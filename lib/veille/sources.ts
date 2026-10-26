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
  source: SourceAvis;
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

export type SourceAvis = "SIGMAP" | "BANQUE_MONDIALE" | "UNGM" | "PNUD" | "UNFPA" | "ENABEL" | "GIZ" | "SBEE" | "BOAD" | "GOUV_BJ" | "ABE" | "MANUEL";

/** UNGM et le portail du PNUD publient les mêmes avis onusiens : même clé pour les fusionner. */
const GROUPE_CLE: Partial<Record<SourceAvis, string>> = { UNGM: "ONU", PNUD: "ONU" };
export const cleAvis = (source: string, reference: string) => `${GROUPE_CLE[source as SourceAvis] ?? source}:${normaliser(reference).trim().replace(/\s+/g, "")}`;

const dateBenin = (jour?: string | null, heure?: string | null) => {
  if (!jour || !/^\d{4}-\d{2}-\d{2}/.test(jour)) return null;
  const h = heure && /^\d{2}:\d{2}/.test(heure) ? heure.slice(0, 5) : "23:59";
  const d = new Date(`${jour.slice(0, 10)}T${h}:00+01:00`);
  return Number.isNaN(d.getTime()) ? null : d;
};

/** Date et heure locales d'un fuseau (ex. America/New_York) → Date */
export function dateFuseau(an: number, mois: number, jour: number, h: number, mi: number, fuseau: string) {
  const naif = Date.UTC(an, mois - 1, jour, h, mi);
  const decalage = (t: number) => {
    const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: fuseau, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(t)).map((x) => [x.type, x.value]));
    return Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute) - t;
  };
  let t = naif - decalage(naif);
  t = naif - decalage(t);
  return new Date(t);
}
const MOIS_EN: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12, january: 1, february: 2, march: 3, april: 4, june: 6, july: 7, august: 8, september: 9, october: 10, november: 11, december: 12 };
const texteHtml = (h: string) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCharCode(parseInt(n, 16))).replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#039;|&apos;|&rsquo;|&lsquo;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&[a-z]+;/gi, " ").replace(/\s+/g, " ").trim();

