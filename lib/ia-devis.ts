/**
 * lib/ia-devis.ts — Lecture automatique d'une demande et devis automatique.
 *
 * Le client dépose son dossier et dit ce qu'il attend (texte ou message vocal). L'IA (Claude) lit
 * les fichiers, reconnaît le service du catalogue, liste les livrables et les étapes, relève la fiche
 * de l'appel d'offres s'il y en a un et mesure le volume. Le prix est calculé par la grille (lib/tarifs),
 * jamais inventé par l'IA. Le devis part au client et à l'équipe ; sans clé IA ou en cas d'échec,
 * la demande reste « en attente » pour un devis préparé à la main.
 */
import { infosDossier, proposerDevis } from "@/lib/dossier";
import { lireTarifs } from "@/lib/reglages";
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { lireFichier } from "@/lib/fichiers";
import { genreFichier, textePdf, texteWord } from "@/lib/apercu";
import { SECTORS, trouverOffre, prixOffre } from "@/lib/catalogue";
import { catalogueTexte } from "@/lib/tarifs";
import { getPhaseTemplates } from "@/lib/service-templates";
import { SECTEUR_MONTAGE, joursRestants, type Piece } from "@/lib/montage";
import { preparerMontage } from "@/lib/montage-serveur";
import { reprendreDuCoffre } from "@/lib/entreprises";
import { sendSuiviAdmin } from "@/lib/email";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { nomService } from "@/lib/prestations-noms";

export const iaAnalyseDisponible = () => Boolean(process.env.ANTHROPIC_API_KEY);
const MODELE = () => process.env.IA_MODELE_ANALYSE ?? "claude-sonnet-5-5";

export type Analyse = {
  domaineId: string | null;
  offreTitre: string | null;
  intitule: string;
  resume: string;
  livrables: { titre: string; description?: string }[];
  etapes: { titre: string; description?: string; duree?: string }[];
  volume: { lots?: number; piecesARediger?: number; complexite?: "simple" | "moyen" | "complexe" };
  appelOffres?: {
    referenceAvis?: string; intitule?: string; autorite?: string; typeMarche?: string;
    dateLimite?: string; lots?: string; modeDepot?: string; financement?: string;
  } | null;
  pointsAttention?: string[];
};

type Bloc =
  | { type: "text"; text: string }
  | { type: "document"; source: { type: "base64"; media_type: "application/pdf"; data: string }; title?: string }
  | { type: "image"; source: { type: "base64"; media_type: string; data: string } };

const CONSIGNES = `Tu es l'assistant de SHIFT UP, cabinet de conseil à Abomey-Calavi (Bénin) : montage de dossiers d'appels d'offres, conseil, juridique et fiscal, finance, numérique, formation, marketing.
Un client vient de déposer un dossier et une consigne. Lis tout, puis réponds UNIQUEMENT par un objet JSON, sans texte autour, de la forme :
{
  "domaineId": "<identifiant de domaine du catalogue ou null>",
  "offreTitre": "<intitulé exact d'une offre de ce domaine ou null>",
  "intitule": "<intitulé court de la prestation demandée>",
  "resume": "<2 à 4 phrases : ce que le client demande et ce que SHIFT UP va faire>",
  "livrables": [{"titre": "...", "description": "..."}],
  "etapes": [{"titre": "...", "description": "...", "duree": "ex. 1 jour"}],
  "volume": {"lots": <nombre de lots visés, 1 par défaut>, "piecesARediger": <nombre de pièces à rédiger par SHIFT UP>, "complexite": "simple|moyen|complexe"},
  "appelOffres": null ou {"referenceAvis": "...", "intitule": "...", "autorite": "...", "typeMarche": "Travaux|Fournitures|Services courants|Prestations intellectuelles", "dateLimite": "AAAA-MM-JJTHH:MM (heure du Bénin)", "lots": "...", "modeDepot": "EN_LIGNE|PHYSIQUE|LES_DEUX|INCONNU", "financement": "..."},
  "pointsAttention": ["pièces ou conditions qui pourraient poser problème (garantie, chiffre d'affaires minimal, agrément, expérience exigée…)"]
}
Règles :
- Catalogue des domaines et offres (choisis l'offre la plus proche ; ne fixe aucun prix, la grille s'en charge) :
{CATALOGUE}
- Pour un appel d'offres, en cas de contradiction entre les pièces, retiens les Données particulières (DPAO).
- Livrables : ce que le client recevra concrètement (offre technique, offre financière, formulaires remplis, pièces administratives classées, rapport…). 3 à 8 livrables.
- Étapes : 3 à 6 étapes de réalisation dans l'ordre.
- N'invente rien qui n'est pas dans le dossier : mets null si l'information manque.
- Écris en français simple, sans jargon.`;

