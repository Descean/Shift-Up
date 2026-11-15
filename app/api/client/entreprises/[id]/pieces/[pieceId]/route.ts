/** DELETE /api/client/entreprises/[id]/pieces/[pieceId] — retire une pièce du coffre (le fichier reste dans les dossiers qui l'ont reprise). */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; pieceId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id, pieceId } = await params;
  const r = await prisma.pieceEntreprise.deleteMany({ where: { id: pieceId, entrepriseId: id, entreprise: { userId: session.user.id } } });
  if (!r.count) return NextResponse.json({ error: "Pièce introuvable." }, { status: 404 });
  return NextResponse.json({ ok: true });
}
