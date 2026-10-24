/**
 * lib/televerser.ts — Envoi d'un fichier depuis le navigateur vers le stockage privé.
 * Renvoie { url, name, size } : url est le lien interne à enregistrer (accès contrôlé).
 */
import { createClient } from "@supabase/supabase-js";

export const TAILLE_MAX_TELEVERSEMENT = 50 * 1024 * 1024;

export async function televerser(file: File): Promise<{ url: string; name: string; size: number }> {
  if (file.size > TAILLE_MAX_TELEVERSEMENT) throw new Error("Fichier trop volumineux (50 Mo maximum).");
  const type = file.type || "application/octet-stream";
  const r = await fetch("/api/upload/url", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ nom: file.name, type, taille: file.size }) });
  const t = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(t.error ?? "Envoi impossible.");
  const sb = createClient(t.supabaseUrl, t.anonKey, { auth: { persistSession: false } });
  const { error } = await sb.storage.from("documents").uploadToSignedUrl(t.path, t.token, file, { contentType: type });
  if (error) throw new Error("Le fichier n'a pas pu être envoyé.");
  return { url: t.url, name: file.name, size: file.size };
}
