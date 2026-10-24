/**
 * app/api/admin/stats/route.ts — KPIs globaux pour le tableau de bord admin
 *
 * GET /api/admin/stats → Renvoie les métriques consolidées du projet SHIFT UP.
 * Accès réservé aux rôles ADMIN et DEVELOPER.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
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
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const anneeDemandee = Number(req.nextUrl.searchParams.get("annee")) || now.getFullYear();
    const debutAnnee = new Date(anneeDemandee, 0, 1);
    const finAnnee = new Date(anneeDemandee + 1, 0, 1);

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
      revenueLastMonth,
      newUsersLastMonth,
      paiementsAnnee,
      formationsAnnee,
      clientsAnnee,
      prestationsParService,
      premierPaiement,
      premierUtilisateur,
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
      prisma.payment.aggregate({ where: { status: "COMPLETED", createdAt: { gte: startOfLastMonth, lt: startOfMonth } }, _sum: { amount: true } }),
      prisma.user.count({ where: { createdAt: { gte: startOfLastMonth, lt: startOfMonth } } }),
      prisma.payment.findMany({ where: { status: "COMPLETED", createdAt: { gte: debutAnnee, lt: finAnnee } }, select: { amount: true, createdAt: true } }),
      prisma.formationInscription.findMany({ where: { status: "PAIEMENT_CONFIRME", createdAt: { gte: debutAnnee, lt: finAnnee } }, select: { montantPaye: true, createdAt: true } }),
      prisma.user.findMany({ where: { role: "CLIENT", createdAt: { gte: debutAnnee, lt: finAnnee } }, select: { createdAt: true } }),
      prisma.prestation.groupBy({ by: ["serviceId", "customService"], _count: true, orderBy: { _count: { serviceId: "desc" } }, take: 20 }),
      prisma.payment.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
      prisma.user.findFirst({ orderBy: { createdAt: "asc" }, select: { createdAt: true } }),
    ]);

    // Série mensuelle de l'année demandée (paiements des prestations + formations payées)
    const mensuel = Array.from({ length: 12 }, (_, m) => ({ mois: m, prestations: 0, formations: 0, nouveauxClients: 0 }));
    for (const p of paiementsAnnee) mensuel[p.createdAt.getMonth()].prestations += p.amount;
    for (const f of formationsAnnee) mensuel[f.createdAt.getMonth()].formations += f.montantPaye;
    for (const u of clientsAnnee) mensuel[u.createdAt.getMonth()].nouveauxClients++;
    const premiereAnnee = Math.min(premierPaiement?.createdAt.getFullYear() ?? now.getFullYear(), premierUtilisateur?.createdAt.getFullYear() ?? now.getFullYear());
    const annees = Array.from({ length: now.getFullYear() - premiereAnnee + 1 }, (_, i) => now.getFullYear() - i);

    // Services les plus demandés
    const ids = prestationsParService.map((g) => g.serviceId).filter((x): x is string => Boolean(x));
    const titres = new Map((await prisma.service.findMany({ where: { id: { in: ids } }, select: { id: true, title: true } })).map((x) => [x.id, x.title]));
    const topMap = new Map<string, number>();
    for (const g of prestationsParService) {
      const t = (g.serviceId && titres.get(g.serviceId)) || g.customService || "Autre demande";
      topMap.set(t, (topMap.get(t) ?? 0) + g._count);
    }
    const topServices = [...topMap.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([titre, total]) => ({ titre, total }));

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
        newLastMonth: newUsersLastMonth,
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
        lastMonth: revenueLastMonth._sum.amount ?? 0,
      },
      mensuel: { annee: anneeDemandee, annees, mois: mensuel },
      topServices,
      pendingMessages,
      newsletterCount,
      recentPrestations,
    });
  } catch (error) {
    console.error("GET /api/admin/stats error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
