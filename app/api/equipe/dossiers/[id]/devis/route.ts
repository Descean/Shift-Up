/**
 * POST /api/equipe/dossiers/[id]/devis — Le monteur envoie le devis au client.
 * { total, acompte, lignes?, etapes[], confirmerSousPlancher? }
 * Sous le tarif plancher de la nature du marché : refus (409) tant que l'envoi n'est pas confirmé ;
 * un monteur ne peut pas confirmer, seule la Direction le peut.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { exigerDossierEquipe } from "@/lib/dossier-serveur";
import { estDirection } from "@/lib/roles";
import { infosDossier, titreDossier } from "@/lib/dossier";
import { lireTarifs, plancherDe } from "@/lib/reglages";
import { sendDevisClient } from "@/lib/email";
import { avertirClient } from "@/lib/notifications";
import { messageSysteme } from "@/lib/fil";

const schema = z.object({
  total: z.number().int().positive().max(1_000_000_000),
  acompte: z.number().int().positive(),
  lignes: z.array(z.object({ label: z.string().trim().min(1).max(200), amount: z.number().int() })).max(20).optional(),
  etapes: z.array(z.string().trim().min(1).max(200)).min(1).max(12),
  confirmerSousPlancher: z.boolean().optional(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await exigerDossierEquipe(id);
  if ("erreur" in a) return a.erreur;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Indiquez le montant, l'acompte et au moins une étape." }, { status: 422 });
  const d = parsed.data;
  if (d.acompte > d.total) return NextResponse.json({ error: "L'acompte ne peut pas dépasser le total." }, { status: 422 });

  const p = await prisma.prestation.findUnique({ where: { id }, include: { client: { select: { name: true, email: true } }, service: { select: { title: true } } } });
  if (!p) return NextResponse.json({ error: "Dossier introuvable." }, { status: 404 });
  if (!["EN_ATTENTE", "DEVIS_ENVOYE", "EN_ATTENTE_PAIEMENT"].includes(p.status) || p.amountPaid > 0) {
    return NextResponse.json({ error: "Le devis ne peut plus être modifié : l'acompte est déjà payé." }, { status: 409 });
  }

  const infos = infosDossier(p.customFields);
  const plancher = plancherDe(await lireTarifs(), infos.nature);
  if (plancher !== null && d.total < plancher) {
    if (!estDirection(a.session.user.role as string)) {
      return NextResponse.json({ error: `Le tarif minimum fixé par la Direction pour ce type de dossier est de ${plancher.toLocaleString("fr-FR")} F.`, plancher }, { status: 409 });
    }
    if (!d.confirmerSousPlancher) return NextResponse.json({ error: "sous_plancher", plancher }, { status: 409 });
  }

  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  const prop = ((cf.analyseIA as Record<string, unknown> | undefined)?.proposition ?? {}) as Record<string, unknown>;
  const titre = titreDossier(p);
  const quote = {
    items: d.lignes?.length ? d.lignes : [{ label: `Montage — ${titre}`, amount: d.total }],
    total: d.total, deposit: d.acompte, validity: "7 jours",
    resume: prop.resume ?? null, livrables: prop.livrables ?? [], pointsAttention: prop.pointsAttention ?? [],
    terms: "Ce tarif inclut l'analyse, le montage complet et le contrôle qualité.",
    par: a.session.user.id,
  };
  await prisma.prestation.update({
    where: { id },
    data: {
      quote: quote as Prisma.InputJsonValue,
      plan: { phases: d.etapes.map((t, i) => ({ title: t, description: "", order: i })) } as Prisma.InputJsonValue,
      amount: d.total,
      status: "DEVIS_ENVOYE",
      assignedToId: p.assignedToId ?? a.session.user.id,
    },
  });
  await messageSysteme(id, `Devis envoyé : ${d.total.toLocaleString("fr-FR")} F, dont ${d.acompte.toLocaleString("fr-FR")} F d'acompte pour démarrer.`, a.session.user.id);
  await Promise.allSettled([
    p.client.email ? sendDevisClient({ to: p.client.email, name: p.client.name ?? "", serviceName: titre, depositAmount: d.acompte, prestationId: id }) : Promise.resolve(),
  ]);
  await avertirClient(id, "DEVIS", "Votre devis est prêt", `${d.total.toLocaleString("fr-FR")} F. Payez l'acompte de ${d.acompte.toLocaleString("fr-FR")} F pour démarrer le montage.`, { courriel: false });
  return NextResponse.json({ ok: true });
}
