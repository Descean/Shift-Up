/**
 * GET   /api/equipe/monteurs — Direction : monteurs (candidatures, actifs, suspendus), dossiers en cours et soldes.
 * PATCH /api/equipe/monteurs { userId, statut, type } — Active, suspend ou change le type d'un monteur.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigerEquipe } from "@/lib/dossier-serveur";
import { soldeMonteur } from "@/lib/monteurs";
import { lienAcces } from "@/lib/acces";
import { lireTarifs } from "@/lib/reglages";
import { sendMonteurActive } from "@/lib/email";

export async function GET() {
  const a = await exigerEquipe(true);
  if ("erreur" in a) return a.erreur;
  const users = await prisma.user.findMany({ where: { role: "MONTEUR" }, select: { id: true, name: true, email: true, phone: true, createdAt: true }, orderBy: { createdAt: "desc" } });
  const profils = await prisma.monteurProfil.findMany({ where: { userId: { in: users.map((u) => u.id) } } }).catch(() => []);
  const enCours = await prisma.prestation.groupBy({ by: ["assignedToId"], where: { assignedToId: { in: users.map((u) => u.id) }, status: { notIn: ["TERMINEE", "ANNULEE"] } }, _count: true });
  const monteurs = await Promise.all(users.map(async (u) => {
    const p = profils.find((x) => x.userId === u.id);
    return {
      id: u.id, nom: u.name, email: u.email, telephone: p?.telephone ?? u.phone, ville: p?.ville ?? null, experience: p?.experience ?? null,
      specialites: p?.specialites ?? [], presentation: p?.presentation ?? null, creeLe: u.createdAt.toISOString(),
      statut: p?.statut ?? "ACTIF", type: p?.type ?? "INTERNE",
      dossiersEnCours: enCours.find((x) => x.assignedToId === u.id)?._count ?? 0,
      solde: p?.type === "INDEPENDANT" ? (await soldeMonteur(u.id)).disponible : 0,
    };
  }));
  return NextResponse.json({ monteurs });
}

const schema = z.object({ userId: z.string().min(1), statut: z.enum(["ACTIF", "SUSPENDU", "EN_ATTENTE"]), type: z.enum(["INDEPENDANT", "INTERNE"]) });

export async function PATCH(req: NextRequest) {
  const a = await exigerEquipe(true);
  if ("erreur" in a) return a.erreur;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 422 });
  const { userId, statut, type } = parsed.data;
  const u = await prisma.user.findFirst({ where: { id: userId, role: "MONTEUR" }, select: { id: true, name: true, email: true } });
  if (!u) return NextResponse.json({ error: "Monteur introuvable." }, { status: 404 });
  const avant = await prisma.monteurProfil.findUnique({ where: { userId } });
  await prisma.monteurProfil.upsert({
    where: { userId },
    update: { statut, type, ...(statut === "ACTIF" && avant?.statut !== "ACTIF" ? { approuveLe: new Date() } : {}) },
    create: { userId, statut, type, approuveLe: statut === "ACTIF" ? new Date() : null },
  });
  await prisma.auditLog.create({ data: { userId: a.session.user.id, action: "MONTEUR_MODIFIE", entity: "User", entityId: userId, details: { statut, type } } }).catch(() => {});
  if (statut === "ACTIF" && avant?.statut === "EN_ATTENTE" && u.email) {
    await sendMonteurActive({ to: u.email, name: u.name ?? "", lien: await lienAcces(u.id, "/dashboard/equipe", 7 * 24 * 60), independant: type === "INDEPENDANT", commission: (await lireTarifs()).commissionMonteurs }).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
