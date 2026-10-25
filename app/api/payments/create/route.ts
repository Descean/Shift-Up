import { NextRequest, NextResponse } from "next/server";
import { getServerSession, type Session } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import type { Prestation } from "@prisma/client";

const schema = z.object({
  prestationId: z.string(),
  method: z.enum(["MOBILE_MONEY", "CARD"]),
  provider: z.enum(["FEDAPAY", "STRIPE"]),
  phone: z.string().optional(), // For mobile money
});

/**
 * Calcule le montant réellement dû pour cette prestation, uniquement à
 * partir de données stockées en base (devis admin, montant déjà payé).
 * Le montant n'est JAMAIS pris depuis la requête du client.
 */
function computeAmountDue(prestation: Prestation): number | null {
  if (!prestation.amount || prestation.amount <= 0) return null; // pas encore de devis
  const remaining = prestation.amount - prestation.amountPaid;
  if (remaining <= 0) return null; // déjà intégralement réglée

  if (prestation.amountPaid > 0) {
    // Solde restant
    return Math.round(remaining);
  }

  // Premier paiement : acompte (montant du devis si précisé, sinon 60% par défaut)
  const quote = prestation.quote as { deposit?: number } | null;
  const deposit = quote?.deposit ?? Math.round(prestation.amount * 0.6);
  return Math.min(Math.round(deposit), Math.round(remaining));
}

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

    const amount = computeAmountDue(prestation);
    if (amount === null || amount <= 0) {
      return NextResponse.json(
        { error: "Aucun montant n'est dû pour cette prestation actuellement." },
        { status: 409 }
      );
    }

    const reference = `SU-PAY-${Date.now()}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

    if (data.provider === "FEDAPAY") {
      return await handleFedaPay({ amount, reference, session, prestation, phone: data.phone });
    }

    if (data.provider === "STRIPE") {
      return await handleStripe({ amount, reference, session, prestation });
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

async function handleFedaPay({ amount, reference, session, prestation, phone }: {
  amount: number; reference: string; session: Session; prestation: Prestation; phone?: string;
}) {
  // Le paiement est créé AVANT l'appel FedaPay : son id sert d'ancre unique
  // et infalsifiable dans callback_url pour que le webhook retrouve le bon
  // enregistrement (jamais un providerRef deviné par le client).
  const payment = await prisma.payment.create({
    data: {
      prestationId: prestation.id,
      userId: session.user.id,
      amount,
      currency: "XOF",
      method: "MOBILE_MONEY",
      provider: "FEDAPAY",
      status: "PENDING",
      reference,
    },
  });

  try {
    const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
    const apiBase = isLive ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com";
    const authHeader = { Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`, "Content-Type": "application/json" };

    const fullName: string = session.user.name ?? "";
    const spaceIndex = fullName.indexOf(" ");
    const firstname = spaceIndex > 0 ? fullName.slice(0, spaceIndex) : fullName;
    const lastname  = spaceIndex > 0 ? fullName.slice(spaceIndex + 1) : "";

    const customer: Record<string, unknown> = { email: session.user.email };
    if (firstname) customer.firstname = firstname;
    if (lastname)  customer.lastname  = lastname;
    if (phone)     customer.phone_number = { number: phone, country: "BJ" };

    const callbackUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook/fedapay?paymentId=${payment.id}`;

    const txRes = await fetch(`${apiBase}/v1/transactions`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        description: `Prestation #${prestation.id.slice(-8).toUpperCase()}`,
        amount,
        currency: { iso: "XOF" },
        callback_url: callbackUrl,
        customer,
      }),
    });

    const txData = await txRes.json();

    if (!txRes.ok) {
      console.error("FedaPay create transaction error:", JSON.stringify(txData));
      await prisma.payment.delete({ where: { id: payment.id } });
      const errMsg = txData.message || txData.error || JSON.stringify(txData);
      return NextResponse.json({ error: "FedaPay: " + errMsg }, { status: 400 });
    }

    const tx = txData["v1/transaction"];
    const transactionId = tx?.id;
    const checkoutUrl = tx?.payment_url;

    if (!transactionId || !checkoutUrl) {
      console.error("FedaPay: réponse incomplète:", JSON.stringify(txData));
      await prisma.payment.delete({ where: { id: payment.id } });
      return NextResponse.json({ error: "FedaPay: réponse incomplète de l'API." }, { status: 500 });
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: { providerRef: String(transactionId) },
    });

    return NextResponse.json({ success: true, checkoutUrl, reference });
  } catch (error) {
    await prisma.payment.delete({ where: { id: payment.id } }).catch(() => {});
    throw error;
  }
}

async function handleStripe({ amount, reference, session, prestation }: {
  amount: number; reference: string; session: Session; prestation: Prestation;
}) {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("Paiement par carte indisponible : STRIPE_SECRET_KEY manquante.");
  const Stripe = (await import("stripe")).default;
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

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
          product_data: { name: `SHIFT UP — Prestation ${prestation.id}` },
        },
        quantity: 1,
      },
    ],
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/succes?type=service&prestationId=${prestation.id}&ref=${reference}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/paiement/echec?type=service&reason=cancelled`,
    customer_email: session.user.email!,
    metadata: { prestationId: prestation.id, reference, userId: session.user.id },
  });

  await prisma.payment.create({
    data: {
      prestationId: prestation.id,
      userId: session.user.id,
      amount, // montant en XOF (la conversion en euros ne concerne que Stripe Checkout)
      currency: "XOF",
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
