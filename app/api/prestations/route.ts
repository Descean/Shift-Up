/**
 * app/api/prestations/route.ts
 *
 * GET  /api/prestations  → Liste les prestations du client connecté
 * POST /api/prestations  → Soumet une nouvelle demande de prestation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendDemandeConfirmation, sendNewDemandeAdmin } from "@/lib/email";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { freeTextSchema, isSafe } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { envoyer, vueClient } from "@/lib/prestations";
import { preparerMontage } from "@/lib/montage-serveur";
import { SECTEUR_MONTAGE } from "@/lib/montage";

const bodySchema = z.object({
  serviceId:     z.string().max(100).optional().nullable(),
  sector:        freeTextSchema(1, 100),
  customService: z.string().max(150).refine(isSafe).optional().nullable(),
  brief:         freeTextSchema(0, 3000).optional().nullable(),
  budget:        z.string().max(50).optional().nullable(),
  deadline:      z.string().max(50).optional().nullable(),
  company:       z.string().max(150).refine(isSafe).optional().nullable(),
  phone:         z.string().max(30).optional().nullable(),
  attachments:   z.array(z.string().url().max(500)).max(20).optional(),
  customFields:  z.record(z.string(), z.unknown()).optional().nullable(),
  /** Fiche de l'appel d'offres (montage de dossier) */
  dossier:       z.unknown().optional(),
  dao:           z.object({ url: z.string().url().max(500), nom: z.string().max(200) }).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const prestations = await prisma.prestation.findMany({
      where: {
        clientId: session.user.id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        service: true,
        payments: true,
        prestationPhases: { orderBy: { order: "asc" } },
        livrables: { orderBy: { createdAt: "asc" }, include: { phase: { select: { id: true, title: true, order: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ prestations: prestations.map(vueClient) });
  } catch (error) {
    console.error("GET /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const ip = getClientIp(req);
  const { allowed, retryAfter } = await rateLimit(`prestations:${session.user.id}:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    const {
      serviceId, sector, customService, budget, deadline,
      company, phone, attachments, customFields, dossier, dao,
    } = parsed.data;
    let brief = parsed.data.brief ?? "";

    // Montage de dossier : fiche de l'appel d'offres + liste des pièces à fournir
    let montage: { dossier: unknown; pieces: unknown[] } | null = null;
    let urgence: string | null = null;
    if (dossier !== undefined && dossier !== null) {
      if (sector !== SECTEUR_MONTAGE) return NextResponse.json({ error: "Fiche d'appel d'offres réservée au montage de dossiers." }, { status: 422 });
      const m = preparerMontage(dossier, session.user.id, dao ?? null, brief);
      if (!m.ok) return NextResponse.json({ error: m.erreur }, { status: 422 });
      montage = { dossier: m.dossier, pieces: m.pieces };
      brief = m.brief;
      urgence = m.urgence;
    }
    if (!brief) return NextResponse.json({ error: "Décrivez votre besoin.", details: { brief: ["Obligatoire."] } }, { status: 422 });
    const pieceJointes = [...(attachments ?? []), ...(montage && dao ? [dao.url] : [])];

    // "autre" est une valeur interne UI, pas un vrai ID de service
    const realServiceId = (serviceId && serviceId !== "autre") ? serviceId : null;

    // Vérifie le service si fourni
    let service = null;
    if (realServiceId) {
      service = await prisma.service.findUnique({ where: { id: realServiceId, isActive: true } });
    }

    const prestation = await prisma.prestation.create({
      data: {
        clientId: session.user.id,
        serviceId: realServiceId,
        sector,
        customService: customService || null,
        brief,
        budget: budget || null,
        deadline: deadline || null,
        company: company || null,
        phone: phone || null,
        attachments: pieceJointes,
        customFields: (montage ? { ...(customFields ?? {}), ...montage } : (customFields ?? undefined)) as Prisma.InputJsonValue | undefined,
        status: "EN_ATTENTE",
        amount: 0, // Défini par le devis admin
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
        details: { sector, serviceId, brief: brief.slice(0, 100) },
      },
    });

    // Notifications email (attendues : sur Vercel, un envoi non attendu peut être interrompu)
    const serviceName = service?.title ?? customService ?? sector;
    const clientName = session.user.name ?? session.user.email ?? "Client";
    await envoyer("nouvelle demande", [
      sendDemandeConfirmation({ to: session.user.email!, name: clientName, serviceName, prestationId: prestation.id, piecesAFournir: montage ? montage.pieces.length : 0 }),
      sendNewDemandeAdmin({ clientName, clientEmail: session.user.email!, serviceName, brief, prestationId: prestation.id, urgence }),
    ]);

    return NextResponse.json({ prestation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
