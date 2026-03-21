/**
 * GET /api/payments/invoice?paymentId=xxx
 * Génère et retourne la facture PDF d'un paiement.
 * Accessible au client propriétaire du paiement et aux admins.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { InvoicePDF, type InvoiceData } from "@/components/pdf/InvoicePDF";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const paymentId = searchParams.get("paymentId");
  if (!paymentId) {
    return NextResponse.json({ error: "paymentId requis." }, { status: 400 });
  }

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        user: { select: { name: true, email: true } },
        prestation: {
          include: {
            service: { select: { title: true } },
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Paiement introuvable." }, { status: 404 });
    }

    // Seul le client propriétaire ou un admin peut télécharger la facture
    const isAdmin = ["ADMIN", "DEVELOPER"].includes(session.user.role as string);
    if (!isAdmin && payment.userId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const data: InvoiceData = {
      reference: payment.reference,
      date: new Date(payment.createdAt).toLocaleDateString("fr-FR"),
      client: {
        name: payment.user.name ?? "Client",
        email: payment.user.email ?? "",
      },
      prestation: {
        title: payment.prestation?.service?.title ?? `Prestation #${payment.prestationId.slice(-8).toUpperCase()}`,
        sector: payment.prestation?.sector ?? null,
      },
      amount: payment.amount,
      currency: payment.currency,
      method: payment.method,
      provider: payment.provider,
      status: payment.status as InvoiceData["status"],
    };

    const buffer = await renderToBuffer(InvoicePDF({ data }));

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="facture-${payment.reference}.pdf"`,
        "Cache-Control": "private, no-cache",
      },
    });
  } catch (error) {
    console.error("GET /api/payments/invoice error:", error);
    return NextResponse.json({ error: "Erreur lors de la génération du PDF." }, { status: 500 });
  }
}
