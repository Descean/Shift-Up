/**
 * POST /api/recrutement/candidature
 * Enregistre une candidature après dépôt des PDF dans le stockage privé.
 *  - vérifie captcha, offre ouverte, présence et format réel (%PDF) de chaque pièce
 *  - crée la candidature en base (référence SU-REC-<année>-<CODE>-<n°>)
 *  - envoie l'accusé de réception au candidat
 *  - envoie le dossier complet au cabinet (pièces jointes, ou liens si > 25 Mo)
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { getOffre, offreOuverte, PIECES, TAILLE_MAX_DOSSIER, DISPONIBILITES } from "@/lib/recrutement/offres";
import { readObject, signedReadUrl, isPdf } from "@/lib/recrutement/storage";
import { sendCandidatureAccuse, sendCandidatureAdmin } from "@/lib/email";

export const maxDuration = 60;

const MAX_PJ_EMAIL = 25 * 1024 * 1024;

const txt = (min: number, max: number, msg: string) =>
  z.string().max(max).transform((s) => s.trim()).pipe(z.string().min(min, msg));
const annee = new Date().getFullYear();

const schema = z.object({
  offre: z.string().min(1).max(20),
  dossierId: z.string().regex(/^[a-z0-9]{16,40}$/),
  nom: txt(2, 80, "Nom requis"),
  prenoms: txt(2, 120, "Prénoms requis"),
  email: z.string().trim().toLowerCase().email("E-mail invalide").max(160),
  telephone: txt(8, 30, "Téléphone requis"),
  ville: txt(2, 80, "Ville requise"),
  nationalite: txt(2, 60, "Nationalité requise"),
  diplome: txt(3, 160, "Diplôme requis"),
  anneeDiplome: z.coerce.number().int().min(1960).max(annee),
  anneesExperience: z.coerce.number().int().min(0).max(60),
  nbProjetsSimilaires: z.coerce.number().int().min(0).max(200),
  disponibilite: z.enum(DISPONIBILITES),
  source: z.string().max(40).regex(/^[\w-]*$/).optional().nullable(),
  consentement: z.literal(true, { errorMap: () => ({ message: "Le consentement est requis." }) }),
  captchaToken: z.string().optional(),
  fichiers: z.array(z.object({
    type: z.enum(PIECES.map((p) => p.type) as [string, ...string[]]),
    path: z.string().max(200),
    nom: z.string().max(200),
  })).min(1).max(20),
});

async function nouvelleReference(code: string) {
  const n = await prisma.candidature.count({ where: { offreCode: code } });
  return `SU-REC-${annee}-${code}-${String(n + 1).padStart(4, "0")}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = rateLimit(`recrut-cand:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Formulaire invalide." }, { status: 400 });
  }
  const d = parsed.data;

  if (!(await verifyCaptcha(d.captchaToken))) {
    return NextResponse.json({ error: "Vérification anti-robot échouée. Recommencez." }, { status: 403 });
  }

  const offre = getOffre(d.offre);
  if (!offre || !offreOuverte(offre)) {
    return NextResponse.json({ error: "Cette offre n'est plus ouverte." }, { status: 410 });
  }

  // ── Contrôle des pièces ───────────────────────────────────────────────────
  const prefix = new RegExp(`^${offre.code}/\\d{4}-\\d{2}/${d.dossierId}/([a-z]+)-[a-f0-9]{8}\\.pdf$`);
  for (const p of PIECES) {
    const n = d.fichiers.filter((f) => f.type === p.type).length;
    if (p.obligatoire && n === 0) return NextResponse.json({ error: `Pièce manquante : ${p.label}.` }, { status: 400 });
    if (n > p.max) return NextResponse.json({ error: `Trop de fichiers pour : ${p.label}.` }, { status: 400 });
  }
  const contenus: { type: string; path: string; nom: string; buf: Buffer }[] = [];
  for (const f of d.fichiers) {
    const m = f.path.match(prefix);
    if (!m || m[1] !== f.type.toLowerCase()) return NextResponse.json({ error: "Pièce invalide." }, { status: 400 });
    const buf = await readObject(f.path);
    if (!buf) return NextResponse.json({ error: `Le fichier « ${f.nom} » n'a pas été reçu. Chargez-le de nouveau.` }, { status: 400 });
    if (!isPdf(buf)) return NextResponse.json({ error: `« ${f.nom} » n'est pas un PDF valide.` }, { status: 415 });
    contenus.push({ ...f, buf });
  }
  const total = contenus.reduce((s, c) => s + c.buf.length, 0);
  if (total > TAILLE_MAX_DOSSIER) {
    return NextResponse.json({ error: "Dossier trop volumineux (30 Mo maximum au total)." }, { status: 413 });
  }

  const deja = await prisma.candidature.findFirst({ where: { email: d.email, offreCode: offre.code } });
  if (deja) {
    return NextResponse.json({
      error: `Vous avez déjà postulé à ce poste (réf. ${deja.reference}). Pour compléter votre dossier, écrivez à contact@shiftup.bj en rappelant cette référence.`,
    }, { status: 409 });
  }

  // ── Enregistrement ────────────────────────────────────────────────────────
  const data = {
    offreCode: offre.code,
    offreTitre: offre.titre,
    nom: d.nom.toUpperCase(),
    prenoms: d.prenoms,
    email: d.email,
    telephone: d.telephone,
    ville: d.ville,
    nationalite: d.nationalite,
    diplome: d.diplome,
    anneeDiplome: d.anneeDiplome,
    anneesExperience: d.anneesExperience,
    nbProjetsSimilaires: d.nbProjetsSimilaires,
    disponibilite: d.disponibilite,
    source: d.source || null,
    consentement: true,
    fichiers: contenus.map((c) => ({ type: c.type, path: c.path, nom: c.nom, taille: c.buf.length })),
  };

  let candidature;
  for (let essai = 0; ; essai++) {
    try {
      const reference = essai < 3 ? await nouvelleReference(offre.code) : `SU-REC-${annee}-${offre.code}-${Date.now().toString(36).toUpperCase()}`;
      candidature = await prisma.candidature.create({ data: { ...data, reference } });
      break;
    } catch (e: unknown) {
      if ((e as { code?: string }).code === "P2002" && essai < 4) continue; // référence déjà prise
      console.error("[recrutement/candidature] création", e);
      return NextResponse.json({ error: "Erreur d'enregistrement. Réessayez." }, { status: 500 });
    }
  }

  // ── E-mails (un échec d'envoi n'annule pas la candidature) ───────────────
  const destinataires = (process.env.RECRUTEMENT_EMAIL || process.env.ADMIN_EMAIL || "contact@shiftup.bj")
    .split(",").map((s) => s.trim()).filter(Boolean);
  const compteur: Record<string, number> = {};
  const nomFichier = (type: string) => {
    compteur[type] = (compteur[type] ?? 0) + 1;
    return `${candidature.reference}_${candidature.nom.replace(/[^A-Z0-9]+/g, "-")}_${type}${compteur[type] > 1 ? "-" + compteur[type] : ""}.pdf`;
  };
  const nommes = contenus.map((c) => ({ ...c, filename: nomFichier(c.type) }));
  let attachments: { filename: string; content: Buffer }[] = [];
  let liens: { label: string; url: string }[] = [];
  if (total <= MAX_PJ_EMAIL) {
    attachments = nommes.map((c) => ({ filename: c.filename, content: c.buf }));
  } else {
    liens = (await Promise.all(nommes.map(async (c) => ({ label: c.filename, url: await signedReadUrl(c.path, 7 * 24 * 3600, c.filename) }))))
      .filter((l): l is { label: string; url: string } => Boolean(l.url));
  }

  const envois = await Promise.allSettled([
    sendCandidatureAccuse({ to: d.email, prenoms: d.prenoms, poste: offre.titre, reference: candidature.reference }),
    sendCandidatureAdmin({
      to: destinataires,
      candidature: { ...data, reference: candidature.reference, poste: offre.titre },
      attachments,
      liens,
    }),
  ]);
  envois.forEach((r, i) => {
    if (r.status === "rejected") console.error(`[recrutement/candidature] e-mail ${i ? "cabinet" : "candidat"}`, r.reason);
    else if ((r.value as { error?: unknown })?.error) console.error(`[recrutement/candidature] e-mail ${i ? "cabinet" : "candidat"}`, (r.value as { error?: unknown }).error);
  });

  return NextResponse.json({ ok: true, reference: candidature.reference });
}
