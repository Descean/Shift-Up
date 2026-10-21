/**
 * Lien court des affiches : shiftup.bj/r/<code>  →  /recrutement/<slug>?src=…
 * Le paramètre src (ex. ?src=affiche) est conservé pour savoir d'où viennent les candidats.
 */
import { NextRequest, NextResponse } from "next/server";
import { getOffre } from "@/lib/recrutement/offres";

export async function GET(req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const offre = getOffre(code);
  const src = (req.nextUrl.searchParams.get("src") ?? "lien").replace(/[^\w-]/g, "").slice(0, 40);
  const url = new URL(offre ? `/recrutement/${offre.slug}` : "/recrutement", req.url);
  url.searchParams.set("src", src || "lien");
  return NextResponse.redirect(url, 307);
}
