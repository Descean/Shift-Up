/**
 * POST /api/admin/prestations/[id]/paiement — Enregistre un paiement reçu hors ligne
 * (Mobile Money sur le numéro SHIFT UP, espèces, virement, chèque).
 *
 * Le paiement suit exactement le même circuit qu'un paiement en ligne (confirmerPaiement) :
 * l'acompte fait démarrer les travaux, le solde déverrouille les livrables, le client est prévenu.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import crypto from "crypto";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { confirmerPaiement } from "@/lib/prestations";

const schema = z.object({
  montant: z.number().positive().max(1_000_000_000),
  moyen: z.enum(["MOBILE_MONEY", "ESPECES", "BANK_TRANSFER", "CHEQUE"]),
  reference: z.string().trim().max(120).optional().nullable(),
  note: z.string().trim().max(500).optional().nullable(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER")) {
    return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  }
  const { id } = await params;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Montant ou moyen de paiement invalide." }, { status: 422 });
  const d = parsed.data;

  const prestation = await prisma.prestation.findUnique({ where: { id }, select: { id: true, clientId: true, amount: true, amountPaid: true, status: true } });
  if (!prestation) return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
  if (prestation.status === "ANNULEE") return NextResponse.json({ error: "Prestation annulée." }, { status: 409 });
  if (prestation.amount <= 0) return NextResponse.json({ error: "Envoyez d'abord le devis : le montant total n'est pas encore fixé." }, { status: 409 });
  const reste = prestation.amount - prestation.amountPaid;
  if (d.montant > reste + 1) {
    return NextResponse.json({ error: `Le montant dépasse le reste à payer (${Math.round(reste).toLocaleString("fr-FR")} F).` }, { status: 422 });
  }

  const payment = await prisma.payment.create({
    data: {
      prestationId: prestation.id,
      userId: prestation.clientId,
      amount: d.montant,
      method: d.moyen,
      provider: "MANUEL",
      status: "PENDING",
      reference: `MAN-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
      metadata: { saisiPar: session.user.id, referenceExterne: d.reference ?? null, note: d.note ?? null },
    },
  });
  await confirmerPaiement(payment.id);

  const maj = await prisma.prestation.findUnique({ where: { id }, select: { amountPaid: true, status: true } });
  return NextResponse.json({ ok: true, paymentId: payment.id, amountPaid: maj?.amountPaid, status: maj?.status });
}
