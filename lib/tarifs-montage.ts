/** Natures de marché et tarifs de la Direction (sans accès à la base : utilisable côté navigateur). */

// Modes de passation proposés au client. L'identifiant « trp » est conservé pour la DRP (dossiers déjà enregistrés).
export const NATURES = [
  { id: "cotation", label: "Demande de cotation" },
  { id: "trp", label: "Demande de renseignements et de prix (DRP)" },
  { id: "dao", label: "Appel d'offres (DAO)" },
  { id: "ami", label: "Manifestation d'intérêt (AMI)" },
  { id: "dp", label: "Demande de propositions" },
  { id: "bailleur", label: "Marché d'un bailleur (Banque mondiale, BAD, AFD…)" },
] as const;
export const IDS_NATURES = NATURES.map((n) => n.id) as [Nature, ...Nature[]];
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
  planchers: { cotation: 30000, trp: 80000, dao: 120000, ami: 50000, dp: 150000, bailleur: 200000 },
  livraisonPhysique: 15000,
  majorationExpress: 0.3,
  acompte: 0.6,
  commissionMonteurs: 0.15,
};

/** Plancher applicable à un dossier de montage : celui de sa nature (aucun pour les autres services). */
export const plancherDe = (t: Tarifs, nature?: string | null): number | null =>
  t.planchers[nature as Nature] ?? null;
