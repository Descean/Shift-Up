/**
 * lib/veille/sources.ts — Collecte des avis d'appel d'offres
 *
 *  - Portail national des marchés publics (SIGMaP) : interface publique de marches-publics.bj,
 *    avis en cours (status=1) et dernières publications.
 *  - Banque mondiale : avis du Bénin (appels d'offres et manifestations d'intérêt).
 *  - Saisie manuelle par l'équipe (voir l'administration de la veille).
 * Chaque avis est identifié par « source:référence » : une nouvelle collecte met à jour
 * l'avis existant (report de date, additif) au lieu de créer un doublon.
 */
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { normaliser, typeDepuisTexte } from "@/lib/veille/criteres";

const AGENT = "Mozilla/5.0 (compatible; ShiftUpVeille/1.0; +https://www.shiftup.bj)";
const SIGMAP_API = "https://api.marches-publics.bj/v2/api/portail/appelsoffres";
const SIGMAP_UI = "https://www.marches-publics.bj/appels-doffres";
const BM_API = "https://search.worldbank.org/api/v2/procnotices";

export type AvisCollecte = {
  source: "SIGMAP" | "BANQUE_MONDIALE" | "MANUEL";
  reference: string;
  objet: string;
  autorite?: string | null;
  typeMarche?: string | null;
  procedure?: string | null;
  financement?: string | null;
  lieu?: string | null;
  datePublication?: Date | null;
  dateLimite?: Date | null;
  lien?: string | null;
  details?: Record<string, unknown>;
};

export const cleAvis = (source: string, reference: string) => `${source}:${normaliser(reference).trim().replace(/\s+/g, "")}`;

const dateBenin = (jour?: string | null, heure?: string | null) => {
  if (!jour || !/^\d{4}-\d{2}-\d{2}/.test(jour)) return null;
  const h = heure && /^\d{2}:\d{2}/.test(heure) ? heure.slice(0, 5) : "23:59";
  const d = new Date(`${jour.slice(0, 10)}T${h}:00+01:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

async function json<T>(url: string): Promise<T> {
  const r = await fetch(url, { headers: { "User-Agent": AGENT, Accept: "application/json" }, signal: AbortSignal.timeout(25000), cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url.split("?")[0]}`);
  return r.json() as Promise<T>;
}

// ─── Portail national (SIGMaP) ──────────────────────────────────────────────

type DossierSigmap = {
  dosID: number; dosReference: string; dosDatePublication?: string | null; dosDateLimiteDepot?: string | null; dosHeurelimitedepot?: string | null;
  dosDateOuvertueDesplis?: string | null; dosHeureOuvertureDesPlis?: string | null; dosFichier?: string | null; doslieuacquisitiondao?: string | null;
  dosLieuDepotDossier?: string | null; dosNombreLots?: number | null; dosLotDivisible?: string | null; expired?: boolean;
  appelsoffres?: { apoObjet?: string | null; apoReference?: string | null; typemarche?: { code?: string; libelle?: string } | null } | null;
  autoriteContractante?: { denomination?: string | null; sigle?: string | null; typeautorite?: { libelle?: string } | null } | null;
};
const TYPES_SIGMAP: Record<string, string> = { T: "Travaux", F: "Fournitures", S: "Services courants", PI: "Prestations intellectuelles" };

export async function collecterSigmap(): Promise<AvisCollecte[]> {
  const vus = new Map<string, DossierSigmap>();
  // Avis en cours (toutes les pages) puis les 100 dernières publications
  for (let page = 0; page < 10; page++) {
    const r = await json<{ content: DossierSigmap[]; last: boolean }>(`${SIGMAP_API}?page=${page}&size=100&search=&status=1`);
    r.content.forEach((d) => vus.set(d.dosReference, d));
    if (r.last || !r.content.length) break;
  }
  const recents = await json<{ content: DossierSigmap[] }>(`${SIGMAP_API}?page=0&size=100&search=&status=0`);
  recents.content.filter((d) => !d.expired).forEach((d) => vus.set(d.dosReference, d));

  return [...vus.values()].filter((d) => d.dosReference && d.appelsoffres?.apoObjet).map((d) => ({
    source: "SIGMAP" as const,
    reference: d.dosReference,
    objet: d.appelsoffres!.apoObjet!.trim(),
    autorite: d.autoriteContractante?.denomination?.trim() ?? null,
    typeMarche: TYPES_SIGMAP[d.appelsoffres?.typemarche?.code ?? ""] ?? null,
    procedure: null,
    financement: null,
    lieu: d.dosLieuDepotDossier ?? d.doslieuacquisitiondao ?? null,
    datePublication: dateBenin(d.dosDatePublication),
    dateLimite: dateBenin(d.dosDateLimiteDepot, d.dosHeurelimitedepot),
    lien: `${SIGMAP_UI}/${d.dosID}`,
    details: {
      avisPdf: d.dosFichier ?? null, lieuAcquisitionDao: d.doslieuacquisitiondao ?? null,
      ouverturePlis: d.dosDateOuvertueDesplis ? `${d.dosDateOuvertueDesplis} ${d.dosHeureOuvertureDesPlis ?? ""}`.trim() : null,
      nombreLots: d.dosNombreLots ?? null, typeAutorite: d.autoriteContractante?.typeautorite?.libelle ?? null, sigle: d.autoriteContractante?.sigle ?? null,
    },
  }));
}

