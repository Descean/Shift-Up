/**
 * lib/recrutement/storage.ts — Stockage des pièces de candidature
 *
 * Production : bucket Supabase PRIVÉ "recrutement" (créé automatiquement au premier usage,
 * PDF uniquement, 10 Mo max par fichier). Le navigateur dépose chaque fichier directement
 * dans Supabase via une URL d'upload signée : on évite ainsi la limite de 4,5 Mo des
 * fonctions Vercel. Les fichiers ne sont jamais publics ; l'admin y accède par lien signé.
 *
 * Développement local sans Supabase : les fichiers sont écrits dans le dossier temporaire
 * du système (jamais en production).
 */
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "fs";
import os from "os";
import path from "path";
import { TAILLE_MAX_FICHIER } from "./offres";

export const BUCKET = "recrutement";

const hasSupabase = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
export const localMode = !hasSupabase && process.env.NODE_ENV !== "production";
const LOCAL_DIR = path.join(os.tmpdir(), "shiftup-recrutement");

let client: SupabaseClient | null = null;
function admin(): SupabaseClient {
  if (!hasSupabase) throw new Error("Supabase non configuré (NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY).");
  client ??= createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  return client;
}

let bucketReady = false;
async function ensureBucket() {
  if (bucketReady) return;
  const sb = admin();
  const { data } = await sb.storage.getBucket(BUCKET);
  if (!data) {
    const { error } = await sb.storage.createBucket(BUCKET, {
      public: false,
      fileSizeLimit: TAILLE_MAX_FICHIER,
      allowedMimeTypes: ["application/pdf"],
    });
    if (error && !/already exists/i.test(error.message)) throw error;
  } else if (data.public) {
    // Sécurité : le bucket ne doit jamais être public
    await sb.storage.updateBucket(BUCKET, { public: false, fileSizeLimit: TAILLE_MAX_FICHIER, allowedMimeTypes: ["application/pdf"] });
  }
  bucketReady = true;
}

export type UploadTicket =
  | { mode: "supabase"; path: string; token: string; supabaseUrl: string; anonKey: string }
  | { mode: "local"; path: string; uploadUrl: string };

/** Prépare le dépôt d'un fichier par le navigateur. */
export async function createUploadTicket(objectPath: string): Promise<UploadTicket> {
  if (localMode) {
    return { mode: "local", path: objectPath, uploadUrl: `/api/recrutement/dev-upload?path=${encodeURIComponent(objectPath)}` };
  }
  await ensureBucket();
  const { data, error } = await admin().storage.from(BUCKET).createSignedUploadUrl(objectPath);
  if (error || !data) throw error ?? new Error("Impossible de créer l'URL de dépôt.");
  return {
    mode: "supabase",
    path: data.path,
    token: data.token,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  };
}

/** Lit un fichier déposé (null s'il n'existe pas). */
export async function readObject(objectPath: string): Promise<Buffer | null> {
  if (localMode) {
    try { return await fs.readFile(path.join(LOCAL_DIR, safeLocal(objectPath))); } catch { return null; }
  }
  const { data, error } = await admin().storage.from(BUCKET).download(objectPath);
  if (error || !data) return null;
  return Buffer.from(await data.arrayBuffer());
}

/** Lien de lecture temporaire (admin). */
export async function signedReadUrl(objectPath: string, seconds: number, downloadName?: string): Promise<string | null> {
  if (localMode) return `/api/recrutement/dev-upload?path=${encodeURIComponent(objectPath)}`;
  const { data, error } = await admin().storage.from(BUCKET).createSignedUrl(objectPath, seconds, downloadName ? { download: downloadName } : undefined);
  if (error || !data) return null;
  return data.signedUrl;
}

/** Développement uniquement : écriture / lecture locale. */
export async function writeLocal(objectPath: string, body: Buffer) {
  if (!localMode) throw new Error("Mode local désactivé.");
  const p = path.join(LOCAL_DIR, safeLocal(objectPath));
  await fs.mkdir(path.dirname(p), { recursive: true });
  await fs.writeFile(p, body);
}

function safeLocal(objectPath: string) {
  const norm = path.normalize(objectPath).replace(/^(\.\.(\/|\\|$))+/, "");
  if (norm.includes("..")) throw new Error("Chemin invalide.");
  return norm;
}

/** Un PDF commence toujours par "%PDF-". */
export function isPdf(buf: Buffer) {
  return buf.length > 5 && buf.subarray(0, 5).toString("latin1") === "%PDF-";
}
