/**
 * GET  /api/equipe/gains — Monteur : lien à partager avec ses clients, solde, gains et versements.
 * POST /api/equipe/gains { montant, operateur, numero } — Demande de versement Mobile Money (≤ solde disponible).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigerEquipe } from "@/lib/dossier-serveur";
import { soldeMonteur } from "@/lib/monteurs";
import { baseUrl } from "@/lib/acces";
import { lireTarifs } from "@/lib/reglages";
import { reference } from "@/lib/dossier";
import { sendAlerteDirection } from "@/lib/email";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";

const MINIMUM_VERSEMENT = 5_000;

export async function GET() {
  const a = await exigerEquipe();
  if ("erreur" in a) return a.erreur;
  const moi = a.session.user.id;
  const [u, solde, gains, versements, tarifs] = await Promise.all([
    prisma.user.findUnique({ where: { id: moi }, select: { affiliationCode: true } }),
    soldeMonteur(moi),
    prisma.gainMonteur.findMany({ where: { monteurId: moi }, orderBy: { createdAt: "desc" }, take: 100 }).catch(() => []),
    prisma.payoutRequest.findMany({ where: { userId: moi }, orderBy: { createdAt: "desc" }, take: 50 }),
    lireTarifs(),
  ]);
  return NextResponse.json({
    independant: a.ctx.independant,
    lien: u?.affiliationCode ? `${baseUrl()}/m/${u.affiliationCode}` : null,
    commission: tarifs.commissionMonteurs,
    minimum: MINIMUM_VERSEMENT,
    solde,
    gains: gains.map((g) => ({ id: g.id, date: g.createdAt.toISOString(), dossier: reference(g.prestationId), dossierId: g.prestationId, brut: g.brut, commission: g.commission, net: g.net })),
    versements: versements.map((v) => ({ id: v.id, date: v.createdAt.toISOString(), montant: v.amount, statut: v.status, numero: v.mobileNumber, operateur: v.mobileProvider, note: v.notes })),
  });
}

const schema = z.object({
  montant: z.number().int().min(MINIMUM_VERSEMENT, `Minimum ${MINIMUM_VERSEMENT.toLocaleString("fr-FR")} F.`),
  operateur: z.enum(["MTN_MOMO", "MOOV_MONEY", "CELTIIS"]),
  numero: z.string().transform((v) => v.replace(/[\s.-]/g, "").replace(/^(\+?229)?/, "+229")).pipe(z.string().regex(/^\+22901\d{8}$/, "Numéro Mobile Money à 10 chiffres, commençant par 01.")),
});

export async function POST(req: NextRequest) {
  const a = await exigerEquipe();
  if ("erreur" in a) return a.erreur;
  if (!a.ctx.independant) return NextResponse.json({ error: "Les versements concernent les monteurs indépendants." }, { status: 403 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Requête invalide." }, { status: 422 });
  const moi = a.session.user.id;
  if (await prisma.payoutRequest.findFirst({ where: { userId: moi, status: { in: ["PENDING", "PROCESSING"] } }, select: { id: true } })) {
    return NextResponse.json({ error: "Une demande de versement est déjà en cours de traitement." }, { status: 409 });
  }
  const { disponible } = await soldeMonteur(moi);
  if (parsed.data.montant > disponible) return NextResponse.json({ error: `Solde disponible : ${Math.round(disponible).toLocaleString("fr-FR")} F.` }, { status: 409 });
  const v = await prisma.payoutRequest.create({
    data: { userId: moi, amount: parsed.data.montant, mobileProvider: parsed.data.operateur, mobileNumber: parsed.data.numero, reference: `SU-MVER-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}` },
  });
  await Promise.allSettled([
    sendAlerteDirection({ titre: "Demande de versement d'un monteur", lignes: [["Monteur", a.session.user.name ?? a.session.user.email ?? ""], ["Montant", `${parsed.data.montant.toLocaleString("fr-FR")} F`], ["Mobile Money", `${parsed.data.operateur} ${parsed.data.numero}`], ["Référence", v.reference]] }),
    alerterEquipeWhatsApp("Versement monteur", `${a.session.user.name ?? ""} — ${parsed.data.montant.toLocaleString("fr-FR")} F`),
  ]);
  return NextResponse.json({ ok: true }, { status: 201 });
}
