/**
 * GET /api/client/affiliation
 * Retourne les filleuls d'un client via son affiliationCode.
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
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { affiliationCode: true },
    });

    if (!user?.affiliationCode) {
      return NextResponse.json({ referrals: [] });
    }

    const clientProfiles = await prisma.clientProfile.findMany({
      where: { affiliatedBy: user.affiliationCode },
      include: {
        user: { select: { id: true, name: true, email: true, createdAt: true, prestations: { select: { payments: { where: { status: "COMPLETED" }, select: { amount: true } } } } } },
      },
    });

    const referrals = clientProfiles.map((cp) => {
      const totalPaid = cp.user.prestations.flatMap((p) => p.payments).reduce((s, pay) => s + pay.amount, 0);
      const commission = Math.round(totalPaid * 0.1);
      return {
        id: cp.id,
        name: cp.user.name ?? "—",
        email: cp.user.email ?? "—",
        date: new Date(cp.user.createdAt).toLocaleDateString("fr-FR"),
        status: totalPaid > 0 ? "CONVERTI" : "EN_ATTENTE",
        commission,
      };
    });

    return NextResponse.json({ referrals });
  } catch (error) {
    console.error("GET /api/client/affiliation error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
