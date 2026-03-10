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

async function handleFedaPay({ amount, reference, phone, session, prestation, prestationId }: any) {
  // FedaPay API integration
  const fedapayRes = await fetch(
    `https://${process.env.FEDAPAY_ENVIRONMENT === "live" ? "api" : "sandbox-api"}.fedapay.com/v1/transactions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: `Paiement SHIFT UP — ${prestation.id}`,
        amount,
        currency: { iso: "XOF" },
        callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/fedapay`,
        customer: { email: session.user.email },
      }),
    }
  );

  const fedaData = await fedapayRes.json();

  if (!fedapayRes.ok) {
    return NextResponse.json({ error: "FedaPay: " + fedaData.message }, { status: 400 });
  }

  // Save payment record
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
      providerRef: String(fedaData.v1?.transaction?.id || fedaData.id),
    },
  });

  return NextResponse.json({
    success: true,
    checkoutUrl: fedaData.v1?.payment_url || fedaData.payment_url,
    reference,
  });
}

async function handleStripe({ amount, reference, session, prestation, prestationId }: any) {
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(amount * 100), // Stripe uses cents (convert from XOF to EUR if needed)
    currency: "eur",
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
      providerRef: paymentIntent.id,
    },
  });

  return NextResponse.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    reference,
  });
}
