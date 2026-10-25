/**
 * GET /api/services — Catalogue public des services actifs (formulaire « Nouvelle demande »).
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const services = await prisma.service.findMany({
    where: { isActive: true },
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    select: { id: true, domain: true, title: true, description: true, priceMin: true, priceMax: true, duration: true, isActive: true },
  });
  return NextResponse.json({ services });
}
