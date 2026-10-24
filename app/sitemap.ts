import { MetadataRoute } from "next";
import prisma from "@/lib/prisma";
import { OFFRES, offreOuverte } from "@/lib/recrutement/offres";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.shiftup.bj";
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

  // ── Formations à venir (les sessions passées ne sont pas référencées) ────────
  let formations: MetadataRoute.Sitemap = [];
  try {
    formations = (await prisma.formation.findMany({ where: { isActive: true, dateDebut: { gt: now } }, select: { slug: true, updatedAt: true } }))
      .map((f) => ({ url: `${baseUrl}/formations/${f.slug}`, lastModified: f.updatedAt, changeFrequency: "weekly", priority: 0.7 }));
  } catch {
    // base inaccessible au build : on continue sans
  }

  // ── Recrutement : page générale + offres ouvertes ────────────────────────────
  const recrutement: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/recrutement`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...OFFRES.filter((o) => offreOuverte(o)).map((o) => ({ url: `${baseUrl}/recrutement/${o.slug}`, lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
  ];

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

    ...formations,
    ...recrutement,

    // ── Pages légales ──────────────────────────────────────────────────────────
    { url: `${baseUrl}/mentions-legales`,     lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/confidentialite`,      lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/cgv`,                  lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/cookies`,              lastModified: now, changeFrequency: "yearly",  priority: 0.2 },

    // ── Articles de blog ───────────────────────────────────────────────────────
    ...blogPosts,
  ];
}
