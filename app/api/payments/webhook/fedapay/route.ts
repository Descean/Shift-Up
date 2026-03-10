import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const { transaction } = payload;

    if (!transaction) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: String(transaction.id) },
      include: { prestation: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const newStatus =
      transaction.status === "approved" ? "COMPLETED" :
      transaction.status === "declined" ? "FAILED" :
      "PENDING";

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus as any },
    });

    if (newStatus === "COMPLETED") {
      // Update prestation amountPaid
      await prisma.prestation.update({
        where: { id: payment.prestationId },
        data: {
          amountPaid: { increment: payment.amount },
          status: payment.prestation.amountPaid + payment.amount >= payment.prestation.amount
            ? "EN_COURS"
            : "EN_ATTENTE",
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: payment.userId,
          action: "PAYMENT_COMPLETED",
          entity: "Payment",
          entityId: payment.id,
          details: { amount: payment.amount, provider: "FEDAPAY", reference: payment.reference },
        },
      });
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("FedaPay webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
