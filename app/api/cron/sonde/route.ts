/**
 * GET /api/cron/sonde?url=… — TEMPORAIRE : lecture d'une page publique pour étudier les sources de la veille.
 * Protégée par CRON_SECRET, limitée au portail des marchés publics du Bénin et à la Banque mondiale.
 */
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
const DOMAINES = ["marches-publics.bj", "search.worldbank.org", "armp.bj", "dncmp.bj"];

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  let cible: URL;
  try { cible = new URL(req.nextUrl.searchParams.get("url") ?? ""); } catch { return NextResponse.json({ error: "URL invalide." }, { status: 400 }); }
  if (cible.protocol !== "https:" && cible.protocol !== "http:") return NextResponse.json({ error: "Protocole refusé." }, { status: 400 });
  if (!DOMAINES.some((d) => cible.hostname === d || cible.hostname.endsWith(`.${d}`))) return NextResponse.json({ error: "Domaine refusé." }, { status: 400 });
  try {
    const r = await fetch(cible, { headers: { "User-Agent": "Mozilla/5.0 (compatible; ShiftUpVeille/1.0; +https://www.shiftup.bj)", Accept: "text/html,application/json;q=0.9,*/*;q=0.8" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const de = Number(req.nextUrl.searchParams.get("de") ?? "0") || 0;
    const brut = await r.text();
    const texte = brut.slice(de, de + 1_500_000);
    return NextResponse.json({ statut: r.status, url: r.url, type: r.headers.get("content-type"), taille: brut.length, contenu: texte });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
