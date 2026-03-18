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
        livrables: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ prestations });
  } catch (error) {
    console.error("GET /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  try {
    const body = await req.json();
    const {
      serviceId, sector, customService, brief, budget, deadline,
      company, phone, attachments, customFields,
    } = body;

    if (!brief?.trim()) return NextResponse.json({ error: "La description du besoin est requise." }, { status: 400 });
    if (!sector) return NextResponse.json({ error: "Le secteur d'activité est requis." }, { status: 400 });

    // Vérifie le service si fourni
    let service = null;
    if (serviceId) {
      service = await prisma.service.findUnique({ where: { id: serviceId, isActive: true } });
    }

    const prestation = await prisma.prestation.create({
      data: {
        clientId: session.user.id,
        serviceId: serviceId || null,
        sector,
        customService: customService || null,
        brief,
        budget: budget || null,
        deadline: deadline || null,
        company: company || null,
        phone: phone || null,
        attachments: attachments ?? [],
        customFields: customFields ?? undefined,
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

    // Notifications email (sans bloquer la réponse)
    const serviceName = service?.title ?? customService ?? sector;
    const clientName = session.user.name ?? session.user.email ?? "Client";
    Promise.all([
      sendDemandeConfirmation({ to: session.user.email!, name: clientName, serviceName, prestationId: prestation.id }),
      sendNewDemandeAdmin({ clientName, clientEmail: session.user.email!, serviceName, brief, prestationId: prestation.id }),
    ]).catch((e) => console.error("Email error:", e));

    return NextResponse.json({ prestation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
