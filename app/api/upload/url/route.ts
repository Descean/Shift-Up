/**
 * POST /api/upload/url  { nom, type, taille }  → lien de dépôt direct vers le stockage privé.
 * Le navigateur envoie ensuite le fichier à Supabase (uploadToSignedUrl) : aucune limite
 * de taille liée à Vercel. Réponse : { path, token, supabaseUrl, anonKey, url }.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { rateLimit } from "@/lib/ratelimit";
import { ticketDepot, TYPES_AUTORISES, TAILLE_MAX_DOC, supabaseConfigure } from "@/lib/fichiers";

const schema = z.object({ nom: z.string().min(1).max(200), type: z.string().max(120), taille: z.number().int().positive() });

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { allowed } = await rateLimit(`upload:${session.user.id}`, { limit: 60, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop d'envois. Réessayez dans quelques minutes." }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });
  if (p.data.taille > TAILLE_MAX_DOC) return NextResponse.json({ error: "Fichier trop volumineux (50 Mo maximum)." }, { status: 413 });
  if (!TYPES_AUTORISES.includes(p.data.type || "application/octet-stream")) return NextResponse.json({ error: "Type de fichier non autorisé." }, { status: 415 });
  if (!supabaseConfigure) return NextResponse.json({ error: "Stockage indisponible." }, { status: 503 });
  try {
    return NextResponse.json(await ticketDepot(session.user.id, p.data.nom));
  } catch (e) {
    console.error("[upload/url]", e);
    return NextResponse.json({ error: "Envoi impossible pour le moment." }, { status: 502 });
  }
}
