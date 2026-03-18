/**
 * GET /api/etudiant/ressources — Ressources pédagogiques actives
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
    const resources = await prisma.resource.findMany({
      where: { isActive: true },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    });

    return NextResponse.json({ resources });
  } catch (error) {
    console.error("GET /api/etudiant/ressources error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
