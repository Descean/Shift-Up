/**
 * app/api/prestations/[id]/route.ts — Détail et mise à jour d'une prestation
 *
 * GET   /api/prestations/:id   → Détail complet (client : ses propres; admin : toutes)
 * PATCH /api/prestations/:id   → Mise à jour partielle (statut, note, rating, review)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  status: z.enum(["EN_ATTENTE","EN_COURS","LIVRAISON","REVISION","TERMINEE","ANNULEE"]).optional(),
  globalProgress: z.number().min(0).max(100).optional(),
  currentPhase: z.number().min(0).optional(),
  phases: z.array(z.any()).optional(),
  notes: z.string().optional(),
  assignedToId: z.string().optional(),
  estimatedEndDate: z.string().optional(),
  endDate: z.string().optional(),
  rating: z.number().min(1).max(5).optional(),
  review: z.string().optional(),
});

type Params = { params: Promise<{ id: string }> };

// ── GET — Récupère le détail d'une prestation ─────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id } = await params;
  const isAdmin = session.user.role === "ADMIN" || session.user.role === "DEVELOPER";

  try {
    const prestation = await prisma.prestation.findUnique({
      where: {
        id,
        // Un client ne peut voir que ses propres prestations ; admin voit tout
        ...(isAdmin ? {} : { clientId: session.user.id }),
      },
      include: {
        service: true,
        payments: { orderBy: { createdAt: "desc" } },
        client: { select: { id: true, name: true, email: true, phone: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
      },
    });

    if (!prestation) {
      return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
    }

    return NextResponse.json({ prestation });
  } catch (error) {
    console.error("GET /api/prestations/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── PATCH — Met à jour une prestation ─────────────────────────────────────────
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

    // Vérifie que la prestation existe et que l'utilisateur y a accès
    const existing = await prisma.prestation.findUnique({
      where: { id, ...(isAdmin ? {} : { clientId: session.user.id }) },
    });
    if (!existing) {
      return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
    }

    // Un client ne peut modifier que rating + review (après livraison)
    const updateData: Record<string, any> = {};
    if (isAdmin) {
      // L'admin peut tout modifier
      if (data.status)          updateData.status          = data.status;
      if (data.globalProgress !== undefined) updateData.globalProgress = data.globalProgress;
      if (data.currentPhase   !== undefined) updateData.currentPhase   = data.currentPhase;
      if (data.phases)          updateData.phases          = data.phases;
      if (data.notes)           updateData.notes           = data.notes;
      if (data.assignedToId)    updateData.assignedToId    = data.assignedToId;
      if (data.estimatedEndDate) updateData.estimatedEndDate = new Date(data.estimatedEndDate);
      if (data.endDate)          updateData.endDate          = new Date(data.endDate);
    }
    // Le client peut toujours soumettre une note/avis (uniquement sur TERMINEE)
    if (data.rating !== undefined && existing.status === "TERMINEE") {
      updateData.rating = data.rating;
    }
    if (data.review && existing.status === "TERMINEE") {
      updateData.review = data.review;
    }

    const updated = await prisma.prestation.update({
      where: { id },
      data: updateData,
      include: { service: true },
    });

    // Audit log sur changement de statut
    if (data.status && data.status !== existing.status) {
      await prisma.auditLog.create({
        data: {
          userId: session.user.id,
          action: `PRESTATION_STATUS_${data.status}`,
          entity: "Prestation",
          entityId: id,
          details: { from: existing.status, to: data.status },
        },
      });
    }

    return NextResponse.json({ prestation: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("PATCH /api/prestations/[id] error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
