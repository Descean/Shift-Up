"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

type Status = "EN_ATTENTE_PAIEMENT" | "PAIEMENT_CONFIRME" | "ANNULEE";

interface Inscription {
  id: string;
  reference: string;
  prenom: string;
  nom: string;
  email: string;
  telephone: string;
  ville: string;
  structure: string;
  poste: string;
  secteur: string;
  attente: string;
  source: string;
  methodePaiement: string;
  status: Status;
  transactionRef: string | null;
  createdAt: string;
  formation: { titre: string; slug: string; prixFCFA: number };
}

interface FormationFilter { slug: string; titre: string }

const statusLabel: Record<Status, { label: string; cls: string }> = {
  EN_ATTENTE_PAIEMENT: { label: "En attente", cls: "bg-amber-50 text-amber-700 border-amber-200" },
  PAIEMENT_CONFIRME: { label: "Confirmée ✓", cls: "bg-green-50 text-green-700 border-green-200" },
  ANNULEE: { label: "Annulée", cls: "bg-red-50 text-red-700 border-red-200" },
};

export default function AdminFormationsPage() {
  const [inscriptions, setInscriptions] = useState<Inscription[]>([]);
  const [formations, setFormations] = useState<FormationFilter[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSlug, setFilterSlug] = useState("");
  const [filterStatus, setFilterStatus] = useState<Status | "">("");
  const [selected, setSelected] = useState<Inscription | null>(null);
  const [updating, setUpdating] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const p = new URLSearchParams();
    if (filterSlug) p.set("slug", filterSlug);
    if (filterStatus) p.set("status", filterStatus);
    if (search) p.set("search", search);
    fetch(`/api/admin/formations?${p}`)
      .then((r) => r.json())
      .then((d) => {
        setInscriptions(d.inscriptions ?? []);
        setTotal(d.total ?? 0);
        setFormations(d.formations ?? []);
      })
      .finally(() => setLoading(false));
  }, [filterSlug, filterStatus, search]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string, status: Status) => {
    setUpdating(true);
    try {
      const res = await fetch(`/api/admin/formations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        load();
        if (selected?.id === id) setSelected((s) => s ? { ...s, status } : null);
      }
    } finally {
      setUpdating(false);
    }
  };

  const confirmedCount = inscriptions.filter((i) => i.status === "PAIEMENT_CONFIRME").length;
  const pendingCount = inscriptions.filter((i) => i.status === "EN_ATTENTE_PAIEMENT").length;
  const totalRevenu = inscriptions
    .filter((i) => i.status === "PAIEMENT_CONFIRME")
    .reduce((sum, i) => sum + i.formation.prixFCFA, 0);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <h1 className="font-syne font-black text-2xl text-primary mb-1">Formations — Inscriptions</h1>
        <p className="text-sm text-gray-400">Gérez les inscriptions et suivez les paiements</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Inscriptions totales", value: total, icon: "fas fa-users", color: "from-accent to-primary" },
          { label: "Confirmées", value: confirmedCount, icon: "fas fa-circle-check", color: "from-green-400 to-emerald-600" },
          { label: "En attente", value: pendingCount, icon: "fas fa-clock", color: "from-amber-400 to-orange-500" },
          { label: "Revenus FCFA", value: totalRevenu.toLocaleString("fr-FR"), icon: "fas fa-coins", color: "from-secondary to-teal-500" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-card p-4">
            <div className={`w-9 h-9 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white text-sm mb-2`}>
              <i className={s.icon} />
            </div>
            <p className="font-syne font-black text-xl text-primary">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl shadow-card p-4 mb-4 flex flex-wrap gap-3">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher nom, email, référence…"
          className="flex-1 min-w-[180px] text-sm border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-accent"
        />
        <select
          value={filterSlug}
          onChange={(e) => setFilterSlug(e.target.value)}
          className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-accent cursor-pointer"
        >
          <option value="">Toutes les formations</option>
          {formations.map((f) => <option key={f.slug} value={f.slug}>{f.titre}</option>)}
        </select>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as Status | "")}
          className="text-sm border border-gray-200 rounded-xl px-3.5 py-2 outline-none focus:border-accent cursor-pointer"
        >
          <option value="">Tous les statuts</option>
          <option value="PAIEMENT_CONFIRME">Confirmées</option>
          <option value="EN_ATTENTE_PAIEMENT">En attente</option>
          <option value="ANNULEE">Annulées</option>
        </select>
        <button onClick={load} className="text-sm bg-accent/10 text-accent border border-accent/20 rounded-xl px-4 py-2 hover:bg-accent/20 transition-colors">
          <i className="fas fa-rotate-right mr-1.5" />Actualiser
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-spinner fa-spin text-2xl mb-3 block text-accent" />
            Chargement…
          </div>
        ) : inscriptions.length === 0 ? (
          <div className="p-12 text-center text-gray-400">
            <i className="fas fa-inbox text-3xl mb-3 block" />
            Aucune inscription trouvée.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50 text-left">
                  {["Référence", "Participant", "Formation", "Paiement", "Statut", "Date", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {inscriptions.map((ins) => (
                  <tr key={ins.id} className="border-b border-gray-50 hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 font-mono text-xs text-primary font-bold">{ins.reference}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-primary">{ins.prenom} {ins.nom}</p>
                      <p className="text-xs text-gray-400">{ins.email}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 max-w-[180px] truncate">{ins.formation.titre}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">
                      {ins.methodePaiement}<br />
                      <span className="text-xs font-semibold text-green-600">{ins.formation.prixFCFA.toLocaleString("fr-FR")} FCFA</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold border ${statusLabel[ins.status].cls}`}>
                        {statusLabel[ins.status].label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">
                      {new Date(ins.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setSelected(ins)}
                          className="text-xs bg-primary/5 text-primary border border-primary/10 rounded-lg px-2.5 py-1.5 hover:bg-primary/10 transition-colors"
                        >
                          Détails
                        </button>
                        {ins.status !== "PAIEMENT_CONFIRME" && (
                          <button
                            onClick={() => updateStatus(ins.id, "PAIEMENT_CONFIRME")}
                            disabled={updating}
                            className="text-xs bg-green-50 text-green-700 border border-green-200 rounded-lg px-2.5 py-1.5 hover:bg-green-100 transition-colors disabled:opacity-50"
                          >
                            ✓ Confirmer
                          </button>
                        )}
                        {ins.status !== "ANNULEE" && ins.status !== "PAIEMENT_CONFIRME" && (
                          <button
                            onClick={() => updateStatus(ins.id, "ANNULEE")}
                            disabled={updating}
                            className="text-xs bg-red-50 text-red-700 border border-red-200 rounded-lg px-2.5 py-1.5 hover:bg-red-100 transition-colors disabled:opacity-50"
                          >
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal détail */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSelected(null); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="p-5 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white rounded-t-2xl">
                <div>
                  <p className="font-mono text-sm font-bold text-primary">{selected.reference}</p>
                  <p className="text-xs text-gray-400">{selected.formation.titre}</p>
                </div>
                <button onClick={() => setSelected(null)} className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">
                  <i className="fas fa-times text-xs" />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <span className={`inline-flex items-center px-3 py-1 rounded-lg text-sm font-semibold border ${statusLabel[selected.status].cls}`}>
                  {statusLabel[selected.status].label}
                </span>

                <dl className="space-y-2">
                  {[
                    ["Participant", `${selected.prenom} ${selected.nom}`],
                    ["Email", selected.email],
                    ["Téléphone", selected.telephone],
                    ["Ville", selected.ville],
                    ["Structure", selected.structure],
                    ["Poste", selected.poste],
                    ["Secteur", selected.secteur],
                    ["Source", selected.source],
                    ["Paiement", selected.methodePaiement],
                    ["Réf. transaction FedaPay", selected.transactionRef ?? "—"],
                    ["Attente", selected.attente],
                    ["Inscrit le", new Date(selected.createdAt).toLocaleString("fr-FR")],
                  ].map(([k, v]) => (
                    <div key={k} className="flex gap-2 text-sm border-b border-gray-50 pb-1.5 last:border-0">
                      <dt className="text-gray-400 w-36 flex-shrink-0">{k}</dt>
                      <dd className="font-medium text-primary break-all">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div className="flex gap-2 pt-2">
                  {selected.status !== "PAIEMENT_CONFIRME" && (
                    <button
                      onClick={() => updateStatus(selected.id, "PAIEMENT_CONFIRME")}
                      disabled={updating}
                      className="flex-1 bg-green-600 text-white font-semibold text-sm rounded-xl py-2.5 hover:bg-green-700 transition-colors disabled:opacity-50"
                    >
                      ✓ Confirmer le paiement
                    </button>
                  )}
                  {selected.status !== "ANNULEE" && selected.status !== "PAIEMENT_CONFIRME" && (
                    <button
                      onClick={() => updateStatus(selected.id, "ANNULEE")}
                      disabled={updating}
                      className="flex-1 bg-red-50 text-red-700 border border-red-200 font-semibold text-sm rounded-xl py-2.5 hover:bg-red-100 transition-colors disabled:opacity-50"
                    >
                      Annuler l'inscription
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
