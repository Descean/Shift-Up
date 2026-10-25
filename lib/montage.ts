/**
 * lib/montage.ts — Montage de dossiers de soumission (secteur « Marchés Publics & Dossiers »)
 *
 * Deux blocs rangés dans prestation.customFields :
 *  - dossier : la fiche de l'appel d'offres (référence, autorité, lots, date limite, mode de dépôt…)
 *  - pieces  : la liste des pièces que le client doit fournir, avec l'état de chacune
 *
 * Ce module ne dépend d'aucune bibliothèque serveur : il est aussi utilisé par les pages.
 */
import { z } from "zod";
import { isSafe } from "@/lib/validation";

export const SECTEUR_MONTAGE = "Marchés Publics & Dossiers";

export const TYPES_MARCHE = ["Travaux", "Fournitures", "Services courants", "Prestations intellectuelles"] as const;
export const MODES_DEPOT = {
  EN_LIGNE: "En ligne (plateforme SIGMAP / e-procurement)",
  PHYSIQUE: "Dépôt physique (sous pli)",
  LES_DEUX: "En ligne et physique",
  INCONNU: "Je ne sais pas",
} as const;
export const PRESTATIONS_MONTAGE = [
  "Montage complet du dossier",
  "Offre technique",
  "Offre financière (bordereau, devis, sous-détails)",
  "Pièces administratives et formulaires",
  "Relecture et contrôle de conformité",
  "Dépôt de l'offre",
] as const;

const texte = (max: number) => z.string().trim().max(max).refine(isSafe, "Contenu non autorisé détecté.");
const facultatif = (max: number) => texte(max).optional().nullable().transform((v) => v || null);

export const dossierSchema = z.object({
  referenceAvis: texte(150).pipe(z.string().min(2, "Indiquez la référence de l'avis.")),
  intitule: texte(400).pipe(z.string().min(3, "Indiquez l'objet du marché.")),
  autorite: texte(200).pipe(z.string().min(2, "Indiquez l'autorité contractante.")),
  typeMarche: z.enum(TYPES_MARCHE),
  procedure: facultatif(120),
  financement: facultatif(150),
  lots: facultatif(300),
  /** Date et heure limite de dépôt, heure du Bénin : « AAAA-MM-JJTHH:MM » */
  dateLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Indiquez la date et l'heure limite de dépôt."),
  modeDepot: z.enum(Object.keys(MODES_DEPOT) as [keyof typeof MODES_DEPOT, ...(keyof typeof MODES_DEPOT)[]]),
  lieuDepot: facultatif(200),
  soumissionnaire: texte(200).pipe(z.string().min(2, "Indiquez l'entreprise qui soumissionne.")),
  groupement: z.boolean().default(false),
  membresGroupement: facultatif(300),
  prestations: z.array(z.enum(PRESTATIONS_MONTAGE)).min(1, "Choisissez au moins une prestation.").max(PRESTATIONS_MONTAGE.length),
});
export type Dossier = z.infer<typeof dossierSchema>;
export type DossierSaisie = z.input<typeof dossierSchema>;

export function dossierVide(): DossierSaisie {
  return {
    referenceAvis: "", intitule: "", autorite: "", typeMarche: "Travaux", procedure: "", financement: "", lots: "",
    dateLimite: "", modeDepot: "EN_LIGNE", lieuDepot: "", soumissionnaire: "", groupement: false, membresGroupement: "",
    prestations: ["Montage complet du dossier"],
  };
}

/** Date limite (heure du Bénin, UTC+1) → Date */
export function dateLimiteVersDate(d: string) {
  return new Date(`${d}:00+01:00`);
}

/** Numéro du jour calendaire à l'heure du Bénin (UTC+1, sans heure d'été) */
const jourBenin = (t: number) => Math.floor((t + 3_600_000) / 86_400_000);

/** Jours calendaires restants avant la date limite (0 = aujourd'hui, négatif si passée) */
export function joursRestants(d: string, maintenant = new Date()) {
  return jourBenin(dateLimiteVersDate(d).getTime()) - jourBenin(maintenant.getTime());
}

