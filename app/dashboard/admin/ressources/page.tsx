"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  url: string;
  duration: string | null;
  size: string | null;
  isNew: boolean;
  isActive: boolean;
  order: number;
}

const TYPES    = ["VIDEO", "PDF", "TEMPLATE", "LIEN"];
const CATEGORIES = ["Développement", "Design", "Marketing", "Gestion de projet", "Outils"];

const typeStyle: Record<string, { bg: string; icon: string; label: string }> = {
  VIDEO:    { bg: "bg-red-50 text-red-600",       icon: "fa-play-circle",   label: "Vidéo" },
  PDF:      { bg: "bg-blue-50 text-blue-600",     icon: "fa-file-pdf",      label: "PDF" },
  TEMPLATE: { bg: "bg-purple-50 text-purple-600", icon: "fa-layer-group",   label: "Template" },
  LIEN:     { bg: "bg-green-50 text-green-600",   icon: "fa-external-link", label: "Lien" },
};

const emptyForm = {
  title: "", description: "", type: "VIDEO", category: "Développement",
  url: "", duration: "", size: "", isNew: false, order: 0,
};

export default function AdminRessourcesPage() {
  const [resources, setResources]   = useState<Resource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [filterType, setFilterType] = useState("TOUS");
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Resource | null>(null);
  const [form, setForm]             = useState({ ...emptyForm });
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/ressources")
      .then((r) => r.json())
      .then((data) => setResources(data.resources ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = resources.filter((r) => {
    const matchType = filterType === "TOUS" || r.type === filterType;
    const q = search.toLowerCase();
    return matchType && (!q || r.title.toLowerCase().includes(q) || r.category.toLowerCase().includes(q));
  });

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(r: Resource) {
    setEditing(r);
    setForm({
      title: r.title, description: r.description, type: r.type,
      category: r.category, url: r.url,
      duration: r.duration ?? "", size: r.size ?? "",
      isNew: r.isNew, order: r.order,
    });
    setShowForm(true);
  }

  async function saveForm() {
    if (!form.title.trim() || !form.url.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        duration: form.duration || null,
        size: form.size || null,
      };

      if (editing) {
        const r = await fetch("/api/admin/ressources", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        const data = await r.json();
        setResources((prev) => prev.map((x) => x.id === editing.id ? data.resource : x));
        toast.success("Ressource mise à jour !");
      } else {
        const r = await fetch("/api/admin/ressources", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await r.json();
        setResources((prev) => [data.resource, ...prev]);
        toast.success("Ressource créée !");
      }
      setShowForm(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteResource(id: string) {
    try {
      await fetch(`/api/admin/ressources?id=${id}`, { method: "DELETE" });
      setResources((prev) => prev.filter((r) => r.id !== id));
      setConfirmDelete(null);
      toast.success("Ressource supprimée.");
    } catch {
      toast.error("Erreur lors de la suppression.");
    }
  }

  async function toggleActive(r: Resource) {
    try {
      await fetch("/api/admin/ressources", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: r.id, isActive: !r.isActive }),
      });
      setResources((prev) => prev.map((x) => x.id === r.id ? { ...x, isActive: !x.isActive } : x));
    } catch {
      toast.error("Erreur.");
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Ressources pédagogiques</h1>
          <p className="text-gray-500 text-sm">{resources.length} ressource(s) · visibles par les étudiants</p>
        </div>
        <button onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <i className="fas fa-plus" />Nouvelle ressource
        </button>
      </motion.div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..."
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
        </div>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white">
          <option value="TOUS">Tous les types</option>
          {TYPES.map((t) => <option key={t} value={t}>{typeStyle[t]?.label ?? t}</option>)}
        </select>
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
            {resources.length === 0 ? "Aucune ressource. Créez la première !" : "Aucune ressource trouvée."}
          </div>
        ) : filtered.map((res) => {
          const typeInfo = typeStyle[res.type] ?? typeStyle.LIEN;
          return (
            <motion.div key={res.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-2xl shadow-card p-5 flex items-start gap-4">
              <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${res.isActive ? "bg-green-400" : "bg-gray-200"}`} />
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 ${typeInfo.bg}`}>
                    <i className={`fas ${typeInfo.icon} text-xs`} />{typeInfo.label}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{res.category}</span>
                  {res.isNew && <span className="text-xs font-bold text-white bg-accent px-2 py-0.5 rounded-full">Nouveau</span>}
                  {!res.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Masqué</span>}
                </div>
                <h3 className="font-syne font-bold text-primary text-sm mb-0.5">{res.title}</h3>
                <p className="text-xs text-gray-500 line-clamp-1 mb-1">{res.description}</p>
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-400">
                  {res.duration && <span><i className="fas fa-clock mr-1" />{res.duration}</span>}
                  {res.size && <span><i className="fas fa-file mr-1" />{res.size}</span>}
                  <span className="font-mono text-gray-300 hidden sm:block truncate max-w-xs">{res.url}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => toggleActive(res)}
                  className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${res.isActive ? "text-green-600 border-green-100 hover:bg-green-50" : "text-gray-400 border-gray-100 hover:bg-gray-50"}`}>
                  <i className={`fas fa-${res.isActive ? "eye" : "eye-slash"} mr-1`} />{res.isActive ? "Visible" : "Masqué"}
                </button>
                <button onClick={() => openEdit(res)}
                  className="text-accent hover:text-secondary text-xs font-medium flex items-center gap-1 px-3 py-1.5 border border-accent/20 rounded-lg hover:bg-accent/5 transition-colors">
                  <i className="fas fa-pen-to-square" />Éditer
                </button>
                <button onClick={() => setConfirmDelete(res.id)}
                  className="text-red-400 hover:text-red-600 text-xs px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
                  <i className="fas fa-trash" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Modal formulaire */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowForm(false)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg p-6 space-y-4 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between">
                  <h3 className="font-syne font-bold text-primary">{editing ? "Modifier la ressource" : "Nouvelle ressource"}</h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-xmark" /></button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                  <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="Titre de la ressource"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2} placeholder="Description courte..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type *</label>
                    <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                      {TYPES.map((t) => <option key={t} value={t}>{typeStyle[t]?.label ?? t}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL / Lien *</label>
                  <input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée (vidéo)</label>
                    <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })}
                      placeholder="Ex: 2h 15min"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Taille (PDF)</label>
                    <input value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })}
                      placeholder="Ex: 4.2 MB"
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ordre d'affichage</label>
                    <input type="number" min={0} value={form.order} onChange={(e) => setForm({ ...form, order: Number(e.target.value) })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" />
                  </div>
                  <div className="flex items-end pb-2.5">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <div onClick={() => setForm({ ...form, isNew: !form.isNew })}
                        className={`w-10 h-6 rounded-full transition-colors relative ${form.isNew ? "bg-accent" : "bg-gray-200"}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isNew ? "left-5" : "left-1"}`} />
                      </div>
                      <span className="text-sm text-gray-700">Marquer "Nouveau"</span>
                    </label>
                  </div>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={saveForm} disabled={saving || !form.title.trim() || !form.url.trim()}
                    className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                    {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</span>
                      : editing ? "Mettre à jour" : "Créer la ressource"}
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
                <h3 className="font-syne font-bold text-primary">Supprimer cette ressource ?</h3>
                <p className="text-gray-500 text-sm">Elle ne sera plus visible par les étudiants.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={() => deleteResource(confirmDelete)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600">Supprimer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
