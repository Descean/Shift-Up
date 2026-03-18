"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Product {
  id: string;
  name: string;
  description: string;
  type: string;
  category: string | null;
  price: number;
  currency: string;
  downloadUrl: string | null;
  previewUrl: string | null;
  thumbnail: string | null;
  features: string[];
  tags: string[];
  isActive: boolean;
  isFeatured: boolean;
  stock: number | null;
  purchases: number;
  createdAt: string;
}

const PRODUCT_TYPES = [
  { value: "APP", label: "Application", icon: "fas fa-mobile-alt", color: "text-blue-500", bg: "bg-blue-50" },
  { value: "LOGICIEL", label: "Logiciel", icon: "fas fa-desktop", color: "text-purple-500", bg: "bg-purple-50" },
  { value: "FICHIER", label: "Fichier", icon: "fas fa-file-arrow-down", color: "text-orange-500", bg: "bg-orange-50" },
  { value: "LICENCE", label: "Licence", icon: "fas fa-key", color: "text-yellow-500", bg: "bg-yellow-50" },
  { value: "TEMPLATE", label: "Template", icon: "fas fa-layer-group", color: "text-pink-500", bg: "bg-pink-50" },
  { value: "FORMATION", label: "Formation", icon: "fas fa-graduation-cap", color: "text-green-500", bg: "bg-green-50" },
  { value: "AUTRE", label: "Autre", icon: "fas fa-box", color: "text-gray-500", bg: "bg-gray-50" },
];

const CURRENCIES = ["XOF", "EUR", "USD"];

function getTypeInfo(type: string) {
  return PRODUCT_TYPES.find((t) => t.value === type) ?? PRODUCT_TYPES[PRODUCT_TYPES.length - 1];
}

// Fields shown per type
const TYPE_FIELDS: Record<string, { downloadUrl: boolean; stock: boolean; duration: boolean }> = {
  APP:       { downloadUrl: true,  stock: false, duration: false },
  LOGICIEL:  { downloadUrl: true,  stock: false, duration: false },
  FICHIER:   { downloadUrl: true,  stock: false, duration: false },
  LICENCE:   { downloadUrl: true,  stock: true,  duration: false },
  TEMPLATE:  { downloadUrl: true,  stock: false, duration: false },
  FORMATION: { downloadUrl: false, stock: false, duration: true  },
  AUTRE:     { downloadUrl: true,  stock: true,  duration: false },
};

const emptyForm = {
  name: "", description: "", type: "APP", category: "",
  price: "", currency: "XOF",
  downloadUrl: "", previewUrl: "", thumbnail: "",
  featuresText: "", tagsText: "",
  isActive: true, isFeatured: false,
  stock: "", duration: "",
};

