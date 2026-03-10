/**
 * app/(public)/blog/[slug]/page.tsx — Page d'article de blog (route dynamique)
 *
 * Cette page affiche le détail d'un article de blog identifié par son `slug`
 * (ex : /blog/transformation-digitale-pme-benin).
 *
 * Stratégie de rendu — Génération Statique (SSG) :
 *   `generateStaticParams` liste tous les slugs disponibles. Next.js pré-génère
 *   une page HTML pour chacun au moment du build → ultra-rapide et bon pour le SEO.
 *
 * ⚠️  À faire en production :
 *   Remplacer le tableau `posts` statique par un fetch Supabase/CMS :
 *   const post = await prisma.blogPost.findUnique({ where: { slug } })
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";

// ── Données statiques des articles ───────────────────────────────────────────
// TODO production : remplacer par prisma.blogPost.findMany() ou appel CMS
const posts = [
  {
    id: "1",
    slug: "transformation-digitale-pme-benin",
    title: "Transformation digitale : par où commencer pour une PME béninoise ?",
    excerpt:
      "La transformation numérique n'est plus une option. Voici une feuille de route pratique adaptée aux réalités des entreprises du Bénin.",
    content: `
La transformation digitale est sur toutes les lèvres, mais pour beaucoup de PME béninoises, elle reste un concept flou et intimidant. Par où commencer ? Quels outils adopter ? Quel budget prévoir ?

## Pourquoi la transformation digitale est urgente au Bénin

Le marché béninois évolue rapidement. Les consommateurs sont de plus en plus connectés, les processus manuels coûtent cher en temps et en erreurs, et la concurrence s'intensifie. Les entreprises qui tardent à se digitaliser prennent le risque de perdre des parts de marché irrémédiablement.

Selon nos observations terrain, les PME qui ont entamé une démarche digitale ont constaté en moyenne :
- Une réduction de 30% des coûts opérationnels
- Une augmentation de 40% de la satisfaction client
- Un gain de temps de 5 à 10 heures par semaine sur les tâches administratives

## Les 5 étapes d'une transformation réussie

### 1. Auditer l'existant

Avant d'investir dans des outils, cartographiez vos processus actuels. Quelles tâches sont répétitives ? Où perdez-vous du temps ? Quelles informations manquent à vos équipes ?

### 2. Définir des priorités claires

Ne cherchez pas à tout digitaliser d'un coup. Identifiez les 2-3 chantiers qui auront le plus d'impact sur votre chiffre d'affaires ou vos coûts.

### 3. Choisir les bons outils

Il n'existe pas d'outil universel. Un logiciel de comptabilité, un CRM, un outil de gestion de projets — chaque solution doit répondre à un besoin spécifique identifié.

### 4. Former vos équipes

La technologie seule ne suffit pas. L'adoption par vos équipes est la clé du succès. Prévoyez du temps de formation et d'accompagnement au changement.

### 5. Mesurer et ajuster

Définissez des indicateurs de performance (KPIs) dès le départ. Mesurez l'impact de chaque initiative et ajustez en fonction des résultats.

## Par où commencer concrètement ?

Pour une PME béninoise avec un budget limité, nous recommandons de démarrer par :

**Présence en ligne** : Un site web professionnel reste la base. C'est votre vitrine 24h/24.

**Gestion comptable** : Remplacer les tableurs Excel par un logiciel comptable adapté est un ROI rapide.

**Communication client** : WhatsApp Business, email marketing, réseaux sociaux — définissez où sont vos clients et soyez présents.

**Paiement digital** : Intégrer MTN Mobile Money ou Moov facilite la collecte et réduit les impayés.

## Conclusion

La transformation digitale n'est pas une révolution overnight. C'est un processus continu qui demande méthode et persévérance. L'essentiel est de commencer, même modestement, et de progresser étape par étape.

Chez SHIFT UP, nous accompagnons les PME béninoises dans cette transformation avec des solutions sur mesure, adaptées à leurs réalités et à leur budget. Contactez-nous pour un diagnostic gratuit.
    `,
    category: "Digital",
    tags: ["Digital", "PME", "Stratégie"],
    author: "Jean-Eudes MÈTOGBÉ GNANCADJA",
    authorInitials: "JE",
    publishedAt: new Date("2025-11-15"),
    readTime: 8,
    views: 1240,
    coverColor: "from-blue-600 to-accent",
  },
  {
    id: "2",
    slug: "business-plan-erreurs-eviter",
    title: "Les 7 erreurs fatales dans un business plan que les investisseurs détestent",
    excerpt:
      "Après avoir analysé des centaines de business plans, voici les erreurs récurrentes qui font fuir les investisseurs et comment les éviter.",
    content: `
Un business plan est votre carte de visite auprès des investisseurs, banques et partenaires. Pourtant, la majorité des plans que nous analysons souffrent des mêmes erreurs rédhibitoires.

## Erreur 1 : Des projections financières irréalistes

C'est l'erreur la plus fréquente. Des prévisions de croissance à 300% la première année sans justification sérieuse ? Les investisseurs professionnels voient cela immédiatement et perdent confiance.

**La solution** : Basez vos projections sur des données réelles du marché. Présentez plusieurs scénarios (pessimiste, réaliste, optimiste) et expliquez vos hypothèses.

## Erreur 2 : Ignorer la concurrence

"Nous n'avons pas de concurrents" — cette phrase est un signal d'alarme immédiat. Soit vous n'avez pas fait votre recherche, soit le marché n'existe pas.

**La solution** : Identifiez tous les concurrents directs et indirects. Expliquez précisément votre avantage différenciant.

## Erreur 3 : Un marché cible flou

"Notre cible, c'est tout le monde" est la phrase qui tue un business plan. Plus votre cible est large, moins votre stratégie est crédible.

**La solution** : Définissez précisément votre persona client. Âge, revenus, habitudes, problèmes spécifiques.

## Erreur 4 : Négliger l'aspect opérationnel

Beaucoup de plans décrivent le "quoi" mais pas le "comment". Comment allez-vous produire, livrer, gérer au quotidien ?

## Erreur 5 : Sous-estimer le besoin en trésorerie

Les entreprises meurent rarement par manque de clients — elles meurent par manque de cash. Le décalage entre encaissements et décaissements tue les jeunes entreprises.

## Erreur 6 : Une équipe non présentée

Les investisseurs investissent d'abord dans des personnes. Si votre plan ne présente pas clairement l'équipe et ses compétences, c'est une lacune majeure.

## Erreur 7 : Un business plan trop long

Un bon business plan fait 20 à 30 pages maximum. Au-delà, vous perdez l'attention de vos lecteurs.

## Conclusion

Un business plan solide demande du temps et de la rigueur. Chez SHIFT UP, nous vous accompagnons dans sa rédaction avec une méthodologie éprouvée.
    `,
    category: "Finance",
    tags: ["Business Plan", "Finance", "Entrepreneuriat"],
    author: "Jean-Eudes MÈTOGBÉ GNANCADJA",
    authorInitials: "JE",
    publishedAt: new Date("2025-10-28"),
    readTime: 6,
    views: 890,
    coverColor: "from-purple-600 to-pink-500",
  },
  {
    id: "3",
    slug: "marketing-digital-afrique-strategies",
    title: "Marketing digital en Afrique : 5 stratégies qui fonctionnent vraiment",
    excerpt:
      "Le marketing digital en Afrique a ses spécificités. Découvrez les approches éprouvées qui génèrent des résultats concrets.",
    content: `
Le marketing digital en Afrique ne s'improvise pas. Ce qui fonctionne en Europe ou aux États-Unis ne donne pas nécessairement les mêmes résultats sur notre continent. Voici 5 stratégies testées et approuvées.

## 1. WhatsApp Marketing — le canal roi

En Afrique de l'Ouest, WhatsApp n'est pas qu'une application de messagerie — c'est le canal de communication business numéro un. Taux d'ouverture des messages WhatsApp : 98%.

**Comment l'exploiter** : Créez un groupe ou une liste de diffusion, envoyez des contenus à valeur ajoutée (pas que des promotions), et engagez la conversation.

## 2. Le contenu vidéo court sur TikTok et Reels

La vidéo courte explose au Bénin et dans toute l'Afrique de l'Ouest. L'accès mobile facilite la consommation de contenu vidéo, même avec une connexion moyenne.

## 3. Le marketing d'influence local

Les influenceurs locaux ont une audience qualifiée et engagée. Un influenceur avec 50 000 abonnés béninois vaut souvent plus qu'un mega-influenceur avec 1 million d'abonnés parisiens.

## 4. Le SEO en français et en langues locales

Beaucoup d'entreprises négligent le référencement naturel. Pourtant, être en première page Google pour "création entreprise Bénin" ou "conseil stratégique Abomey-Calavi" génère des prospects qualifiés gratuitement.

## 5. Le bouche-à-oreille digitalisé

En Afrique, la recommandation reste le canal d'acquisition le plus puissant. Digitalisez-le avec un programme de parrainage, des avis Google, et des témoignages clients sur vos réseaux.

## Conclusion

Le marketing digital efficace en Afrique combine les codes locaux avec les meilleures pratiques mondiales. Authenticité, proximité et pertinence culturelle sont les maîtres mots.
    `,
    category: "Marketing",
    tags: ["Marketing", "Digital", "Afrique"],
    author: "Jean-Eudes MÈTOGBÉ GNANCADJA",
    authorInitials: "JE",
    publishedAt: new Date("2025-10-10"),
    readTime: 7,
    views: 2100,
    coverColor: "from-orange-500 to-red-400",
  },
  {
    id: "4",
    slug: "ia-entreprise-benin-opportunites",
    title: "Intelligence artificielle : les opportunités concrètes pour votre entreprise au Bénin",
    excerpt:
      "L'IA n'est plus réservée aux grandes tech. Voici comment les PME béninoises peuvent en tirer parti dès aujourd'hui.",
    content: `
L'intelligence artificielle est souvent perçue comme une technologie réservée aux grandes entreprises tech. C'est faux. En 2025, des PME béninoises peuvent déjà bénéficier de l'IA à des coûts accessibles.

## Les cas d'usage IA accessibles aux PME

### Service client automatisé

Un chatbot IA peut répondre aux questions fréquentes de vos clients 24h/24, qualifier les leads, et escalader les demandes complexes à votre équipe. Résultat : moins de temps perdu sur des questions répétitives.

### Rédaction de contenu assistée

Les outils IA comme ChatGPT ou Claude peuvent vous aider à rédiger des propositions commerciales, des posts réseaux sociaux, des emails clients. Gain de temps : 2-3 heures par semaine.

### Analyse de données

L'IA peut analyser vos données de vente, identifier des tendances, et vous aider à prendre de meilleures décisions. Plus besoin d'un data scientist à plein temps.

### Automatisation des tâches répétitives

Tri d'emails, génération de rapports, extraction de données de documents — l'IA peut automatiser des centaines de petites tâches chronophages.

## Comment démarrer ?

1. Identifiez 2-3 tâches répétitives qui vous font perdre le plus de temps
2. Explorez les outils existants (ChatGPT, Claude, Gemini, Make.com)
3. Commencez par un POC (proof of concept) à petite échelle
4. Mesurez le ROI avant de généraliser

## Les limites à connaître

L'IA ne remplace pas le jugement humain. Elle augmente vos capacités mais demande supervision et validation. Ne lui faites pas confiance aveuglément sur des décisions critiques.

## Conclusion

L'IA est une opportunité, pas une menace. Les entreprises qui apprennent à l'utiliser aujourd'hui auront un avantage concurrentiel significatif demain. SHIFT UP vous accompagne dans l'intégration de l'IA à votre business.
    `,
    category: "Technologie",
    tags: ["IA", "Technologie", "Innovation"],
    author: "Jean-Eudes MÈTOGBÉ GNANCADJA",
    authorInitials: "JE",
    publishedAt: new Date("2025-09-20"),
    readTime: 9,
    views: 1560,
    coverColor: "from-secondary to-teal-500",
  },
  {
    id: "5",
    slug: "creation-entreprise-benin-guide",
    title: "Guide complet pour créer son entreprise au Bénin en 2025",
    excerpt:
      "De l'idée à l'immatriculation : toutes les étapes, les coûts et les pièges à éviter pour lancer votre activité au Bénin.",
    content: `
Créer son entreprise au Bénin est aujourd'hui plus accessible qu'il y a 10 ans, grâce aux réformes du cadre des affaires. Voici le guide complet pour vous lancer en toute sérénité.

## Étape 1 : Choisir la forme juridique

Au Bénin, les principales formes juridiques sont :

- **SARL** (Société à Responsabilité Limitée) : idéale pour les petites et moyennes entreprises. Capital minimum : 100 000 FCFA.
- **SA** (Société Anonyme) : pour les projets plus ambitieux nécessitant plusieurs actionnaires.
- **EI** (Entreprise Individuelle) : la forme la plus simple, mais vous êtes personnellement responsable des dettes.
- **SAS** (Société par Actions Simplifiée) : forme flexible et moderne, recommandée pour les startups.

## Étape 2 : Rédiger les statuts

Les statuts définissent les règles de fonctionnement de votre entreprise. Ils doivent inclure : la dénomination sociale, le siège social, l'objet social, le capital, la répartition des parts.

**Attention** : Des statuts mal rédigés peuvent créer des problèmes juridiques graves. Faites-vous accompagner par un professionnel.

## Étape 3 : Ouvrir un compte bancaire professionnel

Pour les SARL et SA, un compte bancaire est obligatoire pour déposer le capital social. Les principales banques : BOA, Ecobank, UBA, SGF.

## Étape 4 : Immatriculation au RCCM

L'immatriculation au Registre du Commerce et du Crédit Mobilier (RCCM) se fait au Tribunal de Commerce de Cotonou ou auprès du GUFE (Guichet Unique de Formalisation des Entreprises).

**Documents requis** : statuts, pièce d'identité des associés, justificatif de domicile, attestation de dépôt de capital.

**Délai** : 3 à 7 jours ouvrables.
**Coût** : 35 000 à 75 000 FCFA selon la forme juridique.

## Étape 5 : Obtenir l'IFU

L'Identifiant Fiscal Unique est obtenu auprès de la Direction Générale des Impôts (DGI). Il est indispensable pour toutes vos opérations commerciales et fiscales.

**Délai** : 24 à 48 heures.
**Coût** : Gratuit.

## Étape 6 : Affilier vos employés à la CNSS

Si vous avez des salariés, leur affiliation à la Caisse Nationale de Sécurité Sociale est obligatoire dès le premier jour d'embauche.

## Coûts récapitulatifs

| Étape | Coût estimé |
|-------|------------|
| Rédaction statuts | 50 000 – 150 000 FCFA |
| Immatriculation RCCM | 35 000 – 75 000 FCFA |
| Compte bancaire (dépôt) | Selon capital |
| IFU | Gratuit |
| **Total** | **85 000 – 225 000 FCFA** |

## Les pièges à éviter

- Ne choisissez pas votre forme juridique au hasard
- Ne rédigez pas vos statuts seul sans accompagnement
- N'oubliez pas de déclarer votre activité à la mairie
- Commencez à tenir une comptabilité dès le premier jour

## Conclusion

Créer une entreprise au Bénin est accessible avec le bon accompagnement. SHIFT UP vous guide à travers toutes les étapes, de la rédaction des statuts à l'immatriculation, pour un démarrage serein.
    `,
    category: "Juridique",
    tags: ["Création", "Juridique", "RCCM"],
    author: "Jean-Eudes MÈTOGBÉ GNANCADJA",
    authorInitials: "JE",
    publishedAt: new Date("2025-09-05"),
    readTime: 12,
    views: 3200,
    coverColor: "from-indigo-600 to-purple-500",
  },
];

// ── Type des props de la page (Next.js App Router) ────────────────────────────
// `params` est une Promise en Next.js 15+ — on attend son résolution avec await.
type Props = { params: Promise<{ slug: string }> };

/**
 * generateMetadata — Génère les balises <title> et <meta description> dynamiquement.
 * Appelé côté serveur par Next.js avant le rendu pour chaque article.
 * Si le slug est inconnu, retourne un titre générique.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);
  if (!post) return { title: "Article introuvable | SHIFT UP" };
  return {
    title: `${post.title} | SHIFT UP Blog`,
    description: post.excerpt,
  };
}

/**
 * generateStaticParams — Liste tous les slugs pour la génération statique.
 * Next.js appelle cette fonction au build pour pré-générer chaque page article
 * en HTML statique. Résultat : chargement instantané et excellent SEO.
 *
 * TODO production : remplacer par un fetch depuis Supabase :
 *   const posts = await prisma.blogPost.findMany({ where: { published: true }, select: { slug: true } })
 */
