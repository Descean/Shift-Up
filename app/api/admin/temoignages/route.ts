/**
 * Témoignages clients affichés sur l'accueil (publier uniquement avec l'accord écrit du client).
 * GET liste · POST création · PATCH { id, ... } · DELETE ?id=
 */
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "../recrutement/_lib";

const champs = {
  name: z.string().trim().min(2).max(80),
  role: z.string().trim().min(2).max(120),
  company: z.string().trim().max(120).optional().nullable(),
  content: z.string().trim().min(20).max(600),
  service: z.string().trim().max(80).optional().default(""),
  isVisible: z.boolean().optional(),
};
const creation = z.object(champs);
const maj = z.object({ id: z.string().min(1), ...Object.fromEntries(Object.entries(champs).map(([k, v]) => [k, v.optional()])) });

export async function GET() {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  return NextResponse.json({ temoignages: await prisma.testimonial.findMany({ orderBy: { date: "desc" } }) });
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const p = creation.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Champs invalides (témoignage : 20 à 600 caractères)." }, { status: 400 });
  const t = await prisma.testimonial.create({ data: { ...p.data, company: p.data.company || null, isVisible: p.data.isVisible ?? false } });
  revalidatePath("/");
  return NextResponse.json({ temoignage: t });
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const p = maj.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  const { id, ...data } = p.data as { id: string } & Record<string, unknown>;
  const t = await prisma.testimonial.update({ where: { id }, data }).catch(() => null);
  if (!t) return NextResponse.json({ error: "Introuvable." }, { status: 404 });
  revalidatePath("/");
  return NextResponse.json({ temoignage: t });
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  await prisma.testimonial.delete({ where: { id: req.nextUrl.searchParams.get("id") ?? "" } }).catch(() => null);
  revalidatePath("/");
  return NextResponse.json({ ok: true });
}
