import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { sendFormationReceipt, sendFormationInscriptionAdmin } from "@/lib/email";

const schema = z.object({
  inscriptionId: z.string().min(1),
  transactionId: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { inscriptionId, transactionId } = schema.parse(body);

    const inscription = await prisma.formationInscription.findUnique({
      where: { id: inscriptionId },
      include: { formation: true },
    });

    if (!inscription) {
      return NextResponse.json({ error: "Inscription introuvable." }, { status: 404 });
    }
    if (inscription.status === "PAIEMENT_CONFIRME") {
      return NextResponse.json({ success: true, reference: inscription.reference });
    }

    // Vérification du paiement Kkiapay
    const isSandbox = process.env.KKIAPAY_SANDBOX === "true";
    const apiBase = isSandbox
      ? "https://sandbox-api.kkiapay.me"
      : "https://api.kkiapay.me";

    const kkiRes = await fetch(`${apiBase}/api/v1/transactions/${transactionId}/status`, {
      headers: { "x-api-key": process.env.KKIAPAY_PRIVATE_KEY! },
    });

    if (!kkiRes.ok) {
      console.error("Kkiapay status check failed:", kkiRes.status);
      return NextResponse.json({ error: "Impossible de vérifier le paiement." }, { status: 502 });
    }

    const kkiData = await kkiRes.json();
    const txStatus: string = kkiData?.status ?? "";

    if (!["SUCCESS", "COMPLETE", "COMPLETED"].includes(txStatus.toUpperCase())) {
      return NextResponse.json({ error: "Paiement non complété.", status: txStatus }, { status: 402 });
    }

    // Confirmer l'inscription
    const confirmed = await prisma.formationInscription.update({
      where: { id: inscriptionId },
      data: { status: "PAIEMENT_CONFIRME", transactionRef: transactionId },
    });

    const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
    const dateDebut = fmt.format(inscription.formation.dateDebut);
    const dateFin = fmt.format(inscription.formation.dateFin);

    // Envoi des emails (non-bloquant)
    await Promise.allSettled([
      sendFormationReceipt({
        to: inscription.email,
        prenom: inscription.prenom,
        nom: inscription.nom,
        formation: inscription.formation.titre,
        dateDebut,
        dateFin,
        lieu: inscription.formation.lieu,
        prixFCFA: inscription.formation.prixFCFA,
        reference: confirmed.reference,
        methodePaiement: inscription.methodePaiement,
      }),
      sendFormationInscriptionAdmin({
        prenom: inscription.prenom,
        nom: inscription.nom,
        email: inscription.email,
        telephone: inscription.telephone,
        formation: inscription.formation.titre,
        reference: confirmed.reference,
        structure: inscription.structure,
        secteur: inscription.secteur,
        methodePaiement: inscription.methodePaiement,
      }),
    ]);

    return NextResponse.json({ success: true, reference: confirmed.reference });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("Confirm inscription error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
