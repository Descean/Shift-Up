import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/apporteur-services/webhook/fedapay?orderId={id}&status=approved&id={fedapayTransactionId}
 *
 * FedaPay redirige le client ici après le paiement d'une commande de service
 * apporteur. Sécurité : on NE fait jamais confiance à ?status=approved — on
 * vérifie la transaction directement via l'API FedaPay avant toute
 * confirmation (même patron que /api/formations/webhook/fedapay).
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { searchParams } = new URL(req.url);

  const orderId = searchParams.get("orderId");
  const fedapayTransactionId = searchParams.get("id");

  if (!orderId) {
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=apporteur-service&reason=missing_id`));
  }

  try {
    const order = await prisma.apporteurServiceOrder.findUnique({
      where: { id: orderId },
      include: { service: { select: { id: true } } },
    });

    if (!order) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=apporteur-service&reason=not_found`));
    }

    // Déjà confirmée — idempotent
    if (order.paidAt) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/succes?type=apporteur-service`));
    }

    if (!fedapayTransactionId) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=apporteur-service&reason=no_transaction`));
    }

    // Vérification croisée : l'ID de transaction doit correspondre à celui
    // stocké lors de la génération du lien de paiement.
    if (!order.paymentId || order.paymentId !== fedapayTransactionId) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=apporteur-service&reason=transaction_mismatch`));
    }

    // Vérification obligatoire via l'API FedaPay — jamais via ?status=
    const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
    const apiBase = isLive ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com";

    const verifyRes = await fetch(`${apiBase}/v1/transactions/${fedapayTransactionId}`, {
      headers: { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}` },
    });

    if (!verifyRes.ok) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=apporteur-service&reason=verify_failed`));
    }

    const verifyData = await verifyRes.json();
    const verifiedTx = verifyData["v1/transaction"];
    const verifiedStatus: string = verifiedTx?.status ?? "";

    if (verifiedStatus !== "approved") {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=apporteur-service&reason=${verifiedStatus || "declined"}`));
    }

    await prisma.apporteurServiceOrder.update({
      where: { id: orderId },
      data: { paidAt: new Date(), status: "EN_COURS" },
    });

    // Notifie l'apporteur (non-bloquant)
    const service = await prisma.apporteurService.findUnique({
      where: { id: order.serviceId },
      select: { apporteurId: true, title: true },
    });
    const admin = service ? await prisma.user.findFirst({ where: { role: { in: ["ADMIN", "DEVELOPER"] } }, select: { id: true } }) : null;
    if (service && admin) {
      await prisma.message
        .create({
          data: {
            senderId: admin.id,
            recipientId: service.apporteurId,
            subject: `Paiement reçu — ${service.title}`,
            content: `Le paiement de ${order.amount.toLocaleString("fr-FR")} FCFA a été confirmé pour la commande de ${order.clientName}. Vous pouvez démarrer la prestation.`,
          },
        })
        .catch(() => {});
    }

    return NextResponse.redirect(new URL(`${appUrl}/paiement/succes?type=apporteur-service`));
  } catch (error) {
    console.error("Apporteur-services FedaPay webhook error:", error);
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=apporteur-service&reason=error`));
  }
}
