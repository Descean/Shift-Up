/**
 * lib/recrutement/motifs.ts — Motifs de non-sélection et règles de conservation des données
 *
 * Les libellés sont repris tels quels dans le courriel envoyé au candidat : ils doivent rester
 * factuels, courtois et compréhensibles sans connaître le dossier d'appel d'offres.
 */

export const MOTIFS_NON_RETENU = [
  { code: "DIPLOME", label: "Le niveau ou la spécialité du diplôme ne correspond pas au minimum exigé pour ce poste." },
  { code: "EXPERIENCE", label: "Le nombre d'années d'expérience professionnelle est inférieur au minimum demandé." },
  { code: "PROJETS", label: "Le nombre de projets similaires (routes, pistes rurales, ouvrages en béton armé) n'atteint pas le minimum requis." },
  { code: "JUSTIFICATIFS", label: "Les attestations de travail ne permettent pas de vérifier l'expérience déclarée (projets, montants, fonctions)." },
  { code: "DOSSIER", label: "Le dossier est incomplet ou certaines pièces sont illisibles." },
  { code: "DISPONIBILITE", label: "La disponibilité indiquée ne correspond pas au calendrier du projet." },
  { code: "POSTE_POURVU", label: "Le poste a été pourvu par un candidat dont le profil répondait plus étroitement aux exigences." },
] as const;

export type CodeMotif = (typeof MOTIFS_NON_RETENU)[number]["code"];
export const CODES_MOTIFS = MOTIFS_NON_RETENU.map((m) => m.code) as [CodeMotif, ...CodeMotif[]];

export function libelleMotif(code: string): string {
  return MOTIFS_NON_RETENU.find((m) => m.code === code)?.label ?? code;
}

/** Délai laissé au candidat pour répondre ; sans réponse, ses données sont supprimées. */
export const DELAI_REPONSE_JOURS = 30;
/** Relance automatique s'il n'a pas répondu. */
export const RELANCE_APRES_JOURS = 15;
/** Durée de conservation quand le candidat donne son accord. */
export const DUREE_CONSERVATION_MOIS = 24;

export const LIBELLES_CONSERVATION: Record<string, string> = {
  EN_ATTENTE: "Réponse attendue",
  ACCEPTEE: "Accord de conservation",
  REFUSEE: "Suppression demandée",
  EXPIREE: "Sans réponse : supprimé",
};

export function ajouterJours(d: Date, j: number) {
  return new Date(d.getTime() + j * 24 * 3600 * 1000);
}
export function ajouterMois(d: Date, m: number) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + m);
  return x;
}
