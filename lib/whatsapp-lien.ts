/**
 * lib/whatsapp-lien.ts — Liens WhatsApp « clic pour écrire » (utilisable côté navigateur).
 */
/**
 * Numéro au format international sans « + » (ex. 2290197000000).
 * Bénin : numéros à 10 chiffres commençant par 01 ; un ancien numéro à 8 chiffres reçoit le préfixe 01.
 */
export function numeroInternational(brut?: string | null): string | null {
  if (!brut) return null;
  let n = brut.replace(/[^\d+]/g, "");
  if (n.startsWith("+")) n = n.slice(1);
  else if (n.startsWith("00")) n = n.slice(2);
  else if (/^01\d{8}$/.test(n)) n = `229${n}`;
  else if (/^\d{8}$/.test(n)) n = `22901${n}`;
  if (/^229\d{8}$/.test(n)) n = `22901${n.slice(3)}`;
  return /^\d{9,15}$/.test(n) ? n : null;
}

/** Lien wa.me qui ouvre WhatsApp avec le message déjà écrit. */
export function lienWhatsApp(numero: string | null | undefined, texte: string) {
  const n = numeroInternational(numero);
  const q = `text=${encodeURIComponent(texte)}`;
  return n ? `https://wa.me/${n}?${q}` : `https://wa.me/?${q}`;
}
