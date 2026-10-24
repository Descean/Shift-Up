/**
 * GET /api/cron/recrutement — tâche quotidienne (Vercel Cron, voir vercel.json)
 * Relances, suppression des dossiers sans réponse ou en fin de conservation, fichiers abandonnés.
 * Protégée par CRON_SECRET : Vercel envoie « Authorization: Bearer <CRON_SECRET> ».
 */
import { NextRequest, NextResponse } from "next/server";
import { entretienDonnees } from "@/lib/recrutement/donnees";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const bilan = await entretienDonnees();
  if (bilan.erreurs.length) console.error("[cron/recrutement]", bilan.erreurs);
  return NextResponse.json(bilan);
}
