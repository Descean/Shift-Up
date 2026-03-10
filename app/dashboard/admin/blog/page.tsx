/**
 * app/dashboard/admin/blog/page.tsx — Gestion du blog (admin)
 *
 * Fonctionnalités :
 *  - Liste des articles de blog avec statut (Publié / Brouillon)
 *  - Bouton "Nouvel article" → formulaire de création inline
 *  - Édition rapide du titre et du statut publication
 *  - Suppression avec confirmation
 *  - Compteur de vues par article
 *
 * Données : actuellement mockées.
 * TODO: brancher sur /api/admin/blog (à créer) qui lit prisma.blogPost.
 *
 * Note : Un éditeur riche (TipTap, MDX, etc.) devra remplacer le textarea
 *        pour la rédaction complète des articles.
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: string;
  status: "PUBLIE" | "BROUILLON";
  views: number;
  publishedAt: string | null;
  author: string;
}

// ─── Données mock ─────────────────────────────────────────────────────────────
// TODO: remplacer par fetch("/api/admin/blog") dans un useEffect

const initialPosts: BlogPost[] = [
  {
    id: "post-001",
    title: "Pourquoi votre entreprise a besoin d'un site web en 2025",
    slug: "pourquoi-site-web-entreprise-2025",
    excerpt: "Découvrez les raisons essentielles pour lesquelles une présence en ligne est indispensable.",
    category: "Stratégie digitale",
    status: "PUBLIE",
    views: 1240,
    publishedAt: "15/10/2025",
    author: "Eudes K.",
  },
  {
    id: "post-002",
    title: "Les 5 erreurs fatales en community management",
    slug: "5-erreurs-community-management",
    excerpt: "Évitez ces pièges courants qui font échouer la plupart des stratégies de réseaux sociaux.",
    category: "Marketing",
    status: "PUBLIE",
    views: 876,
    publishedAt: "02/11/2025",
    author: "Marie C.",
  },
  {
    id: "post-003",
    title: "Tendances UI/UX pour les applications mobiles africaines",
    slug: "tendances-ui-ux-apps-mobiles-afrique",
    excerpt: "Comment adapter les interfaces aux usages spécifiques du marché africain.",
    category: "Design",
    status: "PUBLIE",
    views: 532,
    publishedAt: "20/11/2025",
    author: "Eudes K.",
  },
  {
    id: "post-004",
    title: "FedaPay vs Stripe : quel prestataire de paiement choisir au Bénin ?",
    slug: "fedapay-vs-stripe-benin",
    excerpt: "Comparatif technique et tarifaire des deux solutions de paiement les plus populaires.",
    category: "Tech",
    status: "BROUILLON",
    views: 0,
    publishedAt: null,
    author: "Jean-Paul R.",
  },
  {
    id: "post-005",
    title: "Comment mesurer le ROI de votre stratégie digitale",
    slug: "mesurer-roi-strategie-digitale",
    excerpt: "Les indicateurs clés pour évaluer le retour sur investissement de votre présence digitale.",
    category: "Stratégie digitale",
    status: "BROUILLON",
    views: 0,
    publishedAt: null,
    author: "Marie C.",
  },
];

const categories = ["Stratégie digitale", "Marketing", "Design", "Tech", "Actualités"];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function AdminBlogPage() {
  const [posts, setPosts]         = useState<BlogPost[]>(initialPosts);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState<"TOUS" | "PUBLIE" | "BROUILLON">("TOUS");

  // ── États du formulaire d'ajout/édition ─────────────────────────────────
  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<BlogPost | null>(null);

  // Champs du formulaire
  const [formTitle, setFormTitle]       = useState("");
  const [formExcerpt, setFormExcerpt]   = useState("");
  const [formCategory, setFormCategory] = useState(categories[0]);
  const [formStatus, setFormStatus]     = useState<"PUBLIE" | "BROUILLON">("BROUILLON");
  const [saving, setSaving]             = useState(false);

  // ── Confirmation de suppression ──────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  // ── Filtrage ─────────────────────────────────────────────────────────────
  const filtered = posts.filter((p) => {
    const matchStatus = filterStatus === "TOUS" || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.title.toLowerCase().includes(q) ||
      p.category.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Ouverture du formulaire de création ─────────────────────────────────
  function openCreate() {
    setEditing(null);
    setFormTitle("");
    setFormExcerpt("");
    setFormCategory(categories[0]);
    setFormStatus("BROUILLON");
    setShowForm(true);
  }

  // ── Ouverture du formulaire d'édition ────────────────────────────────────
  function openEdit(post: BlogPost) {
    setEditing(post);
    setFormTitle(post.title);
    setFormExcerpt(post.excerpt);
    setFormCategory(post.category);
    setFormStatus(post.status);
    setShowForm(true);
  }

  /**
   * saveForm — Crée ou met à jour un article.
   *
   * En mode création : génère un slug à partir du titre, insère en tête de liste.
   * En mode édition : met à jour les champs modifiés.
   *
   * TODO: remplacer par des appels API :
   *   Création → POST /api/admin/blog
   *   Édition  → PATCH /api/admin/blog { id, title, excerpt, category, status }
   */
  async function saveForm() {
    if (!formTitle.trim()) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 500));

    if (editing) {
      // Mise à jour de l'article existant
      setPosts((prev) =>
        prev.map((p) =>
          p.id === editing.id
            ? { ...p, title: formTitle, excerpt: formExcerpt, category: formCategory, status: formStatus }
            : p
        )
      );
    } else {
      // Création d'un nouvel article — génération du slug
      const slug = formTitle
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")  // retire les accents
        .replace(/[^a-z0-9]+/g, "-")      // remplace les caractères spéciaux par "-"
        .replace(/^-|-$/g, "");           // retire les tirets en début/fin
      const newPost: BlogPost = {
        id: `post-${Date.now()}`,
        title: formTitle,
        slug,
        excerpt: formExcerpt,
        category: formCategory,
        status: formStatus,
        views: 0,
        publishedAt: formStatus === "PUBLIE" ? new Date().toLocaleDateString("fr-FR") : null,
        author: "Eudes K.",
      };
      setPosts((prev) => [newPost, ...prev]);
    }

    setSaving(false);
    setShowForm(false);
  }

  /**
   * deletePost — Supprime un article après confirmation.
   *
   * TODO: remplacer par DELETE /api/admin/blog?id=<id>
   */
  function deletePost(id: string) {
    setPosts((prev) => prev.filter((p) => p.id !== id));
    setConfirmDelete(null);
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Gestion du Blog</h1>
          <p className="text-gray-500 text-sm">{posts.length} article(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-plus" />
          Nouvel article
        </button>
      </motion.div>

      {/* ── Filtres ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilter(e.target.value as any)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white"
        >
          <option value="TOUS">Tous les statuts</option>
          <option value="PUBLIE">Publiés</option>
          <option value="BROUILLON">Brouillons</option>
        </select>
      </div>

      {/* ── Liste des articles ────────────────────────────────────────────── */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
            Aucun article trouvé.
          </div>
        )}
        {filtered.map((post) => (
          <motion.div
            key={post.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-5 flex items-start gap-4"
          >
            {/* Indicateur de statut (barre verticale colorée) */}
            <div
              className={`w-1 self-stretch rounded-full flex-shrink-0 ${
                post.status === "PUBLIE" ? "bg-green-400" : "bg-gray-200"
              }`}
            />

            {/* Corps de l'article */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  post.status === "PUBLIE"
                    ? "bg-green-50 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {post.status === "PUBLIE" ? "Publié" : "Brouillon"}
                </span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">
                  {post.category}
                </span>
              </div>

              <h3 className="font-syne font-bold text-primary text-sm leading-snug mb-1">
                {post.title}
              </h3>

              <p className="text-xs text-gray-500 line-clamp-1 mb-2">{post.excerpt}</p>

              {/* Méta-informations */}
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span>
                  <i className="fas fa-user mr-1" />
                  {post.author}
                </span>
                {post.publishedAt && (
                  <span>
                    <i className="fas fa-calendar mr-1" />
                    {post.publishedAt}
                  </span>
                )}
                {post.status === "PUBLIE" && (
                  <span>
                    <i className="fas fa-eye mr-1" />
                    {post.views.toLocaleString()} vues
                  </span>
                )}
                <span className="font-mono text-gray-300 hidden sm:block">/{post.slug}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => openEdit(post)}
                className="text-accent hover:text-secondary text-xs font-medium flex items-center gap-1 px-3 py-1.5 border border-accent/20 rounded-lg hover:bg-accent/5 transition-colors"
              >
                <i className="fas fa-pen-to-square" />
                Éditer
              </button>
              <button
                onClick={() => setConfirmDelete(post.id)}
                className="text-red-400 hover:text-red-600 text-xs px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors"
              >
                <i className="fas fa-trash" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Modal formulaire article ──────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setShowForm(false)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h3 className="font-syne font-bold text-primary">
                    {editing ? "Modifier l'article" : "Nouvel article"}
                  </h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600">
                    <i className="fas fa-xmark" />
                  </button>
                </div>

                {/* Titre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input
                    value={formTitle}
                    onChange={(e) => setFormTitle(e.target.value)}
                    placeholder="Titre de l'article"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  />
                </div>

                {/* Extrait */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extrait</label>
                  <textarea
                    value={formExcerpt}
                    onChange={(e) => setFormExcerpt(e.target.value)}
                    rows={3}
                    placeholder="Résumé court de l'article (affiché sur la liste)..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none"
                  />
                </div>

                {/* Catégorie + Statut côte à côte */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select
                      value={formStatus}
                      onChange={(e) => setFormStatus(e.target.value as any)}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
                    >
                      <option value="BROUILLON">Brouillon</option>
                      <option value="PUBLIE">Publier</option>
                    </select>
                  </div>
                </div>

                {/* Info éditeur riche */}
                <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
                  <i className="fas fa-info-circle mr-1" />
                  Le contenu complet de l'article est éditable via un éditeur riche (TipTap / MDX).
                  Cette interface gère actuellement le titre, l'extrait et la catégorie.
                </div>

                {/* Boutons */}
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600"
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveForm}
                    disabled={saving || !formTitle.trim()}
                    className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement…
                      </span>
                    ) : editing ? "Mettre à jour" : "Créer l'article"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal confirmation suppression ───────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDelete(null)}
            />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                  <i className="fas fa-trash text-red-500 text-xl" />
                </div>
                <h3 className="font-syne font-bold text-primary">Supprimer cet article ?</h3>
                <p className="text-gray-500 text-sm">Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => deletePost(confirmDelete)}
                    className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600"
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
