/**
 * app/api/admin/payments/route.ts — Finances (admin)
 *
 * GET /api/admin/payments → Paiements reçus + commissions apporteurs
 * Accès réservé ADMIN / DEVELOPER.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const [payments, apporteurs, totals] = await Promise.all([
      // 20 derniers paiements
      prisma.payment.findMany({
        take: 20,
        orderBy: { createdAt: "desc" },
        include: {
          prestation: {
            include: {
              client:  { select: { name: true } },
              service: { select: { title: true } },
            },
          },
        },
      }),

      // Apporteurs avec commissions en attente
      prisma.apporteurProfile.findMany({
        where: { pendingEarnings: { gt: 0 } },
        include: {
          user: { select: { name: true, affiliationCode: true } },
          _count: { select: { referrals: true } },
        },
        orderBy: { pendingEarnings: "desc" },
      }),

      // Totaux financiers
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
    ]);

    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthRevenue = await prisma.payment.aggregate({
      where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
      _sum: { amount: true },
    });

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: p.id,
        reference: p.reference,
        client: p.prestation?.client?.name ?? "—",
        service: p.prestation?.service?.title ?? "—",
        amount: p.amount,
        method: `${p.provider} (${p.method})`,
        status: p.status,
        date: p.createdAt.toISOString(),
      })),
      commissions: apporteurs.map((a) => ({
        apporteur: a.user.name ?? "—",
        code: a.user.affiliationCode ?? "—",
        referrals: a._count.referrals,
        totalGenerated: a.totalEarnings,
        commission: a.pendingEarnings,
        status: "A_PAYER",
      })),
      totals: {
        total: totals._sum.amount ?? 0,
        thisMonth: monthRevenue._sum.amount ?? 0,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/payments error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
