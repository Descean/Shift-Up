/** GET /api/equipe/dossiers/[id] — Fiche d'un dossier pour l'équipe (proposition de devis, étapes, livrables). */
import { NextRequest, NextResponse } from "next/server";
import { chargerDossier, exigerDossierEquipe } from "@/lib/dossier-serveur";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await exigerDossierEquipe(id);
  if ("erreur" in a) return a.erreur;
  const r = await chargerDossier(id, "equipe");
  if (!r) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  return NextResponse.json({ dossier: r.dossier, direction: a.ctx.direction, independant: a.ctx.independant });
}
