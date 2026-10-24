/**
 * POST /api/recrutement/upload-url
 * Délivre une URL de dépôt signée pour UN fichier PDF de candidature.
 * Le fichier est ensuite envoyé directement par le navigateur vers le stockage privé.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomBytes } from "crypto";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { getOffre, offreOuverte, PIECES, TAILLE_MAX_FICHIER } from "@/lib/recrutement/offres";
import { createUploadTicket } from "@/lib/recrutement/storage";

const schema = z.object({
  offre: z.string().min(1).max(20),
  dossierId: z.string().regex(/^[a-z0-9]{16,40}$/),
  type: z.enum(PIECES.map((p) => p.type) as [string, ...string[]]),
  nom: z.string().min(1).max(200),
  taille: z.number().int().positive().max(TAILLE_MAX_FICHIER),
  mime: z.string().max(100),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = await rateLimit(`recrut-upload:${ip}`, { limit: 40, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de fichiers envoyés. Réessayez dans quelques minutes." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    const tooBig = parsed.error.issues.some((i) => i.path[0] === "taille");
    return NextResponse.json({ error: tooBig ? "Fichier trop volumineux (10 Mo maximum)." : "Requête invalide." }, { status: 400 });
  }
  const d = parsed.data;

  if (d.mime !== "application/pdf" || !d.nom.toLowerCase().endsWith(".pdf")) {
    return NextResponse.json({ error: "Seuls les fichiers PDF sont acceptés." }, { status: 415 });
  }
  const offre = getOffre(d.offre);
  if (!offre || !offreOuverte(offre)) {
    return NextResponse.json({ error: "Cette offre n'est plus ouverte." }, { status: 410 });
  }

  const mois = new Date().toISOString().slice(0, 7);
  const objectPath = `${offre.code}/${mois}/${d.dossierId}/${d.type.toLowerCase()}-${randomBytes(4).toString("hex")}.pdf`;

  try {
    const ticket = await createUploadTicket(objectPath);
    return NextResponse.json(ticket);
  } catch (e) {
    console.error("[recrutement/upload-url]", e);
    return NextResponse.json({ error: "Le dépôt de fichiers est momentanément indisponible." }, { status: 503 });
  }
}
