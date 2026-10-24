/**
 * lib/fichiers.ts — Documents des prestations (pièces jointes, livrables, notes vocales)
 *
 * Bucket Supabase PRIVÉ « documents ». Le navigateur dépose le fichier directement dans
 * Supabase par un lien de dépôt signé (pas de limite de 4,5 Mo des fonctions Vercel).
 * Le site enregistre un lien interne https://www.shiftup.bj/api/fichiers/<bucket>/<chemin> :
 * à chaque ouverture, /api/fichiers vérifie les droits puis redirige vers un lien Supabase
 * valable 5 minutes. Un lien signé (?exp=&sig=) permet l'accès sans compte (e-mail au client).
 *
 * L'ancien bucket public « prestations » est migré une fois par la tâche quotidienne :
 * liens réécrits en base, puis bucket passé en privé.
 */
import { createHmac, randomBytes, timingSafeEqual } from "crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import prisma from "@/lib/prisma";

export const BUCKET_DOCS = "documents";
export const BUCKET_ANCIEN = "prestations";
export const TAILLE_MAX_DOC = 50 * 1024 * 1024; // 50 Mo

export const TYPES_AUTORISES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint", "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/zip", "application/x-zip-compressed", "text/plain",
  "audio/webm", "audio/ogg", "audio/mp4", "audio/mpeg", "audio/wav",
  "video/mp4", "video/webm", "video/quicktime",
  "application/octet-stream",
];

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");
export const supabaseConfigure = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);

let client: SupabaseClient | null = null;
function sb(): SupabaseClient {
  if (!supabaseConfigure) throw new Error("Stockage non configuré.");
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { autoRefreshToken: false, persistSession: false } });
  return client;
}

let pret = false;
async function bucketPrive() {
  if (pret) return;
  const { data } = await sb().storage.getBucket(BUCKET_DOCS);
  if (!data) {
    const { error } = await sb().storage.createBucket(BUCKET_DOCS, { public: false, fileSizeLimit: TAILLE_MAX_DOC });
    if (error && !/already exists/i.test(error.message)) throw error;
  } else if (data.public) {
    await sb().storage.updateBucket(BUCKET_DOCS, { public: false, fileSizeLimit: TAILLE_MAX_DOC });
  }
  pret = true;
}

/** Lien interne enregistré en base. */
export function lienInterne(bucket: string, path: string) {
  return `${APP_URL}/api/fichiers/${bucket}/${path.split("/").map(encodeURIComponent).join("/")}`;
}

export async function ticketDepot(userId: string, nom: string) {
  await bucketPrive();
  const ext = (nom.split(".").pop() ?? "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  const path = `${userId}/${new Date().toISOString().slice(0, 7)}/${randomBytes(12).toString("hex")}.${ext}`;
  const { data, error } = await sb().storage.from(BUCKET_DOCS).createSignedUploadUrl(path);
  if (error || !data) throw error ?? new Error("Lien de dépôt indisponible.");
  return { path: data.path, token: data.token, supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!, anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "", url: lienInterne(BUCKET_DOCS, data.path) };
}

export async function lienLecture(bucket: string, path: string, secondes = 300, telechargement?: string) {
  const { data, error } = await sb().storage.from(bucket).createSignedUrl(path, secondes, telechargement ? { download: telechargement } : undefined);
  if (error || !data) return null;
  return data.signedUrl;
}

// ── Liens signés sans compte (ex. livraison d'un apporteur à son client) ──────
function cle() {
  return process.env.FICHIERS_SECRET ?? process.env.NEXTAUTH_SECRET ?? "dev-secret";
}
function signature(chemin: string, exp: number) {
  return createHmac("sha256", cle()).update(`${chemin}:${exp}`).digest("base64url");
}
export function signerLien(url: string, jours = 30) {
  const m = url.match(/\/api\/fichiers\/(.+?)(\?|$)/);
  if (!m) return url;
  const exp = Math.floor(Date.now() / 1000) + jours * 86400;
  return `${url.split("?")[0]}?exp=${exp}&sig=${signature(decodeURIComponent(m[1]), exp)}`;
}
export function signatureValide(chemin: string, exp: string | null, sig: string | null) {
  if (!exp || !sig || Number(exp) < Date.now() / 1000) return false;
  const attendu = Buffer.from(signature(chemin, Number(exp)));
  const recu = Buffer.from(sig);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}

/** Un utilisateur connecté a-t-il le droit d'ouvrir ce fichier ? */
export async function peutLire(user: { id: string; email?: string | null; role?: string | null }, bucket: string, path: string) {
  if (user.role === "ADMIN" || user.role === "DEVELOPER") return true;
  if (path.startsWith(`${user.id}/`)) return true; // déposé par lui
  const lien = lienInterne(bucket, path);
  const [livrable, prestation, commande] = await Promise.all([
    prisma.livrable.findFirst({ where: { url: lien, isAvailable: true, prestation: { clientId: user.id } }, select: { id: true } }),
    prisma.prestation.findFirst({ where: { attachments: { has: lien }, OR: [{ clientId: user.id }, { assignedToId: user.id }] }, select: { id: true } }),
    prisma.apporteurServiceOrder.findFirst({
      where: { documentUrl: { startsWith: lien }, OR: [{ service: { apporteurId: user.id } }, ...(user.email ? [{ clientEmail: user.email }] : [])] },
      select: { id: true },
    }),
  ]);
  return Boolean(livrable || prestation || commande);
}

/**
 * Migration unique de l'ancien bucket public : réécrit les liens publics en liens internes,
 * puis rend le bucket privé. Sans effet si c'est déjà fait.
 */
export async function migrerAncienBucket() {
  if (!supabaseConfigure) return { migre: false, raison: "stockage non configuré" };
  const { data: b } = await sb().storage.getBucket(BUCKET_ANCIEN);
  if (!b) return { migre: false, raison: "aucun ancien bucket" };
  const prefixe = `${process.env.NEXT_PUBLIC_SUPABASE_URL!.replace(/\/$/, "")}/storage/v1/object/public/${BUCKET_ANCIEN}/`;
  const convertir = (u: string) => (u.startsWith(prefixe) ? lienInterne(BUCKET_ANCIEN, decodeURIComponent(u.slice(prefixe.length).split("?")[0])) : u);
  let n = 0;
  for (const l of await prisma.livrable.findMany({ where: { url: { startsWith: prefixe } }, select: { id: true, url: true } })) {
    await prisma.livrable.update({ where: { id: l.id }, data: { url: convertir(l.url!) } }); n++;
  }
  for (const p of await prisma.prestation.findMany({ where: { attachments: { isEmpty: false } }, select: { id: true, attachments: true } })) {
    if (p.attachments.some((a) => a.startsWith(prefixe))) {
      await prisma.prestation.update({ where: { id: p.id }, data: { attachments: p.attachments.map(convertir) } }); n++;
    }
  }
  for (const o of await prisma.apporteurServiceOrder.findMany({ where: { documentUrl: { startsWith: prefixe } }, select: { id: true, documentUrl: true } })) {
    await prisma.apporteurServiceOrder.update({ where: { id: o.id }, data: { documentUrl: convertir(o.documentUrl!) } }); n++;
  }
  if (b.public) await sb().storage.updateBucket(BUCKET_ANCIEN, { public: false });
  return { migre: true, liensReecrits: n, etaitPublic: b.public };
}
