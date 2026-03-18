/**
 * GET /api/etudiant/portfolio
 * Retourne les micro-tâches VALIDE de l'étudiant connecté.
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
    const tasks = await prisma.microTask.findMany({
      where: { assignedToId: session.user.id, status: "VALIDE" },
      orderBy: { updatedAt: "desc" },
    });

    const items = tasks.map((t) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      category: t.type,
      url: t.deliverable ?? "",
      isPublic: true,
      completedAt: new Date(t.updatedAt).toLocaleDateString("fr-FR"),
      reward: t.reward,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("GET /api/etudiant/portfolio error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
