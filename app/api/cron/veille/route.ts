/**
 * GET /api/cron/veille — tâche quotidienne de la veille des appels d'offres (Vercel Cron, voir vercel.json)
 * Collecte des avis sur toutes les sources, puis envoi aux abonnés. Protégée par CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { executerVeille } from "@/lib/veille/moteur";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const debut = Date.now();
  const veille = await executerVeille();
  if (veille.erreurs.length) console.error("[cron/veille]", veille.erreurs);
  return NextResponse.json({ ...veille, dureeMs: Date.now() - debut });
}
