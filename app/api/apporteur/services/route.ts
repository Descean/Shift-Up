/**
 * /api/apporteur/services — CRUD services personnels de l'apporteur
 *
 * GET    → liste les services de l'apporteur connecté
 * POST   → crée un nouveau service (en attente de validation admin)
 * PATCH  → met à jour un service (title, description, prix, etc.)
 * DELETE → supprime un service (?id=xxx)
 *
 * Commission SHIFT UP : 10 % sur chaque vente réalisée.
 * Un service doit être approuvé par un admin (isApproved) avant d'être visible.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { freeTextSchema, isSafe } from "@/lib/validation";

const COMMISSION_RATE = 0.10; // 10 % pour SHIFT UP

const serviceBodySchema = z.object({
  title:       freeTextSchema(3, 100),
  description: freeTextSchema(20, 1000),
  category:    freeTextSchema(2, 60),
  features:    z.array(z.string().max(100).refine(isSafe)).max(10).default([]),
  priceMin:    z.number().positive("Le prix minimum doit être positif.").max(100_000_000),
  priceMax:    z.number().positive().max(100_000_000).optional().nullable(),
  currency:    z.enum(["XOF", "EUR", "USD"]).default("XOF"),
  duration:    z.string().max(50).optional().nullable(),
});

// ── GET — liste des services de l'apporteur connecté ──────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "APPORTEUR") {
    return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });
  }

  try {
    const services = await prisma.apporteurService.findMany({
      where: { apporteurId: session.user.id },
      include: { orders: { select: { status: true, amount: true } } },
      orderBy: { createdAt: "desc" },
    });

    const enriched = services.map((s) => ({
      ...s,
      ordersCount: s.orders.length,
      completedOrders: s.orders.filter((o) => o.status === "TERMINEE").length,
      commissionRate: COMMISSION_RATE,
    }));

    return NextResponse.json({ services: enriched });
  } catch (error) {
    console.error("GET /api/apporteur/services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── POST — créer un service ────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "APPORTEUR") {
    return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const parsed = serviceBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { title, description, category, features, priceMin, priceMax, currency, duration } = parsed.data;

    const service = await prisma.apporteurService.create({
      data: {
        apporteurId: session.user.id,
        title, description, category, features,
        priceMin, priceMax: priceMax ?? null,
        currency, duration: duration ?? null,
        commissionRate: COMMISSION_RATE,
        isApproved: false, // validation admin requise
      },
    });

    return NextResponse.json({ service }, { status: 201 });
  } catch (error) {
    console.error("POST /api/apporteur/services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── PATCH — modifier un service ────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "APPORTEUR") {
    return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { id, ...fields } = body;

    if (!id || typeof id !== "string" || !isSafe(id)) {
      return NextResponse.json({ error: "ID invalide." }, { status: 400 });
    }

    // Vérifier que le service appartient bien à cet apporteur
    const existing = await prisma.apporteurService.findFirst({
      where: { id, apporteurId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Service introuvable." }, { status: 404 });
    }

    const parsed = serviceBodySchema.partial().safeParse(fields);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Toute modification repasse en attente de validation
    const updated = await prisma.apporteurService.update({
      where: { id },
      data: { ...parsed.data, isApproved: false },
    });

    return NextResponse.json({ service: updated });
  } catch (error) {
    console.error("PATCH /api/apporteur/services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── DELETE — supprimer un service ─────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (session.user.role !== "APPORTEUR") {
    return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id") ?? "";

    if (!id || !isSafe(id)) {
      return NextResponse.json({ error: "ID invalide." }, { status: 400 });
    }

    const existing = await prisma.apporteurService.findFirst({
      where: { id, apporteurId: session.user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Service introuvable." }, { status: 404 });
    }

    await prisma.apporteurService.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/apporteur/services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
