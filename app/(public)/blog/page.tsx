import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import prisma from "@/lib/prisma";

export const metadata: Metadata = {
  title: "Blog & Ressources | SHIFT UP",
  description: "Articles, actualités et ressources sur le conseil stratégique, le numérique et l'entrepreneuriat au Bénin.",
};

const COVER_COLORS = [
  "from-blue-600 to-accent",
  "from-purple-600 to-pink-500",
  "from-orange-500 to-red-400",
  "from-secondary to-teal-500",
  "from-indigo-600 to-purple-500",
  "from-green-600 to-teal-400",
];

const categories = ["Tous", "Digital", "Finance", "Marketing", "Technologie", "Juridique", "Stratégie"];

export default async function BlogPage() {
  const dbPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true, slug: true, title: true, excerpt: true,
      category: true, tags: true, authorName: true,
      publishedAt: true, readTime: true, views: true, featured: true,
    },
  }).catch(() => []);

  const posts = dbPosts.map((p, i) => ({
    ...p,
    author: p.authorName,
    authorInitials: p.authorName.split(" ").map((n: string) => n[0]).slice(0, 2).join(""),
    coverColor: COVER_COLORS[i % COVER_COLORS.length],
  }));

  const featured = posts.find((p) => p.featured);
  const rest = posts.filter((p) => !p.featured);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
            <i className="fas fa-newspaper" />
            Blog & Ressources
          </span>
          <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4">
            Insights & <span className="gradient-text">Expertise</span>
          </h1>
          <p className="text-white/60 text-xl">
            Articles de fond, guides pratiques et actualités sur l'entrepreneuriat, le digital et la stratégie.
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-10">
            {categories.map((cat) => (
              <button
                key={cat}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  cat === "Tous"
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-500 hover:text-primary border border-gray-100"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Featured post */}
          {featured && (
            <Link href={`/blog/${featured.slug}`} className="block mb-10 group">
              <div className="bg-white rounded-3xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300">
                <div className={`h-64 bg-gradient-to-br ${featured.coverColor} relative`}>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <i className="fas fa-newspaper text-white/20 text-9xl" />
                  </div>
                  <div className="absolute top-5 left-5">
                    <span className="bg-white text-primary text-xs font-bold px-3 py-1.5 rounded-full">
                      A la une
                    </span>
                  </div>
                </div>
                <div className="p-8">
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full">
                      {featured.category}
                    </span>
                    <span className="text-gray-400 text-xs">
                      {formatDate(featured.publishedAt)}
                    </span>
                    <span className="text-gray-400 text-xs">
                      <i className="fas fa-clock mr-1" />
                      {featured.readTime} min
                    </span>
                    <span className="text-gray-400 text-xs">
                      <i className="fas fa-eye mr-1" />
                      {featured.views.toLocaleString()} vues
                    </span>
                  </div>
                  <h2 className="font-syne font-black text-2xl sm:text-3xl text-primary mb-3 group-hover:text-accent transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-gray-500 leading-relaxed">{featured.excerpt}</p>
                  <div className="mt-5 flex items-center gap-2 text-accent font-semibold text-sm group-hover:gap-3 transition-all">
                    Lire l'article <i className="fas fa-arrow-right text-xs" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Posts grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`} className="block group">
                <div className="bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 h-full">
                  <div className={`h-44 bg-gradient-to-br ${post.coverColor} relative`}>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <i className="fas fa-newspaper text-white/20 text-7xl" />
                    </div>
                    <div className="absolute top-4 left-4">
                      <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-semibold px-3 py-1 rounded-full">
                        {post.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center gap-3 mb-3 text-gray-400 text-xs">
                      <span>{formatDate(post.publishedAt)}</span>
                      <span>•</span>
                      <span>{post.readTime} min de lecture</span>
                    </div>
                    <h3 className="font-syne font-bold text-base text-primary mb-2 group-hover:text-accent transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed line-clamp-3 mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white text-xs font-bold">
                          {post.authorInitials}
                        </div>
                        <span className="text-xs text-gray-500">{post.author}</span>
                      </div>
                      <span className="text-gray-400 text-xs">
                        <i className="fas fa-eye mr-1" />{post.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* Load more */}
          <div className="text-center mt-10">
            <button className="bg-white border border-gray-200 text-primary px-8 py-3 rounded-xl font-semibold hover:border-accent hover:text-accent transition-all duration-200">
              Charger plus d'articles
              <i className="fas fa-arrow-down ml-2" />
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
