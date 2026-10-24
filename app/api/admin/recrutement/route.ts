/**
 * GET   /api/admin/recrutement?offre=DT&statut=NOUVELLE&q=…  → liste des candidatures
 * PATCH /api/admin/recrutement  { id, statut?, noteInterne? }  → mise à jour
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { OFFRES } from "@/lib/recrutement/offres";
import { requireAdmin, buildWhere, STATUTS } from "./_lib";
import { supprimerDonnees } from "@/lib/recrutement/donnees";

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const sp = req.nextUrl.searchParams;
  const [candidatures, parOffre, parStatut, vivier, aNotifier] = await Promise.all([
    prisma.candidature.findMany({ where: buildWhere(sp), orderBy: { createdAt: "desc" }, take: 500 }),
    prisma.candidature.groupBy({ by: ["offreCode"], _count: true }),
    prisma.candidature.groupBy({ by: ["statut"], _count: true }),
    prisma.candidature.count({ where: { conservation: "ACCEPTEE", donneesSupprimeesLe: null } }),
    prisma.candidature.count({ where: { statut: "NON_RETENUE", notifieLe: null, donneesSupprimeesLe: null } }),
  ]);
  return NextResponse.json({
    candidatures,
    offres: OFFRES.map((o) => ({ code: o.code, titre: o.titre, total: parOffre.find((p) => p.offreCode === o.code)?._count ?? 0 })),
    statuts: Object.fromEntries(parStatut.map((s) => [s.statut, s._count])),
    vivier,
    aNotifier,
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

/** DELETE /api/admin/recrutement?id=…  → efface les pièces et anonymise (demande du candidat par courriel, etc.) */
export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const c = await prisma.candidature.findUnique({ where: { id } });
  if (!c) return NextResponse.json({ error: "Candidature introuvable." }, { status: 404 });
  if (c.donneesSupprimeesLe) return NextResponse.json({ candidature: c });
  const candidature = await supprimerDonnees(c, "REFUSEE");
  return NextResponse.json({ candidature });
}
