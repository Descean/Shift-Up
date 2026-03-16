/**
 * app/api/payments/boutique/route.ts
 *
 * Paiement pour les produits de la boutique.
 * Ne nécessite PAS de prestationId (contrairement à /api/payments/create).
 *
 * Body POST :
 *  { productId, productName, amount, provider: "FEDAPAY" | "STRIPE", phone? }
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  productId:   z.string(),
  productName: z.string(),
  amount:      z.number().positive(),
  provider:    z.enum(["FEDAPAY", "STRIPE"]),
  phone:       z.string().optional(),
  email:       z.string().email().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    const reference = `SU-SHOP-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    if (data.provider === "FEDAPAY") {
      return await handleFedaPay(data, reference);
    }

    if (data.provider === "STRIPE") {
      return await handleStripe(data, reference);
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

async function handleFedaPay(
  data: { productId: string; productName: string; amount: number; phone?: string; email?: string },
  reference: string
) {
  const env = process.env.FEDAPAY_ENVIRONMENT === "live" ? "api" : "sandbox-api";

  const fedapayRes = await fetch(`https://${env}.fedapay.com/v1/transactions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      description: `SHIFT UP Boutique — ${data.productName}`,
      amount: data.amount,
      currency: { iso: "XOF" },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/fedapay`,
      redirect_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/succes?type=boutique&id=${data.productId}&name=${encodeURIComponent(data.productName)}&ref=${reference}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/echec?type=boutique&name=${encodeURIComponent(data.productName)}&reason=cancelled`,
      customer: {
        ...(data.email ? { email: data.email } : {}),
        ...(data.phone ? { phone_number: { number: data.phone, country: "BJ" } } : {}),
      },
      metadata: { reference, productId: data.productId },
    }),
  });

  const fedaData = await fedapayRes.json();

  if (!fedapayRes.ok) {
    return NextResponse.json(
      { error: "FedaPay: " + (fedaData.message || "Erreur inconnue") },
      { status: 400 }
    );
  }

  return NextResponse.json({
    success: true,
    checkoutUrl: fedaData.v1?.payment_url || fedaData.payment_url,
    reference,
  });
}

async function handleStripe(
  data: { productId: string; productName: string; amount: number; email?: string },
  reference: string
) {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Convert XOF → EUR (1 EUR ≈ 655.957 XOF)
  const amountEurCents = Math.round((data.amount / 655.957) * 100);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amountEurCents,
          product_data: { name: data.productName },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/succes?type=boutique&id=${data.productId}&name=${encodeURIComponent(data.productName)}&ref=${reference}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/echec?type=boutique&name=${encodeURIComponent(data.productName)}&reason=cancelled`,
    ...(data.email ? { customer_email: data.email } : {}),
    metadata: { reference, productId: data.productId },
  });

  return NextResponse.json({
    success: true,
    checkoutUrl: checkoutSession.url,
    reference,
  });
}
