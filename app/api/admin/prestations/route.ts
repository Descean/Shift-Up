/**
 * app/api/admin/prestations/route.ts — Gestion des prestations (admin)
 *
 * GET   /api/admin/prestations  → Liste toutes les prestations (paginée, filtrable)
 * PATCH /api/admin/prestations  → Assigne un membre, change le statut, met à jour les phases
 *
 * Accès réservé ADMIN / DEVELOPER.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { conflitsDans, montagesActifs, statsMontage } from "@/lib/montage-serveur";
import { lireMontage } from "@/lib/montage";
import { z } from "zod";

const patchSchema = z.object({
  prestationId:    z.string(),
  status:          z.enum(["EN_ATTENTE","DEVIS_ENVOYE","EN_ATTENTE_PAIEMENT","EN_COURS","LIVRAISON","REVISION","TERMINEE","ANNULEE"]).optional(),
  assignedToId:    z.string().optional(),
  globalProgress:  z.number().min(0).max(100).optional(),
  currentPhase:    z.number().min(0).optional(),
  phases:          z.array(z.any()).optional(),
  estimatedEndDate: z.string().optional(),
  endDate:         z.string().optional(),
  adminNote:       z.string().optional(),
});

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") return null;
  return session;
}

// ── GET — Liste toutes les prestations ───────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const page    = Number(searchParams.get("page")   ?? "1");
  const limit   = Number(searchParams.get("limit")  ?? "20");
  const status  = searchParams.get("status")  as any ?? undefined;
  const search  = searchParams.get("search")  ?? undefined;

  try {
    const where = {
      ...(status ? { status } : {}),
      ...(search ? {
        OR: [
          { client:  { name:  { contains: search, mode: "insensitive" as const } } },
          { service: { title: { contains: search, mode: "insensitive" as const } } },
        ],
      } : {}),
    };

    const [prestations, total] = await Promise.all([
      prisma.prestation.findMany({
        where,
        skip:    (page - 1) * limit,
        take:    limit,
        orderBy: { createdAt: "desc" },
        include: {
          client:          { select: { id: true, name: true, email: true, phone: true } },
          service:         { select: { id: true, title: true, domain: true } },
          assignedTo:      { select: { id: true, name: true } },
          payments:        { select: { status: true, amount: true } },
          prestationPhases: { orderBy: { order: "asc" } },
          livrables:       { orderBy: { createdAt: "asc" }, include: { phase: { select: { id: true, title: true, order: true } } } },
        },
      }),
      prisma.prestation.count({ where }),
    ]);

    // Montages : même avis suivi pour d'autres soumissionnaires + statistiques
    const montages = await montagesActifs();
    const avecConflits = prestations.map((p) => {
      const d = lireMontage(p.customFields).dossier;
      return d ? { ...p, conflits: conflitsDans(montages, p.id, d.referenceAvis) } : p;
    });

    return NextResponse.json({
      prestations: avecConflits,
      statsMontage: statsMontage(montages),
      total,
      page,
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── PATCH — Mise à jour admin d'une prestation ────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const body = await req.json();
    const { prestationId, ...data } = patchSchema.parse(body);

    const existing = await prisma.prestation.findUnique({ where: { id: prestationId } });
    if (!existing) {
      return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
    }

    const updated = await prisma.prestation.update({
      where: { id: prestationId },
      data: {
        ...(data.status          ? { status: data.status }                              : {}),
        ...(data.assignedToId    ? { assignedToId: data.assignedToId }                 : {}),
        ...(data.globalProgress  !== undefined ? { globalProgress: data.globalProgress } : {}),
        ...(data.currentPhase    !== undefined ? { currentPhase: data.currentPhase }     : {}),
        ...(data.phases          ? { phases: data.phases }                              : {}),
        ...(data.estimatedEndDate ? { estimatedEndDate: new Date(data.estimatedEndDate) } : {}),
        ...(data.endDate          ? { endDate: new Date(data.endDate) }                 : {}),
      },
      include: {
        client:  { select: { name: true, email: true } },
        service: { select: { title: true } },
      },
    });

    // Audit
    await prisma.auditLog.create({
      data: {
        userId:   session.user.id,
        action:   "ADMIN_PRESTATION_UPDATED",
        entity:   "Prestation",
        entityId: prestationId,
        details:  { changes: data, previousStatus: existing.status },
      },
    });

    return NextResponse.json({ prestation: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("PATCH /api/admin/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
