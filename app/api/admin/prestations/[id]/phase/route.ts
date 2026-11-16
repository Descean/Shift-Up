/**
 * GET   /api/admin/prestations/[id]/phase — Liste les phases
 * POST  /api/admin/prestations/[id]/phase — Créer une phase
 * PATCH /api/admin/prestations/[id]/phase — Mettre à jour une phase (status, progress)
 */

import { estEquipe } from "@/lib/roles";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { avertirClient } from "@/lib/notifications";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!estEquipe(session.user.role as string)) return null;
  return session;
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;
  { const acces = await exigerDossierEquipe(id); if ("erreur" in acces) return acces.erreur; }
  const phases = await prisma.prestationPhase.findMany({
    where: { prestationId: id },
    orderBy: { order: "asc" },
  });
  return NextResponse.json({ phases });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;
  { const acces = await exigerDossierEquipe(id); if ("erreur" in acces) return acces.erreur; }
  try {
    const { title, description, order, status, progress } = await req.json();
    const phase = await prisma.prestationPhase.create({
      data: { prestationId: id, title, description, order: order ?? 0, status: status ?? "PENDING", progress: progress ?? 0 },
    });
    return NextResponse.json({ phase });
  } catch (error) {
    console.error("POST /phase error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;
  { const acces = await exigerDossierEquipe(id); if ("erreur" in acces) return acces.erreur; }
  try {
    const { phaseId, status, progress, startDate, endDate } = await req.json();
    if (!phaseId) return NextResponse.json({ error: "phaseId requis." }, { status: 400 });
    const avant = await prisma.prestationPhase.findFirst({ where: { id: phaseId, prestationId: id }, select: { status: true, title: true } });
    if (!avant) return NextResponse.json({ error: "Étape introuvable pour cette prestation." }, { status: 404 });
    const etaitLivree = (await prisma.prestation.findUnique({ where: { id }, select: { status: true } }))?.status === "LIVRAISON";

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
    const allPhases = await prisma.prestationPhase.findMany({ where: { prestationId: id } });
    const globalProgress = allPhases.length > 0
      ? Math.round(allPhases.reduce((s, p) => s + p.progress, 0) / allPhases.length)
      : 0;

    await prisma.prestation.update({
      where: { id },
      data: {
        globalProgress,
        ...(allPhases.every((p) => p.status === "DONE") && { status: "LIVRAISON" }),
      },
    });

    // Avis au client quand une étape démarre ou se termine
    if (status !== undefined && status !== avant.status) {
      if (status === "DONE") await avertirClient(id, "ETAPE", `Étape terminée : ${avant.title}`, `L'étape « ${avant.title} » de votre demande est terminée. Avancement global : ${globalProgress} %.`);
      else if (status === "IN_PROGRESS") await avertirClient(id, "ETAPE", `Étape en cours : ${avant.title}`, `Nous avons commencé l'étape « ${avant.title} ». Avancement global : ${globalProgress} %.`);
    }
    if (!etaitLivree && allPhases.length > 0 && allPhases.every((p) => p.status === "DONE")) {
      await avertirClient(id, "STATUT", "Livraison prête", "Toutes les étapes sont terminées. Consultez les livrables et validez la livraison, ou demandez une révision.");
    }

    return NextResponse.json({ phase, globalProgress });
  } catch (error) {
    console.error("PATCH /phase error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
