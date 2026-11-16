/** GET /api/client/dossiers — « Mes dossiers » : cartes des demandes du client connecté. */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { carteDossier } from "@/lib/dossier-serveur";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const liste = await prisma.prestation.findMany({
    where: { clientId: session.user.id, status: { not: "ANNULEE" } },
    include: { service: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ dossiers: liste.map((p) => carteDossier(p)) });
}
