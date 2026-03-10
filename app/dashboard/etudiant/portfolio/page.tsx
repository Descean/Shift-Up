/**
 * app/dashboard/etudiant/portfolio/page.tsx — Portfolio (étudiant)
 *
 * Affiche les réalisations de l'étudiant issues des micro-tâches validées.
 * Chaque projet validé peut être ajouté au portfolio public de l'étudiant.
 *
 * Fonctionnalités :
 *  - Liste des projets (tirés des tâches VALIDE)
 *  - Possibilité d'ajouter une description personnalisée + screenshot
 *  - Toggle visibilité publique (visible dans l'annuaire des talents SHIFT UP)
 *
 * Données : actuellement mockées.
 * TODO: charger depuis GET /api/etudiant/portfolio (à créer),
 *       qui lit les tâches VALIDE de cet étudiant.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PortfolioItem {
  id: string;
  title: string;
  description: string;
  category: string;
  url: string;          // lien vers le livrable / démo
  isPublic: boolean;    // visible dans l'annuaire public
  completedAt: string;
  reward: number;
}

// ─── Données mock ─────────────────────────────────────────────────────────────
// Ces projets correspondent aux tâches validées de l'étudiant.
// TODO: filtrer depuis /api/micro-tasks?status=VALIDE

const mockPortfolio: PortfolioItem[] = [
  {
    id: "p-001",
    title: "Composant React — Dashboard Analytics",
    description:
      "Composant TypeScript réutilisable affichant des KPIs avec Recharts. Inclut graphiques en barres, sparklines et badges de variation.",
    category: "Développement",
    url: "https://github.com/etudiant/dashboard-analytics",
    isPublic: true,
    completedAt: "28/11/2025",
    reward: 45000,
  },
  {
    id: "p-002",
    title: "Page de destination HTML/CSS",
    description:
      "Landing page responsive pour une boutique de mode africaine. Pixel-perfect sur mobile, tablette et desktop.",
    category: "Design / Intégration",
    url: "https://codepen.io/etudiant/landing",
    isPublic: true,
    completedAt: "15/11/2025",
    reward: 25000,
  },
  {
    id: "p-003",
    title: "Posts Instagram — Marque Beauté",
    description:
      "3 visuels et légendes Instagram pour une cosmétique béninoise. Format carré 1080×1080, ton jeune et coloré.",
    category: "Marketing / Création",
    url: "https://drive.google.com/etudiant/posts",
    isPublic: false,
    completedAt: "08/11/2025",
    reward: 8000,
  },
];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function EtudiantPortfolioPage() {
  const [items, setItems] = useState<PortfolioItem[]>(mockPortfolio);

  // Compteurs récapitulatifs
  const totalEarned  = items.reduce((s, i) => s + i.reward, 0);
  const publicItems  = items.filter((i) => i.isPublic).length;

  /**
   * togglePublic — Bascule la visibilité publique d'un projet.
   *
   * TODO: appeler PATCH /api/etudiant/portfolio/[id] { isPublic: !current }
   */
  function togglePublic(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, isPublic: !item.isPublic } : item
      )
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Mon Portfolio</h1>
        <p className="text-gray-500 text-sm">Vos réalisations issues des micro-tâches validées</p>
      </motion.div>

      {/* ── Récapitulatif ────────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Projets réalisés", value: items.length, icon: "fa-folder-open", color: "text-accent" },
          { label: "Projets publics",  value: publicItems,  icon: "fa-eye",         color: "text-secondary" },
          { label: "Total gagné",      value: `${totalEarned.toLocaleString()} F`, icon: "fa-coins", color: "text-green-600" },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-card p-5">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className={`font-syne font-black text-2xl ${card.color}`}>{card.value}</p>
          </div>
        ))}
      </div>

      {/* ── Note sur le profil public ────────────────────────────────────── */}
      <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 text-sm text-accent">
        <i className="fas fa-info-circle mr-2" />
        Les projets marqués <strong>Public</strong> apparaissent dans l'annuaire des talents SHIFT UP
        et sont visibles par les clients potentiels.
      </div>

      {/* ── Liste des projets ────────────────────────────────────────────── */}
      {items.length === 0 && (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <i className="fas fa-folder-open text-gray-300 text-2xl" />
          </div>
          <p className="text-gray-400 text-sm">
            Aucun projet pour l'instant. Complétez des micro-tâches pour alimenter votre portfolio.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-card p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              {/* Corps */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-0.5 rounded-full">
                    {item.category}
                  </span>
                  {/* Badge visibilité */}
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                    item.isPublic
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-400"
                  }`}>
                    <i className={`fas fa-${item.isPublic ? "eye" : "eye-slash"} mr-1`} />
                    {item.isPublic ? "Public" : "Privé"}
                  </span>
                </div>

                <h3 className="font-syne font-bold text-primary mb-1">{item.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{item.description}</p>

                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400">
                  <span>
                    <i className="fas fa-calendar mr-1" />
                    Complété le {item.completedAt}
                  </span>
                  <span className="text-green-600 font-semibold">
                    <i className="fas fa-coins mr-1" />
                    {item.reward.toLocaleString()} FCFA gagné
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* Lien vers le projet */}
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 text-xs font-medium text-accent border border-accent/20 px-3 py-2 rounded-lg hover:bg-accent/5 transition-colors"
                >
                  <i className="fas fa-external-link" />
                  Voir le projet
                </a>

                {/* Toggle public / privé */}
                <button
                  onClick={() => togglePublic(item.id)}
                  className={`flex items-center justify-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg transition-colors ${
                    item.isPublic
                      ? "bg-green-50 text-green-700 hover:bg-green-100"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  <i className={`fas fa-${item.isPublic ? "eye-slash" : "eye"}`} />
                  {item.isPublic ? "Rendre privé" : "Publier"}
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
