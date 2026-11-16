/**
 * lib/monteurs.ts — Monteurs internes et indépendants : qui voit et traite quels dossiers.
 *
 *  - Direction (ADMIN / DEVELOPER) : tous les dossiers.
 *  - Monteur interne (compte MONTEUR sans profil, ou profil INTERNE) : tous les dossiers, sauf ceux
 *    confiés à un monteur indépendant.
 *  - Monteur indépendant (profil INDEPENDANT, ACTIF) : uniquement les dossiers qui lui sont confiés
 *    (ses propres clients, ou ceux que la Direction lui attribue).
 *  - Profil EN_ATTENTE ou SUSPENDU : aucun accès.
 */
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { estDirection } from "@/lib/roles";
import { competencesDe, TOUTES_COMPETENCES, type Competences } from "@/lib/competences";

export type ContexteEquipe = { userId: string; direction: boolean; independant: boolean; actif: boolean; statut: string };

export async function profilMonteur(userId: string) {
  try { return await prisma.monteurProfil.findUnique({ where: { userId } }); } catch { return null; }
}

export async function contexteEquipe(userId: string, role: string): Promise<ContexteEquipe> {
  if (estDirection(role)) return { userId, direction: true, independant: false, actif: true, statut: "ACTIF" };
  const p = await profilMonteur(userId);
  const statut = p?.statut ?? "ACTIF";
  return { userId, direction: false, independant: p?.type === "INDEPENDANT", actif: statut === "ACTIF", statut };
}

/** Identifiants des monteurs indépendants (leurs dossiers échappent aux monteurs internes). */
export async function idsIndependants(): Promise<string[]> {
  try {
    return (await prisma.monteurProfil.findMany({ where: { type: "INDEPENDANT" }, select: { userId: true } })).map((x) => x.userId);
  } catch { return []; }
}

/** Filtre Prisma des dossiers visibles par ce membre de l'équipe. */
export async function filtreDossiers(c: ContexteEquipe): Promise<Prisma.PrestationWhereInput> {
  if (c.direction) return {};
  if (!c.actif) return { id: "__aucun__" };
  if (c.independant) return { assignedToId: c.userId };
  const ind = await idsIndependants();
  return ind.length ? { OR: [{ assignedToId: null }, { assignedToId: { notIn: ind } }] } : {};
}

/** Ce membre de l'équipe peut-il traiter le dossier confié à `assignedToId` ? */
export async function peutTraiter(c: ContexteEquipe, assignedToId: string | null) {
  if (c.direction) return true;
  if (!c.actif) return false;
  if (c.independant) return assignedToId === c.userId;
  if (!assignedToId || assignedToId === c.userId) return true;
  return !(await idsIndependants()).includes(assignedToId);
}

/** Monteur indépendant actif correspondant à un code d'invitation (code de parrainage du compte). */
export async function monteurParCode(code?: string | null) {
  if (!code || !/^[A-Za-z0-9_-]{3,40}$/.test(code)) return null;
  const u = await prisma.user.findFirst({ where: { affiliationCode: code, role: "MONTEUR" }, select: { id: true, name: true } }).catch(() => null);
  if (!u) return null;
  const p = await profilMonteur(u.id);
  return p && p.statut === "ACTIF" ? u : null;
}

/** Enregistre la part du monteur indépendant sur un paiement confirmé (une seule fois par paiement). */
export async function crediterMonteur(paymentId: string, prestationId: string, assignedToId: string | null, montant: number, commission: number) {
  if (!assignedToId) return;
  const p = await profilMonteur(assignedToId);
  if (!p || p.type !== "INDEPENDANT") return;
  const net = Math.round(montant * (1 - commission));
  await prisma.gainMonteur.create({ data: { monteurId: assignedToId, paymentId, prestationId, brut: montant, commission, net } }).catch(() => {});
}

/** Solde d'un monteur : gains − versements demandés ou payés. */
export async function soldeMonteur(userId: string) {
  const [g, v] = await Promise.all([
    prisma.gainMonteur.aggregate({ where: { monteurId: userId }, _sum: { net: true } }).catch(() => ({ _sum: { net: 0 } })),
    prisma.payoutRequest.aggregate({ where: { userId, status: { in: ["PENDING", "PROCESSING", "PAID"] } }, _sum: { amount: true } }),
  ]);
  const gagne = g._sum.net ?? 0, verse = v._sum.amount ?? 0;
  return { gagne, verse, disponible: Math.max(0, gagne - verse) };
}

/** Services que ce membre de l'équipe peut ouvrir pour ses clients (Direction et internes : tout le catalogue). */
export async function competencesPartenaire(c: ContexteEquipe): Promise<Competences> {
  if (c.direction || !c.independant) return TOUTES_COMPETENCES;
  const p = await profilMonteur(c.userId);
  return competencesDe(p?.specialites);
}
