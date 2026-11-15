/**
 * lib/tarifs.ts — Grille du devis automatique (forfait selon le volume).
 *
 * Le prix part du tarif de départ de l'offre du catalogue, puis s'ajuste selon ce que l'IA a lu
 * dans le dossier : lots, pièces à rédiger, complexité, urgence. L'administrateur peut toujours
 * revoir le devis avant ou après l'envoi. Les réglages ci-dessous se modifient ici.
 */
import { SECTORS, type ServiceItem } from "@/lib/catalogue";

export const GRILLE = {
  /** Prix de départ si l'offre n'a pas de prix au catalogue */
  baseParDefaut: 100_000,
  /** Lot supplémentaire : part du prix de départ ajoutée par lot au-delà du premier */
  parLotSupplementaire: 0.4,
  lotsMax: 10,
  /** Pièces à rédiger (méthodologie, CV, notes…) comprises dans le forfait, puis prix par pièce */
  piecesComprises: 3,
  parPieceSupplementaire: 10_000,
  /** Coefficient de complexité */
  complexite: { simple: 1, moyen: 1.25, complexe: 1.6 } as Record<string, number>,
  /** Majoration d'urgence selon les jours restants avant la date limite */
  urgence: [{ jours: 2, taux: 0.4 }, { jours: 5, taux: 0.2 }],
  /** Acompte demandé à la validation du devis */
  acompte: 0.6,
  arrondi: 5_000,
  validite: "7 jours",
};

export type Volume = { lots?: number | null; piecesARediger?: number | null; complexite?: string | null; joursRestants?: number | null };
export type LigneDevis = { label: string; amount: number };

/** Prix de départ d'une offre (« À partir de 100 000 XOF » → 100 000). */
export function prixDepart(o?: ServiceItem | null): number {
  const n = Number((o?.price ?? "").replace(/[^\d]/g, ""));
  return n > 0 ? n : GRILLE.baseParDefaut;
}

const arrondir = (n: number) => Math.ceil(n / GRILLE.arrondi) * GRILLE.arrondi;

/** Calcule le devis : lignes, total, acompte. */
export function calculerDevis(intitule: string, offre: ServiceItem | null | undefined, v: Volume) {
  const base = prixDepart(offre);
  const coef = GRILLE.complexite[v.complexite ?? "moyen"] ?? GRILLE.complexite.moyen;
  const lignes: LigneDevis[] = [{ label: intitule, amount: arrondir(base * coef) }];
  const lots = Math.min(Math.max(1, Math.round(v.lots ?? 1)), GRILLE.lotsMax);
  if (lots > 1) lignes.push({ label: `${lots - 1} lot(s) supplémentaire(s)`, amount: arrondir((lots - 1) * base * GRILLE.parLotSupplementaire * coef) });
  const pieces = Math.max(0, Math.round(v.piecesARediger ?? 0) - GRILLE.piecesComprises);
  if (pieces > 0) lignes.push({ label: `${pieces} pièce(s) à rédiger en plus`, amount: pieces * GRILLE.parPieceSupplementaire });
  const sousTotal = lignes.reduce((s, l) => s + l.amount, 0);
  const u = v.joursRestants != null ? GRILLE.urgence.find((x) => v.joursRestants! <= x.jours) : undefined;
  if (u) lignes.push({ label: `Traitement urgent (date limite dans ${Math.max(0, v.joursRestants!)} jour(s))`, amount: arrondir(sousTotal * u.taux) });
  const total = lignes.reduce((s, l) => s + l.amount, 0);
  return { items: lignes, total, deposit: arrondir(total * GRILLE.acompte), validity: GRILLE.validite };
}

/** Catalogue résumé pour l'IA : domaines, offres et prix de départ. */
export function catalogueTexte() {
  return SECTORS.map((d) => `- ${d.id} « ${d.label} » : ${d.services.map((o) => `${o.title} (${o.price || "sur devis"})`).join(" ; ")}`).join("\n");
}
