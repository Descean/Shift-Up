/**
 * POST /api/apporteur/services/orders/[id]/payment-link
 *
 * Génère un lien de paiement FedaPay pour l'encaissement d'une commande de
 * service apporteur. Le montant est TOUJOURS celui stocké en base
 * (order.amount, fixé par l'apporteur) — jamais une valeur envoyée par le
 * client, pour éviter toute manipulation du montant facturé.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "APPORTEUR") {
    return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });
  }

  const { id } = await params;

  try {
    const order = await prisma.apporteurServiceOrder.findFirst({
      where: { id, service: { apporteurId: session.user.id } },
      include: { service: { select: { title: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }
    if (order.paidAt) {
      return NextResponse.json({ error: "Cette commande est déjà payée." }, { status: 409 });
    }
    if (order.status === "ANNULEE") {
      return NextResponse.json({ error: "Cette commande est annulée." }, { status: 409 });
    }

    const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
    const apiBase = isLive ? "https://api.fedapay.com" : "https://sandbox-api.fedapay.com";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const callbackUrl = `${appUrl}/api/apporteur-services/webhook/fedapay?orderId=${order.id}`;

    const [firstName, ...lastParts] = order.clientName.split(" ");
    const txRes = await fetch(`${apiBase}/v1/transactions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        description: `${order.service.title} — Commande ${order.id.slice(-8).toUpperCase()}`,
        amount: order.amount,
        currency: { iso: "XOF" },
        callback_url: callbackUrl,
        customer: {
          email: order.clientEmail,
          firstname: firstName,
          lastname: lastParts.join(" ") || firstName,
          ...(order.clientPhone ? { phone_number: { number: order.clientPhone, country: "BJ" } } : {}),
        },
      }),
    });

    const txData = await txRes.json();
    if (!txRes.ok) {
      console.error("FedaPay create error:", JSON.stringify(txData));
      return NextResponse.json({ error: "Erreur FedaPay : " + (txData.message ?? "réponse invalide") }, { status: 502 });
    }

    const tx = txData["v1/transaction"];
    const fedapayId = tx?.id;
    const checkoutUrl: string = tx?.payment_url ?? "";
    if (!fedapayId || !checkoutUrl) {
      console.error("FedaPay réponse incomplète:", JSON.stringify(txData));
      return NextResponse.json({ error: "Réponse FedaPay incomplète." }, { status: 502 });
    }

    await prisma.apporteurServiceOrder.update({
      where: { id: order.id },
      data: { paymentId: String(fedapayId) },
    });

    return NextResponse.json({ checkoutUrl });
  } catch (error) {
    console.error("POST /api/apporteur/services/orders/[id]/payment-link error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
