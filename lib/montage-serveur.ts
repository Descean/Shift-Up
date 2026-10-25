/**
 * lib/montage-serveur.ts — Contrôles côté serveur des demandes de montage de dossiers.
 */
import { BUCKET_DOCS, lienInterne } from "@/lib/fichiers";
import { dossierSchema, dateLimiteVersDate, echeance, piecesInitiales, resumeDossier, type Dossier, type Piece } from "@/lib/montage";

/** Le lien pointe-t-il vers un fichier déposé par cet utilisateur (stockage privé) ? */
export function fichierDe(url: string, userId: string) {
  return url.split("?")[0].startsWith(lienInterne(BUCKET_DOCS, `${userId}/`));
}

type ResultatMontage =
  | { ok: true; dossier: Dossier; pieces: Piece[]; brief: string; urgence: string | null }
  | { ok: false; erreur: string };

/**
 * Vérifie la fiche « appel d'offres » d'une demande de montage et prépare la liste des pièces.
 * Le DAO éventuel doit avoir été déposé par le client lui-même.
 */
export function preparerMontage(brut: unknown, userId: string, dao?: { url: string; nom: string } | null, brief?: string | null): ResultatMontage {
  const r = dossierSchema.safeParse(brut);
  if (!r.success) return { ok: false, erreur: r.error.issues[0]?.message ?? "Fiche de l'appel d'offres incomplète." };
  const d = r.data;
  const limite = dateLimiteVersDate(d.dateLimite);
  if (Number.isNaN(limite.getTime())) return { ok: false, erreur: "Date limite invalide." };
  if (limite.getTime() < Date.now()) return { ok: false, erreur: "La date limite de dépôt est déjà passée." };
  if (dao && !fichierDe(dao.url, userId)) return { ok: false, erreur: "Fichier du DAO invalide : déposez-le à nouveau." };
  const e = echeance(d.dateLimite);
  return {
    ok: true,
    dossier: d,
    pieces: piecesInitiales(d, dao ? { url: dao.url, nom: dao.nom.slice(0, 200), date: new Date().toISOString() } : null),
    brief: brief?.trim() ? `${brief.trim()}\n\n${resumeDossier(d)}`.slice(0, 3000) : resumeDossier(d),
    urgence: e.niveau === "urgent" ? `${e.libelle}` : null,
  };
}
