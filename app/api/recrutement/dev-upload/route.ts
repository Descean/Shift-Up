/**
 * Développement local uniquement (sans Supabase) : dépôt et lecture des PDF dans le
 * dossier temporaire. Renvoie 404 en production.
 */
import { NextRequest, NextResponse } from "next/server";
import { localMode, readObject, writeLocal } from "@/lib/recrutement/storage";
import { TAILLE_MAX_FICHIER } from "@/lib/recrutement/offres";

function pathParam(req: NextRequest) {
  const p = req.nextUrl.searchParams.get("path") ?? "";
  return /^[A-Z]+\/\d{4}-\d{2}\/[a-z0-9]+\/[a-z]+-[a-f0-9]+\.pdf$/.test(p) ? p : null;
}

export async function PUT(req: NextRequest) {
  const p = pathParam(req);
  if (!localMode || !p) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const buf = Buffer.from(await req.arrayBuffer());
  if (buf.length > TAILLE_MAX_FICHIER) return NextResponse.json({ error: "Trop volumineux" }, { status: 413 });
  await writeLocal(p, buf);
  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const p = pathParam(req);
  if (!localMode || !p) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  const buf = await readObject(p);
  if (!buf) return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  return new NextResponse(new Uint8Array(buf), { headers: { "Content-Type": "application/pdf" } });
}
