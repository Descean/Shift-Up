/**
 * /api/apporteur/services/orders — Gestion des commandes reçues sur les
 * services personnels d'un apporteur (partage → enregistrement client →
 * encaissement → livraison).
 *
 * GET   → liste les commandes de tous les services de l'apporteur connecté
 * PATCH → met à jour une commande qui lui appartient (tarif, livraison, annulation)
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { isSafe } from "@/lib/validation";
import { sendApporteurServiceDelivered } from "@/lib/email";

const COMMISSION_RATE = 0.10;

async function requireApporteur() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== "APPORTEUR") return null;
  return session;
}

// ── GET — commandes de l'apporteur connecté ─────────────────────────────────
export async function GET() {
  const session = await requireApporteur();
  if (!session) return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });

  try {
    const orders = await prisma.apporteurServiceOrder.findMany({
      where: { service: { apporteurId: session.user.id } },
      include: { service: { select: { id: true, title: true } } },
      orderBy: { createdAt: "desc" },
    });

    const enriched = orders.map((o) => ({
      ...o,
      paymentStatus: o.paidAt ? "paye" : o.paymentId ? "lien_genere" : "attente_tarif",
    }));

    return NextResponse.json({ orders: enriched });
  } catch (error) {
    console.error("GET /api/apporteur/services/orders error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

const patchSchema = z.object({
  id: z.string().min(1),
  amount: z.number().positive().max(100_000_000).optional(),
  status: z.enum(["ANNULEE"]).optional(),
  documentUrl: z.string().url().max(500).optional(),
  documentName: z.string().max(200).refine(isSafe).optional(),
  notes: z.string().max(1000).refine(isSafe).optional(),
});

// ── PATCH — modifier une commande possédée par l'apporteur ─────────────────
export async function PATCH(req: NextRequest) {
  const session = await requireApporteur();
  if (!session) return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });

  try {
    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Données invalides.", details: parsed.error.flatten().fieldErrors }, { status: 400 });
    }
    const { id, amount, status, documentUrl, documentName, notes } = parsed.data;

    const order = await prisma.apporteurServiceOrder.findFirst({
      where: { id, service: { apporteurId: session.user.id } },
      include: { service: { select: { title: true } } },
    });
    if (!order) {
      return NextResponse.json({ error: "Commande introuvable." }, { status: 404 });
    }

    const data: Record<string, unknown> = {};

    // Le tarif ne peut plus changer une fois un lien de paiement généré.
    if (amount !== undefined) {
      if (order.paymentId) {
        return NextResponse.json({ error: "Le tarif ne peut plus être modifié : un lien de paiement a déjà été généré." }, { status: 409 });
      }
      data.amount = amount;
      data.commission = amount * COMMISSION_RATE;
      data.apporteurRevenue = amount - amount * COMMISSION_RATE;
    }

    if (status === "ANNULEE") {
      if (order.paidAt) {
        return NextResponse.json({ error: "Impossible d'annuler une commande déjà payée." }, { status: 409 });
      }
      data.status = "ANNULEE";
    }

    if (notes !== undefined) data.notes = notes;

    let shouldNotifyDelivery = false;
    if (documentUrl !== undefined) {
      if (!order.paidAt) {
        return NextResponse.json({ error: "La commande doit être payée avant d'être livrée." }, { status: 409 });
      }
      data.documentUrl = documentUrl;
      data.documentName = documentName ?? null;
      data.deliveredAt = new Date();
      data.status = "TERMINEE";
      shouldNotifyDelivery = true;
    }

    const updated = await prisma.apporteurServiceOrder.update({ where: { id }, data });

    if (shouldNotifyDelivery) {
      await sendApporteurServiceDelivered({
        to: order.clientEmail,
        name: order.clientName,
        serviceTitle: order.service.title,
        documentUrl: documentUrl!,
      }).catch((e) => console.error("sendApporteurServiceDelivered error:", e));
    }

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("PATCH /api/apporteur/services/orders error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
