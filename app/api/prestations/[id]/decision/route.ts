/**
 * POST /api/prestations/:id/decision — Décision du client sur son devis ou sa livraison
 *
 *   accepter_devis    DEVIS_ENVOYE → EN_ATTENTE_PAIEMENT (puis paiement de l'acompte)
 *   modifier_devis    DEVIS_ENVOYE → EN_ATTENTE (commentaire obligatoire, l'admin refait le devis)
 *   refuser_devis     DEVIS_ENVOYE / EN_ATTENTE_PAIEMENT → ANNULEE (rien n'a été payé)
 *   demander_revision LIVRAISON → REVISION (commentaire obligatoire)
 *   valider_livraison LIVRAISON → TERMINEE (solde réglé)
 *
 * Chaque décision est notée dans customFields.historique, envoyée en message interne aux admins
 * et par courriel aux destinataires des alertes.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type { Prisma, PrestationStatus } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendDecisionClientAdmin } from "@/lib/email";
import { envoyer, nomService, soldeRegle } from "@/lib/prestations";

const schema = z.object({
  action: z.enum(["accepter_devis", "modifier_devis", "refuser_devis", "demander_revision", "valider_livraison"]),
  commentaire: z.string().trim().max(2000).optional().nullable(),
});

const REGLES: Record<string, { depuis: PrestationStatus[]; vers: PrestationStatus; commentaire?: boolean }> = {
  accepter_devis: { depuis: ["DEVIS_ENVOYE", "EN_ATTENTE_PAIEMENT"], vers: "EN_ATTENTE_PAIEMENT" },
  modifier_devis: { depuis: ["DEVIS_ENVOYE", "EN_ATTENTE_PAIEMENT"], vers: "EN_ATTENTE", commentaire: true },
  refuser_devis: { depuis: ["DEVIS_ENVOYE", "EN_ATTENTE_PAIEMENT"], vers: "ANNULEE" },
  demander_revision: { depuis: ["LIVRAISON"], vers: "REVISION", commentaire: true },
  valider_livraison: { depuis: ["LIVRAISON", "REVISION"], vers: "TERMINEE" },
};

const LIBELLES: Record<string, string> = {
  accepter_devis: "Devis accepté",
  modifier_devis: "Modification du devis demandée",
  refuser_devis: "Devis refusé",
  demander_revision: "Révision demandée",
  valider_livraison: "Livraison validée",
};

const MESSAGES: Record<string, string> = {
  accepter_devis: "Devis accepté. Vous pouvez payer l'acompte pour démarrer.",
  modifier_devis: "Votre demande de modification a été transmise. Un nouveau devis vous sera envoyé.",
  refuser_devis: "Le devis a été refusé et la demande est close.",
  demander_revision: "Votre demande de révision a été transmise à l'équipe.",
  valider_livraison: "Merci ! La prestation est clôturée.",
};

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
  const { action } = parsed.data;
  const commentaire = parsed.data.commentaire || null;
  const regle = REGLES[action];

  const p = await prisma.prestation.findFirst({
    where: { id, clientId: session.user.id },
    include: { service: { select: { title: true } }, client: { select: { name: true, email: true } } },
  });
  if (!p) return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
  if (!regle.depuis.includes(p.status)) {
    return NextResponse.json({ error: "Cette action n'est pas possible à l'étape actuelle de la prestation." }, { status: 409 });
  }
  if (regle.commentaire && !commentaire) {
    return NextResponse.json({ error: "Précisez ce que vous souhaitez modifier." }, { status: 422 });
  }
  if (action === "refuser_devis" && p.amountPaid > 0) {
    return NextResponse.json({ error: "Un paiement a déjà été reçu : contactez-nous pour annuler." }, { status: 409 });
  }
  if (action === "valider_livraison" && !soldeRegle(p)) {
    return NextResponse.json({ error: "Réglez d'abord le solde pour valider la livraison." }, { status: 409 });
  }

  const cf = (p.customFields as Record<string, unknown> | null) ?? {};
  const historique = Array.isArray(cf.historique) ? (cf.historique as unknown[]) : [];
  historique.push({ date: new Date().toISOString(), action, commentaire, depuis: p.status });

  const maj = await prisma.prestation.update({
    where: { id },
    data: {
      status: regle.vers,
      customFields: { ...cf, historique } as Prisma.InputJsonValue,
      ...(action === "valider_livraison" ? { endDate: new Date(), globalProgress: 100 } : {}),
    },
  });

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: `PRESTATION_CLIENT_${action.toUpperCase()}`, entity: "Prestation", entityId: id, details: { from: p.status, to: regle.vers, commentaire } },
  });

  const serviceName = nomService(p);
  const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "DEVELOPER"] } }, select: { id: true } });
  await prisma.message.createMany({
    data: admins.map((a) => ({
      senderId: session.user.id,
      recipientId: a.id,
      subject: `${LIBELLES[action]} — ${serviceName}`,
      content: `${LIBELLES[action]} par le client.${commentaire ? `\n\nCommentaire :\n${commentaire}` : ""}`,
    })),
  });

  await envoyer("décision client", [
    sendDecisionClientAdmin({
      clientName: p.client.name ?? p.client.email ?? "Client", clientEmail: p.client.email ?? "",
      serviceName, action, commentaire, prestationId: id,
    }),
  ]);

  return NextResponse.json({ ok: true, status: maj.status, message: MESSAGES[action] });
}
