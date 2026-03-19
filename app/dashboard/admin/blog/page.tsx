"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  published: boolean;
  views: number;
  publishedAt: string | null;
  authorName: string;
}

const categories = [
  "Conseil & Stratégie",
  "Marchés Publics & Dossiers",
  "Juridique & Comptabilité",
  "Communication & Marketing",
  "BTP & Génie Civil",
  "Solutions Numériques",
  "Transformation Digitale",
  "Data & Business Intelligence",
  "Formation & Coaching",
  "RSE & Développement Durable",
  "Finance & Investissement",
  "Général",
];

export default function AdminBlogPage() {
  const [posts, setPosts]         = useState<BlogPost[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [filterStatus, setFilter] = useState<"TOUS" | "PUBLIE" | "BROUILLON">("TOUS");

  const [showForm, setShowForm]   = useState(false);
  const [editing, setEditing]     = useState<BlogPost | null>(null);
  const [formTitle, setFormTitle]       = useState("");
  const [formExcerpt, setFormExcerpt]   = useState("");
  const [formContent, setFormContent]   = useState("");
  const [formCategory, setFormCategory] = useState(categories[0]);
  const [formStatus, setFormStatus]     = useState<"PUBLIE" | "BROUILLON">("BROUILLON");
  const [saving, setSaving]             = useState(false);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/blog")
      .then((r) => r.json())
      .then((data) => setPosts(data.posts ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = posts.filter((p) => {
    const matchStatus = filterStatus === "TOUS" || (filterStatus === "PUBLIE" ? p.published : !p.published);
    const q = search.toLowerCase();
    return matchStatus && (!q || p.title.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
  });

  function openCreate() {
    setEditing(null);
    setFormTitle(""); setFormExcerpt(""); setFormContent(""); setFormCategory(categories[0]); setFormStatus("BROUILLON");
    setShowForm(true);
  }

  function openEdit(post: BlogPost) {
    setEditing(post);
    setFormTitle(post.title); setFormExcerpt(post.excerpt); setFormContent(post.content ?? "");
    setFormCategory(post.category);
    setFormStatus(post.published ? "PUBLIE" : "BROUILLON");
    setShowForm(true);
  }

  async function saveForm() {
    if (!formTitle.trim()) return;
    setSaving(true);
    try {
      const isPublished = formStatus === "PUBLIE";
      if (editing) {
        const r = await fetch("/api/admin/blog", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, title: formTitle, excerpt: formExcerpt, content: formContent, category: formCategory, published: isPublished }),
        });
        const data = await r.json();
        setPosts((prev) => prev.map((p) => p.id === editing.id ? { ...p, ...data.post } : p));
        toast.success("Article mis à jour !");
      } else {
        const r = await fetch("/api/admin/blog", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: formTitle, excerpt: formExcerpt, content: formContent, category: formCategory, published: isPublished }),
        });
        const data = await r.json();
        setPosts((prev) => [data.post, ...prev]);
        toast.success("Article créé !");
      }
      setShowForm(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function deletePost(id: string) {
    try {
      await fetch(`/api/admin/blog?id=${id}`, { method: "DELETE" });
      setPosts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
      toast.success("Article supprimé.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  }

  function fmtDate(d: string | null) {
    if (!d) return null;
    return new Date(d).toLocaleDateString("fr-FR");
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Gestion du Blog</h1>
          <p className="text-gray-500 text-sm">{posts.length} article(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <i className="fas fa-plus" />Nouvel article
        </button>
      </motion.div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher un article..."
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
        </div>
        <select value={filterStatus} onChange={(e) => setFilter(e.target.value as any)} className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white">
          <option value="TOUS">Tous les statuts</option>
          <option value="PUBLIE">Publiés</option>
          <option value="BROUILLON">Brouillons</option>
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">Aucun article trouvé.</div>
        ) : filtered.map((post) => (
          <motion.div key={post.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-5 flex items-start gap-4">
            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${post.published ? "bg-green-400" : "bg-gray-200"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${post.published ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {post.published ? "Publié" : "Brouillon"}
                </span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{post.category}</span>
              </div>
              <h3 className="font-syne font-bold text-primary text-sm leading-snug mb-1">{post.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-1 mb-2">{post.excerpt}</p>
              <div className="flex items-center gap-4 text-xs text-gray-400">
                <span><i className="fas fa-user mr-1" />{post.authorName}</span>
                {post.publishedAt && <span><i className="fas fa-calendar mr-1" />{fmtDate(post.publishedAt)}</span>}
                {post.published && <span><i className="fas fa-eye mr-1" />{post.views.toLocaleString()} vues</span>}
                <span className="font-mono text-gray-300 hidden sm:block">/{post.slug}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => openEdit(post)} className="text-accent hover:text-secondary text-xs font-medium flex items-center gap-1 px-3 py-1.5 border border-accent/20 rounded-lg hover:bg-accent/5 transition-colors">
                <i className="fas fa-pen-to-square" />Éditer
              </button>
              <button onClick={() => setConfirmDelete(post.id)} className="text-red-400 hover:text-red-600 text-xs px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                <i className="fas fa-trash" />
              </button>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal formulaire */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowForm(false)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-5">
                <div className="flex items-center justify-between sticky top-0 bg-white pb-2 border-b border-gray-100">
                  <h3 className="font-syne font-bold text-primary">{editing ? "Modifier l'article" : "Nouvel article"}</h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-xmark" /></button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Titre *</label>
                  <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} placeholder="Titre de l'article"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Extrait</label>
                  <textarea value={formExcerpt} onChange={(e) => setFormExcerpt(e.target.value)} rows={2} placeholder="Résumé court affiché dans la liste d'articles..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Contenu (Markdown)
                    <span className="ml-2 text-xs text-gray-400 font-normal">## Titre, ### Sous-titre, **gras**, - liste</span>
                  </label>
                  <textarea
                    value={formContent}
                    onChange={(e) => setFormContent(e.target.value)}
                    rows={16}
                    placeholder={`## Introduction\n\nVotre contenu ici...\n\n## Section 1\n\nTexte de la section.\n\n- Point 1\n- Point 2`}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-y font-mono"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Catégorie</label>
                    <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                      {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                    <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as any)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                      <option value="BROUILLON">Brouillon</option>
                      <option value="PUBLIE">Publier</option>
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 sticky bottom-0 bg-white pt-2 border-t border-gray-100">
                  <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={saveForm} disabled={saving || !formTitle.trim()} className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                    {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</span>
                      : editing ? "Mettre à jour" : "Créer l'article"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Modal suppression */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDelete(null)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto"><i className="fas fa-trash text-red-500 text-xl" /></div>
                <h3 className="font-syne font-bold text-primary">Supprimer cet article ?</h3>
                <p className="text-gray-500 text-sm">Cette action est irréversible.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={() => deletePost(confirmDelete)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600">Supprimer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