async function blocsDepuisFichiers(urls: string[]): Promise<{ blocs: Bloc[]; noms: string[] }> {
  const blocs: Bloc[] = [];
  const noms: string[] = [];
  let images = 0, pdfBruts = 0, volumeTexte = 0;
  for (const url of urls.slice(0, 12)) {
    const f = await lireFichier(url).catch(() => null);
    if (!f) continue;
    const g = genreFichier(url, f.type);
    noms.push(f.nom);
    try {
      if (g === "pdf") {
        const { texte, pages } = await textePdf(f.octets);
        if (texte.replace(/--- page \d+ ---/g, "").trim().length > 400 * Math.min(pages, 3) && volumeTexte < 300_000) {
          volumeTexte += texte.length;
          blocs.push({ type: "text", text: `Fichier « ${f.nom} » (${pages} pages, texte extrait) :\n${texte}` });
        } else if (f.octets.length < 25_000_000 && pages <= 90 && pdfBruts < 2) {
          // PDF scanné : envoyé tel quel, Claude lit les pages
          pdfBruts++;
          blocs.push({ type: "document", source: { type: "base64", media_type: "application/pdf", data: f.octets.toString("base64") }, title: f.nom });
        } else {
          blocs.push({ type: "text", text: `Fichier « ${f.nom} » : PDF scanné trop volumineux pour être lu automatiquement (${pages} pages).` });
        }
      } else if (g === "word") {
        const t = await texteWord(f.octets);
        volumeTexte += t.length;
        blocs.push({ type: "text", text: `Fichier « ${f.nom} » (Word) :\n${t}` });
      } else if (g === "image" && images < 6 && f.octets.length < 4_500_000) {
        images++;
        blocs.push({ type: "image", source: { type: "base64", media_type: f.type.startsWith("image/") ? f.type : "image/jpeg", data: f.octets.toString("base64") } });
      }
    } catch (e) {
      console.error("[ia-devis] lecture", f.nom, e);
    }
  }
  return { blocs, noms };
}

