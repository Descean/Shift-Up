/**
 * lib/recrutement/offres.ts — Offres d'emploi publiées par SHIFT UP (cabinet de recrutement)
 *
 * Les offres sont définies ici (versionnées avec le site). Pour ajouter, fermer ou
 * modifier une offre : éditer ce fichier, puis déployer.
 * Le lien court /r/<code> redirige vers /recrutement/<slug>.
 */

export type FamilleOffre = "Ingénieur" | "Technicien";

export interface OffreEmploi {
  code: string;            // code court affiché (DT, CT…)
  slug: string;            // URL : /recrutement/<slug> et lien court /r/<slug>
  titre: string;
  famille: FamilleOffre;
  mission: string;         // une phrase
  diplome: string;
  experience: string;      // expérience générale
  experienceSpecifique: string;
  autres?: string[];       // exigences complémentaires
  dateLimite: string;      // ISO, fin de journée heure de Cotonou
  active: boolean;
}

/** Contexte commun à toutes les offres (aucune mention de projet, bailleur ou localité). */
export const CONTEXTE_RECRUTEMENT =
  "SHIFT UP recrute, pour le compte d'une entreprise de travaux publics, des cadres et techniciens pour ses chantiers de pistes rurales et d'ouvrages en béton armé au Bénin.";

const DATE_LIMITE = "2026-11-05T23:59:00+01:00";

export const OFFRES: OffreEmploi[] = [
  {
    code: "DT", slug: "dt", titre: "Directeur des travaux", famille: "Ingénieur",
    mission: "Diriger l'exécution de chantiers de pistes rurales et d'ouvrages en béton armé : organisation des équipes et du matériel, délais, qualité, sécurité, relation avec la mission de contrôle.",
    diplome: "Ingénieur en génie civil (BAC+5) ou équivalent",
    experience: "15 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir dirigé, depuis 2016, au moins 5 chantiers de routes ou de pistes rurales comportant des ponts ou dalots en béton armé",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "CT", slug: "ct", titre: "Conducteur des travaux", famille: "Ingénieur",
    mission: "Conduire au quotidien les travaux de terrassement, de chaussée et d'ouvrages : planning, rendements, suivi des quantités et des sous-ensembles du chantier.",
    diplome: "Ingénieur en génie civil (BAC+5) ou équivalent",
    experience: "10 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir conduit au moins 5 chantiers de routes ou de pistes rurales en qualité de conducteur des travaux",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "OA", slug: "oa", titre: "Ingénieur ouvrages d'art", famille: "Ingénieur",
    mission: "Suivre l'exécution des ponts, dalots et ouvrages hydrauliques en béton armé : plans d'exécution, coffrage, ferraillage, bétonnage et réception.",
    diplome: "Ingénieur en génie civil (BAC+5), option ponts et chaussées",
    experience: "10 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir suivi au moins 3 projets d'ouvrages d'art (ponts ou dalots) en béton armé",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "GEO", slug: "geo", titre: "Ingénieur géotechnicien", famille: "Ingénieur",
    mission: "Piloter les études et le contrôle géotechniques du chantier : reconnaissance des sols, choix des matériaux, essais et contrôle du compactage.",
    diplome: "Ingénieur en génie civil (BAC+5), option géotechnique",
    experience: "10 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir assuré la géotechnique d'au moins 3 projets routiers ou d'ouvrages",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "ITOP", slug: "itop", titre: "Ingénieur topographe", famille: "Ingénieur",
    mission: "Diriger les levés, implantations et contrôles topographiques du chantier, et produire les plans de récolement.",
    diplome: "Ingénieur en génie civil (BAC+5), option géomètre-topographe",
    experience: "10 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir assuré la topographie d'au moins 5 projets de routes ou de pistes",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "HSE", slug: "hse", titre: "Spécialiste HSE", famille: "Ingénieur",
    mission: "Mettre en œuvre et suivre le plan hygiène, sécurité et environnement du chantier : sensibilisation, contrôles, rapports et mesures sociales.",
    diplome: "BAC+5 en environnement ou en génie de l'environnement",
    experience: "5 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir assuré le suivi HSE d'au moins 2 chantiers d'ouvrages en béton armé",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "CC", slug: "cc", titre: "Chef de chantier", famille: "Technicien",
    mission: "Encadrer les équipes et les engins sur le terrain, organiser les tâches de la journée et veiller à la qualité d'exécution.",
    diplome: "Technicien supérieur en génie civil (BAC+3)",
    experience: "10 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir été chef de chantier sur au moins 3 chantiers similaires (routes, pistes ou ouvrages)",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "TTOP", slug: "ttop", titre: "Technicien topographe", famille: "Technicien",
    mission: "Réaliser les levés, implantations et contrôles de niveaux sous la direction de l'ingénieur topographe.",
    diplome: "Technicien en génie civil (BAC+3), option topographie",
    experience: "5 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir participé à au moins 3 chantiers d'ouvrages en béton armé ou de routes",
    dateLimite: DATE_LIMITE, active: true,
  },
  {
    code: "LAB", slug: "lab", titre: "Technicien de laboratoire", famille: "Technicien",
    mission: "Réaliser les essais de laboratoire et de chantier sur les sols, granulats et bétons, et tenir les registres d'essais.",
    diplome: "BAC F4 ou DTI en génie civil au moins",
    experience: "3 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir réalisé les essais sur au moins 3 ouvrages en béton armé",
    dateLimite: DATE_LIMITE, active: true,
  },
];

export function getOffre(slugOrCode: string): OffreEmploi | undefined {
  const k = slugOrCode.toLowerCase();
  return OFFRES.find((o) => o.slug === k || o.code.toLowerCase() === k);
}

export function offreOuverte(o: OffreEmploi, now = new Date()): boolean {
  return o.active && now.getTime() <= new Date(o.dateLimite).getTime();
}

export function formatDateLimite(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Porto-Novo" });
}

/** Pièces demandées. CV, diplôme et attestations obligatoires. */
export const PIECES = [
  { type: "CV", label: "CV", aide: "Daté et signé", obligatoire: true, max: 1 },
  { type: "DIPLOME", label: "Diplôme", aide: "Copie du diplôme le plus élevé", obligatoire: true, max: 2 },
  { type: "ATTESTATIONS", label: "Attestations de travail", aide: "Attestations ou certificats précisant les chantiers (plusieurs fichiers possibles)", obligatoire: true, max: 8 },
  { type: "AUTRES", label: "Autres pièces", aide: "Pièce d'identité, certificats, références (facultatif)", obligatoire: false, max: 5 },
] as const;

export type TypePiece = (typeof PIECES)[number]["type"];

export const TAILLE_MAX_FICHIER = 10 * 1024 * 1024;   // 10 Mo par fichier
export const TAILLE_MAX_DOSSIER = 30 * 1024 * 1024;   // 30 Mo au total

export const DISPONIBILITES = ["Immédiate", "Sous 1 mois", "Sous 3 mois"] as const;
