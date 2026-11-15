/**
 * GET  /api/client/entreprises → entreprises du client avec leurs pièces (coffre)
 * POST /api/client/entreprises → nouvelle entreprise
 * Si la table n'existe pas encore (script SQL non exécuté), GET renvoie { disponible: false }.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schemaEntreprise } from "@/lib/entreprises-schema";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const entreprises = await prisma.entreprise.findMany({
      where: { userId: session.user.id },
      include: { pieces: { orderBy: { createdAt: "desc" } } },
      orderBy: { nom: "asc" },
    });
    return NextResponse.json({ disponible: true, entreprises });
  } catch {
    return NextResponse.json({ disponible: false, entreprises: [] });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const parsed = schemaEntreprise.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  const n = await prisma.entreprise.count({ where: { userId: session.user.id } });
  if (n >= 30) return NextResponse.json({ error: "Nombre maximal d'entreprises atteint (30)." }, { status: 409 });
  const entreprise = await prisma.entreprise.create({ data: { ...parsed.data, userId: session.user.id }, include: { pieces: true } });
  return NextResponse.json({ entreprise }, { status: 201 });
}
