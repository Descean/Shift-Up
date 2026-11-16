/** POST /api/equipe/dossiers/[id]/revision — Le monteur indique que la révision demandée après le solde est livrée. */
import { NextRequest, NextResponse } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { infosDossier } from "@/lib/dossier";
import { avertirClient } from "@/lib/notifications";
import { messageSysteme } from "@/lib/fil";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await exigerDossierEquipe(id);
  if ("erreur" in a) return a.erreur;
  const p = await prisma.prestation.findUnique({ where: { id }, select: { customFields: true } });
  const r = p ? infosDossier(p.customFields).revision : null;
  if (!p || !r) return NextResponse.json({ error: "Aucune révision demandée." }, { status: 404 });
  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  await prisma.prestation.update({ where: { id }, data: { customFields: { ...cf, revisionApresSolde: { ...r, faiteLe: new Date().toISOString() } } as Prisma.InputJsonValue } });
  await messageSysteme(id, "La révision est faite : les fichiers mis à jour sont dans votre espace.", a.session.user.id);
  await avertirClient(id, "LIVRABLE", "Révision livrée", "Les fichiers mis à jour sont disponibles dans votre espace.");
  return NextResponse.json({ ok: true });
}
