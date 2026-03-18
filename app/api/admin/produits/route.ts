/**
 * GET    /api/admin/produits       — Liste tous les produits
 * POST   /api/admin/produits       — Créer un produit
 * PATCH  /api/admin/produits       — Modifier un produit
 * DELETE /api/admin/produits?id=xx — Supprimer un produit
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

  const products = await prisma.product.findMany({ orderBy: [{ createdAt: "desc" }] });
  return NextResponse.json({ products });
}

export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const body = await req.json();
    const { name, description, type, category, price, currency, downloadUrl, previewUrl, thumbnail, features, tags, isActive, isFeatured, stock } = body;

    if (!name?.trim() || !type || price === undefined) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }

    const product = await prisma.product.create({
      data: {
        name, description: description ?? "", type,
        category: category || null,
        price: Number(price),
        currency: currency ?? "XOF",
        downloadUrl: downloadUrl || null,
        previewUrl: previewUrl || null,
        thumbnail: thumbnail || null,
        features: features ?? [],
        tags: tags ?? [],
        isActive: isActive ?? true,
        isFeatured: isFeatured ?? false,
        stock: stock != null ? Number(stock) : null,
      },
    });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("POST /api/admin/produits error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { id, ...data } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 400 });

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.category !== undefined && { category: data.category || null }),
        ...(data.price !== undefined && { price: Number(data.price) }),
        ...(data.currency !== undefined && { currency: data.currency }),
        ...(data.downloadUrl !== undefined && { downloadUrl: data.downloadUrl || null }),
        ...(data.previewUrl !== undefined && { previewUrl: data.previewUrl || null }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail || null }),
        ...(data.features !== undefined && { features: data.features }),
        ...(data.tags !== undefined && { tags: data.tags }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
        ...(data.isFeatured !== undefined && { isFeatured: data.isFeatured }),
        ...(data.stock !== undefined && { stock: data.stock != null ? Number(data.stock) : null }),
      },
    });
    return NextResponse.json({ product });
  } catch (error) {
    console.error("PATCH /api/admin/produits error:", error);
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
    await prisma.product.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/produits error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
