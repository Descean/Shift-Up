/**
 * lib/recrutement/offres.ts — Offres d'emploi publiées par SHIFT UP (cabinet de recrutement)
 *
 * Les offres sont définies ici (versionnées avec le site). Pour ajouter, fermer ou
 * modifier une offre : éditer ce fichier, puis déployer.
 * Le lien court /r/<code> redirige vers /recrutement/<slug>.
 */

export type FamilleOffre = "Ingénieur" | "Technicien" | "Communication" | "Création" | "Numérique";

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
  contexte?: string;       // contexte de la mission (remplace CONTEXTE_RECRUTEMENT pour cette offre)
  priseDePoste?: string;   // ex. « Prise de poste selon le calendrier des chantiers »
  libelleProjets?: string; // libellé du champ « nombre de … similaires » du formulaire
  exempleDiplome?: string; // exemple affiché dans le champ diplôme du formulaire
  piecesObligatoires?: TypePiece[];  // pièces rendues obligatoires pour ce poste (ex. portfolio dans AUTRES)
  piecesFacultatives?: TypePiece[];  // pièces rendues facultatives pour ce poste
  aidePieces?: Partial<Record<TypePiece, string>>; // texte d'aide propre au poste
  dateLimite: string;      // ISO, fin de journée heure de Cotonou
  active: boolean;
}

/** Contexte par défaut (aucune mention de projet, bailleur ou localité). */
export const CONTEXTE_RECRUTEMENT =
  "SHIFT UP, cabinet de recrutement, sélectionne pour le compte de ses entreprises clientes des cadres, experts et techniciens au Bénin.";

const DATE_LIMITE = "2026-11-05T23:59:00+01:00";

/* ── Mission communication & identité visuelle (novembre 2026) ── */
const DATE_LIMITE_COM = "2026-11-12T12:00:00+01:00";
const CONTEXTE_COM =
  "SHIFT UP recrute, pour le compte d'un groupement de cabinets, une équipe d'experts pour une mission de communication et d'identité visuelle d'une institution à Cotonou : charte graphique, supports, site web institutionnel, maquettes de tenues de travail et d'objets publicitaires.";
