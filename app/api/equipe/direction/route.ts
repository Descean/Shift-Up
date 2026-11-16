/**
 * GET /api/equipe/direction — Statistiques (chiffre d'affaires encaissé, dossiers en cours, clients uniques) et tarifs.
 * PUT /api/equipe/direction { planchers, livraisonPhysique, majorationExpress, acompte } — Enregistre les tarifs.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigerEquipe } from "@/lib/dossier-serveur";
import { enregistrerTarifs, lireTarifs } from "@/lib/reglages";

export async function GET() {
  const a = await exigerEquipe(true);
  if ("erreur" in a) return a.erreur;
  const [ca, enCours, clients, tarifs] = await Promise.all([
    prisma.payment.aggregate({ where: { status: "COMPLETED" }, _sum: { amount: true } }),
    prisma.prestation.count({ where: { status: { notIn: ["TERMINEE", "ANNULEE"] } } }),
    prisma.prestation.findMany({ where: { status: { not: "ANNULEE" } }, distinct: ["clientId"], select: { clientId: true } }),
    lireTarifs(),
  ]);
  return NextResponse.json({ stats: { chiffreAffaires: ca._sum.amount ?? 0, dossiersEnCours: enCours, clientsUniques: clients.length }, tarifs });
}

const montant = z.number().int().min(0).max(100_000_000);
const schema = z.object({
  planchers: z.object({ cotation: montant, trp: montant, dao: montant }),
  livraisonPhysique: montant,
  majorationExpress: z.number().min(0).max(2),
  acompte: z.number().min(0.1).max(1),
  commissionMonteurs: z.number().min(0).max(0.9),
});

export async function PUT(req: NextRequest) {
  const a = await exigerEquipe(true);
  if ("erreur" in a) return a.erreur;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Valeurs invalides." }, { status: 422 });
  try {
    await enregistrerTarifs(parsed.data);
  } catch (e) {
    console.error("[direction] tarifs", e);
    return NextResponse.json({ error: "Enregistrement impossible : exécutez d'abord le script SQL de la plateforme de montage." }, { status: 503 });
  }
  await prisma.auditLog.create({ data: { userId: a.session.user.id, action: "TARIFS_MODIFIES", entity: "Reglage", entityId: "tarifs", details: parsed.data } }).catch(() => {});
  return NextResponse.json({ ok: true });
}
