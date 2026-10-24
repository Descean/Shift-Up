import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { sendFormationReceipt, sendFormationInscriptionAdmin } from "@/lib/email";

/**
 * POST /api/webhooks/fedapay
 *
 * Webhook serveur-à-serveur de FedaPay (distinct du callback de redirection navigateur).
 * À configurer dans le dashboard FedaPay : Settings → Webhooks → URL = https://www.shiftup.bj/api/webhooks/fedapay
 *
 * Sécurité : vérification HMAC-SHA256 de la signature avant tout traitement.
 * Si FEDAPAY_WEBHOOK_SECRET n'est pas configuré, le webhook est rejeté en production.
 */
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-fedapay-signature") ?? "";
  const secret = process.env.FEDAPAY_WEBHOOK_SECRET;

  // En production, rejeter si le secret n'est pas configuré
  if (!secret) {
    console.error("FEDAPAY_WEBHOOK_SECRET non configuré — webhook rejeté.");
    return NextResponse.json({ error: "Configuration manquante." }, { status: 500 });
  }

  // Vérification HMAC-SHA256
  const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    console.warn("Webhook FedaPay : signature invalide.");
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }

  let event: Record<string, unknown>;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Corps invalide." }, { status: 400 });
  }

  // FedaPay envoie un objet { name: "transaction.approved", data: { v1/transaction: {...} } }
  const eventName = event.name as string | undefined;

  if (eventName === "transaction.approved") {
    const txData = (event.data as Record<string, unknown>)?.["v1/transaction"] as Record<string, unknown> | undefined;
    const fedapayId = String(txData?.id ?? "");
    const txStatus = txData?.status as string | undefined;

    if (!fedapayId || txStatus !== "approved") {
      return NextResponse.json({ received: true });
    }

    // Trouver l'inscription liée à cette transaction
    const inscription = await prisma.formationInscription.findFirst({
      where: { transactionRef: fedapayId, status: "EN_ATTENTE_PAIEMENT" },
      include: { formation: true },
    });

    if (!inscription) {
      // Transaction inconnue ou déjà traitée — répondre 200 pour éviter les retries FedaPay
      return NextResponse.json({ received: true });
    }

    // Confirmer l'inscription
    const confirmed = await prisma.formationInscription.update({
      where: { id: inscription.id },
      data: { status: "PAIEMENT_CONFIRME" },
    });

    const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

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
  }

  // Toujours répondre 200 pour éviter les retries FedaPay
  return NextResponse.json({ received: true });
}
