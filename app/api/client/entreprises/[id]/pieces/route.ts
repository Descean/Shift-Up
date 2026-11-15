/** POST /api/client/entreprises/[id]/pieces — ajoute une pièce au coffre de l'entreprise. */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schemaPiece } from "@/lib/entreprises-schema";
import { fichierDeLUtilisateur } from "@/lib/entreprises";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const e = await prisma.entreprise.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  if (!e) return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });
  const parsed = schemaPiece.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Pièce invalide." }, { status: 422 });
  if (!fichierDeLUtilisateur(parsed.data.url, session.user.id)) return NextResponse.json({ error: "Fichier non reconnu : déposez-le depuis cette page." }, { status: 422 });
  if ((await prisma.pieceEntreprise.count({ where: { entrepriseId: id } })) >= 200) return NextResponse.json({ error: "Coffre plein (200 pièces)." }, { status: 409 });
  const piece = await prisma.pieceEntreprise.create({ data: { ...parsed.data, entrepriseId: id } });
  return NextResponse.json({ piece }, { status: 201 });
}
