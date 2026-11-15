/** PATCH / DELETE /api/client/entreprises/[id] — modifier ou supprimer une entreprise du client. */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { schemaEntreprise } from "@/lib/entreprises-schema";

async function proprietaire(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  const e = await prisma.entreprise.findFirst({ where: { id, userId: session.user.id }, select: { id: true } });
  return e ? session : null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await proprietaire(id))) return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });
  const parsed = schemaEntreprise.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  const entreprise = await prisma.entreprise.update({ where: { id }, data: parsed.data, include: { pieces: { orderBy: { createdAt: "desc" } } } });
  return NextResponse.json({ entreprise });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await proprietaire(id))) return NextResponse.json({ error: "Entreprise introuvable." }, { status: 404 });
  await prisma.entreprise.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
