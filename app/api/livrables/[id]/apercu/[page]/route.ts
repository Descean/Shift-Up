/** GET /api/livrables/[id]/apercu/[page] — Image JPEG filigranée d'une page du livrable. */
import { NextRequest, NextResponse } from "next/server";
import { lireFichier } from "@/lib/fichiers";
import { genreFichier, imagePage } from "@/lib/apercu";
import { accesLivrable } from "@/lib/livrables-acces";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string; page: string }> }) {
  const { id, page } = await params;
  const a = await accesLivrable(id);
  if (!a) return new NextResponse("Introuvable", { status: 404 });
  const n = Number.parseInt(page, 10);
  const f = await lireFichier(a.livrable.url!);
  if (!f || !Number.isFinite(n)) return new NextResponse("Introuvable", { status: 404 });
  try {
    const img = await imagePage(f.octets, genreFichier(a.livrable.url!, f.type), n);
    if (!img) return new NextResponse("Pas d'aperçu", { status: 404 });
    return new NextResponse(new Uint8Array(img), {
      headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, max-age=3600", "Content-Disposition": "inline", "X-Content-Type-Options": "nosniff" },
    });
  } catch (e) {
    console.error("[apercu page]", e);
    return new NextResponse("Aperçu indisponible", { status: 500 });
  }
}
