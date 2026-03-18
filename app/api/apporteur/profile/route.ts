/**
 * GET /api/apporteur/profile
 * Retourne le profil apporteur du user connecté (gains, affiliés, code).
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
    const profile = await prisma.apporteurProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        _count: { select: { referrals: true } },
        user: { select: { affiliationCode: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil apporteur introuvable." }, { status: 404 });
    }

    return NextResponse.json({
      profile: {
        totalEarnings:   profile.totalEarnings,
        pendingEarnings: profile.pendingEarnings,
        totalReferrals:  profile._count.referrals,
        affiliationCode: profile.user.affiliationCode ?? "",
      },
    });
  } catch (error) {
    console.error("GET /api/apporteur/profile error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
