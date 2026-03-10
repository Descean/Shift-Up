/**
 * app/api/micro-tasks/[id]/route.ts — Actions sur une micro-tâche
 *
 * PATCH /api/micro-tasks/:id
 *   - Étudiant peut : s'auto-assigner (assign=true), soumettre (status=SOUMIS, deliverable)
 *   - Admin peut : valider (VALIDE), refuser (REFUSE), tout modifier
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  assign:      z.boolean().optional(),       // true = l'étudiant s'assigne la tâche
  status:      z.enum(["SOUMIS","VALIDE","REFUSE","DISPONIBLE"]).optional(),
  deliverable: z.string().optional(),        // URL ou texte du livrable soumis
});

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "DEVELOPER";

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const task = await prisma.microTask.findUnique({ where: { id } });
    if (!task) {
      return NextResponse.json({ error: "Tâche introuvable." }, { status: 404 });
    }

    // Un étudiant ne peut interagir qu'avec une tâche disponible ou qui lui est assignée
    if (!isAdmin && task.assignedToId && task.assignedToId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
    }

    const updateData: Record<string, any> = {};

    if (data.assign && !task.assignedToId) {
      // L'étudiant s'assigne la tâche si elle est disponible
      if (task.status !== "DISPONIBLE") {
        return NextResponse.json({ error: "Cette tâche n'est plus disponible." }, { status: 400 });
      }
      updateData.assignedToId = session.user.id;
      updateData.status       = "EN_COURS";
    }

    if (data.status === "SOUMIS" && task.assignedToId === session.user.id) {
      // L'étudiant soumet son livrable
      updateData.status      = "SOUMIS";
      updateData.deliverable = data.deliverable;
    }

    if (isAdmin && data.status) {
      // L'admin valide ou refuse
      updateData.status = data.status;

      // Si validé → incrémenter completedTasks de l'étudiant assigné
      if (data.status === "VALIDE" && task.assignedToId) {
        await prisma.etudiantProfile.updateMany({
          where: { userId: task.assignedToId },
          data:  { completedTasks: { increment: 1 } },
        });
      }
    }

    const updated = await prisma.microTask.update({
      where: { id },
      data:  updateData,
    });

    return NextResponse.json({ task: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("PATCH /api/micro-tasks/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
