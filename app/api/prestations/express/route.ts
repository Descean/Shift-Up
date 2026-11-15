/**
 * POST /api/prestations/express — Demande en une fois : le dossier + ce qu'il faut faire.
 *
 * Le client dépose ses fichiers et écrit (ou dit, en message vocal) ce qu'il attend. La demande est
 * créée tout de suite ; l'IA lit ensuite le dossier en arrière-plan et envoie le devis automatique
 * (lib/ia-devis). Sans IA, l'équipe chiffre à la main.
 */
import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSafe } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { fichierDe } from "@/lib/montage-serveur";
import { sendDemandeConfirmation, sendNewDemandeAdmin } from "@/lib/email";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { envoyer } from "@/lib/prestations";
import { creerAvis, lienDemande } from "@/lib/notifications";
import { analyserEtChiffrer, iaAnalyseDisponible } from "@/lib/ia-devis";

export const maxDuration = 300;

const schema = z.object({
  consigne: z.string().trim().max(3000).refine(isSafe, "Contenu non autorisé.").optional().default(""),
  fichiers: z.array(z.object({ url: z.string().url().max(500), nom: z.string().trim().max(200) })).max(15).default([]),
  vocal: z.string().url().max(500).optional().nullable(),
  entrepriseId: z.string().max(40).optional().nullable(),
  telephone: z.string().trim().max(40).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Connectez-vous pour envoyer votre demande." }, { status: 401 });
  const { allowed } = await rateLimit(`express:${session.user.id}`, { limit: 6, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de demandes en peu de temps. Réessayez plus tard." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Demande invalide." }, { status: 422 });
  const d = parsed.data;
  if (!d.fichiers.length && !d.vocal && d.consigne.length < 10) {
    return NextResponse.json({ error: "Déposez votre dossier ou dites-nous en quelques mots ce qu'il faut faire." }, { status: 422 });
  }
  const moi = session.user.id;
  if (d.fichiers.some((f) => !fichierDe(f.url, moi)) || (d.vocal && !fichierDe(d.vocal, moi))) {
    return NextResponse.json({ error: "Fichier non reconnu : déposez-le à nouveau." }, { status: 422 });
  }

  const ent = d.entrepriseId
    ? await prisma.entreprise.findFirst({ where: { id: d.entrepriseId, userId: moi }, select: { id: true, nom: true } }).catch(() => null)
    : null;

  const prestation = await prisma.prestation.create({
    data: {
      clientId: moi,
      sector: "Autre",
      customService: "Demande en cours d'analyse",
      brief: d.consigne || null,
      company: ent?.nom ?? null,
      phone: d.telephone || null,
      attachments: [...d.fichiers.map((f) => f.url), ...(d.vocal ? [d.vocal] : [])],
      status: "EN_ATTENTE",
      customFields: {
        origine: "demande express",
        fichiers: d.fichiers,
        ...(d.vocal ? { consigneVocale: d.vocal } : {}),
        ...(ent ? { entrepriseId: ent.id, entrepriseNom: ent.nom } : {}),
        analyseIA: { statut: iaAnalyseDisponible() ? "en_attente" : "manuel", le: new Date().toISOString() },
      } as Prisma.InputJsonValue,
    },
  });

  const nom = session.user.name ?? session.user.email ?? "Client";
  await envoyer("demande express", [
    sendDemandeConfirmation({ to: session.user.email!, name: nom, serviceName: "Votre demande", prestationId: prestation.id, piecesAFournir: 0 }),
    sendNewDemandeAdmin({ clientName: nom, clientEmail: session.user.email!, serviceName: "Demande express (analyse automatique)", brief: d.consigne || "(dossier déposé, voir les fichiers)", prestationId: prestation.id }),
    alerterEquipeWhatsApp("Nouvelle demande", `${nom} — ${d.fichiers.length} fichier(s)${d.vocal ? " + vocal" : ""}`),
  ]);
  await creerAvis({
    userId: moi, prestationId: prestation.id, type: "DEMANDE", titre: "Demande reçue",
    texte: iaAnalyseDisponible() ? "Nous lisons votre dossier : votre devis arrive dans quelques minutes." : "Notre équipe étudie votre dossier : le devis suit sous 48 heures ouvrées.",
    lien: lienDemande(prestation.id),
  });

  // Lecture du dossier et devis automatique, après la réponse au client
  if (iaAnalyseDisponible()) after(() => analyserEtChiffrer(prestation.id).then(() => undefined));

  return NextResponse.json({ id: prestation.id, analyse: iaAnalyseDisponible() }, { status: 201 });
}
