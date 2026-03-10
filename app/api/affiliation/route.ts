/**
 * app/api/affiliation/route.ts — Statistiques d'affiliation pour l'apporteur
 *
 * GET /api/affiliation → Renvoie le code, le niveau, les gains, et l'historique
 *                        des filleuls de l'apporteur connecté.
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
  if (session.user.role !== "APPORTEUR" && session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
    return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });
  }

  try {
    // Profil apporteur avec totaux
    const apporteur = await prisma.apporteurProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: { select: { affiliationCode: true, name: true } },
      },
    });

    if (!apporteur) {
      return NextResponse.json({ error: "Profil apporteur introuvable." }, { status: 404 });
    }

    // Clients affiliés via ce code
    const affiliatedClients = await prisma.clientProfile.findMany({
      where: { affiliatedBy: apporteur.user.affiliationCode },
      include: {
        user: {
          select: {
            id: true, name: true, createdAt: true,
            prestations: {
              where: { status: "TERMINEE" },
              select: { amount: true, amountPaid: true, createdAt: true },
            },
          },
        },
      },
    });

    // Calcul de la commission : 10% des prestations terminées des filleuls
    const COMMISSION_RATE = 0.10;
    const referralHistory = affiliatedClients.map((c) => {
      const totalAmount = c.user.prestations.reduce((s, p) => s + p.amount, 0);
      const commission  = totalAmount * COMMISSION_RATE;
      return {
        clientId:    c.user.id,
        clientName:  c.user.name ?? "Client",
        joinedAt:    c.user.createdAt,
        prestations: c.user.prestations.length,
        totalAmount,
        commission,
      };
    });

    return NextResponse.json({
      code:            apporteur.user.affiliationCode,
      level:           apporteur.level,
      totalEarnings:   apporteur.totalEarnings,
      pendingEarnings: apporteur.pendingEarnings,
      referralsCount:  affiliatedClients.length,
      referralHistory,
    });
  } catch (error) {
    console.error("GET /api/affiliation error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
