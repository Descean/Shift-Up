/**
 * app/api/micro-tasks/route.ts — Micro-tâches pour les étudiants
 *
 * GET  /api/micro-tasks  → Liste les tâches disponibles (ETUDIANT) ou toutes (ADMIN)
 * POST /api/micro-tasks  → Crée une nouvelle micro-tâche (ADMIN uniquement)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  title:          z.string().min(5),
  description:    z.string().min(20),
  type:           z.enum(["DATA_ENTRY","REDACTION","RECHERCHE","TEST_LOGICIEL","AUTRE"]),
  reward:         z.number().positive(),
  estimatedHours: z.number().positive().default(2),
  deadline:       z.string(), // ISO date string
});

// ── GET — Liste des micro-tâches ──────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "DEVELOPER";
  const statusFilter = searchParams.get("status");

  try {
    const tasks = await prisma.microTask.findMany({
      where: isAdmin
        ? (statusFilter ? { status: statusFilter } : {})
        // Un étudiant voit les tâches DISPONIBLES ou celles qui lui sont assignées
        : {
            OR: [
              { status: "DISPONIBLE" },
              { assignedToId: session.user.id },
            ],
          },
      orderBy: { deadline: "asc" },
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    console.error("GET /api/micro-tasks error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── POST — Crée une micro-tâche (admin only) ──────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    const task = await prisma.microTask.create({
      data: {
        ...data,
        deadline: new Date(data.deadline),
        status: "DISPONIBLE",
      },
    });

    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("POST /api/micro-tasks error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
