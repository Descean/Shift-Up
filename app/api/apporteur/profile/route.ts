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
        user: { select: { affiliationCode: true, name: true, email: true, createdAt: true } },
      },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil apporteur introuvable." }, { status: 404 });
    }

    const totalReferrals = await prisma.clientProfile.count({
      where: { affiliatedBy: profile.user.affiliationCode ?? "" },
    });

    return NextResponse.json({
      profile: {
        name:            profile.user.name ?? "",
        email:           profile.user.email ?? "",
        ifu:             profile.ifu,
        level:           profile.level,
        totalEarnings:   profile.totalEarnings,
        pendingEarnings: profile.pendingEarnings,
        paidEarnings:    Math.max(0, profile.totalEarnings - profile.pendingEarnings),
        totalReferrals,
        affiliationCode: profile.user.affiliationCode ?? "",
        joinedAt:        profile.user.createdAt,
      },
    });
  } catch (error) {
    console.error("GET /api/apporteur/profile error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
