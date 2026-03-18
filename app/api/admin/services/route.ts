/**
 * GET    /api/admin/services       — Liste tous les services
 * POST   /api/admin/services       — Créer un service
 * PATCH  /api/admin/services       — Modifier un service
 * DELETE /api/admin/services?id=xx — Supprimer un service
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

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const services = await prisma.service.findMany({ orderBy: [{ order: "asc" }, { createdAt: "desc" }] });
  return NextResponse.json({ services });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const body = await req.json();
    const { domain, title, description, features, priceMin, priceMax, duration, isPopular, isActive, order } = body;
    if (!title?.trim() || !domain) return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });

    const service = await prisma.service.create({
      data: {
        domain, title, description: description ?? "",
        features: features ?? [],
        priceMin: Number(priceMin) || 0,
        priceMax: priceMax ? Number(priceMax) : null,
        duration: duration || null,
        isPopular: isPopular ?? false,
        isActive: isActive ?? true,
        order: order ?? 0,
      },
    });
    return NextResponse.json({ service });
  } catch (error) {
    console.error("POST /api/admin/services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 400 });

    const service = await prisma.service.update({
      where: { id },
      data: {
        ...(data.domain !== undefined && { domain: data.domain }),
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.features !== undefined && { features: data.features }),
        ...(data.priceMin !== undefined && { priceMin: Number(data.priceMin) }),
        ...(data.priceMax !== undefined && { priceMax: data.priceMax ? Number(data.priceMax) : null }),
        ...(data.duration !== undefined && { duration: data.duration || null }),
        ...(data.isPopular !== undefined && { isPopular: data.isPopular }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.order !== undefined && { order: data.order }),
      },
    });
    return NextResponse.json({ service });
  } catch (error) {
    console.error("PATCH /api/admin/services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 400 });
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/services error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
