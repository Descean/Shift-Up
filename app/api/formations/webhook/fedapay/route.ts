import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendFormationReceipt, sendFormationInscriptionAdmin } from "@/lib/email";

/**
 * GET /api/formations/webhook/fedapay
 *   ?inscriptionId={id}&status=approved&id={fedapayTransactionId}
 *
 * FedaPay redirige l'utilisateur ici après le paiement.
 * On confirme l'inscription, on envoie les emails, puis on redirige vers la page de succès.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { searchParams } = new URL(req.url);

  const inscriptionId = searchParams.get("inscriptionId");
  const status = searchParams.get("status");
  const fedapayTransactionId = searchParams.get("id");

  if (!inscriptionId) {
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=formation&reason=missing_id`));
  }

  try {
    const inscription = await prisma.formationInscription.findUnique({
      where: { id: inscriptionId },
      include: { formation: true },
    });

    if (!inscription) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=formation&reason=not_found`));
    }

    // Déjà confirmée — rediriger vers le succès directement
    if (inscription.status === "PAIEMENT_CONFIRME") {
      return NextResponse.redirect(
        new URL(`${appUrl}/formations/${inscription.formation.slug}?succes=1&ref=${inscription.reference}`)
      );
    }

    if (status !== "approved") {
      await prisma.formationInscription.update({
        where: { id: inscriptionId },
        data: { status: "ANNULEE" },
      });
      return NextResponse.redirect(
        new URL(`${appUrl}/formations/${inscription.formation.slug}?echec=1&reason=${status ?? "declined"}`)
      );
    }

    // Confirmer le paiement
    const confirmed = await prisma.formationInscription.update({
      where: { id: inscriptionId },
      data: {
        status: "PAIEMENT_CONFIRME",
        transactionRef: fedapayTransactionId ?? inscription.transactionRef,
      },
    });

    const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

    // Envoi des emails (non-bloquant)
    await Promise.allSettled([
      sendFormationReceipt({
        to: inscription.email,
        prenom: inscription.prenom,
        nom: inscription.nom,
        formation: inscription.formation.titre,
        dateDebut: fmt.format(inscription.formation.dateDebut),
        dateFin: fmt.format(inscription.formation.dateFin),
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

    return NextResponse.redirect(
      new URL(`${appUrl}/formations/${inscription.formation.slug}?succes=1&ref=${confirmed.reference}`)
    );
  } catch (error) {
    console.error("Formations FedaPay webhook error:", error);
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=formation&reason=error`));
  }
}