async function page(url: string, init?: RequestInit): Promise<string> {
  const r = await fetch(url, { ...init, headers: { "User-Agent": AGENT, Accept: "text/html,*/*", ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(25000), cache: "no-store" });
  if (!r.ok) throw new Error(`HTTP ${r.status} — ${url.split("?")[0]}`);
  return r.text();
}

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

// ─── UNGM (agences des Nations unies : PNUD, UNFPA, UNICEF, PAM, UNOPS…) ─────

const UNGM = "https://www.ungm.org";
const PAYS_UNGM_BENIN = "2314";

export async function collecterUngm(): Promise<AvisCollecte[]> {
  const accueil = await fetch(`${UNGM}/Public/Notice`, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(25000), cache: "no-store" });
  const html = await accueil.text();
  const jeton = html.match(/name="__RequestVerificationToken" type="hidden" value="([^"]+)"/)?.[1];
  const cookies = (accueil.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  if (!jeton) throw new Error("UNGM : jeton introuvable");
  const auj = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" }).replace(/ /g, "-");
  const avis: AvisCollecte[] = [];
  for (let i = 0; i < 10; i++) {
    const corps = {
      PageIndex: i, PageSize: 15, Title: "", Description: "", Reference: "", PublishedFrom: "", PublishedTo: auj, DeadlineFrom: auj, DeadlineTo: "",
      Countries: [PAYS_UNGM_BENIN], Agencies: [], UNSPSCs: [], NoticeTypes: [], SortField: "Deadline", SortAscending: true, isPicker: false,
      IsSustainable: false, IsActive: true, NoticeDisplayType: null, NoticeSearchTotalLabelId: "noticeSearchTotal", TypeOfCompetitions: [],
    };
    const h = await page(`${UNGM}/Public/Notice/Search`, {
      method: "POST", body: JSON.stringify(corps),
      headers: { "Content-Type": "application/json", "X-Requested-With": "XMLHttpRequest", RequestVerificationToken: jeton, Cookie: cookies },
    });
    const lignes = h.replace(/\r/g, "").split(/(?=<div role="row"[^>]*data-noticeid=)/).slice(1);
    if (!lignes.length) break;
    for (const l of lignes) {
      const id = l.match(/data-noticeid="(\d+)"/)?.[1];
      const titre = texteHtml(l.match(/ungm-title--small">([\s\S]*?)<\/span>/)?.[1] ?? "");
      const cellules = [...l.replace(/<script[\s\S]*?<\/script>/g, "").matchAll(/<div role="cell"[^>]*>([\s\S]*?)<\/div>\s*(?=<div role="cell"|$)/g)].map((m) => texteHtml(m[1]));
      const pays = cellules[cellules.length - 1] ?? "";
      if (!id || !titre || !/benin/i.test(pays)) continue;
      const lim = l.match(/deadline"[^>]*>\s*<span>\s*(\d{2})-([A-Za-z]{3})-(\d{4}) (\d{2}):(\d{2})\s*\(GMT ([-\d.]+)\)/);
      const pub = cellules.find((c) => /^\d{2}-[A-Za-z]{3}-\d{4}$/.test(c));
      const refCell = l.match(/data-description="Reference">\s*<span>([\s\S]*?)<\/span>/)?.[1];
      const agence = texteHtml(l.match(/resultAgency">\s*<span>([\s\S]*?)<\/span>/)?.[1] ?? "");
      const type = texteHtml(l.match(/<label[^>]*>([\s\S]*?)<\/label>/)?.[1] ?? "");
      avis.push({
        source: "UNGM", reference: texteHtml(refCell ?? id) || id, objet: titre, autorite: agence || null,
        typeMarche: typeDepuisTexte(`${type} ${titre}`), procedure: type || null, financement: agence ? `Nations unies — ${agence}` : "Nations unies",
        datePublication: pub ? dateBM(pub) : null,
        dateLimite: lim ? new Date(Date.UTC(+lim[3], (MOIS_EN[lim[2].toLowerCase()] ?? 1) - 1, +lim[1], +lim[4], +lim[5]) - Number(lim[6]) * 3_600_000) : null,
        lien: `${UNGM}/Public/Notice/${id}`, details: { idUngm: id },
      });
    }
    if (lignes.length < 15) break;
  }
  return avis;
}

// ─── Portail du PNUD (procurement-notices.undp.org) ──────────────────────────

export async function collecterPnud(): Promise<AvisCollecte[]> {
  const h = (await page("https://procurement-notices.undp.org/")).replace(/\r/g, "");
  return h.split(/(?=<a href="view_negotiation\.cfm\?nego_id=)/).slice(1).flatMap((bloc) => {
    const champ = (nom: string) => texteHtml(bloc.match(new RegExp(`${nom}\\s*</div>\\s*<span>([\\s\\S]*?)</span>`))?.[1] ?? "");
    const bureau = champ("UNDP Office/Country");
    if (!/\/BENIN/i.test(bureau)) return [];
    const id = bloc.match(/nego_id=(\d+)/)?.[1];
    const lim = bloc.match(/Deadline[\s\S]*?<nobr>(\d{2})-([A-Za-z]{3})-(\d{2})<br>(\d{2}):(\d{2}) (AM|PM)/);
    const pub = bloc.match(/Posted[\s\S]*?<nobr>(\d{2})-([A-Za-z]{3})-(\d{2})<\/nobr>/);
    const h24 = lim ? (+lim[4] % 12) + (lim[6] === "PM" ? 12 : 0) : 0;
    return [{
      source: "PNUD" as const, reference: champ("Ref No") || `PNUD-${id}`, objet: champ("Title"), autorite: "PNUD Bénin",
      typeMarche: typeDepuisTexte(`${champ("Process")} ${champ("Title")}`), procedure: champ("Process") || null, financement: "Nations unies — PNUD",
      datePublication: pub ? dateFuseau(2000 + +pub[3], MOIS_EN[pub[2].toLowerCase()] ?? 1, +pub[1], 12, 0, "America/New_York") : null,
      dateLimite: lim ? dateFuseau(2000 + +lim[3], MOIS_EN[lim[2].toLowerCase()] ?? 1, +lim[1], h24, +lim[5], "America/New_York") : null,
      lien: `https://procurement-notices.undp.org/view_negotiation.cfm?nego_id=${id}`, details: { idPnud: id },
    }];
  }).filter((a) => a.objet);
}

// ─── UNFPA Bénin (appels à soumission du bureau pays) ────────────────────────

export async function collecterUnfpa(): Promise<AvisCollecte[]> {
  const h = (await page("https://benin.unfpa.org/fr/call-for-submissions")).replace(/\r/g, "");
  const vus = new Set<string>();
  return [...h.matchAll(/<a[^>]+href="(\/fr\/submission\/[^"]+)"[^>]*>([\s\S]{10,400}?)<\/a>/g)].flatMap((m) => {
    const lien = `https://benin.unfpa.org${m[1]}`;
    const titre = texteHtml(m[2]);
    // Ignorés : liens « Lire l'histoire », stages et recrutements individuels de personnel (niveaux NOA à NOD)
    if (vus.has(lien) || titre.length < 15 || /^lire l/i.test(titre) || /stagiaire|stage |niveau no[a-d]\b/i.test(titre)) return [];
    vus.add(lien);
    const apres = h.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 600);
    const d = texteHtml(apres).match(/(\d{1,2}) (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre) (\d{4})/i);
    const MOIS_FR = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
    return [{
      source: "UNFPA" as const, reference: decodeURIComponent(m[1].split("/").pop() ?? m[1]).slice(0, 120), objet: titre, autorite: "UNFPA Bénin",
      typeMarche: typeDepuisTexte(titre), financement: "Nations unies — UNFPA",
      datePublication: d ? dateBenin(`${d[3]}-${String(MOIS_FR.indexOf(d[2].toLowerCase()) + 1).padStart(2, "0")}-${d[1].padStart(2, "0")}`, "12:00") : null,
      dateLimite: null, lien,
    }];
  });
}

// ─── Enabel (coopération belge) — marchés ouverts au Bénin ───────────────────

export async function collecterEnabel(): Promise<AvisCollecte[]> {
  const url = "https://www.enabel.be/fr/liste-marches-publics/?in_category%5B%5D=all&in_country=1710&is_status=0";
  const h = (await page(url)).replace(/\r/g, "");
  return h.split(/(?=<div class="card--news card--tenders)/).slice(1).flatMap((c) => {
    const titre = texteHtml(c.match(/<p class="h5">([\s\S]*?)<\/p>/)?.[1] ?? "");
    if (!titre) return [];
    const [ref, ...reste] = titre.split(/\s+[–-]\s+/);
    const lim = texteHtml(c.match(/Date de clôture : <\/strong>([\s\S]*?)<\/p>/)?.[1] ?? "").match(/(\d{1,2}) ([A-Za-zéû]+) (\d{4}) (\d{2}):(\d{2})/);
    const docs = [...c.matchAll(/<a href="([^"]+)" download>([^<]+)<\/a>/g)].map((x) => ({ url: x[1], nom: texteHtml(x[2]) }));
    const cahier = docs.find((d) => /csc|cahier|dao/i.test(d.nom)) ?? docs[0];
    return [{
      source: "ENABEL" as const, reference: reste.length ? ref : titre.slice(0, 60), objet: reste.length ? reste.join(" – ") : titre, autorite: "Enabel (coopération belge)",
      typeMarche: typeDepuisTexte(c.match(/type-tenders-([a-z-]+)/)?.[1]?.replace(/-/g, " ") ?? titre), financement: "Coopération belge (Enabel)",
      dateLimite: lim && MOIS_EN[lim[2].toLowerCase()] ? dateFuseau(+lim[3], MOIS_EN[lim[2].toLowerCase()], +lim[1], +lim[4], +lim[5], "Africa/Porto-Novo") : null,
      lien: url, details: { documents: docs.slice(0, 10), avisPdf: cahier?.url ?? null },
    }];
  });
}

// ─── GIZ (coopération allemande) — avis mentionnant le Bénin ─────────────────

export async function collecterGiz(): Promise<AvisCollecte[]> {
  const base = "https://ausschreibungen.giz.de/Satellite/company/welcome.do";
  const premiere = await fetch(base, { headers: { "User-Agent": AGENT }, signal: AbortSignal.timeout(25000), cache: "no-store" });
  const cookies = (premiere.headers.getSetCookie?.() ?? []).map((c) => c.split(";")[0]).join("; ");
  const pages = [await premiere.text()];
  const nbPages = Math.min(15, Math.max(1, ...[...pages[0].matchAll(/selectedTablePagePROJECT_RESULT=(\d+)/g)].map((m) => +m[1])));
  for (let p = 2; p <= nbPages; p++) pages.push(await page(`${base}?method=showTable&fromSearch=1&selectedTablePagePROJECT_RESULT=${p}`, { headers: { Cookie: cookies } }));
  const avis = new Map<string, AvisCollecte>();
  for (const h of pages) {
    for (const tr of h.replace(/\r/g, "").match(/<tr>[\s\S]*?<\/tr>/g) ?? []) {
      const pid = tr.match(/projectForwarding\.do\?pid=(\d+)/)?.[1];
      const tds = [...tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((m) => m[1]);
      if (!pid || tds.length < 4) continue;
      const titre = texteHtml(tds[2]);
      if (!/b[eé]nin/i.test(titre)) continue;
      const lim = tds[1].match(/title='(\d{2})\.(\d{2})\.(\d{4}) um (\d{2}):(\d{2}) Uhr'/);
      const pub = tds[0].match(/title='(\d{2})\.(\d{2})\.(\d{4})/);
      const [ref, ...reste] = titre.split(/-(?=\D)/);
      avis.set(pid, {
        source: "GIZ", reference: /^\d{6,}$/.test(ref) ? ref : `GIZ-${pid}`, objet: /^\d{6,}$/.test(ref) ? reste.join("-").trim() : titre, autorite: "GIZ (coopération allemande)",
        typeMarche: typeDepuisTexte(titre), procedure: texteHtml(tds[3]) || null, financement: "Coopération allemande (GIZ)",
        datePublication: pub ? dateFuseau(+pub[3], +pub[2], +pub[1], 12, 0, "Europe/Berlin") : null,
        dateLimite: lim ? dateFuseau(+lim[3], +lim[2], +lim[1], +lim[4], +lim[5], "Europe/Berlin") : null,
        lien: `https://ausschreibungen.giz.de/Satellite/public/company/projectForwarding.do?pid=${pid}`,
      });
    }
  }
  return [...avis.values()];
}

// ─── SBEE (portail de la PRMP) ───────────────────────────────────────────────

export async function collecterSbee(): Promise<AvisCollecte[]> {
  const h = (await page("https://marches-publics.sbee.bj/")).replace(/\r/g, "");
  return h.split(/(?=<div class="col-md-12 blog-item">)/).slice(1).flatMap((b) => {
    const titre = texteHtml(b.match(/<h3>([\s\S]*?)<\/h3>/)?.[1] ?? "");
    const detail = texteHtml(b.match(/<p class="job-details[^"]*">([\s\S]*?)<\/p>/)?.[1] ?? "");
    if (!titre) return [];
    const ref = detail.match(/^((?:DRP|DAOI?|AAOI?|AMI|DC|DPS|AAON|AON|AOI)[^,]*?\d{4})(?= relati| pour| portant|\s*$)/i)?.[1] ?? detail.split(" relati")[0].slice(0, 120);
    const champs = [...b.matchAll(/<strong>\s*([^<]+?)\s*<\/strong><\/span>\s*<br>\s*([\s\S]*?)<\/div>/g)].map((m) => [texteHtml(m[1]), texteHtml(m[2])] as const);
    const val = (k: string) => champs.find(([c]) => c.toLowerCase().startsWith(k))?.[1] ?? "";
    const lim = val("date limite").match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/);
    const pub = val("date de publication").match(/(\d{2})-(\d{2})-(\d{4}) (\d{2}):(\d{2})/);
    const pdf = b.match(/href="(https:\/\/marches-publics\.sbee\.bj\/uploads\/[^"]+)"/)?.[1] ?? null;
    return [{
      source: "SBEE" as const, reference: ref, objet: titre, autorite: "Société Béninoise d'Énergie Électrique (SBEE)",
      typeMarche: typeDepuisTexte(val("type de marché").replace(/marché de /i, "")), procedure: ref.split(/\s/)[0] ?? null,
      datePublication: pub ? dateBenin(`${pub[3]}-${pub[2]}-${pub[1]}`, `${pub[4]}:${pub[5]}`) : null,
      dateLimite: lim ? dateBenin(`${lim[3]}-${lim[2]}-${lim[1]}`, `${lim[4]}:${lim[5]}`) : null,
      lien: "https://marches-publics.sbee.bj/", details: { avisPdf: pdf ? encodeURI(decodeURI(pdf)) : null, nombreLots: val("nombre de lots") || null },
    }];
  });
}

// ─── BOAD (Banque Ouest Africaine de Développement) ──────────────────────────

type AvisBoad = { id: number; date: string; link: string; title: { rendered: string }; tender_category?: number[]; acf?: { end_at?: string; presentation?: { text?: string } } };

export async function collecterBoad(): Promise<AvisCollecte[]> {
  const liste = await json<AvisBoad[]>("https://admin.boad.org/wp-json/wp/v2/tender?per_page=60&_fields=id,date,link,title,tender_category,acf.end_at,acf.presentation");
  return liste.flatMap((x) => {
    const titre = texteHtml(x.title.rendered);
    const texte = texteHtml(x.acf?.presentation?.text ?? "");
    // Écartés : résultats, attributions, avis généraux, bourses ; gardés : avis citant le Bénin et appels régionaux de la BOAD
    if (/^(r[ée]sultats?|avis d.attribution|avis g[ée]n[ée]ral|agpm|programme de bourses)/i.test(titre)) return [];
    const lim = x.acf?.end_at?.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    const [ref, ...reste] = titre.split(/\s+[–-]\s+/);
    const appelRegionalBoad = /\/BOAD\b/.test(ref) && !/^A+O+N\b/i.test(ref) && !/TOGO|BURKINA|MALI|NIGER|S[ÉE]N[ÉE]GAL|C[ÔO]TE D.IVOIRE|GUIN[ÉE]E/i.test(ref);
    if (!/b[ée]nin/i.test(`${titre} ${texte}`) && !appelRegionalBoad) return [];
    return [{
      source: "BOAD" as const, reference: reste.length ? ref : `BOAD-${x.id}`, objet: reste.length ? reste.join(" – ") : titre, autorite: "BOAD",
      typeMarche: typeDepuisTexte(`${ref} ${titre}`), procedure: ref.split(/[\s/N°]/)[0] || null, financement: "BOAD",
      datePublication: dateBenin(x.date.slice(0, 10), "12:00"),
      dateLimite: lim ? dateBenin(`${lim[3]}-${lim[2]}-${lim[1]}`, "23:59") : null,
      lien: x.link.replace("admin.boad.org", "www.boad.org"),
    }];
  });
}

// ─── gouv.bj — opportunités « Marchés publics » du Gouvernement ──────────────

export async function collecterGouvBj(): Promise<AvisCollecte[]> {
  const h = (await page("https://www.gouv.bj/opportunites/marches-publics/")).replace(/\r/g, "");
  return h.split(/(?=<article class="flex row bg-gray news)/).slice(1).flatMap((a) => {
    const lien = a.match(/<h3[^>]*><a href="([^"]+)"/)?.[1];
    const titre = texteHtml(a.match(/<h3[^>]*><a[^>]*>([\s\S]*?)<\/a>/)?.[1] ?? "");
    if (!lien || !titre) return [];
    const resume = texteHtml(a.match(/<p class="p-alt-2[^"]*">([\s\S]*?)<\/p>/)?.[1] ?? "");
    const genre = texteHtml(a.match(/<span class="upper success medium">([\s\S]*?)<\/span>/)?.[1] ?? "");
    const lim = texteHtml(a.match(/Clôture : <\/span><span[^>]*>([\s\S]*?)<\/span>/)?.[1] ?? "").match(/(\d{1,2}) ([A-Za-zéû]+)\.? (\d{4}) à (\d{2}):(\d{2})/);
    const mois = lim ? MOIS_EN[lim[2].toLowerCase().slice(0, 3)] : undefined;
    const id = lien.match(/opportunite\/(\d+)/)?.[1] ?? lien;
    // Titre générique (« Avis de demande de renseignements et de prix ») : le résumé précise l'objet
    const objet = /^avis de demande de renseignements et de prix/i.test(titre) && resume ? `${titre} — ${resume.slice(0, 300)}` : titre;
    return [{
      source: "GOUV_BJ" as const, reference: `GOUV-${id}`, objet, autorite: "Gouvernement du Bénin (gouv.bj)",
      typeMarche: typeDepuisTexte(`${titre} ${resume}`), procedure: genre || null,
      dateLimite: lim && mois ? dateBenin(`${lim[3]}-${String(mois).padStart(2, "0")}-${lim[1].padStart(2, "0")}`, `${lim[4]}:${lim[5]}`) : null,
      lien, details: { resume: resume.slice(0, 1000) || null },
    }];
  });
}

// ─── ABE (Agence Béninoise pour l'Environnement) ─────────────────────────────

export async function collecterAbe(): Promise<AvisCollecte[]> {
  const h = (await page("https://www.abe.bj/appels-doffres/")).replace(/\r/g, "");
  return h.split(/(?=<li class="dt-doc ao-avis")/).slice(1).flatMap((li) => {
    if (!/data-statut="en-cours"/.test(li)) return [];
    const ref = texteHtml(li.match(/<h2 class="dt-titre">([\s\S]*?)<\/h2>/)?.[1] ?? "").replace(/^avis n°\s*:?\s*/i, "");
    const objet = texteHtml(li.match(/<p class="ao-objet">([\s\S]*?)<\/p>/)?.[1] ?? "") || ref;
    const ech = Number(li.match(/data-echeance="(\d+)"/)?.[1]);
    const pub = Number(li.match(/data-publication="(\d+)"/)?.[1]);
    const pdf = li.match(/data-pdf-url="([^"]+)"/)?.[1]?.replace(/&#038;/g, "&") ?? null;
    if (!ref) return [];
    return [{
      source: "ABE" as const, reference: ref, objet, autorite: "Agence Béninoise pour l'Environnement (ABE)",
      typeMarche: typeDepuisTexte(objet), procedure: ref.split(/[\s/]/)[0] || null,
      // Les horodatages du site correspondent à l'heure du Bénin enregistrée comme UTC : on retire 1 h
      datePublication: pub ? new Date(pub * 1000 - 3_600_000) : null, dateLimite: ech ? new Date(ech * 1000 - 3_600_000) : null,
      lien: "https://www.abe.bj/appels-doffres/", details: { avisPdf: pdf },
    }];
  });
}

/** Toutes les sources automatiques, lues en parallèle. */
// Ordre d'enregistrement : pour un même avis onusien, UNGM (heure saisie par l'agence) passe après le PNUD.
export const SOURCES_AUTOMATIQUES: Record<string, () => Promise<AvisCollecte[]>> = {
  sigmap: collecterSigmap, banqueMondiale: collecterBanqueMondiale, pnud: collecterPnud, ungm: collecterUngm,
  unfpa: collecterUnfpa, enabel: collecterEnabel, giz: collecterGiz, sbee: collecterSbee, boad: collecterBoad,
  gouvBj: collecterGouvBj, abe: collecterAbe,
};

// ─── Enregistrement ──────────────────────────────────────────────────────────

/**
 * Crée ou met à jour les avis ; renvoie le nombre de nouveaux avis.
 * En lot : une lecture des clés existantes, une insertion groupée, des mises à jour seulement
 * pour les avis modifiés (report de date, objet corrigé, lien) — la tâche tient dans le temps imparti.
 */
export async function enregistrerAvis(avis: AvisCollecte[]) {
  const parCle = new Map<string, Prisma.AvisMarcheCreateManyInput>();
  for (const a of avis) {
    if (!a.reference || !a.objet) continue;
    const cle = cleAvis(a.source, a.reference);
    parCle.set(cle, {
      cle, source: a.source, reference: a.reference.slice(0, 200), objet: a.objet.slice(0, 2000),
      autorite: a.autorite?.slice(0, 300) ?? null, typeMarche: a.typeMarche ?? null, procedure: a.procedure?.slice(0, 200) ?? null,
      financement: a.financement?.slice(0, 300) ?? null, lieu: a.lieu?.slice(0, 300) ?? null,
      datePublication: a.datePublication ?? null, dateLimite: a.dateLimite ?? null, lien: a.lien ?? null,
      details: (a.details ?? undefined) as Prisma.InputJsonValue | undefined,
    });
  }
  if (!parCle.size) return 0;
  const existants = new Map(
    (await prisma.avisMarche.findMany({ where: { cle: { in: [...parCle.keys()] } }, select: { cle: true, objet: true, dateLimite: true, lien: true, source: true } }))
      .map((e) => [e.cle, e]),
  );
  const nouveaux = [...parCle.values()].filter((d) => !existants.has(d.cle));
  if (nouveaux.length) await prisma.avisMarche.createMany({ data: nouveaux, skipDuplicates: true });
  const modifies = [...parCle.values()].filter((d) => {
    const e = existants.get(d.cle);
    return e && (e.objet !== d.objet || (e.dateLimite?.getTime() ?? null) !== ((d.dateLimite as Date | null)?.getTime() ?? null) || e.lien !== d.lien);
  });
  for (let i = 0; i < modifies.length; i += 10) {
    await Promise.all(modifies.slice(i, i + 10).map(({ cle, ...data }) => prisma.avisMarche.update({ where: { cle }, data })));
  }
  return nouveaux.length;
}
