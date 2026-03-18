/**
 * GET    /api/admin/ressources       — Liste toutes les ressources
 * POST   /api/admin/ressources       — Créer une ressource
 * PATCH  /api/admin/ressources       — Modifier une ressource (body: { id, ...fields })
 * DELETE /api/admin/ressources?id=xx — Supprimer une ressource
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

  const resources = await prisma.resource.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
  });
  return NextResponse.json({ resources });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { title, description, type, category, url, duration, size, isNew, order } = await req.json();
    if (!title?.trim() || !type || !category || !url?.trim()) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const resource = await prisma.resource.create({
      data: {
        title,
        description: description ?? "",
        type,
        category,
        url,
        duration: duration || null,
        size: size || null,
        isNew: isNew ?? false,
        order: order ?? 0,
      },
    });
    return NextResponse.json({ resource });
  } catch (error) {
    console.error("POST /api/admin/ressources error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { id, title, description, type, category, url, duration, size, isNew, isActive, order } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 400 });

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        ...(title !== undefined && { title }),
        ...(description !== undefined && { description }),
        ...(type !== undefined && { type }),
        ...(category !== undefined && { category }),
        ...(url !== undefined && { url }),
        ...(duration !== undefined && { duration: duration || null }),
        ...(size !== undefined && { size: size || null }),
        ...(isNew !== undefined && { isNew }),
        ...(isActive !== undefined && { isActive }),
        ...(order !== undefined && { order }),
      },
    });
    return NextResponse.json({ resource });
  } catch (error) {
    console.error("PATCH /api/admin/ressources error:", error);
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

    await prisma.resource.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/ressources error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