const AUTRES_COM = [
  "Disponibilité pour une mission de 13 semaines à Cotonou, dès la notification du marché",
  "Exclusivité : ne pas figurer dans l'équipe d'un autre candidat pour la même mission",
  "CV signé et attestations de service fait ou de travail justifiant chaque projet cité",
];
const COM = { contexte: CONTEXTE_COM, priseDePoste: "Mission de 13 semaines à Cotonou", libelleProjets: "Nombre de projets similaires", dateLimite: DATE_LIMITE_COM, active: true };

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
  {
    code: "CP", slug: "cp", titre: "Chef de projet communication (chef de mission)", famille: "Communication",
    mission: "Diriger la mission : cadrage avec le client, coordination de l'équipe créative et technique, respect du calendrier et validation des livrables (charte, supports, site web, maquettes).",
    diplome: "BAC+4 au moins en communication ou en marketing",
    experience: "5 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Avoir conduit au moins 2 projets de création ou de déclinaison d'identité visuelle, ou de site web institutionnel, au cours des 5 dernières années",
    autres: AUTRES_COM, exempleDiplome: "Ex. Master en communication des organisations", ...COM,
  },
  {
    code: "DA", slug: "da", titre: "Directeur artistique / graphiste", famille: "Création",
    mission: "Concevoir la charte graphique et piloter sa déclinaison sur l'ensemble des modèles et supports de l'institution.",
    diplome: "BAC+3 au moins en design graphique",
    experience: "5 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Portfolio présentant au moins 2 identités visuelles réalisées (à joindre en PDF)",
    autres: AUTRES_COM, exempleDiplome: "Ex. Licence professionnelle en design graphique", ...COM,
    piecesObligatoires: ["AUTRES"], aidePieces: { AUTRES: "Portfolio (au moins 2 identités visuelles) obligatoire ; certificats, références" },
  },
  {
    code: "DW", slug: "dw", titre: "Développeur web (CMS)", famille: "Numérique",
    mission: "Concevoir et mettre en ligne le site web institutionnel sous CMS : thème, gabarits, sécurité, hébergement, formation des administrateurs et maintenance.",
    diplome: "BAC+3 au moins en informatique",
    experience: "3 ans d'expérience minimum en développement sous CMS (WordPress de préférence)",
    experienceSpecifique: "Avoir réalisé au moins 2 sites web institutionnels (liens et attestations à joindre)",
    autres: AUTRES_COM, exempleDiplome: "Ex. Licence en génie logiciel", ...COM, libelleProjets: "Nombre de sites institutionnels réalisés",
  },
  {
    code: "RB", slug: "rb", titre: "Rédacteur bilingue français-anglais", famille: "Communication",
    mission: "Rédiger et traduire les contenus institutionnels du site web et des supports, en français et en anglais.",
    diplome: "Aucun diplôme exigé (formation en langues, lettres ou journalisme appréciée)",
    experience: "3 ans d'expérience minimum en rédaction institutionnelle français-anglais",
    experienceSpecifique: "Avoir rédigé ou traduit des contenus institutionnels (sites web, rapports, brochures, communiqués)",
    autres: AUTRES_COM, exempleDiplome: "Ex. Licence en anglais (ou dernier diplôme obtenu)", ...COM,
    piecesFacultatives: ["DIPLOME"], aidePieces: { AUTRES: "Exemples de textes rédigés ou traduits, certificats" },
  },
  {
    code: "GM", slug: "gm", titre: "Graphiste maquettiste (rendus produits)", famille: "Création",
    mission: "Réaliser les maquettes et rendus des tenues de travail, des équipements de protection et des objets publicitaires aux couleurs de l'institution.",
    diplome: "BAC+2 au moins en arts graphiques",
    experience: "3 ans d'expérience professionnelle minimum après le diplôme",
    experienceSpecifique: "Portfolio de maquettes de vêtements ou d'objets marqués (tenues, EPI, goodies)",
    autres: AUTRES_COM, exempleDiplome: "Ex. BTS en arts graphiques", ...COM,
    piecesObligatoires: ["AUTRES"], aidePieces: { AUTRES: "Portfolio de maquettes (vêtements, objets marqués) obligatoire ; certificats, références" },
  },
  {
    code: "PH", slug: "ph", titre: "Photographe professionnel", famille: "Création",
    mission: "Réaliser les séances photo du personnel et des sites de l'institution et livrer une sélection retouchée (intervention ponctuelle).",
    diplome: "Aucun diplôme exigé",
    experience: "Pratique professionnelle confirmée de la photographie",
    experienceSpecifique: "Portfolio de portraits professionnels et de photos de sites industriels ou de chantiers",
    autres: AUTRES_COM, exempleDiplome: "Ex. dernier diplôme obtenu", ...COM, libelleProjets: "Nombre de reportages similaires",
    piecesObligatoires: ["AUTRES"], piecesFacultatives: ["DIPLOME", "ATTESTATIONS"],
    aidePieces: { AUTRES: "Portfolio (portraits professionnels, sites industriels ou chantiers) obligatoire ; références" },
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
  const d = new Date(iso);
  const jour = d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Porto-Novo" });
  const heure = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Porto-Novo" });
  // Heure affichée seulement si la clôture n'est pas en fin de journée
  return heure === "23:59" ? jour : `${jour} à ${heure.replace(":", " h ")}`;
}

/** Pièces demandées. CV, diplôme et attestations obligatoires. */
export const PIECES = [
  { type: "CV", label: "CV", aide: "Daté et signé", obligatoire: true, max: 1 },
  { type: "IDENTITE", label: "Pièce d'identité", aide: "En cours de validité (CNI, passeport, CIP ou carte biométrique), recto et verso", obligatoire: true, max: 2 },
  { type: "DIPLOME", label: "Diplôme", aide: "Copie du diplôme le plus élevé", obligatoire: true, max: 2 },
  { type: "ATTESTATIONS", label: "Attestations de travail", aide: "Attestations ou certificats précisant les chantiers ou missions réalisés (plusieurs fichiers possibles)", obligatoire: true, max: 8 },
  { type: "AUTRES", label: "Autres pièces", aide: "Portfolio, certificats, références", obligatoire: false, max: 5 },
] as const;

export type TypePiece = (typeof PIECES)[number]["type"];

export interface PieceDemandee { type: TypePiece; label: string; aide: string; obligatoire: boolean; max: number }

/** Pièces demandées pour une offre donnée (règles propres au poste appliquées). */
export function piecesOffre(o: OffreEmploi): PieceDemandee[] {
  return PIECES.map((p) => ({
    type: p.type,
    label: p.label,
    max: p.max,
    aide: o.aidePieces?.[p.type] ?? p.aide,
    obligatoire: o.piecesObligatoires?.includes(p.type) ? true : o.piecesFacultatives?.includes(p.type) ? false : p.obligatoire,
  }));
}

export const TAILLE_MAX_FICHIER = 10 * 1024 * 1024;   // 10 Mo par fichier
export const TAILLE_MAX_DOSSIER = 30 * 1024 * 1024;   // 30 Mo au total

export const DISPONIBILITES = ["Immédiate", "Sous 1 mois", "Sous 3 mois"] as const;
