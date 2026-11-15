/**
 * GET /api/livrables/[id]/apercu — Description de l'aperçu d'un livrable :
 * { genre, pages } pour un PDF ou une image (pages servies en images filigranées),
 * { genre: "word", html } pour un document Word, { genre: "autre" } sinon.
 * Le fichier d'origine n'est jamais envoyé par cette route.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { lireFichier } from "@/lib/fichiers";
import { compterPages, genreFichier, htmlWord } from "@/lib/apercu";
import { accesLivrable } from "@/lib/livrables-acces";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await accesLivrable(id);
  if (!a) return NextResponse.json({ error: "Livrable introuvable." }, { status: 404 });
  const f = await lireFichier(a.livrable.url!);
  if (!f) return NextResponse.json({ genre: "autre", pages: 0, solde: a.solde });
  const genre = genreFichier(a.livrable.url!, f.type);
  if (a.client && !a.livrable.viewedAt) {
    await prisma.livrable.update({ where: { id }, data: { viewedAt: new Date() } }).catch(() => {});
  }
  try {
    if (genre === "word") return NextResponse.json({ genre, pages: 0, html: await htmlWord(f.octets), solde: a.solde });
    return NextResponse.json({ genre, pages: await compterPages(f.octets, genre), solde: a.solde });
  } catch (e) {
    console.error("[apercu]", e);
    return NextResponse.json({ genre: "autre", pages: 0, solde: a.solde });
  }
}
