"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

interface Service {
  id: string;
  domain: string;
  title: string;
  description: string;
  features: string[];
  priceMin: number;
  priceMax: number | null;
  duration: string | null;
  isPopular: boolean;
  isActive: boolean;
  order: number;
}

const DOMAINS = [
  "Conseil Stratégique", "Solutions Numériques", "Formation",
  "Marketing Digital", "Juridique & Finance", "Design & Branding",
];

const emptyForm = {
  domain: DOMAINS[0], title: "", description: "",
  featuresText: "", priceMin: "", priceMax: "", duration: "",
  isPopular: false, isActive: true, order: 0,
};

export default function AdminServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading]   = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing]   = useState<Service | null>(null);
  const [form, setForm]         = useState({ ...emptyForm });
  const [saving, setSaving]     = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((d) => setServices(d.services ?? []))
      .finally(() => setLoading(false));
  }, []);

  function openCreate() {
    setEditing(null);
    setForm({ ...emptyForm });
    setShowForm(true);
  }

  function openEdit(s: Service) {
    setEditing(s);
    setForm({
      domain: s.domain, title: s.title, description: s.description,
      featuresText: s.features.join("\n"),
      priceMin: String(s.priceMin), priceMax: s.priceMax ? String(s.priceMax) : "",
      duration: s.duration ?? "", isPopular: s.isPopular, isActive: s.isActive, order: s.order,
    });
    setShowForm(true);
  }

  async function save() {
    if (!form.title.trim()) return;
    setSaving(true);
    try {
      const payload = {
        domain: form.domain, title: form.title, description: form.description,
        features: form.featuresText.split("\n").map((f) => f.trim()).filter(Boolean),
        priceMin: Number(form.priceMin) || 0,
        priceMax: form.priceMax ? Number(form.priceMax) : null,
        duration: form.duration || null,
        isPopular: form.isPopular, isActive: form.isActive, order: form.order,
      };

      if (editing) {
        const r = await fetch("/api/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: editing.id, ...payload }) });
        const d = await r.json();
        setServices((prev) => prev.map((s) => s.id === editing.id ? d.service : s));
        toast.success("Service mis à jour !");
      } else {
        const r = await fetch("/api/admin/services", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
        const d = await r.json();
        setServices((prev) => [d.service, ...prev]);
        toast.success("Service créé !");
      }
      setShowForm(false);
    } catch { toast.error("Erreur lors de l'enregistrement."); }
    finally { setSaving(false); }
  }

  async function deleteService(id: string) {
    try {
      await fetch(`/api/admin/services?id=${id}`, { method: "DELETE" });
      setServices((prev) => prev.filter((s) => s.id !== id));
      setConfirmDelete(null);
      toast.success("Service supprimé.");
    } catch { toast.error("Erreur."); }
  }

  async function toggleActive(s: Service) {
    try {
      const r = await fetch("/api/admin/services", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: s.id, isActive: !s.isActive }) });
      const d = await r.json();
      setServices((prev) => prev.map((x) => x.id === s.id ? d.service : x));
    } catch { toast.error("Erreur."); }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Services & CMS</h1>
          <p className="text-gray-500 text-sm">{services.length} service(s) configuré(s)</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity">
          <i className="fas fa-plus" />Nouveau service
        </button>
      </motion.div>

      {/* Flux devis → client */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 text-sm text-accent">
        <i className="fas fa-info-circle mr-2" />
        <strong>Flux demande client :</strong> Quand un client clique "Demander un devis", il soumet un formulaire de contact → le message apparaît dans <strong>Marketing → Contacts</strong> → vous lui répondez via la messagerie interne → le client accepte en souscrivant depuis son dashboard.
      </div>

      {/* Liste */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex justify-center py-12"><span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>
        ) : services.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">Aucun service. Créez le premier !</div>
        ) : services.map((s) => (
          <motion.div key={s.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5 flex items-start gap-4">
            <div className={`w-1 self-stretch rounded-full flex-shrink-0 ${s.isActive ? "bg-green-400" : "bg-gray-200"}`} />
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-xs text-gray-400 bg-gray-50 px-2 py-0.5 rounded-full">{s.domain}</span>
                {s.isPopular && <span className="text-xs font-bold text-white bg-accent px-2 py-0.5 rounded-full">Populaire</span>}
                {!s.isActive && <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Masqué</span>}
              </div>
              <h3 className="font-syne font-bold text-primary text-sm mb-0.5">{s.title}</h3>
              <p className="text-xs text-gray-500 line-clamp-1 mb-1">{s.description}</p>
              <div className="flex flex-wrap gap-3 text-xs text-gray-400">
                <span><i className="fas fa-tag mr-1" />{s.priceMin.toLocaleString()} {s.priceMax ? `– ${s.priceMax.toLocaleString()}` : "+"} FCFA</span>
                {s.duration && <span><i className="fas fa-clock mr-1" />{s.duration}</span>}
                <span><i className="fas fa-list mr-1" />{s.features.length} fonctionnalités</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={() => toggleActive(s)} className={`text-xs px-3 py-1.5 border rounded-lg transition-colors ${s.isActive ? "text-green-600 border-green-100 hover:bg-green-50" : "text-gray-400 border-gray-100 hover:bg-gray-50"}`}>
                <i className={`fas fa-${s.isActive ? "eye" : "eye-slash"} mr-1`} />{s.isActive ? "Visible" : "Masqué"}
              </button>
              <button onClick={() => openEdit(s)} className="text-accent hover:text-secondary text-xs font-medium flex items-center gap-1 px-3 py-1.5 border border-accent/20 rounded-lg hover:bg-accent/5 transition-colors">
                <i className="fas fa-pen-to-square" />Éditer
              </button>
              <button onClick={() => setConfirmDelete(s.id)} className="text-red-400 hover:text-red-600 text-xs px-3 py-1.5 border border-red-100 rounded-lg hover:bg-red-50 transition-colors">
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
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl p-6 space-y-4 overflow-y-auto max-h-[90vh]">
                <div className="flex items-center justify-between">
                  <h3 className="font-syne font-bold text-primary">{editing ? "Modifier le service" : "Nouveau service"}</h3>
                  <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-xmark" /></button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Domaine *</label>
                    <select value={form.domain} onChange={(e) => setForm({ ...form, domain: e.target.value })} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                      {DOMAINS.map((d) => <option key={d}>{d}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Titre *</label>
                    <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="Titre du service" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none" placeholder="Description courte" />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fonctionnalités (une par ligne)</label>
                  <textarea value={form.featuresText} onChange={(e) => setForm({ ...form, featuresText: e.target.value })} rows={4} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent resize-none font-mono" placeholder={"Audit stratégique\nFeuille de route 90 jours\nSuivi mensuel"} />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix min (FCFA)</label>
                    <input type="number" value={form.priceMin} onChange={(e) => setForm({ ...form, priceMin: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="150000" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Prix max (FCFA)</label>
                    <input type="number" value={form.priceMax} onChange={(e) => setForm({ ...form, priceMax: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="Optionnel" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Durée</label>
                    <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="Ex: 4-6 semaines" />
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setForm({ ...form, isPopular: !form.isPopular })} className={`w-10 h-6 rounded-full transition-colors relative ${form.isPopular ? "bg-accent" : "bg-gray-200"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isPopular ? "left-5" : "left-1"}`} />
                    </div>
                    <span className="text-sm text-gray-700">Marquer "Populaire"</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => setForm({ ...form, isActive: !form.isActive })} className={`w-10 h-6 rounded-full transition-colors relative ${form.isActive ? "bg-green-500" : "bg-gray-200"}`}>
                      <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${form.isActive ? "left-5" : "left-1"}`} />
                    </div>
                    <span className="text-sm text-gray-700">Visible sur le site</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-2">
                  <button onClick={() => setShowForm(false)} disabled={saving} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={save} disabled={saving || !form.title.trim()} className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                    {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</span> : editing ? "Mettre à jour" : "Créer le service"}
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
                <h3 className="font-syne font-bold text-primary">Supprimer ce service ?</h3>
                <p className="text-gray-500 text-sm">Les prestations existantes liées ne seront pas supprimées.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={() => deleteService(confirmDelete)} className="flex-1 bg-red-500 text-white rounded-xl py-2.5 text-sm font-semibold hover:bg-red-600">Supprimer</button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
