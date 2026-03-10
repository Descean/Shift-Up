/**
 * app/dashboard/admin/utilisateurs/page.tsx — Gestion des utilisateurs (admin)
 *
 * Fonctionnalités :
 *  - Tableau paginé de tous les utilisateurs inscrits
 *  - Recherche par nom ou email
 *  - Filtre par rôle (CLIENT, APPORTEUR, ETUDIANT, ADMIN, DEVELOPER)
 *  - Actions : activer / désactiver un compte, changer le rôle
 *  - Badge étoiles (notation) et compteur de prestations
 *  - Consomme GET /api/admin/users et PATCH /api/admin/users
 *
 * Données : actuellement mockées — remplacer par appels réels (TODO commentés).
 */

"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type UserRole = "CLIENT" | "APPORTEUR" | "ETUDIANT" | "ADMIN" | "DEVELOPER";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  stars: number;         // note 0–5 attribuée par l'admin
  prestationsCount: number;
  createdAt: string;
  affiliationCode: string | null; // uniquement pour APPORTEUR
}

// ─── Données mock ─────────────────────────────────────────────────────────────
// TODO: remplacer par fetch("/api/admin/users?page=1&limit=20") dans un useEffect

const mockUsers: User[] = [
  {
    id: "u-001",
    name: "Kofi Mensah",
    email: "kofi@example.com",
    role: "CLIENT",
    isActive: true,
    stars: 4,
    prestationsCount: 2,
    createdAt: "10/09/2025",
    affiliationCode: null,
  },
  {
    id: "u-002",
    name: "Aïcha Traoré",
    email: "aicha@example.com",
    role: "CLIENT",
    isActive: true,
    stars: 5,
    prestationsCount: 1,
    createdAt: "01/10/2025",
    affiliationCode: null,
  },
  {
    id: "u-003",
    name: "Rodrigue Hounton",
    email: "rodrigue@example.com",
    role: "APPORTEUR",
    isActive: true,
    stars: 3,
    prestationsCount: 0,
    createdAt: "15/08/2025",
    affiliationCode: "SU-RH2025",
  },
  {
    id: "u-004",
    name: "Élodie Favi",
    email: "elodie@example.com",
    role: "ETUDIANT",
    isActive: true,
    stars: 0,
    prestationsCount: 0,
    createdAt: "22/10/2025",
    affiliationCode: null,
  },
  {
    id: "u-005",
    name: "Samuel Kpoton",
    email: "samuel@example.com",
    role: "CLIENT",
    isActive: false, // compte désactivé
    stars: 2,
    prestationsCount: 1,
    createdAt: "05/11/2025",
    affiliationCode: null,
  },
  {
    id: "u-006",
    name: "Eudes Kpadonou",
    email: "shiftup.eudes@gmail.com",
    role: "ADMIN",
    isActive: true,
    stars: 0,
    prestationsCount: 0,
    createdAt: "01/01/2025",
    affiliationCode: null,
  },
];

// ─── Couleurs par rôle ────────────────────────────────────────────────────────

