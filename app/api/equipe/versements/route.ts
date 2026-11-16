/**
 * GET   /api/equipe/versements — Direction : demandes de versement des monteurs indépendants.
 * PATCH /api/equipe/versements { id, statut: "PAID" | "REJECTED", note? } — Versement fait (Mobile Money) ou refusé.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigerEquipe } from "@/lib/dossier-serveur";

export async function GET() {
  const a = await exigerEquipe(true);
  if ("erreur" in a) return a.erreur;
  const liste = await prisma.payoutRequest.findMany({
    where: { user: { role: "MONTEUR" } },
    include: { user: { select: { name: true, email: true } } },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    take: 100,
  });
  return NextResponse.json({ versements: liste.map((v) => ({ id: v.id, monteur: v.user.name ?? v.user.email, montant: v.amount, operateur: v.mobileProvider, numero: v.mobileNumber, statut: v.status, reference: v.reference, date: v.createdAt.toISOString(), note: v.notes })) });
}

const schema = z.object({ id: z.string().min(1), statut: z.enum(["PAID", "REJECTED"]), note: z.string().trim().max(300).optional() });

export async function PATCH(req: NextRequest) {
  const a = await exigerEquipe(true);
  if ("erreur" in a) return a.erreur;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 422 });
  const r = await prisma.payoutRequest.updateMany({
    where: { id: parsed.data.id, status: { in: ["PENDING", "PROCESSING"] }, user: { role: "MONTEUR" } },
    data: { status: parsed.data.statut, notes: parsed.data.note ?? null, processedAt: new Date() },
  });
  if (!r.count) return NextResponse.json({ error: "Demande introuvable ou déjà traitée." }, { status: 409 });
  await prisma.auditLog.create({ data: { userId: a.session.user.id, action: "VERSEMENT_MONTEUR", entity: "PayoutRequest", entityId: parsed.data.id, details: parsed.data } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