/** Transcription d'un message vocal (Whisper via Groq, si la clé existe). */
async function transcrire(url: string): Promise<string | null> {
  if (!process.env.GROQ_API_KEY) return null;
  const f = await lireFichier(url).catch(() => null);
  if (!f) return null;
  const form = new FormData();
  form.append("file", new Blob([new Uint8Array(f.octets)], { type: f.type || "audio/webm" }), f.nom || "vocal.webm");
  form.append("model", "whisper-large-v3");
  form.append("language", "fr");
  const r = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
    method: "POST", headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` }, body: form, signal: AbortSignal.timeout(60_000),
  }).catch(() => null);
  if (!r?.ok) return null;
  const d = (await r.json().catch(() => ({}))) as { text?: string };
  return d.text?.trim() || null;
}

async function appelerClaude(blocs: Bloc[]): Promise<Analyse> {
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "x-api-key": process.env.ANTHROPIC_API_KEY!, "anthropic-version": "2023-06-01", "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODELE(), max_tokens: 4000,
      system: CONSIGNES.replace("{CATALOGUE}", catalogueTexte()),
      messages: [{ role: "user", content: blocs }],
    }),
    signal: AbortSignal.timeout(240_000),
  });
  const d = (await r.json().catch(() => ({}))) as { content?: { type: string; text?: string }[]; error?: { message?: string } };
  if (!r.ok) throw new Error(`IA ${r.status} : ${d.error?.message ?? "réponse invalide"}`);
  const brut = d.content?.filter((c) => c.type === "text").map((c) => c.text).join("") ?? "";
  const debut = brut.indexOf("{"), fin = brut.lastIndexOf("}");
  if (debut < 0 || fin <= debut) throw new Error("Réponse de l'IA illisible.");
  return JSON.parse(brut.slice(debut, fin + 1)) as Analyse;
}

/** Fiche d'appel d'offres complétée à partir de l'analyse (format attendu par lib/montage). */
function ficheDepuisAnalyse(a: Analyse, soumissionnaire: string) {
  const ao = a.appelOffres;
  if (!ao?.dateLimite || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(ao.dateLimite)) return null;
  return {
    referenceAvis: ao.referenceAvis || "Référence à confirmer",
    intitule: ao.intitule || a.intitule,
    autorite: ao.autorite || "Autorité à confirmer",
    typeMarche: ["Travaux", "Fournitures", "Services courants", "Prestations intellectuelles"].includes(ao.typeMarche ?? "") ? ao.typeMarche : "Travaux",
    procedure: "", financement: ao.financement ?? "", lots: ao.lots ?? "",
    dateLimite: ao.dateLimite,
    modeDepot: ["EN_LIGNE", "PHYSIQUE", "LES_DEUX", "INCONNU"].includes(ao.modeDepot ?? "") ? ao.modeDepot : "INCONNU",
    lieuDepot: "", soumissionnaire, groupement: false, membresGroupement: "",
    prestations: ["Montage complet du dossier"],
  };
}

/**
 * Analyse une demande et envoie le devis automatique. Sans effet si la demande n'est plus « en attente »
 * ou si un devis existe déjà. Ne lève jamais d'erreur : un échec laisse la main à l'équipe.
 */
export async function analyserEtChiffrer(prestationId: string): Promise<{ ok: boolean; raison?: string }> {
  const p = await prisma.prestation.findUnique({
    where: { id: prestationId },
    include: { client: { select: { id: true, name: true, email: true } }, service: { select: { title: true } } },
  });
  if (!p || p.status !== "EN_ATTENTE" || p.quote) return { ok: false, raison: "déjà traitée" };
  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  // Garde la proposition de départ (grille + plancher) tant que la lecture n'en a pas fait une meilleure
  const avant = (cf.analyseIA ?? {}) as Record<string, unknown>;
  const noter = (analyseIA: Record<string, unknown>) =>
    prisma.prestation.update({ where: { id: p.id }, data: { customFields: { ...cf, analyseIA: { proposition: avant.proposition, ...analyseIA } } as Prisma.InputJsonValue } });

  if (!iaAnalyseDisponible()) {
    await noter({ statut: "manuel", raison: "IA non configurée", le: new Date().toISOString() });
    return { ok: false, raison: "IA non configurée" };
  }

  try {
    await noter({ statut: "en_cours", le: new Date().toISOString() });
    const vocal = typeof cf.consigneVocale === "string" ? await transcrire(cf.consigneVocale) : null;
    const { blocs, noms } = await blocsDepuisFichiers(p.attachments);
    const consigne = [p.brief?.trim(), vocal ? `Message vocal du client (transcrit) : ${vocal}` : null].filter(Boolean).join("\n\n") || "Le client n'a rien écrit : déduis la demande du dossier.";
    const a = await appelerClaude([
      { type: "text", text: `Consigne du client :\n${consigne}\n\nEntreprise indiquée : ${p.company ?? "non précisée"}\nFichiers déposés : ${noms.join(", ") || "aucun"}\nDate du jour : ${new Date().toLocaleDateString("fr-FR", { timeZone: "Africa/Porto-Novo" })}` },
      ...blocs,
    ]);

    const domaine = SECTORS.find((d) => d.id === a.domaineId) ?? null;
    const offre = trouverOffre(domaine ?? undefined, a.offreTitre) ?? null;
    const secteur = domaine?.label ?? p.sector;
    const montage = secteur === SECTEUR_MONTAGE || !!infosDossier(cf).nature;

    // Appel d'offres : fiche et liste des pièces, avec reprise du coffre de l'entreprise
    let montageCf: Record<string, unknown> = {};
    let jours: number | null = null;
    if (montage && !cf.dossier) {
      const fiche = ficheDepuisAnalyse(a, p.company ?? (cf.entrepriseNom as string | undefined) ?? "Entreprise à confirmer");
      if (fiche) {
        const m = preparerMontage(fiche, p.clientId, null, null);
        if (m.ok) {
          let pieces = m.pieces as Piece[];
          if (typeof cf.entrepriseId === "string") {
            const ent = await prisma.entreprise.findFirst({ where: { id: cf.entrepriseId, userId: p.clientId }, include: { pieces: true } }).catch(() => null);
            if (ent) pieces = reprendreDuCoffre(pieces, ent.pieces, new Date(`${fiche.dateLimite}:00+01:00`)).pieces;
          }
          montageCf = { dossier: m.dossier, pieces };
          jours = joursRestants(fiche.dateLimite);
        }
      }
    } else if (montage && cf.dossier) {
      jours = joursRestants((cf.dossier as { dateLimite: string }).dateLimite);
    }

    // Proposition pour le monteur : grille selon le volume lu, plancher de la nature, Express, livraison physique
    const infos = infosDossier(cf);
    const devis = proposerDevis(await lireTarifs(), infos, a.intitule || offre?.title || nomService(p), offre, { ...a.volume, joursRestants: jours });
    const etapes = (a.etapes?.length ? a.etapes : getPhaseTemplates(secteur).map((t) => ({ titre: t.title, description: t.description, duree: "" }))).slice(0, 8);
    const proposition = {
      ...devis, auto: true, resume: a.resume, livrables: (a.livrables ?? []).slice(0, 10),
      pointsAttention: (a.pointsAttention ?? []).slice(0, 8),
      etapes: etapes.map((e) => ({ titre: e.titre, description: e.description ?? "", duree: e.duree ?? "" })),
    };

    await prisma.prestation.update({
      where: { id: p.id },
      data: {
        sector: infos.nature ? SECTEUR_MONTAGE : secteur,
        customService: p.serviceId || infos.nature ? p.customService : (offre?.title ?? a.intitule ?? p.customService),
        customFields: {
          ...cf, ...montageCf,
          ...(offre ? { offre: { titre: offre.title, prix: prixOffre(offre), delai: offre.duration ?? null } } : {}),
          ...(vocal ? { transcriptionVocale: vocal } : {}),
          analyseIA: { statut: "ok", le: new Date().toISOString(), modele: MODELE(), proposition },
        } as Prisma.InputJsonValue,
      },
    });

    const service = offre?.title ?? a.intitule ?? nomService(p);
    await Promise.allSettled([
      sendSuiviAdmin({
        clientName: p.client.name ?? "Client", clientEmail: p.client.email ?? "", serviceName: service, prestationId: p.id,
        titre: "Dossier lu : devis à valider",
        lignes: [["Proposition", `${devis.total.toLocaleString("fr-FR")} F (acompte ${devis.deposit.toLocaleString("fr-FR")} F)`], ["Résumé", a.resume],
          ["Livrables", (a.livrables ?? []).map((l) => `• ${l.titre}`).join("\n")], ["Points d'attention", (a.pointsAttention ?? []).join("\n")]],
      }),
      alerterEquipeWhatsApp("Devis à valider", `${p.client.name ?? p.client.email ?? "Client"} — ${service} — proposition ${devis.total.toLocaleString("fr-FR")} F`),
    ]);
    return { ok: true };
  } catch (e) {
    console.error("[ia-devis]", e);
    await noter({ statut: "echec", raison: (e as Error).message?.slice(0, 300), le: new Date().toISOString() }).catch(() => {});
    await alerterEquipeWhatsApp("Devis à préparer", `Analyse automatique impossible — ${p.client.name ?? p.client.email ?? "Client"} — à chiffrer à la main`).catch(() => {});
    return { ok: false, raison: (e as Error).message };
  }
}
