/**
 * POST /api/equipe/dossiers/[id]/relance — Rappelle au client que son devis attend l'acompte :
 * courriel avec un bouton de connexion directe au dossier. Au plus un rappel toutes les 15 minutes.
 */
import { NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { prevenirClientDevis } from "@/lib/devis-client";
import { titreDossier } from "@/lib/dossier";
import { messageSysteme } from "@/lib/fil";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await exigerDossierEquipe(id);
  if ("erreur" in a) return a.erreur;
  const p = await prisma.prestation.findUnique({ where: { id }, include: { service: { select: { title: true } } } });
  if (!p) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  if (!["DEVIS_ENVOYE", "EN_ATTENTE_PAIEMENT"].includes(p.status) || p.amountPaid > 0) {
    return NextResponse.json({ error: "Il n'y a pas d'acompte en attente sur ce dossier." }, { status: 409 });
  }
  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  const dernier = typeof cf.devisPrevenuLe === "string" ? Date.parse(cf.devisPrevenuLe) : 0;
  if (Date.now() - dernier < 15 * 60 * 1000) {
    return NextResponse.json({ error: "Le client vient d'être prévenu. Réessayez dans quelques minutes." }, { status: 429 });
  }
  const acompte = Number((p.quote as { deposit?: number } | null)?.deposit ?? 0);
  if (!(await prevenirClientDevis(id, titreDossier(p), acompte, true))) {
    return NextResponse.json({ error: "Ce client n'a pas d'adresse e-mail." }, { status: 422 });
  }
  const le = new Date().toISOString();
  await prisma.prestation.update({ where: { id }, data: { customFields: { ...cf, devisPrevenuLe: le } as Prisma.InputJsonValue } });
  await messageSysteme(id, "Rappel du devis envoyé au client par e-mail.", a.session.user.id);
  return NextResponse.json({ ok: true, le });
}
