/**
 * app/api/payout/admin/route.ts
 *
 * GET  — Liste les PayoutRequests (filtre par status)
 * PATCH — Met à jour le statut d'une PayoutRequest (PROCESSING | PAID | REJECTED)
 *
 * Réservé aux ADMIN / DEVELOPER.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") return null;
  return session;
}

// ── GET /api/payout/admin?status=PENDING ────────────────────────────────────
export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") || "PENDING";

  const rows = await prisma.payoutRequest.findMany({
    where:   { status },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { name: true, email: true } } },
  });

  const requests = rows.map((r) => ({
    id:             r.id,
    reference:      r.reference,
    userId:         r.userId,
    userName:       r.user.name || "—",
    userEmail:      r.user.email,
    amount:         r.amount,
    currency:       r.currency,
    mobileProvider: r.mobileProvider,
    mobileNumber:   r.mobileNumber,
    status:         r.status,
    notes:          r.notes,
    createdAt:      r.createdAt.toISOString(),
    processedAt:    r.processedAt?.toISOString() ?? null,
  }));

  return NextResponse.json({ requests });
}

// ── PATCH /api/payout/admin ──────────────────────────────────────────────────
const patchSchema = z.object({
  id:     z.string(),
  status: z.enum(["PROCESSING", "PAID", "REJECTED"]),
  notes:  z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const payout = await prisma.payoutRequest.findUnique({ where: { id: data.id } });
    if (!payout) return NextResponse.json({ error: "Demande introuvable." }, { status: 404 });

    const updated = await prisma.payoutRequest.update({
      where: { id: data.id },
      data: {
        status:      data.status,
        notes:       data.notes ?? payout.notes,
        processedAt: data.status === "PAID" || data.status === "REJECTED" ? new Date() : payout.processedAt,
      },
    });

    // If PAID — deduct from apporteur's pendingEarnings and add to totalEarnings
    if (data.status === "PAID") {
      await prisma.apporteurProfile.update({
        where: { userId: payout.userId },
        data: {
          pendingEarnings: { decrement: payout.amount },
          totalEarnings:   { increment: payout.amount },
        },
      });
    }

    return NextResponse.json({ success: true, status: updated.status });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("Payout admin error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
