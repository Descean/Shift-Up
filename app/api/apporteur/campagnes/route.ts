/**
 * GET   /api/apporteur/campagnes  — Campagnes de l'apporteur connecté
 * POST  /api/apporteur/campagnes  — Créer une campagne
 * PATCH /api/apporteur/campagnes  — Modifier le statut d'une campagne
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const campaigns = await prisma.campaign.findMany({
      where: { apporteurId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    const items = campaigns.map((c) => ({
      id: c.id,
      name: c.name,
      channel: c.channel,
      service: c.service ?? "",
      clicks: c.clicks,
      leads: c.leads,
      conversions: c.conversions,
      status: c.status,
      startDate: new Date(c.startDate).toLocaleDateString("fr-FR"),
    }));

    return NextResponse.json({ campaigns: items });
  } catch (error) {
    console.error("GET /api/apporteur/campagnes error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { name, channel, service } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Nom requis." }, { status: 400 });
    }

    const campaign = await prisma.campaign.create({
      data: {
        apporteurId: session.user.id,
        name,
        channel: channel ?? "WhatsApp",
        service: service ?? null,
      },
    });

    return NextResponse.json({
      campaign: {
        id: campaign.id,
        name: campaign.name,
        channel: campaign.channel,
        service: campaign.service ?? "",
        clicks: campaign.clicks,
        leads: campaign.leads,
        conversions: campaign.conversions,
        status: campaign.status,
        startDate: new Date(campaign.startDate).toLocaleDateString("fr-FR"),
      },
    });
  } catch (error) {
    console.error("POST /api/apporteur/campagnes error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { id, status } = await req.json();
    const campaign = await prisma.campaign.update({
      where: { id, apporteurId: session.user.id },
      data: { status },
    });
    return NextResponse.json({ campaign });
  } catch (error) {
    console.error("PATCH /api/apporteur/campagnes error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
