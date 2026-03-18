/**
 * app/api/admin/stats/route.ts — KPIs globaux pour le tableau de bord admin
 *
 * GET /api/admin/stats → Renvoie les métriques consolidées du projet SHIFT UP.
 * Accès réservé aux rôles ADMIN et DEVELOPER.
 */

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const now = new Date();
    // Début du mois courant pour les stats mensuelles
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Requêtes en parallèle pour minimiser la latence
    const [
      totalUsers,
      newUsersThisMonth,
      allPrestations,
      allUsers,
      revenueTotal,
      revenueThisMonth,
      pendingMessages,
      newsletterCount,
      recentPrestations,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.prestation.findMany({ select: { status: true } }),
      prisma.user.findMany({ select: { role: true } }),
      prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
      prisma.payment.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfMonth } }, _sum: { amount: true } }),
      prisma.contactMessage.count({ where: { isRead: false } }),
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),
      prisma.prestation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: {
          id: true, status: true, amount: true, createdAt: true,
          sector: true, customService: true,
          client:  { select: { name: true, email: true } },
          service: { select: { title: true, domain: true } },
        },
      }),
    ]);

    // Répartition prestations par statut
    const statusCounts: Record<string, number> = {};
    for (const p of allPrestations) {
      statusCounts[p.status] = (statusCounts[p.status] ?? 0) + 1;
    }

    // Répartition utilisateurs par rôle
    const roleCounts: Record<string, number> = {};
    for (const u of allUsers) {
      roleCounts[u.role] = (roleCounts[u.role] ?? 0) + 1;
    }

    return NextResponse.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
        byRole: roleCounts,
      },
      prestations: {
        total: allPrestations.length,
        active: allPrestations.filter(p => ["EN_COURS","LIVRAISON","REVISION"].includes(p.status)).length,
        completed: allPrestations.filter(p => p.status === "TERMINEE").length,
        byStatus: statusCounts,
      },
      revenue: {
        total: revenueTotal._sum.amount ?? 0,
        thisMonth: revenueThisMonth._sum.amount ?? 0,
      },
      pendingMessages,
      newsletterCount,
      recentPrestations,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
