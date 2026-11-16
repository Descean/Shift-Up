/**
 * lib/competences.ts — Services qu'un partenaire peut proposer à ses propres clients,
 * d'après les compétences cochées à son inscription (« Travailler avec nous »).
 * Sans accès à la base : utilisable côté navigateur.
 */
import { SECTORS } from "@/lib/catalogue";
import { NATURES, type Nature } from "@/lib/tarifs-montage";

export const DOMAINE_MONTAGE = "marches-publics";
const TOUTES_NATURES = NATURES.map((n) => n.id) as Nature[];

export type Competences = { domaines: string[]; natures: Nature[] };

/** Tout le catalogue (Direction et équipe interne), montage en premier. */
export const TOUTES_COMPETENCES: Competences = {
  domaines: [DOMAINE_MONTAGE, ...SECTORS.map((s) => s.id).filter((id) => id !== DOMAINE_MONTAGE)],
  natures: TOUTES_NATURES,
};

/**
 * Compétences d'un partenaire indépendant. Les anciens comptes « monteur » n'ont coché que des natures
 * de dossiers (ou rien) : ils restent monteurs de dossiers.
 */
export function competencesDe(specialites: string[] | null | undefined): Competences {
  const s = specialites ?? [];
  const natures = TOUTES_NATURES.filter((n) => s.includes(n));
  const domaines = SECTORS.map((x) => x.id).filter((id) => s.includes(id));
  if (natures.length && !domaines.includes(DOMAINE_MONTAGE)) domaines.push(DOMAINE_MONTAGE);
  if (!domaines.length) domaines.push(DOMAINE_MONTAGE);
  domaines.sort((a, b) => (a === DOMAINE_MONTAGE ? -1 : b === DOMAINE_MONTAGE ? 1 : 0));
  return { domaines, natures: domaines.includes(DOMAINE_MONTAGE) ? (natures.length ? natures : TOUTES_NATURES) : [] };
}
