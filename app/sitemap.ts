import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://shiftup.bj";
  const now = new Date();

  // ── Articles de blog publiés ────────────────────────────────────────────────
  let blogPosts: MetadataRoute.Sitemap = [];
  try {
    const posts = await prisma.blogPost.findMany({
      where: { published: true },
      select: { slug: true, updatedAt: true },
      orderBy: { updatedAt: "desc" },
    });
    blogPosts = posts.map((post) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.updatedAt,
      changeFrequency: "monthly",
      priority: 0.7,
    }));
  } catch {
    // Ne bloque pas le build si la DB est inaccessible
  }

  return [
    // ── Pages principales ──────────────────────────────────────────────────────
    { url: baseUrl,                           lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${baseUrl}/services`,             lastModified: now, changeFrequency: "monthly", priority: 0.9 },
    { url: `${baseUrl}/services/souscrire`,   lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/boutique`,             lastModified: now, changeFrequency: "weekly",  priority: 0.8 },
    { url: `${baseUrl}/contact`,              lastModified: now, changeFrequency: "monthly", priority: 0.8 },

    // ── Pages secondaires ──────────────────────────────────────────────────────
    { url: `${baseUrl}/a-propos`,             lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/blog`,                 lastModified: now, changeFrequency: "daily",   priority: 0.8 },
    { url: `${baseUrl}/faq`,                  lastModified: now, changeFrequency: "weekly",  priority: 0.6 },

    // ── Pages légales ──────────────────────────────────────────────────────────
    { url: `${baseUrl}/mentions-legales`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/confidentialite`,      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/cgv`,                  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },

    // ── Articles de blog ───────────────────────────────────────────────────────
    ...blogPosts,
  ];
}
