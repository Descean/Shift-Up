import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { sendFormationReceipt, sendFormationInscriptionAdmin } from "@/lib/email";

/**
 * GET /api/formations/webhook/fedapay
 *   ?inscriptionId={id}&status=approved&id={fedapayTransactionId}
 *
 * FedaPay redirige l'utilisateur ici après le paiement.
 * Sécurité : on NE fait jamais confiance à ?status=approved — on vérifie
 * la transaction directement via l'API FedaPay avant toute confirmation.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { searchParams } = new URL(req.url);

  const inscriptionId = searchParams.get("inscriptionId");
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

    // Déjà confirmée — rediriger vers le succès directement (idempotent)
    if (inscription.status === "PAIEMENT_CONFIRME") {
      return NextResponse.redirect(
        new URL(`${appUrl}/formations/${inscription.formation.slug}?succes=1&ref=${inscription.reference}`)
      );
    }

    // ── Vérification obligatoire via l'API FedaPay ──────────────────────────
    // On ne fait JAMAIS confiance au paramètre ?status de l'URL.
    // Un attaquant connaissant l'inscriptionId pourrait forger ce paramètre.
    if (!fedapayTransactionId) {
      await prisma.formationInscription.update({
        where: { id: inscriptionId },
        data: { status: "ANNULEE" },
      });
      return NextResponse.redirect(
        new URL(`${appUrl}/formations/${inscription.formation.slug}?echec=1&reason=no_transaction`)
      );
    }

    // Vérification croisée : l'ID de transaction doit correspondre à ce qu'on
    // a stocké en base lors de la création de la transaction.
    if (inscription.transactionRef && inscription.transactionRef !== fedapayTransactionId) {
      await prisma.formationInscription.update({
        where: { id: inscriptionId },
        data: { status: "ANNULEE" },
      });
      return NextResponse.redirect(
        new URL(`${appUrl}/formations/${inscription.formation.slug}?echec=1&reason=transaction_mismatch`)
      );
    }

    // Appel API FedaPay pour vérifier le statut réel de la transaction
    const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
    const apiBase = isLive ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com";

    const verifyRes = await fetch(`${apiBase}/v1/transactions/${fedapayTransactionId}`, {
      headers: { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}` },
    });

    if (!verifyRes.ok) {
      // Impossible de vérifier — on n'annule pas mais on refuse de confirmer
      return NextResponse.redirect(
        new URL(`${appUrl}/formations/${inscription.formation.slug}?echec=1&reason=verify_failed`)
      );
    }

    const verifyData = await verifyRes.json();
    const verifiedTx = verifyData["v1/transaction"];
    const verifiedStatus: string = verifiedTx?.status ?? "";

    if (verifiedStatus !== "approved") {
      await prisma.formationInscription.update({
        where: { id: inscriptionId },
        data: { status: "ANNULEE" },
      });
      return NextResponse.redirect(
        new URL(`${appUrl}/formations/${inscription.formation.slug}?echec=1&reason=${verifiedStatus || "declined"}`)
      );
    }
    // ── Fin vérification FedaPay ────────────────────────────────────────────

    // Confirmer le paiement (statut vérifié côté FedaPay)
    const confirmed = await prisma.formationInscription.update({
      where: { id: inscriptionId },
      data: {
        status: "PAIEMENT_CONFIRME",
        transactionRef: fedapayTransactionId,
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