export default function AdminProduitsPage() {
  const [products, setProducts]     = useState<Product[]>([]);
  const [loading, setLoading]       = useState(true);
  const [showForm, setShowForm]     = useState(false);
  const [editing, setEditing]       = useState<Product | null>(null);
  const [form, setForm]             = useState({ ...emptyForm });
  const [saving, setSaving]         = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [filterType, setFilterType] = useState("ALL");

  useEffect(() => {
    fetch("/api/admin/produits")
      .then((r) => r.json())
      .then((d) => setProducts(d.products ?? []))
      .finally(() => setLoading(false));
  }, []);

  const fields = TYPE_FIELDS[form.type] ?? TYPE_FIELDS["AUTRE"];

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(p: Product) {
    setEditing(p);
    setForm({
      name: p.name, description: p.description,
      type: p.type, category: p.category ?? "",
      price: String(p.price), currency: p.currency,
      downloadUrl: p.downloadUrl ?? "", previewUrl: p.previewUrl ?? "",
      thumbnail: p.thumbnail ?? "",
      featuresText: p.features.join("\n"),
      tagsText: p.tags.join(", "),
      isActive: p.isActive, isFeatured: p.isFeatured,
      stock: p.stock != null ? String(p.stock) : "",
      duration: "",
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        type: form.type,
        category: form.category || null,
        price: Number(form.price) || 0,
        currency: form.currency,
        downloadUrl: fields.downloadUrl ? (form.downloadUrl || null) : null,
        previewUrl: form.previewUrl || null,
        thumbnail: form.thumbnail || null,
        features: form.featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
        tags: form.tagsText.split(",").map((t) => t.trim()).filter(Boolean),
        isActive: form.isActive,
        isFeatured: form.isFeatured,
        stock: fields.stock && form.stock ? Number(form.stock) : null,
      };

      if (editing) {
        const r = await fetch("/api/admin/produits", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id: editing.id, ...payload }),
        });
        const d = await r.json();
        setProducts((prev) => prev.map((p) => p.id === editing.id ? d.product : p));
        toast.success("Produit mis à jour !");
      } else {
        const r = await fetch("/api/admin/produits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const d = await r.json();
        setProducts((prev) => [d.product, ...prev]);
        toast.success("Produit créé !");
      }
      setShowForm(false);
    } catch {
      toast.error("Erreur lors de l'enregistrement.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    try {
      await fetch(`/api/admin/produits?id=${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
      setConfirmDelete(null);
      toast.success("Produit supprimé.");
    } catch {
      toast.error("Erreur.");
    }
  }

  async function toggleActive(p: Product) {
    try {
      const r = await fetch("/api/admin/produits", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: p.id, isActive: !p.isActive }),
      });
      const d = await r.json();
      setProducts((prev) => prev.map((x) => x.id === p.id ? d.product : x));
    } catch {
      toast.error("Erreur.");
    }
  }

  const filtered = filterType === "ALL" ? products : products.filter((p) => p.type === filterType);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Catalogue Produits</h1>
          <p className="text-gray-500 text-sm">{products.length} produit(s) — {products.filter((p) => p.isActive).length} actif(s)</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-plus" />Nouveau produit
        </button>
      </motion.div>

      {/* Type filter pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setFilterType("ALL")}
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === "ALL" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-accent hover:text-accent"}`}
        >
          Tous ({products.length})
        </button>
        {PRODUCT_TYPES.map((t) => {
          const count = products.filter((p) => p.type === t.value).length;
          if (count === 0) return null;
          return (
            <button
              key={t.value}
              onClick={() => setFilterType(t.value)}
              className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${filterType === t.value ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-accent hover:text-accent"}`}
            >
              <i className={`${t.icon} text-xs`} />{t.label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste produits */}
      {loading ? (
        <div className="flex justify-center py-16"><span className="w-7 h-7 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-16 text-center text-gray-400 text-sm">
          <i className="fas fa-box-open text-3xl mb-3 block" />
          {filterType === "ALL" ? "Aucun produit. Créez le premier !" : `Aucun produit de type "${getTypeInfo(filterType).label}".`}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((p) => {
            const typeInfo = getTypeInfo(p.type);
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl shadow-card overflow-hidden flex flex-col"
              >
                {/* Thumbnail / placeholder */}
                <div className={`relative h-36 flex items-center justify-center ${typeInfo.bg}`}>
                  {p.thumbnail ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={p.thumbnail} alt={p.name} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <i className={`${typeInfo.icon} ${typeInfo.color} text-5xl opacity-30`} />
                  )}
                  {/* Badges overlay */}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full text-white ${typeInfo.color.replace("text-", "bg-").replace("-500", "-500")}`} style={{ background: "rgba(0,0,0,0.45)" }}>
                      {typeInfo.label}
                    </span>
                    {p.isFeatured && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full text-white" style={{ background: "rgba(0,0,0,0.45)" }}>
                        <i className="fas fa-star mr-0.5" />Mis en avant
                      </span>
                    )}
                  </div>
                  {!p.isActive && (
                    <div className="absolute inset-0 bg-white/60 flex items-center justify-center">
                      <span className="text-xs font-semibold text-gray-500 bg-white px-3 py-1 rounded-full shadow">Masqué</span>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-syne font-bold text-primary text-sm mb-1 line-clamp-1">{p.name}</h3>
                  <p className="text-xs text-gray-500 line-clamp-2 mb-3 flex-1">{p.description}</p>

                  <div className="flex items-center justify-between mb-3">
                    <span className="font-syne font-black text-accent text-base">
                      {p.price.toLocaleString()} <span className="text-xs font-medium">{p.currency}</span>
                    </span>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span><i className="fas fa-download mr-0.5" />{p.purchases}</span>
                      {p.stock != null && <span><i className="fas fa-layer-group mr-0.5" />{p.stock} licences</span>}
                    </div>
                  </div>

                  {p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {p.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                      ))}
                      {p.tags.length > 3 && <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">+{p.tags.length - 3}</span>}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => toggleActive(p)}
                      className={`flex-1 text-xs py-1.5 border rounded-lg transition-colors ${p.isActive ? "text-green-600 border-green-100 hover:bg-green-50" : "text-gray-400 border-gray-100 hover:bg-gray-50"}`}
                    >
                      <i className={`fas fa-${p.isActive ? "eye" : "eye-slash"} mr-1`} />{p.isActive ? "Visible" : "Masqué"}
                    </button>
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 text-xs py-1.5 border border-accent/20 text-accent rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      <i className="fas fa-pen-to-square mr-1" />Éditer
                    </button>
                    <button
                      onClick={() => setConfirmDelete(p.id)}
                      className="px-3 text-xs py-1.5 border border-red-100 text-red-400 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <i className="fas fa-trash" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* ───── Modal formulaire ───── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setShowForm(false)} />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-5 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between">
                  <h3 className="font-syne font-bold text-primary">{editing ? "Modifier le produit" : "Nouveau produit"}</h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-xmark" /></button>
                </div>

                {/* Sélecteur de type — adaptatif */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Type de produit *</label>
                  <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                    {PRODUCT_TYPES.map((t) => (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setForm({ ...form, type: t.value })}
                        className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all text-center ${form.type === t.value ? "border-accent bg-accent/5" : "border-gray-100 hover:border-gray-200"}`}
                      >
                        <span className={`text-lg ${form.type === t.value ? t.color : "text-gray-400"}`}>
                          <i className={t.icon} />
                        </span>
                        <span className={`text-[10px] font-medium leading-tight ${form.type === t.value ? "text-accent" : "text-gray-500"}`}>{t.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Nom + catégorie */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nom *</label>
                    <input
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      placeholder={`Nom du ${getTypeInfo(form.type).label.toLowerCase()}`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                    <input
                      value={form.category}
                      onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      placeholder="Ex: Productivité, CRM…"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none"
                    placeholder="Description courte affichée sur la fiche produit"
                  />
                </div>

                {/* Prix + devise */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix *</label>
                    <input
                      type="number"
                      value={form.price}
                      onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Devise</label>
                    <select
                      value={form.currency}
                      onChange={(e) => setForm({ ...form, currency: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent"
                    >
                      {CURRENCIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Champs conditionnels selon le type */}
                {fields.downloadUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <i className="fas fa-link mr-1.5 text-gray-400" />URL de téléchargement
                    </label>
                    <input
                      value={form.downloadUrl}
                      onChange={(e) => setForm({ ...form, downloadUrl: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      placeholder="https://..."
                    />
                  </div>
                )}

                {fields.stock && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <i className="fas fa-layer-group mr-1.5 text-gray-400" />Stock de licences (laisser vide = illimité)
                    </label>
                    <input
                      type="number"
                      value={form.stock}
                      onChange={(e) => setForm({ ...form, stock: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      placeholder="Illimité"
                    />
                  </div>
                )}

                {/* Aperçu + Thumbnail (communs) */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <i className="fas fa-eye mr-1.5 text-gray-400" />URL d&apos;aperçu
                    </label>
                    <input
                      value={form.previewUrl}
                      onChange={(e) => setForm({ ...form, previewUrl: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <i className="fas fa-image mr-1.5 text-gray-400" />Miniature (URL)
                    </label>
                    <input
                      value={form.thumbnail}
                      onChange={(e) => setForm({ ...form, thumbnail: e.target.value })}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                {/* Fonctionnalités */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fonctionnalités incluses (une par ligne)</label>
                  <textarea
                    value={form.featuresText}
                    onChange={(e) => setForm({ ...form, featuresText: e.target.value })}
                    rows={3}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none font-mono"
                    placeholder={"Interface intuitive\nMises à jour gratuites\nSupport 24/7"}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags (séparés par des virgules)</label>
                  <input
                    value={form.tagsText}
                    onChange={(e) => setForm({ ...form, tagsText: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    placeholder="comptabilité, PME, cloud"
                  />
                </div>

                {/* Toggles */}
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setForm({ ...form, isActive: !form.isActive })} className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? "left-5" : "left-1"}`} />
                    </div>
                    <span className="text-sm text-gray-700">Visible dans la boutique</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setForm({ ...form, isFeatured: !form.isFeatured })} className={`w-10 h-6 rounded-full transition-colors relative ${form.isFeatured ? "bg-accent" : "bg-gray-200"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isFeatured ? "left-5" : "left-1"}`} />
                    </div>
                    <span className="text-sm text-gray-700"><i className="fas fa-star mr-1 text-yellow-400" />Mis en avant</span>
                  </label>
                </div>

                {/* Boutons */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setShowForm(false)}
                    disabled={saving}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={save}
                    disabled={saving || !form.name.trim()}
                    className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement…
                      </span>
                    ) : editing ? "Mettre à jour" : "Créer le produit"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ───── Modal suppression ───── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmDelete(null)} />
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center space-y-4">
                <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                  <i className="fas fa-trash text-red-500 text-xl" />
                </div>
                <h3 className="font-syne font-bold text-primary">Supprimer ce produit ?</h3>
                <p className="text-gray-500 text-sm">Les achats existants ne seront pas supprimés.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={() => deleteProduct(confirmDelete)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600">Supprimer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
