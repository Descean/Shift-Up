import type { Metadata } from "next";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import prisma from "@/lib/prisma";
import NewsletterForm from "@/components/layout/NewsletterForm";
import { BandeauTitre, Puce, TitrePoints, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Blog & Ressources",
  description: "Articles, actualités et ressources sur le conseil stratégique, le numérique et l'entrepreneuriat au Bénin.",
};

const FONDS = ["bg-su-nuit", "bg-su-cadet", "bg-su-bleu"];

function Couverture({ image, categorie, index, grande = false }: { image: string | null; categorie: string; index: number; grande?: boolean }) {
  return (
    <div className={`relative overflow-hidden ${grande ? "min-h-[280px] lg:min-h-full" : "h-44"} ${FONDS[index % FONDS.length]}`}
      style={image ? { backgroundImage: `url(${image})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}>
      {!image && <>
        <span aria-hidden="true" className="absolute right-[-70px] top-[-90px] h-[260px] w-[260px] rounded-full border-[30px] border-white/10" />
        <span aria-hidden="true" className="absolute bottom-[-60px] left-[-40px] h-[180px] w-[180px] rounded-full border border-su-ciel/40" />
      </>}
      <span className="absolute left-4 top-4 rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-su-bleu">{categorie}</span>
    </div>
  );
}

export default async function BlogPage({ searchParams }: { searchParams: Promise<{ categorie?: string }> }) {
  const { categorie } = await searchParams;
  const dbPosts = await prisma.blogPost.findMany({
    where: { published: true },
    orderBy: [{ featured: "desc" }, { publishedAt: "desc" }],
    select: {
      id: true, slug: true, title: true, excerpt: true, coverImage: true,
      category: true, authorName: true, publishedAt: true, readTime: true, featured: true,
    },
  }).catch(() => []);

  const categories = Array.from(new Set(dbPosts.map((p) => p.category)));
  const posts = categorie ? dbPosts.filter((p) => p.category === categorie) : dbPosts;
  const featured = posts.find((p) => p.featured) ?? posts[0];
  const rest = posts.filter((p) => p !== featured);

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Conseils et repères" accent="pour entreprendre au Bénin."
        texte="Marchés publics, fiscalité, formation, numérique : des articles concrets, écrits par l'équipe SHIFT UP.">
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2.5">
            <Link href="/blog"><Puce actif={!categorie}>Tous les articles</Puce></Link>
            {categories.map((c) => (
              <Link key={c} href={`/blog?categorie=${encodeURIComponent(c)}`}><Puce actif={categorie === c}>{c}</Puce></Link>
            ))}
          </div>
        )}
      </BandeauTitre>

      <section className="bg-white py-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6">
          {!featured ? (
            <div className="rounded-2xl border border-su-lavande bg-su-brume p-10 text-center">
              <h2 className={`${titreFont} m-0 mb-2 text-xl font-bold text-su-nuit`}>Les premiers articles arrivent bientôt</h2>
              <p className="m-0 text-[#4B5563]">Inscrivez-vous à la lettre ci-dessous pour les recevoir dès leur parution.</p>
            </div>
          ) : (
            <Link href={`/blog/${featured.slug}`}
              className="group grid overflow-hidden rounded-3xl border border-su-lavande bg-white transition-shadow hover:shadow-[0_16px_40px_rgba(30,46,79,0.12)] lg:grid-cols-[1.1fr_1fr]">
              <Couverture image={featured.coverImage} categorie={featured.category} index={0} grande />
              <div className="flex flex-col justify-center gap-4 p-8 sm:p-10">
                <span className="text-[13px] text-[#6B7280]">{formatDate(featured.publishedAt ?? new Date())} · {featured.readTime} min de lecture</span>
                <h2 className={`${titreFont} m-0 text-[26px] font-extrabold leading-tight text-su-nuit group-hover:text-su-bleu sm:text-[30px]`}>{featured.title}</h2>
                <p className="m-0 text-base leading-relaxed text-[#4B5563]">{featured.excerpt}</p>
                <span className="inline-flex items-center gap-2 text-[15px] font-semibold text-su-bleu">Lire l&apos;article <Icone nom="fleche" taille={18} epaisseur={2} /></span>
              </div>
            </Link>
          )}

          {rest.length > 0 && (
            <div className="flex flex-col gap-8">
              <TitrePoints>Derniers articles</TitrePoints>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, i) => (
                  <Link key={post.id} href={`/blog/${post.slug}`}
                    className="group flex flex-col overflow-hidden rounded-2xl border border-su-lavande bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(30,46,79,0.12)]">
                    <Couverture image={post.coverImage} categorie={post.category} index={i + 1} />
                    <div className="flex flex-1 flex-col gap-2.5 p-6">
                      <span className="text-xs text-[#6B7280]">{formatDate(post.publishedAt ?? new Date())} · {post.readTime} min</span>
                      <h3 className={`${titreFont} m-0 line-clamp-2 text-lg font-bold leading-snug text-su-nuit group-hover:text-su-bleu`}>{post.title}</h3>
                      <p className="m-0 line-clamp-3 text-sm leading-relaxed text-[#4B5563]">{post.excerpt}</p>
                      <span className="mt-auto pt-2 text-xs text-[#6B7280]">{post.authorName}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="bg-white pb-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <div className="relative grid items-center gap-8 overflow-hidden rounded-3xl bg-su-nuit p-8 sm:p-12 lg:grid-cols-2">
            <span aria-hidden="true" className="absolute right-[-120px] top-[-160px] h-[400px] w-[400px] rounded-full border border-su-ciel/25" />
            <div className="relative flex flex-col gap-3">
              <TitrePoints taille="text-[28px]" clair>La lettre SHIFT UP</TitrePoints>
              <p className="m-0 text-[15px] leading-relaxed text-su-lavande">Un e-mail par mois : nouveaux articles, appels d&apos;offres à surveiller et dates des formations.</p>
            </div>
            <div className="relative"><NewsletterForm /></div>
          </div>
        </div>
      </section>
    </div>
  );
}
