import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendFormationReceipt } from "@/lib/email";

const schema = z.object({
  status: z.enum(["EN_ATTENTE_PAIEMENT", "PAIEMENT_CONFIRME", "ANNULEE"]),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.role || !["ADMIN", "DEVELOPER"].includes(session.user.role)) return null;
  return session;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const { id } = await params;
    const body = await req.json();
    const { status } = schema.parse(body);

    const prev = await prisma.formationInscription.findUnique({
      where: { id },
      include: { formation: true },
    });

    if (!prev) return NextResponse.json({ error: "Inscription introuvable." }, { status: 404 });

    const updated = await prisma.formationInscription.update({
      where: { id },
      data: { status },
    });

    // Si l'admin confirme manuellement, envoyer le reçu
    if (status === "PAIEMENT_CONFIRME" && prev.status !== "PAIEMENT_CONFIRME") {
      const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
      await sendFormationReceipt({
        to: prev.email,
        prenom: prev.prenom,
        nom: prev.nom,
        formation: prev.formation.titre,
        dateDebut: fmt.format(prev.formation.dateDebut),
        dateFin: fmt.format(prev.formation.dateFin),
        lieu: prev.formation.lieu,
        prixFCFA: prev.formation.prixFCFA,
        reference: updated.reference,
        methodePaiement: prev.methodePaiement,
      }).catch(console.error);
    }

    return NextResponse.json({ success: true, inscription: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    console.error("Update inscription error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
