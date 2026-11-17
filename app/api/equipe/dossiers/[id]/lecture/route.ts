/**
 * GET /api/equipe/dossiers/[id]/lecture?url=… — Espace de lecture du monteur : rend un document Word du
 * dossier en HTML (les PDF et images sont affichés directement par le navigateur).
 * Seuls les fichiers du dossier sont acceptés : pièces de départ, pièces du client, livrables.
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { lireFichier } from "@/lib/fichiers";
import { genreFichier, htmlWord } from "@/lib/apercu";
import { lireMontage } from "@/lib/montage";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await exigerDossierEquipe(id);
  if ("erreur" in a) return a.erreur;
  const url = req.nextUrl.searchParams.get("url") ?? "";
  const p = await prisma.prestation.findUnique({ where: { id }, select: { attachments: true, customFields: true, livrables: { select: { url: true } } } });
  if (!p) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  const urls = new Set<string>([
    ...p.attachments,
    ...lireMontage(p.customFields).pieces.flatMap((x) => x.fichiers.map((f) => f.url)),
    ...p.livrables.map((l) => l.url).filter((u): u is string => !!u),
  ]);
  if (!urls.has(url)) return NextResponse.json({ error: "Ce fichier n'appartient pas au dossier." }, { status: 404 });
  const f = await lireFichier(url);
  if (!f) return NextResponse.json({ error: "Fichier illisible." }, { status: 404 });
  const genre = genreFichier(f.nom || url, f.type);
  if (genre !== "word") return NextResponse.json({ genre });
  try {
    return NextResponse.json({ genre, html: await htmlWord(f.octets) });
  } catch {
    return NextResponse.json({ genre: "autre" });
  }
}
