/**
 * GET   /api/admin/apporteur-services         — Liste tous les services apporteurs (filtrable)
 * PATCH /api/admin/apporteur-services         — Approuver / rejeter / modifier un service apporteur
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!["ADMIN", "DEVELOPER"].includes(session.user.role as string)) return null;
  return session;
}

export async function GET(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "all"; // all | pending | approved

  try {
    const where =
      filter === "pending"  ? { isApproved: false } :
      filter === "approved" ? { isApproved: true  } :
      {};

    const services = await prisma.apporteurService.findMany({
      where,
      include: {
        apporteur: { select: { id: true, name: true, email: true } },
        orders:    { select: { status: true, amount: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const enriched = services.map((s) => ({
      ...s,
      ordersCount:      s.orders.length,
      completedOrders:  s.orders.filter((o) => o.status === "TERMINEE").length,
      totalRevenue:     s.orders.reduce((sum, o) => sum + o.amount, 0),
    }));

    return NextResponse.json({ services: enriched });
  } catch (error) {
    console.error("GET /api/admin/apporteur-services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const { id, isApproved, isActive, adminNote } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 400 });

    const service = await prisma.apporteurService.update({
      where: { id },
      data: {
        ...(isApproved !== undefined && { isApproved }),
        ...(isActive   !== undefined && { isActive   }),
      },
      include: { apporteur: { select: { id: true, name: true, email: true } } },
    });

    // Message interne à l'apporteur
    const statusLabel = isApproved === true ? "approuvé" : isApproved === false ? "rejeté" : null;
    if (statusLabel) {
      const admins = await prisma.user.findMany({
        where: { role: { in: ["ADMIN", "DEVELOPER"] } },
        select: { id: true },
        take: 1,
      });
      if (admins[0]) {
        await prisma.message.create({
          data: {
            senderId:    admins[0].id,
            recipientId: service.apporteurId,
            subject:     `Votre service "${service.title}" a été ${statusLabel}`,
            content:     adminNote
              ? `Votre service "${service.title}" a été ${statusLabel} par l'équipe SHIFT UP.\n\nNote : ${adminNote}`
              : `Votre service "${service.title}" a été ${statusLabel} par l'équipe SHIFT UP.`,
          },
        });
      }
    }

    return NextResponse.json({ service });
  } catch (error) {
    console.error("PATCH /api/admin/apporteur-services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
