import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  prestationId: z.string(),
  amount: z.number().positive(),
  method: z.enum(["MOBILE_MONEY", "CARD"]),
  provider: z.enum(["FEDAPAY", "STRIPE"]),
  phone: z.string().optional(), // For mobile money
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    const prestation = await prisma.prestation.findUnique({
      where: { id: data.prestationId, clientId: session.user.id },
    });

    if (!prestation) {
      return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
    }

    const reference = `SU-PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    if (data.provider === "FEDAPAY") {
      return await handleFedaPay({ ...data, reference, session, prestation });
    }

    if (data.provider === "STRIPE") {
      return await handleStripe({ ...data, reference, session, prestation });
    }

    return NextResponse.json({ error: "Provider non supporté." }, { status: 400 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("Payment error:", error);
    return NextResponse.json({ error: "Erreur lors de la création du paiement." }, { status: 500 });
  }
}

async function handleFedaPay({ amount, reference, session, prestation, prestationId, phone }: any) {
  const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
  const apiBase = isLive ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com";
  const authHeader = { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`, "Content-Type": "application/json" };

  // Décompose le nom complet en prénom / nom
  const fullName: string = session.user.name ?? "";
  const spaceIndex = fullName.indexOf(" ");
  const firstname = spaceIndex > 0 ? fullName.slice(0, spaceIndex) : fullName;
  const lastname  = spaceIndex > 0 ? fullName.slice(spaceIndex + 1) : "";

  // Construction du client FedaPay
  const customer: Record<string, unknown> = { email: session.user.email };
  if (firstname) customer.firstname = firstname;
  if (lastname)  customer.lastname  = lastname;
  if (phone)     customer.phone_number = { number: phone, country: "BJ" };

  // Étape 1 : créer la transaction
  const txRes = await fetch(`${apiBase}/v1/transactions`, {
    method: "POST",
    headers: authHeader,
    body: JSON.stringify({
      description: `Prestation #${(prestation.id as string).slice(-8).toUpperCase()}`,
      amount,
      currency: { iso: "XOF" },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/fedapay`,
      customer,
    }),
  });

  const txData = await txRes.json();

  if (!txRes.ok) {
    console.error("FedaPay create transaction error:", JSON.stringify(txData));
    const errMsg = txData.message || txData.error || JSON.stringify(txData);
    return NextResponse.json({ error: "FedaPay: " + errMsg }, { status: 400 });
  }

  // La clé de la réponse FedaPay est "v1/transaction" (avec slash)
  const tx = txData["v1/transaction"];
  const transactionId = tx?.id;
  const checkoutUrl = tx?.payment_url; // payment_url est déjà dans la réponse

  if (!transactionId || !checkoutUrl) {
    console.error("FedaPay: réponse incomplète:", JSON.stringify(txData));
    return NextResponse.json({ error: "FedaPay: réponse incomplète de l'API." }, { status: 500 });
  }

  // Sauvegarder le paiement
  await prisma.payment.create({
    data: {
      prestationId,
      userId: session.user.id,
      amount,
      currency: "XOF",
      method: "MOBILE_MONEY",
      provider: "FEDAPAY",
      status: "PENDING",
      reference,
      providerRef: String(transactionId),
    },
  });

  return NextResponse.json({ success: true, checkoutUrl, reference });
}

async function handleStripe({ amount, reference, session, prestation, prestationId }: any) {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  // Convert XOF → EUR (approximate: 1 EUR ≈ 655.957 XOF)
  const amountEurCents = Math.round((amount / 655.957) * 100);

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "eur",
          unit_amount: amountEurCents,
          product_data: { name: `SHIFT UP — Prestation ${prestationId}` },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/succes?type=service&prestationId=${prestationId}&ref=${reference}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/echec?type=service&reason=cancelled`,
    customer_email: session.user.email,
    metadata: { prestationId, reference, userId: session.user.id },
  });

  await prisma.payment.create({
    data: {
      prestationId,
      userId: session.user.id,
      amount,
      currency: "EUR",
      method: "CARD",
      provider: "STRIPE",
      status: "PENDING",
      reference,
      providerRef: checkoutSession.id,
    },
  });

  return NextResponse.json({
    success: true,
    checkoutUrl: checkoutSession.url,
    reference,
  });
}
