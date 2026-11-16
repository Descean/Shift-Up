/**
 * lib/dossier.ts — Vue « dossier de montage » d'une prestation, telle que la montrent les espaces
 * client, monteur et Direction : nature du marché, date limite, urgence, livraison, pause, statut
 * affiché, et calcul de la proposition de devis (grille + planchers + Express + livraison physique).
 */
import type { PrestationStatus } from "@prisma/client";
import { calculerDevis, type LigneDevis, type Volume } from "@/lib/tarifs";
import { libelleNature, plancherDe, type Tarifs } from "@/lib/tarifs-montage";
import type { ServiceItem } from "@/lib/catalogue";

export type InfosDossier = {
  nature: string | null;
  dateLimite: string | null; // AAAA-MM-JJ
  urgence: "standard" | "express";
  livraison: "numerique" | "physique";
  pause: { motif: string; depuis: string } | null;
  soldeLe: string | null;
  revision: { demandeeLe: string; texte: string; faiteLe?: string } | null;
};

export function infosDossier(customFields: unknown): InfosDossier {
  const cf = (customFields ?? {}) as Record<string, unknown>;
  const m = (cf.montage ?? {}) as Record<string, unknown>;
  const p = cf.pause as InfosDossier["pause"] | undefined;
  return {
    nature: typeof m.nature === "string" ? m.nature : null,
    dateLimite: typeof m.dateLimite === "string" ? m.dateLimite : null,
    urgence: m.urgence === "express" ? "express" : "standard",
    livraison: m.livraison === "physique" ? "physique" : "numerique",
    pause: p && typeof p.motif === "string" ? p : null,
    soldeLe: typeof cf.soldeLe === "string" ? cf.soldeLe : null,
    revision: (cf.revisionApresSolde as InfosDossier["revision"]) ?? null,
  };
}

export const reference = (id: string) => `DOS-${id.slice(-6).toUpperCase()}`;

/** Statuts tels que les montre la maquette (badges, colonnes du Kanban). */
export type EtatDossier = "a_chiffrer" | "attente_acompte" | "production" | "pause" | "termine" | "solde" | "annule";

export function etatDossier(status: PrestationStatus | string, customFields: unknown): EtatDossier {
  switch (status) {
    case "EN_ATTENTE": return "a_chiffrer";
    case "DEVIS_ENVOYE":
    case "EN_ATTENTE_PAIEMENT": return "attente_acompte";
    case "EN_COURS":
    case "REVISION": return infosDossier(customFields).pause ? "pause" : "production";
    case "LIVRAISON": return "termine";
    case "TERMINEE": return "solde";
    default: return "annule";
  }
}

export const ETATS: Record<EtatDossier, { label: string; classe: string }> = {
  a_chiffrer: { label: "À chiffrer", classe: "bg-orange-50 text-orange-700 border-orange-200" },
  attente_acompte: { label: "Attente acompte", classe: "bg-amber-50 text-amber-700 border-amber-200" },
  production: { label: "En production", classe: "bg-su-brume text-su-bleu border-su-lavande" },
  pause: { label: "Pause (pièce)", classe: "bg-red-50 text-red-700 border-red-200" },
  termine: { label: "Terminé (attente solde)", classe: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  solde: { label: "Livrables débloqués", classe: "bg-gray-100 text-gray-700 border-gray-200" },
  annule: { label: "Annulé", classe: "bg-gray-100 text-gray-500 border-gray-200" },
};

/** Titre affiché d'un dossier : sa nature de marché, sinon l'intitulé de la prestation. */
export function titreDossier(p: { customFields: unknown; customService?: string | null; service?: { title: string } | null }) {
  return libelleNature(infosDossier(p.customFields).nature) ?? p.service?.title ?? p.customService ?? "Dossier";
}

export const libelleLivraison = (l: InfosDossier["livraison"]) => (l === "physique" ? "Numérique + physique" : "Numérique uniquement");

/** Révision incluse : 48 heures après le paiement du solde. */
export const DELAI_REVISION_MS = 48 * 3600 * 1000;
export const revisionOuverte = (i: InfosDossier) => !!i.soldeLe && !i.revision && Date.now() - new Date(i.soldeLe).getTime() < DELAI_REVISION_MS;

const arrondir = (n: number) => Math.ceil(n / 5_000) * 5_000;

/**
 * Proposition de devis pour le monteur : grille (volume), relevée au plancher de la nature du marché,
 * majorée en Express, plus la livraison physique. Le monteur l'ajuste avant de l'envoyer.
 */
export function proposerDevis(t: Tarifs, i: InfosDossier, intitule: string, offre?: ServiceItem | null, volume: Volume = {}) {
  const g = calculerDevis(intitule, offre ?? null, { ...volume, joursRestants: null });
  const items: LigneDevis[] = [...g.items];
  let total = items.reduce((s, l) => s + l.amount, 0);
  const plancher = plancherDe(t, i.nature);
  if (plancher !== null && total < plancher) { items.push({ label: "Mise au tarif minimum de ce type de dossier", amount: plancher - total }); total = plancher; }
  if (i.urgence === "express") {
    const m = arrondir(total * t.majorationExpress);
    items.push({ label: `Traitement express (+${Math.round(t.majorationExpress * 100)} %)`, amount: m });
    total += m;
  }
  if (i.livraison === "physique" && t.livraisonPhysique > 0) {
    items.push({ label: "Impression, reliure et mise sous pli cacheté", amount: t.livraisonPhysique });
    total += t.livraisonPhysique;
  }
  return { items, total, deposit: arrondir(total * t.acompte), plancher };
}
