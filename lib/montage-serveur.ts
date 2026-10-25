/**
 * lib/montage-serveur.ts — Contrôles côté serveur des demandes de montage de dossiers.
 */
import prisma from "@/lib/prisma";
import { BUCKET_DOCS, lienInterne } from "@/lib/fichiers";
import { SECTEUR_MONTAGE, lireMontage, dossierSchema, dateLimiteVersDate, echeance, piecesInitiales, resumeDossier, type Dossier, type Piece } from "@/lib/montage";

/** Le lien pointe-t-il vers un fichier déposé par cet utilisateur (stockage privé) ? */
export function fichierDe(url: string, userId: string) {
  return url.split("?")[0].startsWith(lienInterne(BUCKET_DOCS, `${userId}/`));
}

type ResultatMontage =
  | { ok: true; dossier: Dossier; pieces: Piece[]; brief: string; urgence: string | null }
  | { ok: false; erreur: string };

/**
 * Vérifie la fiche « appel d'offres » d'une demande de montage et prépare la liste des pièces.
 * Le DAO éventuel doit avoir été déposé par le client lui-même.
 */
export function preparerMontage(brut: unknown, userId: string, dao?: { url: string; nom: string } | null, brief?: string | null): ResultatMontage {
  const r = dossierSchema.safeParse(brut);
  if (!r.success) return { ok: false, erreur: r.error.issues[0]?.message ?? "Fiche de l'appel d'offres incomplète." };
  const d = r.data;
  const limite = dateLimiteVersDate(d.dateLimite);
  if (Number.isNaN(limite.getTime())) return { ok: false, erreur: "Date limite invalide." };
  if (limite.getTime() < Date.now()) return { ok: false, erreur: "La date limite de dépôt est déjà passée." };
  if (dao && !fichierDe(dao.url, userId)) return { ok: false, erreur: "Fichier du DAO invalide : déposez-le à nouveau." };
  const e = echeance(d.dateLimite);
  return {
    ok: true,
    dossier: d,
    pieces: piecesInitiales(d, dao ? { url: dao.url, nom: dao.nom.slice(0, 200), date: new Date().toISOString() } : null),
    brief: brief?.trim() ? `${brief.trim()}\n\n${resumeDossier(d)}`.slice(0, 3000) : resumeDossier(d),
    urgence: e.niveau === "urgent" ? `${e.libelle}` : null,
  };
}

// ─── Même avis suivi pour plusieurs soumissionnaires ─────────────────────────

/** Référence d'avis comparable : sans accents, espaces, ponctuation ni « N° ». */
export function normaliserAvis(ref: string) {
  return ref.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/n\s*[°º]/g, "").replace(/[^a-z0-9]/g, "");
}

export type Conflit = { id: string; client: string; soumissionnaire: string; lots: string | null; statut: string };

type MontageActif = Awaited<ReturnType<typeof montagesActifs>>[number];

export function montagesActifs() {
  return prisma.prestation.findMany({
    where: { sector: SECTEUR_MONTAGE, status: { not: "ANNULEE" } },
    select: { id: true, clientId: true, status: true, customFields: true, client: { select: { name: true, email: true } } },
  });
}

/** Autres demandes (y compris du même client, pour une autre entreprise) sur le même avis. */
export function conflitsDans(liste: MontageActif[], id: string, reference: string): Conflit[] {
  const cle = normaliserAvis(reference);
  if (cle.length < 4) return [];
  return liste.flatMap((x) => {
    if (x.id === id) return [];
    const d = lireMontage(x.customFields).dossier;
    if (!d || normaliserAvis(d.referenceAvis) !== cle) return [];
    return [{ id: x.id, client: x.client.name ?? x.client.email ?? "Client", soumissionnaire: d.soumissionnaire, lots: d.lots ?? null, statut: x.status }];
  });
}

export async function conflitsAvis(id: string, reference: string) {
  return conflitsDans(await montagesActifs(), id, reference);
}

export const libelleConflit = (c: Conflit) => `${c.soumissionnaire} (client : ${c.client}${c.lots ? ` — ${c.lots}` : ""})`;

/** Statistiques des montages (hors demandes annulées). */
export function statsMontage(liste: MontageActif[]) {
  const st = { dossiers: 0, deposes: 0, attribues: 0, nonRetenus: 0, autres: 0, enAttente: 0, montantAttribue: 0, tauxReussite: null as number | null };
  for (const x of liste) {
    const m = lireMontage(x.customFields);
    if (!m.dossier) continue;
    st.dossiers++;
    if (m.depot) st.deposes++;
    const r = m.resultat?.statut;
    if (r === "ATTRIBUE") { st.attribues++; st.montantAttribue += m.resultat?.montantAttribue ?? m.resultat?.montantOffre ?? 0; }
    else if (r === "NON_RETENU") st.nonRetenus++;
    else if (r === "INFRUCTUEUX" || r === "ANNULE") st.autres++;
    else if (m.depot) st.enAttente++;
  }
  const decides = st.attribues + st.nonRetenus;
  st.tauxReussite = decides ? Math.round((st.attribues / decides) * 100) : null;
  return st;
}
