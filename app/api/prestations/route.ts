/**
 * app/api/prestations/route.ts — CRUD des prestations (côté client)
 *
 * GET  /api/prestations        → Liste les prestations du client connecté
 * POST /api/prestations        → Crée une nouvelle demande de prestation
 *
 * Sécurité : session NextAuth obligatoire pour les deux méthodes.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

// Schéma de création d'une prestation
const createSchema = z.object({
  serviceId: z.string(),
  amount: z.number().positive(),
  notes: z.string().optional(),
  estimatedEndDate: z.string().optional(),
});

// ── GET — Récupère les prestations du client connecté ────────────────────────
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // Filtre optionnel par statut

  try {
    const prestations = await prisma.prestation.findMany({
      where: {
        clientId: session.user.id,
        ...(status ? { status: status as any } : {}),
      },
      include: {
        service: true,   // Détails du service
        payments: true,  // Historique des paiements pour calculer amountPaid
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ prestations });
  } catch (error) {
    console.error("GET /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── POST — Crée une nouvelle demande de prestation ───────────────────────────
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createSchema.parse(body);

    // Vérifie que le service existe et est actif
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId, isActive: true },
    });
    if (!service) {
      return NextResponse.json({ error: "Service introuvable ou inactif." }, { status: 404 });
    }

    // Crée la prestation avec le statut initial EN_ATTENTE
    const prestation = await prisma.prestation.create({
      data: {
        clientId: session.user.id,
        serviceId: data.serviceId,
        amount: data.amount,
        notes: data.notes,
        status: "EN_ATTENTE",
        estimatedEndDate: data.estimatedEndDate ? new Date(data.estimatedEndDate) : undefined,
        phases: [], // Phases définies par l'admin lors de l'assignation
      },
      include: { service: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PRESTATION_CREATED",
        entity: "Prestation",
        entityId: prestation.id,
        details: { serviceId: data.serviceId, amount: data.amount },
      },
    });

    return NextResponse.json({ prestation }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("POST /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
