/**
 * lib/veille/criteres.ts — Critères de la veille et correspondance avis ↔ abonné.
 * Sans dépendance serveur : utilisé aussi par les pages.
 */

/** Secteur des prestations « abonnement à la veille » */
export const SECTEUR_VEILLE = "Veille des marchés";

export const SECTEURS_VEILLE: Record<string, string[]> = {
  "BTP, bâtiments et génie civil": ["travaux", "construction", "rehabilitation", "refection", "batiment", "genie civil", "piste", "route", "voirie", "pavage", "ouvrage", "dalot", "pont", "cloture", "salle de classe", "modules de classes", "magasin", "marche ", "latrine", "forage"],
  "Eau, assainissement et hygiène": ["assainissement", "eau potable", "adduction", "aep", "saepmv", "forage", "latrine", "vidange", "caniveau", "drainage", "hydraulique", "puits", "station de pompage"],
  "Énergie et électricité": ["electrification", "electrique", "electricite", "solaire", "photovoltaique", "groupe electrogene", "eclairage", "lampadaire", "transformateur", "reseau bt", "reseau hta", "onduleur"],
  "Informatique et télécoms": ["informatique", "ordinateur", "imprimante", "serveur", "logiciel", "reseau informatique", "telecommunication", "fibre", "videosurveillance", "photocopieur", "consommables informatiques", "application", "plateforme numerique", "site web"],
  "Fournitures et mobilier de bureau": ["fournitures de bureau", "mobilier", "tables-bancs", "tables bancs", "chaises", "fauteuil", "armoire", "papeterie", "consommables", "fournitures scolaires"],
  "Véhicules, engins et pièces": ["vehicule", "camion", "moto", "engin", "pick-up", "4x4", "pieces de rechange", "pneumatiques", "carburant", "lubrifiant"],
  "Froid, climatisation et maintenance": ["climatiseur", "climatisation", "froid", "chambre froide", "maintenance", "entretien des equipements", "incinerateur", "ascenseur"],
  "Nettoyage, entretien et espaces verts": ["nettoyage", "entretien des locaux", "entretien menager", "espaces verts", "jardinage", "desinsectisation", "deratisation", "hygiene des locaux"],
  "Gardiennage et sécurité": ["gardiennage", "surveillance", "securite des locaux", "securisation", "vigile", "incendie", "extincteur"],
  "Communication, audiovisuel et événementiel": ["communication", "audiovisuel", "film", "video", "spot", "evenementiel", "sonorisation", "impression", "imprimerie", "edition", "affiche", "gadgets", "publicite", "medias", "reportage"],
  "Études, conseil et formation": ["etude", "consultant", "cabinet", "assistance technique", "audit", "evaluation", "formation", "renforcement de capacites", "elaboration", "diagnostic", "controle et surveillance", "maitrise d'oeuvre", "recrutement d'un", "recrutement de"],
  "Santé et équipements médicaux": ["medical", "medicaments", "sante", "hopital", "laboratoire", "reactifs", "consommables medicaux", "equipements medicaux", "vaccins"],
  "Agriculture, élevage et environnement": ["agricole", "semences", "engrais", "intrants", "elevage", "aviculture", "maraichage", "plants", "reboisement", "foret", "amenagement de bas-fonds", "irrigation", "peche", "environnement"],
  "Alimentation et restauration": ["vivres", "denrees", "restauration", "cantine", "alimentaires", "pause-cafe", "traiteur", "repas"],
  "Transport, logistique et voyage": ["transport", "transit", "billets d'avion", "billetterie", "location de vehicules", "demenagement", "logistique", "hebergement"],
};

export const DEPARTEMENTS = ["Alibori", "Atacora", "Atlantique", "Borgou", "Collines", "Couffo", "Donga", "Littoral", "Mono", "Ouémé", "Plateau", "Zou"];

