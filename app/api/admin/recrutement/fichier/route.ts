/** GET /api/admin/recrutement/fichier?id=<candidature>&i=<index>  → redirection vers un lien signé (5 min) */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { signedReadUrl } from "@/lib/recrutement/storage";
import { requireAdmin } from "../_lib";

type Piece = { type: string; path: string; nom: string; taille: number };

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const id = req.nextUrl.searchParams.get("id") ?? "";
  const i = Number(req.nextUrl.searchParams.get("i"));
  const c = await prisma.candidature.findUnique({ where: { id } });
  const piece = (c?.fichiers as Piece[] | undefined)?.[i];
  if (!c || !piece) return NextResponse.json({ error: "Pièce introuvable." }, { status: 404 });
  const dl = req.nextUrl.searchParams.get("dl") === "1";
  const url = await signedReadUrl(piece.path, 300, dl ? `${c.reference}_${piece.type}_${i + 1}.pdf` : undefined);
  if (!url) return NextResponse.json({ error: "Lien indisponible." }, { status: 502 });
  return NextResponse.redirect(new URL(url, req.url), 302);
}
