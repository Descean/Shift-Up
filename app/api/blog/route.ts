/**
 * GET /api/blog — Articles publiés (public)
 */
import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? undefined;

  try {
    const posts = await prisma.blogPost.findMany({
      where: {
        published: true,
        ...(category && category !== "Tous" ? { category } : {}),
      },
      orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
      select: {
        id: true, slug: true, title: true, excerpt: true,
        category: true, tags: true, authorName: true,
        publishedAt: true, readTime: true, views: true,
        featured: true, coverImage: true,
      },
    });

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("GET /api/blog error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
