import { NextRequest, NextResponse } from "next/server";
import { createHmac } from "crypto";
import prisma from "@/lib/prisma";
import { confirmerPaiement } from "@/lib/prestations";
import type { Payment, Prestation } from "@prisma/client";

/**
 * Webhooks FedaPay pour les paiements de prestations.
 *
 * Sécurité : on NE fait JAMAIS confiance à un statut fourni par le client
 * (paramètres d'URL du GET) ou par le corps du POST — la confirmation d'un
 * paiement repose TOUJOURS sur une vérification serveur-à-serveur directe
 * auprès de l'API FedaPay (GET /v1/transactions/{id}), exactement comme pour
 * /api/formations/webhook/fedapay.
 */

function fedapayApiBase() {
  const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
  return isLive ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com";
}

async function verifyFedapayTransaction(transactionId: string): Promise<string | null> {
  const res = await fetch(`${fedapayApiBase()}/v1/transactions/${transactionId}`, {
    headers: { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data["v1/transaction"]?.status ?? null;
}

/** Confirme un paiement déjà vérifié comme "approved" auprès de FedaPay. Idempotent. */
async function confirmPayment(payment: Payment & { prestation: Prestation }) {
  await confirmerPaiement(payment.id);
}

/**
 * GET /api/payments/webhook/fedapay?paymentId={id}&id={fedapayTransactionId}
 * FedaPay redirige le navigateur du client ici après le paiement.
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { searchParams } = new URL(req.url);

  const paymentId = searchParams.get("paymentId");
  const fedapayTransactionId = searchParams.get("id");

  if (!paymentId) {
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=missing_id`));
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { prestation: true },
    });

    if (!payment) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=not_found`));
    }

    // Déjà confirmé — idempotent, on ne revérifie pas
    if (payment.status === "COMPLETED") {
      return NextResponse.redirect(
        new URL(`${appUrl}/paiement/succes?type=service&prestationId=${payment.prestationId}&ref=${payment.reference}`)
      );
    }

    if (!fedapayTransactionId) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=no_transaction`));
    }

    // Vérification croisée : l'ID de transaction doit correspondre à celui
    // enregistré au moment de la création du paiement (jamais fourni par le client).
    if (payment.providerRef && payment.providerRef !== fedapayTransactionId) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=transaction_mismatch`));
    }

    // Vérification obligatoire auprès de l'API FedaPay — jamais via ?status=
    const verifiedStatus = await verifyFedapayTransaction(fedapayTransactionId);

    if (verifiedStatus === null) {
      // Impossible de vérifier — on ne confirme pas, mais on ne marque pas non plus en échec définitif
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=verify_failed`));
    }

    if (verifiedStatus !== "approved") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=${verifiedStatus || "declined"}`));
    }

    await confirmPayment(payment);

    return NextResponse.redirect(
      new URL(`${appUrl}/paiement/succes?type=service&prestationId=${payment.prestationId}&ref=${payment.reference}`)
    );
  } catch (error) {
    console.error("FedaPay webhook GET error:", error);
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=error`));
  }
}

/**
 * POST /api/payments/webhook/fedapay
 * Notification serveur-à-serveur FedaPay. Le statut du payload n'est utilisé
 * que pour retrouver le paiement concerné — la confirmation elle-même est
 * toujours revérifiée auprès de l'API FedaPay avant d'être appliquée.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();

    // Vérification de la signature FedaPay (fail-closed si une clé est configurée)
    const webhookSecret = process.env.FEDAPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers.get("x-fedapay-signature") ?? req.headers.get("x-webhook-signature");
      if (!signature) {
        console.error("FedaPay webhook POST: signature manquante — requête rejetée");
        return NextResponse.json({ error: "Missing signature" }, { status: 401 });
      }
      const expectedSig = createHmac("sha256", webhookSecret).update(rawBody).digest("hex");
      if (expectedSig !== signature) {
        console.error("FedaPay webhook POST: signature invalide — requête rejetée");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const payload = JSON.parse(rawBody);
    const entity = payload.entity ?? payload.transaction;

    if (!entity?.id) {
      console.error("FedaPay webhook POST: payload inattendu:", JSON.stringify(payload));
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: String(entity.id) },
      include: { prestation: true },
    });

    if (!payment) {
      console.error("FedaPay webhook POST: paiement introuvable pour entity.id =", entity.id);
      // 200 pour éviter que FedaPay ne réessaie indéfiniment un événement qui ne nous concerne pas
      return NextResponse.json({ received: true, warning: "Payment not found" });
    }

    if (payment.status === "COMPLETED") {
      return NextResponse.json({ received: true, info: "Already processed" });
    }

    // Ne jamais se fier au statut du payload — revérifier systématiquement auprès de l'API FedaPay
    const verifiedStatus = await verifyFedapayTransaction(String(entity.id));

    if (verifiedStatus === "approved") {
      await confirmPayment(payment);
    } else if (verifiedStatus === "declined" || verifiedStatus === "canceled") {
      await prisma.payment.update({ where: { id: payment.id }, data: { status: "FAILED" } });
    }
    // Autre statut (ex: "pending") ou vérification impossible → on ne change rien, FedaPay renverra l'événement plus tard

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("FedaPay webhook POST error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
