import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/payments/webhook/fedapay-boutique?purchaseId={id}&status=approved&id={fedapayTransactionId}
 *
 * FedaPay redirige le client ici après le paiement d'un produit boutique.
 * Sécurité : on NE fait jamais confiance à ?status= — la confirmation
 * revérifie toujours la transaction auprès de l'API FedaPay (même patron
 * que /api/payments/webhook/fedapay et /api/formations/webhook/fedapay).
 */
export async function GET(req: NextRequest) {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const { searchParams } = new URL(req.url);

  const purchaseId = searchParams.get("purchaseId");
  const fedapayTransactionId = searchParams.get("id");

  if (!purchaseId) {
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=boutique&reason=missing_id`));
  }

  try {
    const purchase = await prisma.productPurchase.findUnique({
      where: { id: purchaseId },
      include: { product: true },
    });

    if (!purchase) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=boutique&reason=not_found`));
    }

    if (purchase.status === "COMPLETED") {
      return NextResponse.redirect(
        new URL(`${appUrl}/paiement/succes?type=boutique&id=${purchase.productId}&name=${encodeURIComponent(purchase.product.name)}&ref=${purchase.reference}`)
      );
    }

    if (!fedapayTransactionId) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=boutique&reason=no_transaction`));
    }

    if (purchase.providerRef && purchase.providerRef !== fedapayTransactionId) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=boutique&reason=transaction_mismatch`));
    }

    const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
    const apiBase = isLive ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com";

    const verifyRes = await fetch(`${apiBase}/v1/transactions/${fedapayTransactionId}`, {
      headers: { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}` },
    });

    if (!verifyRes.ok) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=boutique&reason=verify_failed`));
    }

    const verifyData = await verifyRes.json();
    const verifiedStatus: string = verifyData["v1/transaction"]?.status ?? "";

    if (verifiedStatus !== "approved") {
      await prisma.productPurchase.update({ where: { id: purchase.id }, data: { status: "FAILED" } });
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=boutique&reason=${verifiedStatus || "declined"}`));
    }

    await prisma.productPurchase.update({
      where: { id: purchase.id },
      data: { status: "COMPLETED" },
    });

    await prisma.auditLog.create({
      data: {
        userId: purchase.userId,
        action: "PRODUCT_PURCHASE_COMPLETED",
        entity: "ProductPurchase",
        entityId: purchase.id,
        details: { amount: purchase.amount, provider: "FEDAPAY", reference: purchase.reference, productId: purchase.productId },
      },
    });

    return NextResponse.redirect(
      new URL(`${appUrl}/paiement/succes?type=boutique&id=${purchase.productId}&name=${encodeURIComponent(purchase.product.name)}&ref=${purchase.reference}`)
    );
  } catch (error) {
    console.error("Boutique FedaPay webhook error:", error);
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=boutique&reason=error`));
  }
}
