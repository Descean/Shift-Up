/**
 * /api/admin/blog — CRUD des articles de blog (admin)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (session.user.role !== "ADMIN" && session.user.role !== "DEVELOPER") return null;
  return session;
}

function slugify(text: string) {
  return text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// GET — liste tous les articles
export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const posts = await prisma.blogPost.findMany({
      orderBy: { publishedAt: "desc" },
      select: { id: true, title: true, slug: true, excerpt: true, content: true, category: true, published: true, views: true, publishedAt: true, authorName: true },
    });
    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/admin/blog error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// POST — créer un article
export async function POST(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const { title, excerpt, content, category, published } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Titre requis." }, { status: 422 });

    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: slugify(title),
        excerpt: excerpt ?? "",
        category: category ?? "Général",
        content: content ?? "",
        authorName: session.user.name ?? "SHIFT UP",
        authorId: session.user.id,
        published: published ?? false,
        publishedAt: published ? new Date() : null,
        readTime: 5,
      },
    });
    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/blog error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// PATCH — modifier un article
export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const { id, title, excerpt, content, category, published } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 422 });

    const post = await prisma.blogPost.update({
      where: { id },
      data: {
        ...(title    !== undefined && { title, slug: slugify(title) }),
        ...(excerpt  !== undefined && { excerpt }),
        ...(content  !== undefined && { content }),
        ...(category !== undefined && { category }),
        ...(published !== undefined && {
          published,
          publishedAt: published ? new Date() : null,
        }),
      },
    });
    return NextResponse.json({ post });
  } catch (error) {
    console.error("PATCH /api/admin/blog error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// DELETE — supprimer un article
export async function DELETE(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 422 });

    await prisma.blogPost.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/blog error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
