import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  const formation = await prisma.formation.findUnique({
    where: { slug: params.slug, isActive: true },
    select: {
      id: true,
      slug: true,
      titre: true,
      description: true,
      dateDebut: true,
      dateFin: true,
      lieu: true,
      prixFCFA: true,
      placesMax: true,
      _count: { select: { inscriptions: { where: { status: "PAIEMENT_CONFIRME" } } } },
    },
  });

  if (!formation) {
    return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
  }

  return NextResponse.json({
    ...formation,
    placesRestantes: Math.max(0, formation.placesMax - formation._count.inscriptions),
  });
}
