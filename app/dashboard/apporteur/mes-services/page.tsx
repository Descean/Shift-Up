"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

/**
 * Page "Mes Services" — Dashboard Apporteur
 *
 * Permet à l'apporteur de créer, gérer et suivre ses propres services.
 * Chaque service vendu génère 90 % de revenus pour l'apporteur,
 * SHIFT UP perçoit 10 % de commission pour la plateforme et le support.
 */

const COMMISSION_RATE = 0.10;

const CATEGORIES = [
  "Conseil & Stratégie",
  "Communication & Marketing",
  "Juridique & Comptabilité",
  "BTP & Génie Civil",
  "Solutions Numériques",
  "Formation & Coaching",
  "Finance & Investissement",
  "RSE & Développement Durable",
  "Autre",
];

interface ServiceItem {
  id: string;
  title: string;
  description: string;
  category: string;
  features: string[];
  priceMin: number;
  priceMax: number | null;
  currency: string;
  duration: string | null;
  isActive: boolean;
  isApproved: boolean;
  totalOrders: number;
  completedOrders: number;
  totalRevenue: number;
  createdAt: string;
}

const emptyForm = {
  title: "", description: "", category: CATEGORIES[0],
  features: [""], priceMin: "", priceMax: "", currency: "XOF", duration: "",
};

