/**
 * app/(public)/blog/[slug]/page.tsx — Page d'article de blog (dynamique)
 *
 * Rendu serveur dynamique : l'article est chargé depuis la base de données
 * à chaque requête via Prisma, ce qui permet d'afficher tous les articles
 * créés ou importés sans rebuild.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import prisma from "@/lib/prisma";
import ArticleContent from "@/components/blog/ArticleContent";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

// ── Couleur de couverture selon la catégorie ─────────────────────────────────
function coverColorForCategory(category: string): string {
  const map: Record<string, string> = {
    "Conseil & Stratégie":              "from-accent-600 to-accent",
    "Marchés Publics & Dossiers":       "from-accent-600 to-accent-500",
    "Juridique & Comptabilité":         "from-accent-600 to-secondary-500",
    "Communication & Marketing":        "from-secondary-500 to-secondary-400",
    "BTP & Génie Civil":                "from-secondary-600 to-secondary-500",
    "Solutions Numériques":             "from-accent to-accent-700",
    "Transformation Digitale":          "from-accent-600 to-accent",
    "Data & Business Intelligence":     "from-secondary to-primary-500",
    "Formation & Coaching":             "from-accent-500 to-secondary-500",
    "RSE & Développement Durable":      "from-primary-500 to-primary-600",
    "Finance & Investissement":         "from-primary-600 to-primary-500",
  };
  return map[category] ?? "from-accent to-secondary";
}

// ── generateMetadata ─────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    select: { title: true, excerpt: true, category: true },
  });
  if (!post) return { title: "Article introuvable" };
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://www.shiftup.bj";
  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      type: "article",
      url: `${baseUrl}/blog/${slug}`,
      siteName: "SHIFT UP",
      images: [{ url: `${baseUrl}/assets/og-image.png`, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: [`${baseUrl}/assets/og-image.png`],
    },
  };
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  const post = await prisma.blogPost.findUnique({ where: { slug, published: true } });
  if (!post) notFound();

  // Articles similaires (même catégorie en priorité)
  const related = await prisma.blogPost.findMany({
    where: { published: true, slug: { not: slug } },
    select: { id: true, slug: true, title: true, readTime: true, category: true },
    orderBy: [
      { category: "asc" }, // même catégorie remonte
      { publishedAt: "desc" },
    ],
    take: 3,
  });

  const authorInitials = post.authorName
    .split(" ")
    .map((w) => w[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase() || "SU";

  const coverColor = coverColorForCategory(post.category);

  return (
    <div className="min-h-screen">
      {/* ── Héro ── */}
      <section className="bg-primary pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10 max-w-4xl">
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <i className="fas fa-arrow-left text-xs" />
            Retour au blog
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="bg-accent/20 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              {post.category}
            </span>
            {post.publishedAt && (
              <span className="text-white/40 text-sm">{formatDate(post.publishedAt)}</span>
            )}
            <span className="text-white/40 text-sm">
              <i className="fas fa-clock mr-1" />
              {post.readTime} min de lecture
            </span>
            <span className="text-white/40 text-sm">
              <i className="fas fa-eye mr-1" />
              {post.views.toLocaleString()} vues
            </span>
          </div>

          <h1 className="font-syne font-black text-3xl sm:text-4xl lg:text-5xl text-white mb-6 leading-tight">
            {post.title}
          </h1>

          <p className="text-white/60 text-lg leading-relaxed mb-8">{post.excerpt}</p>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {authorInitials}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{post.authorName}</p>
              <p className="text-white/40 text-xs">SHIFT UP</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Couverture colorée ── */}
      <div className={`h-64 bg-gradient-to-br ${coverColor} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-newspaper text-white/10 text-[160px]" />
        </div>
      </div>

      {/* ── Corps + sidebar ── */}
      <section className="section-padding bg-paper">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-10">

            {/* Article principal */}
            <article className="lg:col-span-2 bg-white rounded-3xl shadow-card p-8 md:p-10">
              {post.content ? <ArticleContent contenu={post.content} /> : (
                <p className="text-gray-500 italic">Contenu en cours de rédaction…</p>
              )}

              {/* Tags */}
              {Array.isArray(post.tags) && post.tags.length > 0 && (
                <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                  {(post.tags as string[]).map((tag) => (
                    <span
                      key={tag}
                      className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Partage */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-500">Partager :</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + " — https://www.shiftup.bj/blog/" + post.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-accent text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-accent-600 transition-colors"
                >
                  <i className="fab fa-whatsapp" />WhatsApp
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=https://www.shiftup.bj/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-accent-700 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-accent-800 transition-colors"
                >
                  <i className="fab fa-linkedin-in" />LinkedIn
                </a>
              </div>
            </article>

            {/* Sidebar */}
            <aside className="space-y-6">
              {/* CTA */}
              <div className="bg-primary rounded-3xl p-6 text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-alt text-accent text-xl" />
                </div>
                <h3 className="font-syne font-bold text-white text-lg mb-2">RDV Gratuit</h3>
                <p className="text-white/50 text-sm mb-5">
                  Premier diagnostic offert. Échangeons sur votre projet.
                </p>
                <Link
                  href="/contact"
                  className="block w-full bg-gradient-to-r from-accent to-secondary text-white text-sm font-semibold py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Prendre RDV
                </Link>
              </div>

              {/* Auteur */}
              <div className="bg-white rounded-3xl shadow-card p-6">
                <h4 className="font-syne font-bold text-primary mb-4">À propos de l&apos;auteur</h4>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    {authorInitials}
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{post.authorName}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                      Expert en conseil stratégique et solutions numériques pour entreprises béninoises et africaines.
                    </p>
                  </div>
                </div>
              </div>

              {/* Articles similaires */}
              {related.length > 0 && (
                <div className="bg-white rounded-3xl shadow-card p-6">
                  <h4 className="font-syne font-bold text-primary mb-4">Articles similaires</h4>
                  <div className="space-y-4">
                    {related.map((r) => {
                      const rColor = coverColorForCategory(r.category);
                      return (
                        <Link key={r.id} href={`/blog/${r.slug}`} className="block group">
                          <div className="flex gap-3">
                            <div className={`w-14 h-14 bg-gradient-to-br ${rColor} rounded-xl flex-shrink-0`} />
                            <div>
                              <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                                {r.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-1">{r.readTime} min</p>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              )}
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
