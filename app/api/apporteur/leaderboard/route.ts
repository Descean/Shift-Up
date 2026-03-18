/**
 * GET /api/apporteur/leaderboard
 * Top 20 apporteurs triés par totalEarnings.
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

  try {
    const profiles = await prisma.apporteurProfile.findMany({
      take: 20,
      orderBy: { totalEarnings: "desc" },
      include: {
        user: { select: { id: true, name: true, affiliationCode: true } },
      },
    });

    const leaderboard = await Promise.all(
      profiles.map(async (p, index) => {
        const referrals = await prisma.clientProfile.count({
          where: { affiliatedBy: p.user.affiliationCode ?? "" },
        });
        return {
          rank: index + 1,
          name: p.user.name ?? "—",
          level: p.level,
          conversions: referrals,
          earnings: p.totalEarnings,
          avatar: (p.user.name ?? "??").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase(),
          isCurrentUser: p.user.id === session.user.id,
        };
      })
    );

    return NextResponse.json({ leaderboard });
  } catch (error) {
    console.error("GET /api/apporteur/leaderboard error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