export function generateStaticParams() {
  return posts.map((p) => ({ slug: p.slug }));
}

/**
 * BlogPostPage — Composant de page serveur (Server Component, pas de "use client").
 *
 * Flux :
 *  1. Récupère le slug depuis les params URL.
 *  2. Cherche l'article correspondant dans le tableau `posts`.
 *  3. Si introuvable → `notFound()` affiche la page 404 de Next.js.
 *  4. Sélectionne 3 articles "similaires" (tous sauf l'actuel) pour la sidebar.
 *  5. Rend la page : hero, image de couverture, article principal, sidebar.
 */
export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = posts.find((p) => p.slug === slug);

  // Article introuvable → page 404 automatique de Next.js
  if (!post) notFound();

  // Articles similaires : jusqu'à 3 articles différents de celui affiché
  const related = posts.filter((p) => p.slug !== slug).slice(0, 3);

  /**
   * renderContent — Parseur markdown simplifié pour afficher le contenu.
   * Transforme le texte brut en éléments React selon le préfixe de chaque ligne :
   *  - "## "  → <h2>
   *  - "### " → <h3>
   *  - "**texte**" (ligne entière) → <p> en gras
   *  - "- "  → <li> avec icône check
   *  - "|"   → ignoré (tableaux non supportés — affichés dans le texte brut)
   *  - ""    → espacement vertical
   *  - autre → <p> normal
   */
  const renderContent = (content: string) => {
    return content
      .trim()
      .split("\n")
      .map((line, i) => {
        if (line.startsWith("## ")) {
          return (
            <h2 key={i} className="font-syne font-bold text-2xl text-primary mt-10 mb-4">
              {line.replace("## ", "")}
            </h2>
          );
        }
        if (line.startsWith("### ")) {
          return (
            <h3 key={i} className="font-syne font-bold text-lg text-primary mt-6 mb-3">
              {line.replace("### ", "")}
            </h3>
          );
        }
        if (line.startsWith("**") && line.endsWith("**")) {
          return (
            <p key={i} className="font-semibold text-primary mb-2">
              {line.replace(/\*\*/g, "")}
            </p>
          );
        }
        if (line.startsWith("- ")) {
          return (
            <li key={i} className="flex items-start gap-2 text-gray-600 mb-1.5">
              <i className="fas fa-check text-secondary text-xs mt-1.5 flex-shrink-0" />
              <span>{line.replace("- ", "")}</span>
            </li>
          );
        }
        if (line.startsWith("|") && line.includes("|")) {
          return null; // Les lignes de tableau sont ignorées (simplification)
        }
        if (line.trim() === "") return <div key={i} className="mb-4" />;
        return (
          <p key={i} className="text-gray-600 leading-relaxed mb-4">
            {line}
          </p>
        );
      });
  };

  return (
    <div className="min-h-screen">
      {/* ── Section héro : fond sombre avec titre et méta de l'article ── */}
      <section className="bg-primary pt-28 pb-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10 max-w-4xl">
          {/* Lien retour vers la liste des articles */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-white/60 hover:text-white text-sm mb-6 transition-colors"
          >
            <i className="fas fa-arrow-left text-xs" />
            Retour au blog
          </Link>

          {/* Méta : catégorie, date, temps de lecture, vues */}
          <div className="flex flex-wrap items-center gap-3 mb-5">
            <span className="bg-accent/20 text-accent text-xs font-semibold px-3 py-1.5 rounded-full">
              {post.category}
            </span>
            <span className="text-white/40 text-sm">{formatDate(post.publishedAt)}</span>
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

          {/* Carte auteur */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white font-bold text-sm">
              {post.authorInitials}
            </div>
            <div>
              <p className="text-white font-medium text-sm">{post.author}</p>
              <p className="text-white/40 text-xs">Fondateur & Directeur Général, SHIFT UP</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Bannière de couverture colorée (dégradé unique par article) ── */}
      <div className={`h-64 bg-gradient-to-br ${post.coverColor} relative`}>
        <div className="absolute inset-0 flex items-center justify-center">
          <i className="fas fa-newspaper text-white/10 text-[160px]" />
        </div>
      </div>

      {/* ── Corps de l'article + sidebar ── */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-3 gap-10">

            {/* Article principal (2/3 de la largeur) */}
            <article className="lg:col-span-2 bg-white rounded-3xl shadow-card p-8 md:p-10">
              {/* Contenu rendu via le parseur markdown simplifié */}
              <div className="prose-custom">
                {renderContent(post.content)}
              </div>

              {/* Tags de l'article */}
              <div className="mt-10 pt-6 border-t border-gray-100 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full"
                  >
                    #{tag}
                  </span>
                ))}
              </div>

              {/* Boutons de partage WhatsApp et LinkedIn */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <span className="text-sm text-gray-500">Partager :</span>
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(post.title + " - " + "https://shiftup.bj/blog/" + post.slug)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-green-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-green-600 transition-colors"
                >
                  <i className="fab fa-whatsapp" />
                  WhatsApp
                </a>
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=https://shiftup.bj/blog/${post.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 bg-blue-700 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors"
                >
                  <i className="fab fa-linkedin-in" />
                  LinkedIn
                </a>
              </div>
            </article>

            {/* ── Sidebar (1/3 de la largeur) ── */}
            <aside className="space-y-6">
              {/* CTA : prise de rendez-vous gratuit */}
              <div className="bg-primary rounded-3xl p-6 text-center">
                <div className="w-12 h-12 bg-accent/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-calendar-alt text-accent text-xl" />
                </div>
                <h3 className="font-syne font-bold text-white text-lg mb-2">
                  RDV Gratuit
                </h3>
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

              {/* Carte auteur */}
              <div className="bg-white rounded-3xl shadow-card p-6">
                <h4 className="font-syne font-bold text-primary mb-4">À propos de l'auteur</h4>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white font-bold flex-shrink-0">
                    JE
                  </div>
                  <div>
                    <p className="font-semibold text-primary text-sm">{post.author}</p>
                    <p className="text-gray-500 text-xs mt-0.5 leading-relaxed">
                      Fondateur & DG de SHIFT UP. Expert en conseil stratégique et solutions numériques pour entreprises béninoises et africaines.
                    </p>
                  </div>
                </div>
              </div>

              {/* Articles similaires */}
              <div className="bg-white rounded-3xl shadow-card p-6">
                <h4 className="font-syne font-bold text-primary mb-4">Articles similaires</h4>
                <div className="space-y-4">
                  {related.map((r) => (
                    <Link key={r.id} href={`/blog/${r.slug}`} className="block group">
                      <div className="flex gap-3">
                        {/* Vignette colorée de l'article lié */}
                        <div className={`w-14 h-14 bg-gradient-to-br ${r.coverColor} rounded-xl flex-shrink-0`} />
                        <div>
                          <p className="text-sm font-medium text-primary group-hover:text-accent transition-colors line-clamp-2 leading-snug">
                            {r.title}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">{r.readTime} min</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </aside>
          </div>
        </div>
      </section>
    </div>
  );
}
