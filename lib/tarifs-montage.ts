/** Natures de marché et tarifs de la Direction (sans accès à la base : utilisable côté navigateur). */

export const NATURES = [
  { id: "cotation", label: "Demande de Cotation" },
  { id: "trp", label: "DRP / TRP" },
  { id: "dao", label: "Dossier d'Appel d'Offres (DAO)" },
] as const;
export type Nature = (typeof NATURES)[number]["id"];
export const libelleNature = (n?: string | null) => NATURES.find((x) => x.id === n)?.label ?? null;

export type Tarifs = {
  planchers: Record<Nature, number>;
  livraisonPhysique: number;
  majorationExpress: number; // 0,3 = +30 %
  acompte: number; // 0,6 = 60 %
  commissionMonteurs: number; // part SHIFT UP sur les paiements des clients des monteurs indépendants (0,15 = 15 %)
};

export const TARIFS_DEFAUT: Tarifs = {
  planchers: { cotation: 30000, trp: 80000, dao: 120000 },
  livraisonPhysique: 15000,
  majorationExpress: 0.3,
  acompte: 0.6,
  commissionMonteurs: 0.15,
};

/** Plancher applicable à un dossier de montage : celui de sa nature (aucun pour les autres services). */
export const plancherDe = (t: Tarifs, nature?: string | null): number | null =>
  t.planchers[nature as Nature] ?? null;
