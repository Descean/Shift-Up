/**
 * GET /api/veille/avis/:id — Un avis collecté (pré-remplissage de la fiche « Monter ce dossier »).
 * Données publiques ; réservé aux utilisateurs connectés.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  try {
    const avis = await prisma.avisMarche.findUnique({ where: { id } });
    if (!avis) return NextResponse.json({ error: "Avis introuvable." }, { status: 404 });
    return NextResponse.json({ avis });
  } catch {
    return NextResponse.json({ error: "Avis indisponible." }, { status: 404 });
  }
}
