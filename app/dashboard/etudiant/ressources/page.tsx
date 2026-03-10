/**
 * app/dashboard/etudiant/ressources/page.tsx — Ressources & cours (étudiant)
 *
 * Bibliothèque de ressources pédagogiques mise à disposition par SHIFT UP :
 *  - Vidéos de formation
 *  - Guides PDF
 *  - Templates et outils
 *  - Liens vers des cours externes recommandés
 *
 * Catégories : Développement, Design, Marketing, Gestion de projet, Outils
 *
 * Données : actuellement mockées.
 * TODO: charger depuis GET /api/etudiant/ressources (à créer),
 *       qui lit prisma.ressource (modèle à ajouter au schéma).
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type ResourceType = "VIDEO" | "PDF" | "TEMPLATE" | "LIEN";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  url: string;
  duration?: string;   // pour les vidéos
  size?: string;       // pour les PDFs
  isNew?: boolean;     // tag "Nouveau"
}

// ─── Données mock ─────────────────────────────────────────────────────────────

const resources: Resource[] = [
  {
    id: "r-001",
    title: "Initiation à React & Next.js",
    description: "Apprenez les bases de React et Next.js App Router avec des exemples pratiques.",
    type: "VIDEO",
    category: "Développement",
    url: "#",
    duration: "2h 15min",
    isNew: true,
  },
  {
    id: "r-002",
    title: "Guide Tailwind CSS — De zéro à expert",
    description: "Maîtrisez Tailwind CSS pour créer des interfaces modernes et responsive.",
    type: "PDF",
    category: "Développement",
    url: "#",
    size: "4.2 MB",
  },
  {
    id: "r-003",
    title: "Template Figma — Kit UI Web App",
    description: "Composants Figma prêts à l'emploi pour vos projets de design d'application.",
    type: "TEMPLATE",
    category: "Design",
    url: "#",
    isNew: true,
  },
  {
    id: "r-004",
    title: "Stratégie de contenu pour réseaux sociaux",
    description: "Comment créer une stratégie de contenu efficace pour Instagram, Facebook et LinkedIn.",
    type: "VIDEO",
    category: "Marketing",
    url: "#",
    duration: "45min",
  },
  {
    id: "r-005",
    title: "Guide SEO pour débutants",
    description: "Les bases du référencement naturel : mots-clés, balises, liens et contenu.",
    type: "PDF",
    category: "Marketing",
    url: "#",
    size: "2.8 MB",
  },
  {
    id: "r-006",
    title: "Méthode Agile / Scrum — Cours complet",
    description: "Comprendre et appliquer la méthodologie Agile dans vos projets digitaux.",
    type: "LIEN",
    category: "Gestion de projet",
    url: "#",
  },
  {
    id: "r-007",
    title: "Template propositions commerciales",
    description: "Modèle Word/Google Docs pour rédiger des propositions commerciales professionnelles.",
    type: "TEMPLATE",
    category: "Gestion de projet",
    url: "#",
  },
  {
    id: "r-008",
    title: "Guide Git & GitHub — Collaboration en équipe",
    description: "Flux de travail Git pour travailler en équipe : branches, pull requests, conflits.",
    type: "PDF",
    category: "Outils",
    url: "#",
    size: "1.9 MB",
    isNew: true,
  },
];

const categories = ["Tous", "Développement", "Design", "Marketing", "Gestion de projet", "Outils"];

// ─── Styles ───────────────────────────────────────────────────────────────────

const typeStyle: Record<ResourceType, { bg: string; icon: string; label: string }> = {
  VIDEO:    { bg: "bg-red-50 text-red-600",    icon: "fa-play-circle",  label: "Vidéo" },
  PDF:      { bg: "bg-blue-50 text-blue-600",  icon: "fa-file-pdf",     label: "PDF" },
  TEMPLATE: { bg: "bg-purple-50 text-purple-600", icon: "fa-layer-group", label: "Template" },
  LIEN:     { bg: "bg-green-50 text-green-600", icon: "fa-external-link", label: "Lien" },
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function EtudiantRessourcesPage() {
  const [activeCategory, setCategory] = useState("Tous");
  const [search, setSearch]           = useState("");

  // Filtrage par catégorie et recherche textuelle
  const filtered = resources.filter((r) => {
    const matchCat  = activeCategory === "Tous" || r.category === activeCategory;
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-5xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Ressources & Cours</h1>
        <p className="text-gray-500 text-sm">
          {resources.length} ressources disponibles pour monter en compétences
        </p>
      </motion.div>

      {/* ── Recherche ────────────────────────────────────────────────────── */}
      <div className="relative">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher une ressource..."
          className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* ── Onglets catégories ────────────────────────────────────────────── */}
      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              activeCategory === cat
                ? "bg-accent text-white"
                : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Grille des ressources ─────────────────────────────────────────── */}
      {filtered.length === 0 && (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
          Aucune ressource trouvée.
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        {filtered.map((res, i) => {
          const typeInfo = typeStyle[res.type];
          return (
            <motion.div
              key={res.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="bg-white rounded-2xl shadow-card p-5 flex flex-col"
            >
              {/* Badges type + catégorie + "Nouveau" */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${typeInfo.bg}`}>
                  <i className={`fas ${typeInfo.icon} text-xs`} />
                  {typeInfo.label}
                </span>
                <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full">
                  {res.category}
                </span>
                {res.isNew && (
                  <span className="text-xs font-bold text-white bg-accent px-2.5 py-0.5 rounded-full">
                    Nouveau
                  </span>
                )}
              </div>

              <h3 className="font-syne font-bold text-primary text-sm mb-1">{res.title}</h3>
              <p className="text-xs text-gray-500 flex-1 mb-4">{res.description}</p>

              {/* Méta-infos durée/taille */}
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">
                  {res.duration && <><i className="fas fa-clock mr-1" />{res.duration}</>}
                  {res.size && <><i className="fas fa-weight-hanging mr-1" />{res.size}</>}
                </span>

                {/* Bouton accès */}
                <a
                  href={res.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-secondary transition-colors"
                >
                  {res.type === "PDF" ? "Télécharger" : res.type === "TEMPLATE" ? "Utiliser" : "Accéder"}
                  <i className="fas fa-arrow-right text-xs" />
                </a>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