export function dateLimiteFr(d: string) {
  return dateLimiteVersDate(d).toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", weekday: "long", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

/** Libellé court du délai : « J-5 », « Demain », « Aujourd'hui », « Dépassée » */
export function echeance(d: string, maintenant = new Date()) {
  if (dateLimiteVersDate(d).getTime() < maintenant.getTime()) return { libelle: "Date limite dépassée", niveau: "depassee" as const };
  const j = joursRestants(d, maintenant);
  if (j <= 0) return { libelle: "Dépôt aujourd'hui", niveau: "urgent" as const };
  if (j === 1) return { libelle: "Dépôt demain", niveau: "urgent" as const };
  return { libelle: `J-${j}`, niveau: j <= 3 ? ("urgent" as const) : j <= 7 ? ("proche" as const) : ("normal" as const) };
}

/** Résumé utilisé comme description de la demande quand le client n'en a pas écrit. */
export function resumeDossier(d: Dossier) {
  return [
    `Montage du dossier de soumission — ${d.intitule}`,
    `Avis : ${d.referenceAvis} — ${d.autorite}`,
    d.lots ? `Lot(s) : ${d.lots}` : null,
    `Soumissionnaire : ${d.soumissionnaire}${d.groupement ? " (groupement)" : ""}`,
    `Date limite : ${dateLimiteFr(d.dateLimite)}`,
    `Attendu : ${d.prestations.join(", ")}`,
  ].filter(Boolean).join("\n");
}

// ─── Pièces à fournir ─────────────────────────────────────────────────────────

export const CATEGORIES_PIECE = ["Dossier", "Administratif", "Financier", "Technique", "Autre"] as const;
export type CategoriePiece = (typeof CATEGORIES_PIECE)[number];

export const STATUTS_PIECE = {
  A_FOURNIR: "À fournir",
  FOURNI: "Reçu, en vérification",
  VALIDE: "Conforme",
  A_REPRENDRE: "À reprendre",
  INDISPONIBLE: "Non disponible",
  NON_REQUIS: "Non requis",
} as const;
export type StatutPiece = keyof typeof STATUTS_PIECE;

export interface FichierPiece { url: string; nom: string; date: string }
export interface Piece {
  id: string;
  libelle: string;
  categorie: CategoriePiece;
  statut: StatutPiece;
  fichiers: FichierPiece[];
  commentaireClient?: string | null;
  commentaireAdmin?: string | null;
  majLe: string;
}

type Modele = { id: string; libelle: string; categorie: CategoriePiece; si?: (d: Dossier) => boolean };

const MODELES: Modele[] = [
  { id: "dao", libelle: "Dossier d'appel d'offres complet (avis, DAO, additifs éventuels)", categorie: "Dossier" },
  { id: "rccm", libelle: "Registre du commerce (RCCM)", categorie: "Administratif" },
  { id: "ifu", libelle: "Carte IFU / NIF", categorie: "Administratif" },
  { id: "statuts", libelle: "Statuts de l'entreprise (pour une société)", categorie: "Administratif" },
  { id: "fiscale", libelle: "Attestation fiscale en cours de validité", categorie: "Administratif" },
  { id: "cnss", libelle: "Attestation CNSS en cours de validité", categorie: "Administratif" },
  { id: "nonfaillite", libelle: "Attestation de non-faillite", categorie: "Administratif" },
  { id: "nonexclusion", libelle: "Attestation de non-exclusion de la commande publique", categorie: "Administratif" },
  { id: "identite", libelle: "Pièce d'identité du signataire (et pouvoir s'il n'est pas le gérant)", categorie: "Administratif" },
  { id: "rib", libelle: "Relevé d'identité bancaire (RIB)", categorie: "Administratif" },
  { id: "groupement", libelle: "Accord de groupement signé et pièces de chaque membre", categorie: "Administratif", si: (d) => d.groupement },
  { id: "bilans", libelle: "États financiers des 3 dernières années", categorie: "Financier" },
  { id: "capacite", libelle: "Attestation de capacité financière ou ligne de crédit", categorie: "Financier" },
  { id: "garantie", libelle: "Garantie de soumission (si le DAO l'exige)", categorie: "Financier" },
  { id: "references", libelle: "Liste des marchés similaires déjà exécutés", categorie: "Technique" },
  { id: "attestations", libelle: "Attestations de bonne exécution ou PV de réception de ces marchés", categorie: "Technique" },
  { id: "personnel", libelle: "CV, diplômes et attestations du personnel proposé", categorie: "Technique", si: (d) => d.typeMarche !== "Fournitures" },
  { id: "materiel", libelle: "Justificatifs du matériel (cartes grises, factures ou promesses de location)", categorie: "Technique", si: (d) => d.typeMarche === "Travaux" },
  { id: "fiches", libelle: "Fiches techniques, catalogues ou prospectus des articles proposés", categorie: "Technique", si: (d) => d.typeMarche === "Fournitures" },
  { id: "autorisation", libelle: "Autorisation du fabricant (si le DAO l'exige)", categorie: "Technique", si: (d) => d.typeMarche === "Fournitures" },
];

/** Liste de départ, adaptée au type de marché ; le DAO joint au formulaire est déjà marqué reçu. */
export function piecesInitiales(d: Dossier, dao?: FichierPiece | null): Piece[] {
  const maintenant = new Date().toISOString();
  return MODELES.filter((m) => !m.si || m.si(d)).map((m) => ({
    id: m.id, libelle: m.libelle, categorie: m.categorie,
    statut: m.id === "dao" && dao ? "FOURNI" : "A_FOURNIR",
    fichiers: m.id === "dao" && dao ? [dao] : [],
    majLe: maintenant,
  }));
}

/** Pièces encore attendues du client */
export const enAttenteClient = (p: Piece) => p.statut === "A_FOURNIR" || p.statut === "A_REPRENDRE";

export function bilanPieces(pieces: Piece[]) {
  const utiles = pieces.filter((p) => p.statut !== "NON_REQUIS");
  return {
    total: utiles.length,
    valides: utiles.filter((p) => p.statut === "VALIDE").length,
    recues: utiles.filter((p) => p.statut === "FOURNI" || p.statut === "VALIDE").length,
    attendues: utiles.filter(enAttenteClient).length,
    aReprendre: utiles.filter((p) => p.statut === "A_REPRENDRE").length,
    indisponibles: utiles.filter((p) => p.statut === "INDISPONIBLE").length,
  };
}

// ─── Dépôt de l'offre et résultat ─────────────────────────────────────────────

export interface Depot {
  deposeLe: string;              // date et heure du dépôt (ISO)
  par: "SHIFT_UP" | "CLIENT";
  numero?: string | null;        // n° de récépissé ou d'accusé de réception
  recepisse?: FichierPiece | null;
  commentaire?: string | null;
  enregistreLe: string;
}

export const RESULTATS = {
  EN_ATTENTE: "En attente du résultat",
  ATTRIBUE: "Marché attribué",
  NON_RETENU: "Offre non retenue",
  INFRUCTUEUX: "Appel d'offres infructueux",
  ANNULE: "Procédure annulée",
} as const;
export type StatutResultat = keyof typeof RESULTATS;

export interface Resultat {
  statut: StatutResultat;
  date?: string | null;          // date de la notification ou de la publication (AAAA-MM-JJ)
  montantOffre?: number | null;  // montant lu à l'ouverture des plis (F CFA)
  montantAttribue?: number | null;
  rang?: number | null;
  attributaire?: string | null;
  motif?: string | null;         // motif de rejet communiqué
  document?: FichierPiece | null; // PV, lettre de notification ou publication
  commentaire?: string | null;
  enregistrePar: "SHIFT_UP" | "CLIENT";
  enregistreLe: string;
}

/** SHIFT UP dépose-t-il l'offre lui-même ? */
export const shiftUpDepose = (d: Dossier | null) => Boolean(d?.prestations.includes("Dépôt de l'offre"));

/** Lecture tolérante de customFields */
export function lireMontage(cf: unknown): { dossier: Dossier | null; pieces: Piece[]; depot: Depot | null; resultat: Resultat | null } {
  const o = (cf && typeof cf === "object" ? cf : {}) as { dossier?: Dossier; pieces?: Piece[]; depot?: Depot; resultat?: Resultat };
  return { dossier: o.dossier ?? null, pieces: Array.isArray(o.pieces) ? o.pieces : [], depot: o.depot ?? null, resultat: o.resultat ?? null };
}
