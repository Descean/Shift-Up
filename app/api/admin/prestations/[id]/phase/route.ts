/**
 * GET   /api/admin/prestations/[id]/phase — Liste les phases
 * POST  /api/admin/prestations/[id]/phase — Créer une phase
 * PATCH /api/admin/prestations/[id]/phase — Mettre à jour une phase (status, progress)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!["ADMIN", "DEVELOPER"].includes(session.user.role as string)) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const phases = await prisma.prestationPhase.findMany({
    where: { prestationId: params.id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ phases });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { title, description, order, status, progress } = await req.json();
    const phase = await prisma.prestationPhase.create({
      data: { prestationId: params.id, title, description, order: order ?? 0, status: status ?? "PENDING", progress: progress ?? 0 },
    });
    return NextResponse.json({ phase });
  } catch (error) {
    console.error("POST /phase error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { phaseId, status, progress, startDate, endDate } = await req.json();
    if (!phaseId) return NextResponse.json({ error: "phaseId requis." }, { status: 400 });

    const phase = await prisma.prestationPhase.update({
      where: { id: phaseId },
      data: {
        ...(status !== undefined && { status }),
        ...(progress !== undefined && { progress: Number(progress) }),
        ...(startDate !== undefined && { startDate: startDate ? new Date(startDate) : null }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
      },
    });

    // Recalcule le progress global de la prestation
    const allPhases = await prisma.prestationPhase.findMany({ where: { prestationId: params.id } });
    const globalProgress = allPhases.length > 0
      ? Math.round(allPhases.reduce((s, p) => s + p.progress, 0) / allPhases.length)
      : 0;

    await prisma.prestation.update({
      where: { id: params.id },
      data: {
        globalProgress,
        ...(allPhases.every((p) => p.status === "DONE") && { status: "LIVRAISON" }),
      },
    });

    return NextResponse.json({ phase, globalProgress });
  } catch (error) {
    console.error("PATCH /phase error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
