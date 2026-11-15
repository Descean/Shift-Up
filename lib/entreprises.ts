/**
 * lib/entreprises.ts — « Mes entreprises » : coffre de pièces réutilisables d'une entreprise soumissionnaire.
 *
 * À la création d'un montage de dossier pour une entreprise du coffre, les pièces encore valides à la
 * date limite de dépôt sont reprises automatiquement ; celles qui expirent avant sont signalées.
 */
import type { Piece } from "@/lib/montage";

export type PieceCoffre = {
  id: string; type: string; libelle: string; url: string; nomFichier: string;
  dateDelivrance: Date | string | null; dateExpiration: Date | string | null; createdAt: Date | string;
};

/** La pièce est-elle valide à cette date ? (sans date d'expiration : considérée valide) */
export function valideLe(p: Pick<PieceCoffre, "dateExpiration">, date: Date) {
  return !p.dateExpiration || new Date(p.dateExpiration).getTime() >= date.getTime();
}

/** État d'une pièce du coffre aujourd'hui : valide, expire bientôt (30 jours) ou expirée. */
export function etatPiece(p: Pick<PieceCoffre, "dateExpiration">, maintenant = new Date()) {
  if (!p.dateExpiration) return { niveau: "valide" as const, libelle: "Sans date d'expiration" };
  const fin = new Date(p.dateExpiration);
  const jours = Math.ceil((fin.getTime() - maintenant.getTime()) / 86_400_000);
  const date = fin.toLocaleDateString("fr-FR");
  if (jours < 0) return { niveau: "expiree" as const, libelle: `Expirée le ${date}` };
  if (jours <= 30) return { niveau: "bientot" as const, libelle: `Expire le ${date} (J-${jours})` };
  return { niveau: "valide" as const, libelle: `Valide jusqu'au ${date}` };
}

/** Pièce la plus récente du coffre pour chaque type. */
export function dernieresParType<T extends PieceCoffre>(coffre: T[]): Map<string, T> {
  const m = new Map<string, T>();
  for (const p of [...coffre].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())) {
    if (!m.has(p.type)) m.set(p.type, p);
  }
  return m;
}

/**
 * Reprend dans la liste des pièces d'un montage celles du coffre encore valides à la date limite.
 * Renvoie la liste mise à jour et le nombre de pièces reprises / signalées comme expirées.
 */
export function reprendreDuCoffre(pieces: Piece[], coffre: PieceCoffre[], dateLimite: Date) {
  const parType = dernieresParType(coffre);
  const maintenant = new Date().toISOString();
  let reprises = 0, expirees = 0;
  const maj = pieces.map((p): Piece => {
    const c = parType.get(p.id);
    if (!c || p.statut !== "A_FOURNIR") return p;
    if (!valideLe(c, dateLimite)) {
      expirees++;
      return { ...p, commentaireClient: `La pièce de votre coffre expire le ${new Date(c.dateExpiration!).toLocaleDateString("fr-FR")}, avant la date limite : déposez une version à jour.` };
    }
    reprises++;
    return {
      ...p, statut: "FOURNI", majLe: maintenant,
      fichiers: [{ url: c.url, nom: c.nomFichier, date: maintenant }],
      commentaireClient: `Reprise de « Mes entreprises »${c.dateExpiration ? ` (valide jusqu'au ${new Date(c.dateExpiration).toLocaleDateString("fr-FR")})` : ""}.`,
    };
  });
  return { pieces: maj, reprises, expirees };
}

/** Le lien interne désigne-t-il un fichier déposé par cet utilisateur ? (chemin « documents/<userId>/… ») */
export function fichierDeLUtilisateur(url: string, userId: string) {
  try {
    const chemin = decodeURIComponent(new URL(url).pathname);
    return chemin.startsWith(`/api/fichiers/documents/${userId}/`) && !chemin.includes("..");
  } catch {
    return false;
  }
}
