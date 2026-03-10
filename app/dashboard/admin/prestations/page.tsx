/**
 * app/dashboard/admin/prestations/page.tsx — Gestion des prestations (admin)
 *
 * Fonctionnalités :
 *  - Tableau paginé de toutes les prestations (toutes priorités, tous clients)
 *  - Filtrage par statut (EN_ATTENTE, EN_COURS, LIVRAISON, REVISION, TERMINEE, ANNULEE)
 *  - Recherche par nom client ou titre service
 *  - Modal de mise à jour : statut, progression globale, assignation membre équipe
 *  - Consomme GET /api/admin/prestations et PATCH /api/admin/prestations
 *
 * Données : actuellement mockées — remplacer fetch() par appels réels (TODO commentés).
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Statuts possibles d'une prestation (miroir du schéma Prisma) */
type PrestationStatus =
  | "EN_ATTENTE"
  | "EN_COURS"
  | "LIVRAISON"
  | "REVISION"
  | "TERMINEE"
  | "ANNULEE";

interface Prestation {
  id: string;
  client: { name: string; email: string };
  service: { title: string; domain: string };
  status: PrestationStatus;
  globalProgress: number;   // 0–100
  amount: number;           // montant total FCFA
  amountPaid: number;       // montant déjà payé
  assignedTo: string | null; // nom du membre assigné
  createdAt: string;
  estimatedEndDate: string | null;
}

// ─── Données mock ─────────────────────────────────────────────────────────────
// TODO: remplacer par fetch("/api/admin/prestations") dans un useEffect

const mockPrestations: Prestation[] = [
  {
    id: "prest-001",
    client: { name: "Kofi Mensah", email: "kofi@example.com" },
    service: { title: "Application Web / SaaS", domain: "dev" },
    status: "EN_COURS",
    globalProgress: 45,
    amount: 1500000,
    amountPaid: 600000,
    assignedTo: "Jean-Paul R.",
    createdAt: "10/10/2025",
    estimatedEndDate: "31/12/2025",
  },
  {
    id: "prest-002",
    client: { name: "Aïcha Traoré", email: "aicha@example.com" },
    service: { title: "Stratégie digitale", domain: "marketing" },
    status: "TERMINEE",
    globalProgress: 100,
    amount: 200000,
    amountPaid: 200000,
    assignedTo: "Marie C.",
    createdAt: "01/11/2025",
    estimatedEndDate: "20/11/2025",
  },
  {
    id: "prest-003",
    client: { name: "Samuel Kpoton", email: "samuel@example.com" },
    service: { title: "Logo & Identité visuelle", domain: "design" },
    status: "EN_ATTENTE",
    globalProgress: 0,
    amount: 80000,
    amountPaid: 0,
    assignedTo: null,
    createdAt: "20/11/2025",
    estimatedEndDate: null,
  },
  {
    id: "prest-004",
    client: { name: "Félicia Dossa", email: "felicia@example.com" },
    service: { title: "E-commerce / Boutique", domain: "dev" },
    status: "LIVRAISON",
    globalProgress: 90,
    amount: 450000,
    amountPaid: 180000,
    assignedTo: "Jean-Paul R.",
    createdAt: "15/10/2025",
    estimatedEndDate: "05/12/2025",
  },
  {
    id: "prest-005",
    client: { name: "Boris Agbayissah", email: "boris@example.com" },
    service: { title: "Community Management", domain: "marketing" },
    status: "REVISION",
    globalProgress: 75,
    amount: 150000,
    amountPaid: 60000,
    assignedTo: "Marie C.",
    createdAt: "05/11/2025",
    estimatedEndDate: "10/12/2025",
  },
];

// Membres de l'équipe disponibles pour assignation
const teamMembers = ["Jean-Paul R.", "Marie C.", "Eudes K.", "Carole M."];

// ─── Styles de statuts ────────────────────────────────────────────────────────

/** Classes CSS Tailwind par statut pour les badges colorés */
const statusStyle: Record<PrestationStatus, string> = {
  EN_ATTENTE: "bg-gray-100 text-gray-600",
  EN_COURS:   "bg-blue-50 text-blue-700",
  LIVRAISON:  "bg-purple-50 text-purple-700",
  REVISION:   "bg-amber-50 text-amber-700",
  TERMINEE:   "bg-green-50 text-green-700",
  ANNULEE:    "bg-red-50 text-red-500",
};

/** Labels affichables par statut (version lisible du code enum) */
const statusLabel: Record<PrestationStatus, string> = {
  EN_ATTENTE: "En attente",
  EN_COURS:   "En cours",
  LIVRAISON:  "Livraison",
  REVISION:   "Révision",
  TERMINEE:   "Terminée",
  ANNULEE:    "Annulée",
};

