/** POST /api/client/dossiers/[id]/revision { texte } — Révision incluse, à demander dans les 48 heures qui suivent le solde. */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { infosDossier, revisionOuverte } from "@/lib/dossier";
import { messageSysteme } from "@/lib/fil";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { isSafe } from "@/lib/validation";

const schema = z.object({ texte: z.string().trim().min(5, "Dites-nous ce qu'il faut revoir.").max(3000).refine(isSafe, "Contenu non autorisé.") });

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 422 });
  const p = await prisma.prestation.findFirst({ where: { id, clientId: session.user.id }, select: { customFields: true, client: { select: { name: true, email: true } } } });
  if (!p) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  if (!revisionOuverte(infosDossier(p.customFields))) {
    return NextResponse.json({ error: "La révision incluse se demande dans les 48 heures qui suivent le paiement du solde." }, { status: 409 });
  }
  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  await prisma.prestation.update({
    where: { id },
    data: { customFields: { ...cf, revisionApresSolde: { demandeeLe: new Date().toISOString(), texte: parsed.data.texte } } as Prisma.InputJsonValue },
  });
  await messageSysteme(id, `Révision demandée : ${parsed.data.texte}`, session.user.id);
  await alerterEquipeWhatsApp("Révision demandée", `${p.client.name ?? p.client.email ?? "Client"} — ${parsed.data.texte.slice(0, 140)}`).catch(() => {});
  return NextResponse.json({ ok: true });
}