export default function ApporteurMesServicesPage() {
  const [services, setServices]       = useState<ServiceItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [showForm, setShowForm]       = useState(false);
  const [editing, setEditing]         = useState<ServiceItem | null>(null);
  const [saving, setSaving]           = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);

  // ── Chargement des services ────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/apporteur/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .finally(() => setLoading(false));
  }, []);

  // ── Ouvrir formulaire création ─────────────────────────────────────────
  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  // ── Ouvrir formulaire édition ──────────────────────────────────────────
  function openEdit(s: ServiceItem) {
    setEditing(s);
    setForm({
      title: s.title, description: s.description, category: s.category,
      features: s.features.length ? s.features : [""],
      priceMin: String(s.priceMin), priceMax: s.priceMax ? String(s.priceMax) : "",
      currency: s.currency, duration: s.duration ?? "",
    });
    setShowForm(true);
  }

  // ── Gestion des caractéristiques (features) ────────────────────────────
  function setFeature(i: number, val: string) {
    setForm((prev) => {
      const f = [...prev.features];
      f[i] = val;
      return { ...prev, features: f };
    });
  }
  function addFeature() {
    if (form.features.length < 8) setForm((p) => ({ ...p, features: [...p.features, ""] }));
  }
  function removeFeature(i: number) {
    setForm((p) => ({ ...p, features: p.features.filter((_, idx) => idx !== i) }));
  }

  // ── Soumission formulaire ──────────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const priceMin = parseFloat(form.priceMin);
    const priceMax = form.priceMax ? parseFloat(form.priceMax) : null;

    if (!form.title.trim() || !form.description.trim()) {
      toast.error("Titre et description sont requis.");
      return;
    }
    if (isNaN(priceMin) || priceMin <= 0) {
      toast.error("Prix minimum invalide.");
      return;
    }
    if (priceMax && priceMax < priceMin) {
      toast.error("Le prix maximum doit être ≥ au prix minimum.");
      return;
    }

    setSaving(true);
    const payload = {
      ...(editing ? { id: editing.id } : {}),
      title: form.title.trim(), description: form.description.trim(),
      category: form.category, features: form.features.filter((f) => f.trim()),
      priceMin, priceMax, currency: form.currency,
      duration: form.duration.trim() || null,
    };

    const method = editing ? "PATCH" : "POST";
    const res = await fetch("/api/apporteur/services", {
      method, headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);

    if (!res.ok) {
      toast.error(data.error ?? "Erreur lors de l'enregistrement.");
      return;
    }

    if (editing) {
      setServices((prev) => prev.map((s) => s.id === editing.id ? { ...s, ...data.service } : s));
      toast.success("Service mis à jour ! En attente de validation admin.");
    } else {
      setServices((prev) => [data.service, ...prev]);
      toast.success("Service créé ! En attente de validation admin.");
    }
    setShowForm(false);
  }

  // ── Suppression ────────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    const res = await fetch(`/api/apporteur/services?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      setServices((prev) => prev.filter((s) => s.id !== id));
      toast.success("Service supprimé.");
    } else {
      toast.error("Impossible de supprimer ce service.");
    }
    setConfirmDelete(null);
  }

  // ── Rendu ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Mes Services</h1>
          <p className="text-gray-500 text-sm mt-1">
            Créez vos propres offres de service. SHIFT UP perçoit{" "}
            <strong>{(COMMISSION_RATE * 100).toFixed(0)} %</strong> de commission sur chaque vente —
            vous conservez <strong>{((1 - COMMISSION_RATE) * 100).toFixed(0)} %</strong>.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-plus" />
          Ajouter un service
        </button>
      </div>

      {/* Bandeau info commission */}
      <div className="bg-gradient-to-r from-accent/5 to-secondary/5 border border-accent/20 rounded-2xl p-4 flex gap-4 items-start">
        <div className="w-9 h-9 bg-accent/10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5">
          <i className="fas fa-circle-info text-accent" />
        </div>
        <div className="text-sm text-gray-600">
          <p className="font-semibold text-primary mb-1">Comment ça fonctionne ?</p>
          <p>
            Vous créez votre service, fixez votre tarif, et SHIFT UP le diffuse sur la plateforme.
            À chaque vente : <strong className="text-accent">90 % vous revient</strong>, 10 % revient à SHIFT UP
            pour la plateforme, la facturation et le support client.
            Chaque nouveau service est soumis à validation de l'équipe SHIFT UP avant publication.
          </p>
        </div>
      </div>

      {/* Liste vide */}
      {services.length === 0 && (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center space-y-3">
          <div className="w-16 h-16 bg-accent/10 rounded-2xl flex items-center justify-center mx-auto">
            <i className="fas fa-briefcase text-accent text-2xl" />
          </div>
          <p className="font-syne font-bold text-primary">Aucun service créé</p>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Créez votre premier service et commencez à générer des revenus via la plateforme SHIFT UP.
          </p>
          <button
            onClick={openCreate}
            className="mt-2 inline-flex items-center gap-2 bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors"
          >
            <i className="fas fa-plus" />Créer mon premier service
          </button>
        </div>
      )}

      {/* Grille services */}
      <div className="grid sm:grid-cols-2 gap-5">
        {services.map((s) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl shadow-card p-5 flex flex-col gap-4"
          >
            {/* En-tête carte */}
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-xs font-medium bg-accent/10 text-accent px-2.5 py-0.5 rounded-full">
                    {s.category}
                  </span>
                  {s.isApproved ? (
                    <span className="text-xs font-medium bg-green-50 text-green-700 border border-green-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-circle-check text-[9px]" /> Approuvé
                    </span>
                  ) : (
                    <span className="text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <i className="fas fa-clock text-[9px]" /> En validation
                    </span>
                  )}
                </div>
                <h3 className="font-syne font-bold text-primary leading-snug line-clamp-2">{s.title}</h3>
              </div>
              <div className="flex gap-1.5 flex-shrink-0">
                <button
                  onClick={() => openEdit(s)}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:border-accent text-gray-400 hover:text-accent flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-pen text-xs" />
                </button>
                <button
                  onClick={() => setConfirmDelete(s.id)}
                  className="w-8 h-8 rounded-lg border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors"
                >
                  <i className="fas fa-trash text-xs" />
                </button>
              </div>
            </div>

            {/* Description */}
            <p className="text-gray-500 text-sm leading-relaxed line-clamp-3">{s.description}</p>

            {/* Features */}
            {s.features.length > 0 && (
              <ul className="space-y-1">
                {s.features.slice(0, 4).map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-gray-600">
                    <i className="fas fa-check text-secondary text-[9px] flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            )}

            {/* Prix + stats */}
            <div className="flex items-end justify-between pt-2 border-t border-gray-100 mt-auto">
              <div>
                <p className="text-lg font-syne font-black text-primary">
                  {s.priceMin.toLocaleString()} {s.currency}
                  {s.priceMax && <span className="text-sm font-normal text-gray-400"> – {s.priceMax.toLocaleString()}</span>}
                </p>
                {s.duration && <p className="text-xs text-gray-400">{s.duration}</p>}
              </div>
              <div className="text-right text-xs text-gray-400 space-y-0.5">
                <p><i className="fas fa-shopping-cart mr-1" />{s.totalOrders} commandes</p>
                <p className="text-accent font-semibold">
                  {((s.totalRevenue ?? 0) * (1 - COMMISSION_RATE)).toLocaleString()} {s.currency} gagnés
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── Modal formulaire ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showForm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
              onClick={() => setShowForm(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header modal */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white rounded-t-3xl z-10">
                  <h2 className="font-syne font-bold text-primary text-lg">
                    {editing ? "Modifier le service" : "Nouveau service"}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="w-8 h-8 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400"
                  >
                    <i className="fas fa-xmark" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">

                  {/* Titre */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      Titre du service <span className="text-red-400">*</span>
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      placeholder="Ex: Création de site web vitrine"
                      maxLength={100}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      required
                    />
                  </div>

                  {/* Catégorie */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">Catégorie</label>
                    <select
                      value={form.category}
                      onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                    >
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      Description <span className="text-red-400">*</span>
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      placeholder="Décrivez votre service en détail : ce que vous livrez, pour qui, et pourquoi vous choisir."
                      rows={4}
                      maxLength={1000}
                      className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none"
                      required
                    />
                  </div>

                  {/* Caractéristiques */}
                  <div>
                    <label className="block text-sm font-semibold text-primary mb-1.5">
                      Points forts (jusqu'à 8)
                    </label>
                    <div className="space-y-2">
                      {form.features.map((f, i) => (
                        <div key={i} className="flex gap-2">
                          <input
                            value={f}
                            onChange={(e) => setFeature(i, e.target.value)}
                            placeholder={`Point fort ${i + 1}`}
                            maxLength={100}
                            className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-accent"
                          />
                          {form.features.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeFeature(i)}
                              className="w-9 h-9 rounded-xl border border-gray-200 hover:border-red-300 text-gray-400 hover:text-red-500 flex items-center justify-center text-xs transition-colors"
                            >
                              <i className="fas fa-xmark" />
                            </button>
                          )}
                        </div>
                      ))}
                      {form.features.length < 8 && (
                        <button
                          type="button"
                          onClick={addFeature}
                          className="text-accent text-sm hover:underline flex items-center gap-1.5"
                        >
                          <i className="fas fa-plus text-xs" /> Ajouter un point fort
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Prix */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">
                        Prix minimum <span className="text-red-400">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="number" min={0} step={500}
                          value={form.priceMin}
                          onChange={(e) => setForm((p) => ({ ...p, priceMin: e.target.value }))}
                          placeholder="50000"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent pr-14"
                          required
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          {form.currency}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">Prix maximum</label>
                      <div className="relative">
                        <input
                          type="number" min={0} step={500}
                          value={form.priceMax}
                          onChange={(e) => setForm((p) => ({ ...p, priceMax: e.target.value }))}
                          placeholder="Optionnel"
                          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent pr-14"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                          {form.currency}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Devise + délai */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">Devise</label>
                      <select
                        value={form.currency}
                        onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      >
                        <option value="XOF">XOF (FCFA)</option>
                        <option value="EUR">EUR (€)</option>
                        <option value="USD">USD ($)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-primary mb-1.5">Délai de livraison</label>
                      <input
                        value={form.duration}
                        onChange={(e) => setForm((p) => ({ ...p, duration: e.target.value }))}
                        placeholder="Ex: 3-5 jours ouvrés"
                        maxLength={50}
                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                      />
                    </div>
                  </div>

                  {/* Alerte validation */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700 flex gap-2 items-start">
                    <i className="fas fa-triangle-exclamation mt-0.5 flex-shrink-0" />
                    <span>
                      Votre service sera soumis à validation par l'équipe SHIFT UP avant d'être publié sur la plateforme.
                      {editing && " Toute modification repasse en attente de validation."}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-accent to-secondary text-white text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition-opacity flex items-center gap-2"
                    >
                      {saving && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                      {editing ? "Enregistrer les modifications" : "Créer le service"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Modal suppression ────────────────────────────────────────────── */}
      <AnimatePresence>
        {confirmDelete && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-40"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center space-y-4">
                <div className="w-12 h-12 bg-red-50 rounded-2xl flex items-center justify-center mx-auto">
                  <i className="fas fa-trash text-red-500 text-xl" />
                </div>
                <p className="font-syne font-bold text-primary">Supprimer ce service ?</p>
                <p className="text-gray-500 text-sm">Cette action est irréversible. Les commandes existantes ne seront pas affectées.</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={() => handleDelete(confirmDelete)}
                    className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors"
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
