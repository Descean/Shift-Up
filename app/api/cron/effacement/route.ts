/**
 * GET /api/cron/effacement — Tâche quotidienne (Vercel Cron) : avis à J-7, puis effacement des fichiers
 * et des échanges 30 jours après la fin d'une prestation. Protégée par CRON_SECRET.
 */
import { NextRequest, NextResponse } from "next/server";
import { effacementQuotidien } from "@/lib/effacement";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  }
  try {
    return NextResponse.json({ ok: true, ...(await effacementQuotidien()) });
  } catch (e) {
    console.error("[cron effacement]", e);
    return NextResponse.json({ error: "Erreur" }, { status: 500 });
  }
}
