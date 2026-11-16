/**
 * PATCH  /api/admin/soumissions/:id — Corriger une offre ou saisir / corriger son résultat
 * DELETE /api/admin/soumissions/:id — Supprimer une offre saisie par erreur
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSafe } from "@/lib/validation";
import { RESULTATS, appliquerResultat } from "@/lib/soumissions";

async function admin() {
  const s = await getServerSession(authOptions);
  return s?.user?.id && ["ADMIN", "DEVELOPER"].includes(s.user.role as string) ? s : null;
}
const opt = (max: number) =>
  z.string().trim().max(max).refine(isSafe, "Contenu non autorisé détecté.").optional().nullable().transform((v) => (v === undefined ? undefined : v || null));

const schema = z.object({
  resultat: z.enum(RESULTATS).optional(),
  attributaire: opt(300),
  montantAttribue: z.coerce.number().min(0).max(1e13).optional().nullable(),
  preuveUrl: z.union([z.string().url().max(1000), z.literal("").transform(() => null)]).optional().nullable(),
  validiteJours: z.coerce.number().int().min(15).max(365).optional(),
  reference: opt(150),
  note: opt(1000),
});

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await admin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const { id } = await params;
  const corps = schema.safeParse(await req.json().catch(() => null));
  if (!corps.success) return NextResponse.json({ error: corps.error.issues[0]?.message ?? "Données invalides." }, { status: 400 });
  const { resultat, attributaire, montantAttribue, preuveUrl, ...autres } = corps.data;
  try {
    if (Object.keys(autres).length) await prisma.soumission.update({ where: { id }, data: autres });
    if (resultat) {
      await appliquerResultat(id, { resultat, attributaire, montantAttribue: montantAttribue ?? null, preuveUrl, detecteParTendo: false });
    } else if (attributaire !== undefined || montantAttribue !== undefined || preuveUrl !== undefined) {
      await prisma.soumission.update({ where: { id }, data: { attributaire, montantAttribue, preuveUrl } });
    }
    return NextResponse.json({ ok: true, message: "Enregistré." });
  } catch (e) {
    console.error("[admin/soumissions] maj", e);
    return NextResponse.json({ error: "Mise à jour impossible." }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await admin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const { id } = await params;
  try {
    await prisma.soumission.delete({ where: { id } });
    revalidatePath("/");
    return NextResponse.json({ ok: true, message: "Offre supprimée." });
  } catch {
    return NextResponse.json({ error: "Suppression impossible." }, { status: 500 });
  }
}
