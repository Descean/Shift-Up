import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getPhaseTemplates } from "@/lib/service-templates";

/**
 * GET /api/payments/webhook/fedapay?status=approved&id={transactionId}
 * FedaPay redirige l'utilisateur vers cette URL après le paiement.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const transactionId = searchParams.get("id");
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    if (!transactionId) {
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=missing_id`));
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: transactionId },
      include: { prestation: true },
    });

    if (!payment) {
      console.error("FedaPay webhook GET: payment not found for transactionId", transactionId);
      return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=not_found`));
    }

    if (status === "approved") {
      // Mettre à jour le paiement
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: "COMPLETED" },
      });

      // Faire avancer la prestation
      await prisma.prestation.update({
        where: { id: payment.prestationId },
        data: {
          amountPaid: { increment: payment.amount },
          status: "EN_COURS",
          startDate: payment.prestation.startDate ?? new Date(),
        },
      });

      // Générer les phases depuis le template du secteur (si pas encore créées)
      const existingPhases = await prisma.prestationPhase.count({ where: { prestationId: payment.prestationId } });
      if (existingPhases === 0) {
        const prestation = await prisma.prestation.findUnique({ where: { id: payment.prestationId } });
        const templates = getPhaseTemplates(prestation?.sector ?? null);
        if (templates.length > 0) {
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
      }

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

      return NextResponse.redirect(
        new URL(`${appUrl}/paiement/succes?type=service&prestationId=${payment.prestationId}&ref=${payment.reference}`)
      );
    }

    // Paiement annulé ou refusé
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });

    return NextResponse.redirect(
      new URL(`${appUrl}/paiement/echec?type=service&reason=${status ?? "declined"}`)
    );
  } catch (error) {
    console.error("FedaPay webhook GET error:", error);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    return NextResponse.redirect(new URL(`${appUrl}/paiement/echec?type=service&reason=error`));
  }
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    // FedaPay webhook payload: { name: "transaction.approved", entity: { id, status, ... } }
    // (différent du champ "transaction" — c'est "entity")
    const entity = payload.entity ?? payload.transaction;

    if (!entity?.id) {
      console.error("FedaPay webhook POST: payload inattendu:", JSON.stringify(payload));
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    const payment = await prisma.payment.findFirst({
      where: { providerRef: String(entity.id) },
      include: { prestation: true },
    });

    if (!payment) {
      console.error("FedaPay webhook POST: paiement introuvable pour entity.id =", entity.id);
      // Retourner 200 pour éviter que FedaPay ne réessaie indéfiniment
      return NextResponse.json({ received: true, warning: "Payment not found" });
    }

    // Éviter le double traitement si déjà COMPLETED
    if (payment.status === "COMPLETED") {
      return NextResponse.json({ received: true, info: "Already processed" });
    }

    const eventName: string = payload.name ?? "";
    const entityStatus: string = entity.status ?? "";

    const newStatus =
      entityStatus === "approved" || eventName === "transaction.approved" ? "COMPLETED" :
      entityStatus === "declined" || eventName === "transaction.declined" ? "FAILED" :
      entityStatus === "canceled" || eventName === "transaction.canceled" ? "FAILED" :
      "PENDING";

    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: newStatus as any },
    });

    if (newStatus === "COMPLETED") {
      // Faire avancer la prestation
      await prisma.prestation.update({
        where: { id: payment.prestationId },
        data: {
          amountPaid: { increment: payment.amount },
          status: "EN_COURS",
          startDate: payment.prestation.startDate ?? new Date(),
        },
      });

      // Générer automatiquement les phases depuis le template du secteur
      const existingPhases = await prisma.prestationPhase.count({ where: { prestationId: payment.prestationId } });
      if (existingPhases === 0) {
        const prestation = await prisma.prestation.findUnique({ where: { id: payment.prestationId } });
        const templates = getPhaseTemplates(prestation?.sector ?? null);
        if (templates.length > 0) {
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
      }

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
