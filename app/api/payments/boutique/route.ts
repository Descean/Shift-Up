/**
 * app/api/payments/boutique/route.ts
 *
 * Paiement pour les produits de la boutique.
 *
 * Sécurité : authentification requise, et le montant facturé vient TOUJOURS
 * du catalogue serveur (Product.price), jamais du corps envoyé par le client.
 *
 * Body POST :
 *  { productId, provider: "FEDAPAY" | "STRIPE", phone? }
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import type { Product } from "@prisma/client";

const schema = z.object({
  productId: z.string(),
  provider:  z.enum(["FEDAPAY", "STRIPE"]),
  phone:     z.string().optional(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Connectez-vous pour effectuer un achat." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const product = await prisma.product.findUnique({ where: { id: data.productId, isActive: true } });
    if (!product) {
      return NextResponse.json({ error: "Produit introuvable ou indisponible." }, { status: 404 });
    }

    const reference = `SU-SHOP-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    if (data.provider === "FEDAPAY") {
      return await handleFedaPay({ product, session, reference, phone: data.phone });
    }

    if (data.provider === "STRIPE") {
      return await handleStripe({ product, session, reference });
    }

    return NextResponse.json({ error: "Provider non supporté." }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("Boutique payment error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la création du paiement." },
      { status: 500 }
    );
  }
}

async function handleFedaPay({ product, session, reference, phone }: {
  product: Product; session: Session; reference: string; phone?: string;
}) {
  // Currency: FedaPay fonctionne en XOF. Les produits en EUR/USD passent par Stripe.
  if (product.currency !== "XOF") {
    return NextResponse.json({ error: "Ce produit n'est pas payable via Mobile Money." }, { status: 400 });
  }

  const purchase = await prisma.productPurchase.create({
    data: {
      productId: product.id,
      userId: session.user.id,
      amount: product.price,
      reference,
      status: "PENDING",
    },
  });

  try {
    const env = process.env.FEDAPAY_ENVIRONMENT === "live" ? "api" : "sandbox-api";
    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/fedapay-boutique?purchaseId=${purchase.id}`;

    const fedapayRes = await fetch(`https://${env}.fedapay.com/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: `SHIFT UP Boutique — ${product.name}`,
        amount: product.price,
        currency: { iso: "XOF" },
        callback_url: callbackUrl,
        customer: {
          email: session.user.email,
          ...(phone ? { phone_number: { number: phone, country: "BJ" } } : {}),
        },
      }),
    });

    const fedaData = await fedapayRes.json();

    if (!fedapayRes.ok) {
      await prisma.productPurchase.delete({ where: { id: purchase.id } });
      return NextResponse.json(
        { error: "FedaPay: " + (fedaData.message || "Erreur inconnue") },
        { status: 400 }
      );
    }

    const tx = fedaData["v1/transaction"];
    const transactionId = tx?.id;
    const checkoutUrl: string | undefined = tx?.payment_url;

    if (!transactionId || !checkoutUrl) {
      await prisma.productPurchase.delete({ where: { id: purchase.id } });
      return NextResponse.json({ error: "FedaPay: réponse incomplète de l'API." }, { status: 500 });
    }

    await prisma.productPurchase.update({
      where: { id: purchase.id },
      data: { providerRef: String(transactionId) },
    });

    return NextResponse.json({ success: true, checkoutUrl, reference });
  } catch (error) {
    await prisma.productPurchase.delete({ where: { id: purchase.id } }).catch(() => {});
    throw error;
  }
}

async function handleStripe({ product, session, reference }: {
  product: Product; session: Session; reference: string;
}) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Paiement par carte indisponible : STRIPE_SECRET_KEY manquante.");
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  // Prix déjà en EUR/USD si product.currency !== "XOF", sinon conversion XOF → EUR
  const unitAmount = product.currency === "XOF"
    ? Math.round((product.price / 655.957) * 100)
    : Math.round(product.price * 100);
  const currency = product.currency === "XOF" ? "eur" : product.currency.toLowerCase();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency,
          unit_amount: unitAmount,
          product_data: { name: product.name },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/succes?type=boutique&id=${product.id}&name=${encodeURIComponent(product.name)}&ref=${reference}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/echec?type=boutique&name=${encodeURIComponent(product.name)}&reason=cancelled`,
    customer_email: session.user.email!,
    metadata: { reference, productId: product.id, userId: session.user.id },
  });

  return NextResponse.json({
    success: true,
    checkoutUrl: checkoutSession.url,
    reference,
  });
}
