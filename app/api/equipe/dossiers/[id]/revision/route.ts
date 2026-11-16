/**
 * POST /api/equipe/dossiers/[id]/revision — Le monteur indique que les corrections sont faites :
 *  - correction demandée avant le solde (statut REVISION) : le dossier revient en livraison, le client revoit l'aperçu ;
 *  - révision incluse demandée après le solde : elle est marquée livrée.
 */
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
  const p = await prisma.prestation.findUnique({ where: { id }, select: { customFields: true, status: true } });
  if (p?.status === "REVISION") {
    await prisma.prestation.update({ where: { id }, data: { status: "LIVRAISON" } });
    await messageSysteme(id, "Les corrections sont faites. Veuillez vérifier l'aperçu.", a.session.user.id);
    await avertirClient(id, "STATUT", "Corrections faites", "Vérifiez l'aperçu de vos livrables, puis réglez le solde pour télécharger vos fichiers.");
    return NextResponse.json({ ok: true });
  }
  const r = p ? infosDossier(p.customFields).revision : null;
  if (!p || !r) return NextResponse.json({ error: "Aucune révision demandée." }, { status: 404 });
  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  await prisma.prestation.update({ where: { id }, data: { customFields: { ...cf, revisionApresSolde: { ...r, faiteLe: new Date().toISOString() } } as Prisma.InputJsonValue } });
  await messageSysteme(id, "La révision est faite : les fichiers mis à jour sont dans votre espace.", a.session.user.id);
  await avertirClient(id, "LIVRABLE", "Révision livrée", "Les fichiers mis à jour sont disponibles dans votre espace.");
  return NextResponse.json({ ok: true });
}