// ─── Banque mondiale ─────────────────────────────────────────────────────────

type AvisBM = {
  id: string; notice_type?: string; noticedate?: string; submission_deadline_date?: string; submission_deadline_time?: string;
  project_id?: string; project_name?: string; bid_reference_no?: string; bid_description?: string; procurement_group?: string;
  procurement_method_name?: string; contact_organization?: string; contact_address?: string;
};
const GROUPES_BM: Record<string, string> = { CW: "Travaux", GO: "Fournitures", NC: "Services courants", CS: "Prestations intellectuelles" };
const MOIS: Record<string, string> = { jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12" };
/** « 13-Oct-2026 » → Date */
const dateBM = (t?: string) => {
  const m = t?.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  return m && MOIS[m[2].toLowerCase()] ? dateBenin(`${m[3]}-${MOIS[m[2].toLowerCase()]}-${m[1].padStart(2, "0")}`, "12:00") : null;
};
const CHAMPS_BM = "id,notice_type,noticedate,submission_deadline_date,submission_deadline_time,project_id,project_name,bid_reference_no,bid_description,procurement_group,procurement_method_name,contact_organization,contact_address";

export async function collecterBanqueMondiale(): Promise<AvisCollecte[]> {
  const r = await json<{ procnotices?: AvisBM[] }>(`${BM_API}?format=json&rows=150&project_ctry_name_exact=Benin&srt=noticedate&order=desc&fl=${CHAMPS_BM}`);
  return (r.procnotices ?? [])
    .filter((n) => n.notice_type && !/award/i.test(n.notice_type) && n.bid_description)
    .map((n) => ({
      source: "BANQUE_MONDIALE" as const,
      reference: n.bid_reference_no?.trim() || n.id,
      objet: n.bid_description!.trim(),
      autorite: n.contact_organization ?? null,
      typeMarche: GROUPES_BM[n.procurement_group ?? ""] ?? typeDepuisTexte(n.procurement_method_name),
      procedure: [n.notice_type, n.procurement_method_name?.replace(/\s+/g, " ")].filter(Boolean).join(" — "),
      financement: `Banque mondiale${n.project_name ? ` — ${n.project_name}` : ""}`,
      lieu: n.contact_address ?? null,
      datePublication: dateBM(n.noticedate),
      dateLimite: dateBenin(n.submission_deadline_date, n.submission_deadline_time),
      lien: `https://projects.worldbank.org/en/projects-operations/procurement-detail/${n.id}`,
      details: { idBM: n.id, projet: n.project_id ?? null },
    }));
}

// ─── Enregistrement ──────────────────────────────────────────────────────────

/** Crée ou met à jour les avis ; renvoie le nombre de nouveaux avis. */
export async function enregistrerAvis(avis: AvisCollecte[]) {
  let nouveaux = 0;
  for (const a of avis) {
    if (!a.reference || !a.objet) continue;
    const cle = cleAvis(a.source, a.reference);
    const donnees = {
      source: a.source, reference: a.reference.slice(0, 200), objet: a.objet.slice(0, 2000),
      autorite: a.autorite?.slice(0, 300) ?? null, typeMarche: a.typeMarche ?? null, procedure: a.procedure?.slice(0, 200) ?? null,
      financement: a.financement?.slice(0, 300) ?? null, lieu: a.lieu?.slice(0, 300) ?? null,
      datePublication: a.datePublication ?? null, dateLimite: a.dateLimite ?? null, lien: a.lien ?? null,
      details: (a.details ?? undefined) as Prisma.InputJsonValue | undefined,
    };
    const existant = await prisma.avisMarche.findUnique({ where: { cle }, select: { id: true } });
    if (existant) await prisma.avisMarche.update({ where: { cle }, data: donnees });
    else { await prisma.avisMarche.create({ data: { cle, ...donnees } }); nouveaux++; }
  }
  return nouveaux;
}