/** Principales communes, rattachées à leur département (pour la recherche par zone). */
export const COMMUNES: Record<string, string[]> = {
  Alibori: ["Banikoara", "Gogounou", "Kandi", "Karimama", "Malanville", "Ségbana"],
  Atacora: ["Boukoumbé", "Cobly", "Kérou", "Kouandé", "Matéri", "Natitingou", "Péhunco", "Tanguiéta", "Toucountouna"],
  Atlantique: ["Abomey-Calavi", "Allada", "Kpomassè", "Ouidah", "Sô-Ava", "Toffo", "Tori-Bossito", "Zè"],
  Borgou: ["Bembèrèkè", "Kalalé", "N'Dali", "Nikki", "Parakou", "Pèrèrè", "Sinendé", "Tchaourou"],
  Collines: ["Bantè", "Dassa-Zoumè", "Glazoué", "Ouèssè", "Savalou", "Savè"],
  Couffo: ["Aplahoué", "Djakotomey", "Dogbo", "Klouékanmè", "Lalo", "Toviklin"],
  Donga: ["Bassila", "Copargo", "Djougou", "Ouaké"],
  Littoral: ["Cotonou"],
  Mono: ["Athiémé", "Bopa", "Comè", "Grand-Popo", "Houéyogbé", "Lokossa"],
  Ouémé: ["Adjarra", "Adjohoun", "Aguégués", "Akpro-Missérété", "Avrankou", "Bonou", "Dangbo", "Porto-Novo", "Sèmè-Kpodji"],
  Plateau: ["Adja-Ouèrè", "Ifangni", "Kétou", "Pobè", "Sakété"],
  Zou: ["Abomey", "Agbangnizoun", "Bohicon", "Covè", "Djidja", "Ouinhi", "Zagnanado", "Za-Kpota", "Zogbodomey"],
};

export const TYPES_VEILLE = ["Travaux", "Fournitures", "Services courants", "Prestations intellectuelles"] as const;

export const normaliser = (s: string) => ` ${s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[’']/g, "'").replace(/[^a-z0-9' -]+/g, " ").replace(/\s+/g, " ")} `;

export type AvisPourCorrespondance = { objet: string; autorite?: string | null; lieu?: string | null; typeMarche?: string | null; dateLimite?: Date | string | null };
export type CriteresVeille = { secteurs: string[]; motsCles: string[]; exclusions: string[]; typesMarche: string[]; zones: string[] };

const contient = (texte: string, terme: string) => {
  const t = normaliser(terme).trim();
  return t.length >= 3 && texte.includes(t.length <= 4 ? ` ${t} ` : t);
};

/**
 * Score de correspondance (0 = ne correspond pas).
 * Il faut au moins un mot-clé ou un mot d'un secteur choisi dans l'objet de l'avis ; les filtres
 * type de marché et zone, s'ils sont renseignés, doivent aussi être satisfaits ; un mot exclu écarte l'avis.
 */
export function scoreCorrespondance(a: AvisPourCorrespondance, c: CriteresVeille) {
  const objet = normaliser(a.objet);
  const tout = normaliser(`${a.objet} ${a.autorite ?? ""} ${a.lieu ?? ""}`);
  if (c.exclusions.some((x) => contient(tout, x))) return 0;
  if (c.typesMarche.length && a.typeMarche && !c.typesMarche.includes(a.typeMarche)) return 0;
  if (c.zones.length) {
    const termes = c.zones.flatMap((z) => [z, ...(COMMUNES[z] ?? [])]);
    if (!termes.some((z) => contient(tout, z))) return 0;
  }
  let score = 0;
  for (const m of c.motsCles) if (contient(objet, m)) score += 3;
  for (const s of c.secteurs) {
    const n = (SECTEURS_VEILLE[s] ?? []).filter((m) => contient(objet, m)).length;
    if (n) score += 1 + Math.min(n, 3);
  }
  return score;
}

/** Type de marché déduit d'un libellé ou d'un titre (portails, Banque mondiale, agences). */
export function typeDepuisTexte(t?: string | null): (typeof TYPES_VEILLE)[number] | null {
  const x = normaliser(t ?? "").replace(/'/g, " ");
  if (/ (prestations? intellectuelles?|pi|cs|consultant|consulting|consultancy|cabinet|bureau d ?etudes?|assistance technique|maitrise d ?oeuvre|etudes?|audit|auditeur|evaluation|expert|specialiste|recrutement|expression of interest|eoi) /.test(x)) return "Prestations intellectuelles";
  if (/ (travaux|works|t|cw|construction|rehabilitation|refection|amenagement) /.test(x)) return "Travaux";
  if (/ (fournitures?|goods|f|go|acquisition|achat|livraison|equipements?) /.test(x)) return "Fournitures";
  if (/ (services?|non-consulting|nc|s|entretien|gardiennage|nettoyage|maintenance|location|assurance) /.test(x)) return "Services courants";
  return null;
}
