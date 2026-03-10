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
      totalPrestations,
      activePrestations,
      completedPrestations,
      revenueTotal,
      revenueThisMonth,
      pendingMessages,
      newsletterCount,
      recentPrestations,
    ] = await Promise.all([
      // Utilisateurs
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfMonth } } }),

      // Prestations
      prisma.prestation.count(),
      prisma.prestation.count({ where: { status: { in: ["EN_COURS","LIVRAISON","REVISION"] } } }),
      prisma.prestation.count({ where: { status: "TERMINEE" } }),

      // Revenus (paiements COMPLETED)
      prisma.payment.aggregate({
        where: { status: "COMPLETED" },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { status: "COMPLETED", createdAt: { gte: startOfMonth } },
        _sum: { amount: true },
      }),

      // Messages contact non lus
      prisma.contactMessage.count({ where: { isRead: false } }),

      // Abonnés newsletter actifs
      prisma.newsletterSubscriber.count({ where: { isActive: true } }),

      // 5 dernières prestations avec infos client + service
      prisma.prestation.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        include: {
          client:  { select: { name: true, email: true } },
          service: { select: { title: true, domain: true } },
        },
      }),
    ]);

    return NextResponse.json({
      users: {
        total: totalUsers,
        newThisMonth: newUsersThisMonth,
      },
      prestations: {
        total: totalPrestations,
        active: activePrestations,
        completed: completedPrestations,
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
