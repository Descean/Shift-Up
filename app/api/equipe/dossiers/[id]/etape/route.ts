/**
 * POST /api/equipe/dossiers/[id]/etape — Checklist de montage :
 *  { etapeId, statut: "IN_PROGRESS" | "DONE" } fait avancer une étape ;
 *  { ajouter: "titre" } ajoute une étape en fin de liste (pendant la production, ex. en lisant le dossier).
 * Quand toutes les étapes sont faites, le dossier passe en livraison : le client vérifie l'aperçu et paie le solde.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { avertirClient } from "@/lib/notifications";
import { messageSysteme } from "@/lib/fil";

const schema = z.union([
  z.object({ etapeId: z.string().min(1), statut: z.enum(["IN_PROGRESS", "DONE"]) }),
  z.object({ ajouter: z.string().trim().min(2, "Donnez un titre à l'étape.").max(150) }),
]);

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await exigerDossierEquipe(id);
  if ("erreur" in a) return a.erreur;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Requête invalide." }, { status: 422 });
  const p = await prisma.prestation.findUnique({ where: { id }, select: { status: true, assignedToId: true } });
  if (!p) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  if (!["EN_COURS", "REVISION"].includes(p.status)) return NextResponse.json({ error: "Le dossier n'est pas en production." }, { status: 409 });

  if ("ajouter" in parsed.data) {
    const n = await prisma.prestationPhase.count({ where: { prestationId: id } });
    if (n >= 40) return NextResponse.json({ error: "Trop d'étapes sur ce dossier." }, { status: 422 });
    const e = await prisma.prestationPhase.create({ data: { prestationId: id, title: parsed.data.ajouter, order: n, status: "PENDING" } });
    const etapes = await prisma.prestationPhase.findMany({ where: { prestationId: id }, select: { status: true } });
    await prisma.prestation.update({ where: { id }, data: { globalProgress: Math.round((etapes.filter((x) => x.status === "DONE").length / etapes.length) * 100) } });
    return NextResponse.json({ ok: true, etapeId: e.id, termine: false });
  }

  const etape = await prisma.prestationPhase.findFirst({ where: { id: parsed.data.etapeId, prestationId: id } });
  if (!etape) return NextResponse.json({ error: "Étape introuvable." }, { status: 404 });
  const fait = parsed.data.statut === "DONE";
  await prisma.prestationPhase.update({
    where: { id: etape.id },
    data: { status: parsed.data.statut, progress: fait ? 100 : Math.max(etape.progress, 10), ...(fait ? { endDate: new Date() } : { startDate: etape.startDate ?? new Date() }) },
  });
  if (!p.assignedToId) await prisma.prestation.update({ where: { id }, data: { assignedToId: a.session.user.id } });

  const etapes = await prisma.prestationPhase.findMany({ where: { prestationId: id }, select: { status: true } });
  const faites = etapes.filter((e) => e.status === "DONE").length;
  await prisma.prestation.update({ where: { id }, data: { globalProgress: etapes.length ? Math.round((faites / etapes.length) * 100) : 0 } });

  if (fait) await avertirClient(id, "ETAPE", "Étape validée", `« ${etape.title} » est terminée.`, { courriel: false });
  if (etapes.length && faites === etapes.length) {
    await prisma.prestation.update({ where: { id }, data: { status: "LIVRAISON" } });
    await messageSysteme(id, "Les travaux de montage sont terminés. Veuillez vérifier l'aperçu.", a.session.user.id);
    await avertirClient(id, "STATUT", "Montage terminé", "Vérifiez l'aperçu de vos livrables, puis réglez le solde pour télécharger vos fichiers.");
    return NextResponse.json({ ok: true, termine: true });
  }
  return NextResponse.json({ ok: true, termine: false });
}