/** Classes CSS pour les badges de rôle */
const roleStyle: Record<UserRole, string> = {
  CLIENT:    "bg-blue-50 text-blue-700",
  APPORTEUR: "bg-purple-50 text-purple-700",
  ETUDIANT:  "bg-amber-50 text-amber-700",
  ADMIN:     "bg-red-50 text-red-700",
  DEVELOPER: "bg-gray-100 text-gray-700",
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function AdminUtilisateursPage() {
  // ── États de liste / filtre ──────────────────────────────────────────────
  const [search, setSearch]         = useState("");
  const [filterRole, setFilterRole] = useState<UserRole | "TOUS">("TOUS");

  // ── États du modal d'édition ─────────────────────────────────────────────
  const [editing, setEditing]       = useState<User | null>(null);
  const [editRole, setEditRole]     = useState<UserRole>("CLIENT");
  const [editActive, setEditActive] = useState(true);
  const [editStars, setEditStars]   = useState(0);
  const [saving, setSaving]         = useState(false);

  // ── Filtrage ─────────────────────────────────────────────────────────────
  // Combine le filtre de rôle et la recherche textuelle (nom OU email)
  const filtered = mockUsers.filter((u) => {
    const matchRole = filterRole === "TOUS" || u.role === filterRole;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q);
    return matchRole && matchSearch;
  });

  // ── Ouverture du modal d'édition ─────────────────────────────────────────
  // Pré-remplit les champs avec les valeurs actuelles de l'utilisateur
  function openEdit(u: User) {
    setEditing(u);
    setEditRole(u.role);
    setEditActive(u.isActive);
    setEditStars(u.stars);
  }

  /**
   * saveEdit — Applique les modifications d'un utilisateur.
   *
   * TODO: remplacer le setTimeout par un vrai appel :
   *   await fetch("/api/admin/users", {
   *     method: "PATCH",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify({
   *       userId: editing.id,
   *       role: editRole,
   *       isActive: editActive,
   *       stars: editStars,
   *     }),
   *   });
   */
  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setEditing(null);
  }

  // ─── Rendu ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-7xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">
          Gestion des Utilisateurs
        </h1>
        <p className="text-gray-500 text-sm">
          {mockUsers.length} utilisateur(s) enregistré(s)
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
            placeholder="Rechercher par nom ou email..."
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>

        {/* Filtre par rôle */}
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value as any)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white"
        >
          <option value="TOUS">Tous les rôles</option>
          {(["CLIENT", "APPORTEUR", "ETUDIANT", "ADMIN", "DEVELOPER"] as UserRole[]).map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
      </div>

      {/* ── Tableau des utilisateurs ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Utilisateur</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Rôle</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Note</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Prestations</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Inscription</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              )}
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">

                  {/* Identité */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {/* Avatar généré avec initiales */}
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-xs font-bold">
                          {u.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                        </span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-primary">{u.name}</p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                        {/* Code d'affiliation affiché uniquement pour les apporteurs */}
                        {u.affiliationCode && (
                          <span className="text-xs font-mono text-purple-600 bg-purple-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                            {u.affiliationCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Rôle */}
                  <td className="px-6 py-4">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${roleStyle[u.role]}`}>
                      {u.role}
                    </span>
                  </td>

                  {/* Statut actif/inactif */}
                  <td className="px-6 py-4 text-center">
                    {u.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 bg-green-50 px-2 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                        Actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full font-semibold">
                        <span className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                        Inactif
                      </span>
                    )}
                  </td>

                  {/* Note en étoiles */}
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <i
                          key={star}
                          className={`fas fa-star text-xs ${star <= u.stars ? "text-amber-400" : "text-gray-200"}`}
                        />
                      ))}
                    </div>
                  </td>

                  {/* Nombre de prestations */}
                  <td className="px-6 py-4 text-center text-sm text-gray-600 font-medium">
                    {u.prestationsCount}
                  </td>

                  {/* Date d'inscription */}
                  <td className="px-6 py-4 text-sm text-gray-400">{u.createdAt}</td>

                  {/* Bouton édition */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openEdit(u)}
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

      {/* ── Modal d'édition utilisateur ───────────────────────────────────── */}
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
                  <h3 className="font-syne font-bold text-primary">Modifier l'utilisateur</h3>
                  <button
                    onClick={() => setEditing(null)}
                    className="text-gray-400 hover:text-gray-600"
                    disabled={saving}
                  >
                    <i className="fas fa-xmark" />
                  </button>
                </div>

                {/* Récapitulatif identité */}
                <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
                    <span className="text-white text-sm font-bold">
                      {editing.name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-primary">{editing.name}</p>
                    <p className="text-xs text-gray-400">{editing.email}</p>
                  </div>
                </div>

                {/* Sélection du rôle */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Rôle</label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as UserRole)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                  >
                    {(["CLIENT", "APPORTEUR", "ETUDIANT", "ADMIN", "DEVELOPER"] as UserRole[]).map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>

                {/* Toggle actif / inactif */}
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Compte actif</p>
                    <p className="text-xs text-gray-400">
                      {editActive ? "Le compte est accessible" : "Le compte est suspendu"}
                    </p>
                  </div>
                  <button
                    onClick={() => setEditActive(!editActive)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${editActive ? "bg-green-500" : "bg-gray-300"}`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${editActive ? "translate-x-7" : "translate-x-1"}`}
                    />
                  </button>
                </div>

                {/* Notation étoiles */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Note client — <span className="text-accent font-bold">{editStars}/5</span>
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setEditStars(star === editStars ? 0 : star)}
                        className={`text-2xl transition-colors ${star <= editStars ? "text-amber-400" : "text-gray-200 hover:text-amber-200"}`}
                      >
                        <i className="fas fa-star" />
                      </button>
                    ))}
                  </div>
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