/** Couleur de la barre de progression selon avancement */
function progressColor(p: number): string {
  if (p === 100) return "bg-green-500";
  if (p >= 60)   return "bg-blue-500";
  if (p >= 30)   return "bg-amber-500";
  return "bg-gray-300";
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function AdminPrestationsPage() {
  // ── États de liste / filtre ──────────────────────────────────────────────
  const [search, setSearch]         = useState("");
  const [filterStatus, setFilter]   = useState<PrestationStatus | "TOUS">("TOUS");

  // ── États du modal d'édition ─────────────────────────────────────────────
  const [editing, setEditing]         = useState<Prestation | null>(null);
  const [editStatus, setEditStatus]   = useState<PrestationStatus>("EN_ATTENTE");
  const [editProgress, setEditProgress] = useState(0);
  const [editAssigned, setEditAssigned] = useState<string>("");
  const [saving, setSaving]           = useState(false);

  // ── Filtrage des prestations ─────────────────────────────────────────────
  // Filtre simultané sur le statut ET la recherche textuelle (client + service)
  const filtered = mockPrestations.filter((p) => {
    const matchStatus = filterStatus === "TOUS" || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.client.name.toLowerCase().includes(q) ||
      p.service.title.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  // ── Ouverture du modal d'édition ─────────────────────────────────────────
  // Pré-remplit les champs éditables avec les valeurs actuelles de la prestation
  function openEdit(p: Prestation) {
    setEditing(p);
    setEditStatus(p.status);
    setEditProgress(p.globalProgress);
    setEditAssigned(p.assignedTo ?? "");
  }

  /**
   * saveEdit — Enregistre les modifications d'une prestation.
   *
   * TODO: remplacer le setTimeout par un vrai appel :
   *   await fetch("/api/admin/prestations", {
   *     method: "PATCH",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify({
   *       prestationId: editing.id,
   *       status: editStatus,
   *       globalProgress: editProgress,
   *       assignedToId: editAssigned,  // doit être un userId, pas un nom
   *     }),
   *   });
   */
  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600)); // simulation réseau
    setSaving(false);
    setEditing(null);
  }

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">
          Gestion des Prestations
        </h1>
        <p className="text-gray-500 text-sm">
          {mockPrestations.length} prestation(s) au total
        </p>
      </motion.div>

      {/* ── Barre de filtres ─────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">

        {/* Recherche textuelle */}
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher client ou service..."
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filtre par statut */}
        <select
          value={filterStatus}
          onChange={(e) => setFilter(e.target.value as any)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white"
        >
          <option value="TOUS">Tous les statuts</option>
          {(Object.keys(statusLabel) as PrestationStatus[]).map((s) => (
            <option key={s} value={s}>{statusLabel[s]}</option>
          ))}
        </select>
      </div>

      {/* ── Tableau des prestations ───────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Service</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Progression</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Montant</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Assigné à</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Créé le</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Aucune prestation trouvée.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">

                  {/* Client */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-primary">{p.client.name}</p>
                    <p className="text-xs text-gray-400">{p.client.email}</p>
                  </td>

                  {/* Service */}
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-700">{p.service.title}</p>
                    <span className="text-xs text-gray-400 capitalize">{p.service.domain}</span>
                  </td>

                  {/* Statut */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[p.status]}`}>
                      {statusLabel[p.status]}
                    </span>
                  </td>

                  {/* Progression — barre de pourcentage */}
                  <td className="px-6 py-4 min-w-[120px]">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${progressColor(p.globalProgress)}`}
                          style={{ width: `${p.globalProgress}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">{p.globalProgress}%</span>
                    </div>
                  </td>

                  {/* Montant total + payé */}
                  <td className="px-6 py-4 text-right">
                    <p className="text-sm font-bold text-primary">{p.amount.toLocaleString()} F</p>
                    <p className="text-xs text-gray-400">{p.amountPaid.toLocaleString()} payé</p>
                  </td>

                  {/* Assigné à */}
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {p.assignedTo ?? <span className="text-gray-300 italic">Non assigné</span>}
                  </td>

                  {/* Date de création */}
                  <td className="px-6 py-4 text-sm text-gray-400">{p.createdAt}</td>

                  {/* Bouton édition */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-accent hover:text-secondary transition-colors text-xs font-medium flex items-center gap-1"
                    >
                      <i className="fas fa-pen-to-square" />
                      Éditer
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Modal d'édition ──────────────────────────────────────────────── */}
      <AnimatePresence>
        {editing && (
          <>
            {/* Fond semi-transparent */}
            <motion.div
              className="fixed inset-0 bg-black/40 z-40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !saving && setEditing(null)}
            />

            {/* Panneau modal */}
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-5">

                {/* En-tête modal */}
                <div className="flex items-center justify-between">
                  <h3 className="font-syne font-bold text-primary">
                    Modifier la prestation
                  </h3>
                  <button
                    onClick={() => setEditing(null)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={saving}
                  >
                    <i className="fas fa-xmark" />
                  </button>
                </div>

                {/* Nom du client + service */}
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-primary">{editing.client.name}</p>
                  <p className="text-xs text-gray-400">{editing.service.title}</p>
                </div>

                {/* Sélection du statut */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value as PrestationStatus)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  >
                    {(Object.keys(statusLabel) as PrestationStatus[]).map((s) => (
                      <option key={s} value={s}>{statusLabel[s]}</option>
                    ))}
                  </select>
                </div>

                {/* Slider de progression */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Progression globale — <span className="text-accent font-bold">{editProgress}%</span>
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={editProgress}
                    onChange={(e) => setEditProgress(Number(e.target.value))}
                    className="w-full accent-accent"
                  />
                  <div className="flex justify-between text-xs text-gray-400 mt-1">
                    <span>0%</span><span>50%</span><span>100%</span>
                  </div>
                </div>

                {/* Sélection du membre assigné */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Assigner à</label>
                  <select
                    value={editAssigned}
                    onChange={(e) => setEditAssigned(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  >
                    <option value="">— Non assigné —</option>
                    {teamMembers.map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                {/* Boutons d'action */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setEditing(null)}
                    className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600 hover:border-gray-300"
                    disabled={saving}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={saveEdit}
                    disabled={saving}
                    className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
                  >
                    {saving ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Enregistrement…
                      </span>
                    ) : "Enregistrer"}
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
