import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPhaseTemplates } from "@/lib/service-templates";

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
      const newAmountPaid = payment.prestation.amountPaid + payment.amount;
      const isFullyPaid = newAmountPaid >= payment.prestation.amount;

      // Passe toujours en EN_COURS dès qu'un paiement est confirmé (acompte suffisant)
      await prisma.prestation.update({
        where: { id: payment.prestationId },
        data: {
          amountPaid: { increment: payment.amount },
          status: "EN_COURS",
          startDate: new Date(),
        },
      });

      // Générer automatiquement les phases depuis le template du secteur
      const existingPhases = await prisma.prestationPhase.count({ where: { prestationId: payment.prestationId } });
      if (existingPhases === 0) {
        const prestation = await prisma.prestation.findUnique({ where: { id: payment.prestationId } });
        const templates = getPhaseTemplates(prestation?.sector ?? null);
        await prisma.prestationPhase.createMany({
          data: templates.map((t) => ({
            prestationId: payment.prestationId,
            title: t.title,
            description: t.description,
            order: t.order,
            status: t.order === 0 ? "IN_PROGRESS" : "PENDING",
            progress: 0,
          })),
        });
      }

      void isFullyPaid;

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
