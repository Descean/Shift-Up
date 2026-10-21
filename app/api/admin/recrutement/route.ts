/**
 * GET   /api/admin/recrutement?offre=DT&statut=NOUVELLE&q=…  → liste des candidatures
 * PATCH /api/admin/recrutement  { id, statut?, noteInterne? }  → mise à jour
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { OFFRES } from "@/lib/recrutement/offres";
import { requireAdmin, buildWhere, STATUTS } from "./_lib";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const [candidatures, parOffre, parStatut] = await Promise.all([
    prisma.candidature.findMany({ where: buildWhere(sp), orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.candidature.groupBy({ by: ["offreCode"], _count: true }),
    prisma.candidature.groupBy({ by: ["statut"], _count: true }),
  ]);
  return NextResponse.json({
    candidatures,
    offres: OFFRES.map((o) => ({ code: o.code, titre: o.titre, total: parOffre.find((p) => p.offreCode === o.code)?._count ?? 0 })),
    statuts: Object.fromEntries(parStatut.map((s) => [s.statut, s._count])),
  });
}

const patchSchema = z.object({
  id: z.string().min(1),
  statut: z.enum(STATUTS).optional(),
  noteInterne: z.string().max(2000).optional(),
});

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const p = patchSchema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { id, ...data } = p.data;
  const c = await prisma.candidature.update({ where: { id }, data }).catch(() => null);
  if (!c) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  return NextResponse.json({ candidature: c });
}
