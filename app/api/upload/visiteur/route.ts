/**
 * POST /api/upload/visiteur  { nom, type, taille, jeton? }  → lien de dépôt pour un visiteur sans compte.
 * Le fichier va dans « visiteurs/<jeton>/ » ; le jeton est créé au premier dépôt et renvoyé au navigateur.
 * Les dépôts jamais envoyés sont effacés après 48 heures (tâche quotidienne).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { JETON_VISITEUR, nouveauJeton, ticketDepotVisiteur, TYPES_AUTORISES, TAILLE_MAX_DOC, supabaseConfigure } from "@/lib/fichiers";

const schema = z.object({ nom: z.string().min(1).max(200), type: z.string().max(120), taille: z.number().int().positive(), jeton: z.string().max(40).optional().nullable() });

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`upload-visiteur:${getClientIp(req)}`, { limit: 30, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop d'envois. Réessayez dans quelques minutes." }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  if (p.data.taille > TAILLE_MAX_DOC) return NextResponse.json({ error: "Fichier trop volumineux (50 Mo maximum)." }, { status: 413 });
  if (!TYPES_AUTORISES.includes(p.data.type || "application/octet-stream")) return NextResponse.json({ error: "Type de fichier non autorisé." }, { status: 415 });
  if (!supabaseConfigure) return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });
  const jeton = p.data.jeton && JETON_VISITEUR.test(p.data.jeton) ? p.data.jeton : nouveauJeton();
  try {
    return NextResponse.json({ ...(await ticketDepotVisiteur(jeton, p.data.nom)), jeton });
  } catch (e) {
    console.error("[upload/visiteur]", e);
    return NextResponse.json({ error: "Envoi impossible pour le moment." }, { status: 502 });
  }
}
