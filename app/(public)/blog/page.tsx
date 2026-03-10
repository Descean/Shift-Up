import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog & Ressources | SHIFT UP",
  description: "Articles, actualités et ressources sur le conseil stratégique, le numérique et l'entrepreneuriat au Bénin.",
};

// Mock data — replace with CMS/Supabase fetch
const posts = [
  {
    id: "1",
    slug: "transformation-digitale-pme-benin",
    title: "Transformation digitale : par où commencer pour une PME béninoise ?",
    excerpt:
      "La transformation numérique n'est plus une option. Voici une feuille de route pratique adaptée aux réalités des entreprises du Bénin.",
    category: "Digital",
    tags: ["Digital", "PME", "Stratégie"],
    author: "Jean-Eudes MÈTOGBÉ",
    authorInitials: "JE",
    publishedAt: new Date("2025-11-15"),
    readTime: 8,
    views: 1240,
    featured: true,
    coverColor: "from-blue-600 to-accent",
  },
  {
    id: "2",
    slug: "business-plan-erreurs-eviter",
    title: "Les 7 erreurs fatales dans un business plan que les investisseurs détestent",
    excerpt:
      "Après avoir analysé des centaines de business plans, voici les erreurs récurrentes qui font fuir les investisseurs et comment les éviter.",
    category: "Finance",
    tags: ["Business Plan", "Finance", "Entrepreneuriat"],
    author: "Jean-Eudes MÈTOGBÉ",
    authorInitials: "JE",
    publishedAt: new Date("2025-10-28"),
    readTime: 6,
    views: 890,
    featured: false,
    coverColor: "from-purple-600 to-pink-500",
  },
  {
    id: "3",
    slug: "marketing-digital-afrique-strategies",
    title: "Marketing digital en Afrique : 5 stratégies qui fonctionnent vraiment",
    excerpt:
      "Le marketing digital en Afrique a ses spécificités. Découvrez les approches éprouvées qui génèrent des résultats concrets.",
    category: "Marketing",
    tags: ["Marketing", "Digital", "Afrique"],
    author: "Jean-Eudes MÈTOGBÉ",
    authorInitials: "JE",
    publishedAt: new Date("2025-10-10"),
    readTime: 7,
    views: 2100,
    featured: false,
    coverColor: "from-orange-500 to-red-400",
  },
  {
    id: "4",
    slug: "ia-entreprise-benin-opportunites",
    title: "Intelligence artificielle : les opportunités concrètes pour votre entreprise au Bénin",
    excerpt:
      "L'IA n'est plus réservée aux grandes tech. Voici comment les PME béninoises peuvent en tirer parti dès aujourd'hui.",
    category: "Technologie",
    tags: ["IA", "Technologie", "Innovation"],
    author: "Jean-Eudes MÈTOGBÉ",
    authorInitials: "JE",
    publishedAt: new Date("2025-09-20"),
    readTime: 9,
    views: 1560,
    featured: false,
    coverColor: "from-secondary to-teal-500",
  },
  {
    id: "5",
    slug: "creation-entreprise-benin-guide",
    title: "Guide complet pour créer son entreprise au Bénin en 2025",
    excerpt:
      "De l'idée à l'immatriculation : toutes les étapes, les coûts et les pièges à éviter pour lancer votre activité au Bénin.",
    category: "Juridique",
    tags: ["Création", "Juridique", "RCCM"],
    author: "Jean-Eudes MÈTOGBÉ",
    authorInitials: "JE",
    publishedAt: new Date("2025-09-05"),
    readTime: 12,
    views: 3200,
    featured: false,
    coverColor: "from-indigo-600 to-purple-500",
  },
];

const categories = ["Tous", "Digital", "Finance", "Marketing", "Technologie", "Juridique", "Stratégie"];

export default function BlogPage() {
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
