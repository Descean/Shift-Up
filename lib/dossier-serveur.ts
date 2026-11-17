/**
 * Chargement d'un dossier pour les espaces client et équipe (même forme, droits différents) et
 * contrôles d'accès communs aux routes /api/equipe/*.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { estDirection, estEquipe } from "@/lib/roles";
import { etatDossier, infosDossier, reference, revisionOuverte, titreDossier } from "@/lib/dossier";
import { livrableAccessible, soldeRegle } from "@/lib/prestations";
import { lireTarifs, plancherDe } from "@/lib/reglages";
import { contexteEquipe, peutTraiter } from "@/lib/monteurs";
import { SECTEUR_MONTAGE, lireMontage } from "@/lib/montage";

export async function exigerEquipe(direction = false) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { erreur: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  const role = session.user.role as string;
  if (!(direction ? estDirection(role) : estEquipe(role))) return { erreur: NextResponse.json({ error: "Accès réservé." }, { status: 403 }) };
  const ctx = await contexteEquipe(session.user.id, role);
  if (!ctx.actif) return { erreur: NextResponse.json({ error: "Votre compte monteur est en attente de validation.", enAttente: true }, { status: 403 }) };
  return { session, ctx };
}

/** Membre de l'équipe autorisé à traiter ce dossier (monteur indépendant : seulement les siens). */
export async function exigerDossierEquipe(id: string) {
  const a = await exigerEquipe();
  if ("erreur" in a) return a;
  const p = await prisma.prestation.findUnique({ where: { id }, select: { assignedToId: true } });
  if (!p || !(await peutTraiter(a.ctx, p.assignedToId))) return { erreur: NextResponse.json({ error: "Dossier introuvable." }, { status: 404 }) };
  return a;
}

const inclure = {
  client: { select: { id: true, name: true, email: true } },
  assignedTo: { select: { id: true, name: true } },
  service: { select: { title: true } },
  prestationPhases: { orderBy: { order: "asc" as const }, include: { livrables: { orderBy: { createdAt: "asc" as const } } } },
  livrables: { where: { phaseId: null }, orderBy: { createdAt: "asc" as const } },
  payments: { where: { status: "COMPLETED" as const }, orderBy: { createdAt: "asc" as const }, select: { id: true, amount: true, createdAt: true, reference: true } },
};

type Brut = NonNullable<Awaited<ReturnType<typeof brut>>>;
const brut = (id: string) => prisma.prestation.findUnique({ where: { id }, include: inclure });

/** Dossier tel que l'affiche la fiche (client : liens des fichiers retirés tant que le solde n'est pas réglé). */
export async function chargerDossier(id: string, vue: "client" | "equipe") {
  const p = await brut(id);
  if (!p) return null;
  return { p, dossier: await formater(p, vue) };
}

async function formater(p: Brut, vue: "client" | "equipe") {
  const infos = infosDossier(p.customFields);
  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  const ia = (cf.analyseIA ?? null) as Record<string, unknown> | null;
  const quote = (p.quote ?? null) as { items?: { label: string; amount: number }[]; total?: number; deposit?: number; resume?: string; livrables?: { titre: string; description?: string }[]; pointsAttention?: string[] } | null;
  const solde = soldeRegle(p);
  const livrable = (l: Brut["livrables"][number]) => ({
    id: l.id, titre: l.title, type: l.type, observation: l.observation, vu: !!l.viewedAt,
    url: vue === "equipe" || livrableAccessible(l, p) ? l.url : null,
  });
  const tarifs = vue === "equipe" ? await lireTarifs() : null;
  return {
    id: p.id,
    reference: reference(p.id),
    titre: titreDossier(p),
    etat: etatDossier(p.status, p.customFields),
    statut: p.status,
    infos,
    revisionOuverte: revisionOuverte(infos),
    consigne: p.brief,
    entreprise: p.company,
    client: vue === "equipe" ? { nom: p.client.name, email: p.client.email } : null,
    charge: p.assignedTo ? { id: p.assignedTo.id, nom: p.assignedTo.name } : null,
    montant: p.amount, paye: p.amountPaid, solde,
    acompte: quote?.deposit ?? Math.round(p.amount * 0.6),
    resteAPayer: Math.max(0, Math.round(p.amount - p.amountPaid)),
    devis: quote ? { lignes: quote.items ?? [], total: quote.total ?? p.amount, acompte: quote.deposit ?? 0, resume: quote.resume ?? null, livrables: quote.livrables ?? [], pointsAttention: quote.pointsAttention ?? [] } : null,
    etapes: p.prestationPhases.map((ph) => ({ id: ph.id, titre: ph.title, description: ph.description, statut: ph.status, livrables: ph.livrables.map(livrable) })),
    autresLivrables: p.livrables.map(livrable),
    paiements: p.payments.map((x) => ({ id: x.id, montant: x.amount, date: x.createdAt.toISOString(), reference: x.reference })),
    fichiersDepart: vue === "equipe" ? p.attachments : [],
    creeLe: p.createdAt.toISOString(),
    // Montage : fiche de l'appel d'offres, pièces à fournir, dépôt de l'offre et résultat
    montage: p.sector === SECTEUR_MONTAGE || Boolean(infos.nature),
    correction: p.status === "REVISION" ? derniereCorrection(cf) : null,
    marche: lireMontage(p.customFields),
    ...(vue === "equipe" ? {
      analyse: ia ? { statut: ia.statut ?? null, raison: ia.raison ?? null, proposition: ia.proposition ?? null } : null,
      transcription: typeof cf.transcriptionVocale === "string" ? cf.transcriptionVocale : null,
      prevenuLe: typeof cf.devisPrevenuLe === "string" ? cf.devisPrevenuLe : null,
      plancher: tarifs ? plancherDe(tarifs, infos.nature) : null,
      tarifs,
    } : {}),
  };
}

/** Dernière demande de correction du client avant le solde (historique des décisions). */
function derniereCorrection(cf: Record<string, unknown>) {
  const h = Array.isArray(cf.historique) ? (cf.historique as { date?: string; action?: string; commentaire?: string | null }[]) : [];
  const c = [...h].reverse().find((x) => x.action === "demander_revision");
  return c ? { demandeeLe: c.date ?? null, texte: c.commentaire ?? "" } : null;
}

export type DossierVue = Awaited<ReturnType<typeof formater>>;

/** Carte de la liste « Mes dossiers » / du Kanban. */
export function carteDossier(p: { id: string; status: string; customFields: unknown; customService: string | null; service: { title: string } | null; amount: number; createdAt: Date; client?: { email: string | null; name: string | null } | null; assignedTo?: { name: string | null } | null }) {
  const infos = infosDossier(p.customFields);
  return {
    id: p.id, reference: reference(p.id), titre: titreDossier(p), etat: etatDossier(p.status, p.customFields),
    dateLimite: infos.dateLimite, urgence: infos.urgence, livraison: infos.livraison, montant: p.amount, montage: !!infos.nature,
    revision: !!infos.revision && !infos.revision.faiteLe,
    client: p.client?.email ?? p.client?.name ?? null, charge: p.assignedTo?.name ?? null, creeLe: p.createdAt.toISOString(),
  };
}
