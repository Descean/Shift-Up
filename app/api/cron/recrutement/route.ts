/**
 * GET /api/cron/recrutement — tâche quotidienne (Vercel Cron, voir vercel.json)
 * Recrutement : relances, suppression des dossiers sans réponse ou en fin de conservation, fichiers abandonnés.
 * Montages de dossiers : rappels de pièces, de dépôt et de résultat (voir lib/montage-rappels.ts).
 * Documents : migration unique de l'ancien bucket public « prestations » vers un accès contrôlé.
 * Protégée par CRON_SECRET : Vercel envoie « Authorization: Bearer <CRON_SECRET> ».
 */
import { NextRequest, NextResponse } from "next/server";
import { entretienDonnees } from "@/lib/recrutement/donnees";
import { migrerAncienBucket } from "@/lib/fichiers";
import { rappelsMontage } from "@/lib/montage-rappels";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  const bilan = await entretienDonnees();
  if (bilan.erreurs.length) console.error("[cron/recrutement]", bilan.erreurs);
  // Documents des prestations : passage unique de l'ancien bucket public en privé
  const fichiers = await migrerAncienBucket().catch((e) => ({ migre: false, raison: (e as Error).message }));
  const montage = await rappelsMontage().catch((e) => ({ erreurs: [(e as Error).message] }));
  if (montage.erreurs.length) console.error("[cron/montage]", montage.erreurs);
  return NextResponse.json({ ...bilan, fichiers, montage });
}
