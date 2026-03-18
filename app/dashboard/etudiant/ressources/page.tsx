"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type ResourceType = "VIDEO" | "PDF" | "TEMPLATE" | "LIEN";

interface Resource {
  id: string;
  title: string;
  description: string;
  type: ResourceType;
  category: string;
  url: string;
  duration?: string | null;
  size?: string | null;
  isNew?: boolean;
}

const typeStyle: Record<ResourceType, { bg: string; icon: string; label: string }> = {
  VIDEO:    { bg: "bg-red-50 text-red-600",        icon: "fa-play-circle",  label: "Vidéo" },
  PDF:      { bg: "bg-blue-50 text-blue-600",      icon: "fa-file-pdf",     label: "PDF" },
  TEMPLATE: { bg: "bg-purple-50 text-purple-600",  icon: "fa-layer-group",  label: "Template" },
  LIEN:     { bg: "bg-green-50 text-green-600",    icon: "fa-external-link", label: "Lien" },
};

const categories = ["Tous", "Développement", "Design", "Marketing", "Gestion de projet", "Outils"];

export default function EtudiantRessourcesPage() {
  const [resources, setResources]   = useState<Resource[]>([]);
  const [loading, setLoading]       = useState(true);
  const [activeCategory, setCategory] = useState("Tous");
  const [search, setSearch]         = useState("");

  useEffect(() => {
    fetch("/api/etudiant/ressources")
      .then((r) => r.json())
      .then((data) => setResources(data.resources ?? []))
      .finally(() => setLoading(false));
  }, []);

  const filtered = resources.filter((r) => {
    const matchCat    = activeCategory === "Tous" || r.category === activeCategory;
    const q           = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.description.toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Ressources & Cours</h1>
        <p className="text-gray-500 text-sm">{resources.length} ressource{resources.length !== 1 ? "s" : ""} disponible{resources.length !== 1 ? "s" : ""} pour monter en compétences</p>
      </motion.div>

      <div className="relative">
        <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher une ressource..."
          className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent" />
      </div>

      <div className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${activeCategory === cat ? "bg-accent text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
            {cat}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
          {resources.length === 0 ? "Aucune ressource disponible pour le moment." : "Aucune ressource trouvée."}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((res, i) => {
            const typeInfo = typeStyle[res.type] ?? typeStyle.LIEN;
            return (
              <motion.div key={res.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-white rounded-2xl shadow-card p-5 flex flex-col">
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1 ${typeInfo.bg}`}>
                    <i className={`fas ${typeInfo.icon} text-xs`} />{typeInfo.label}
                  </span>
                  <span className="text-xs text-gray-400 bg-gray-50 px-2.5 py-0.5 rounded-full">{res.category}</span>
                  {res.isNew && <span className="text-xs font-bold text-white bg-accent px-2.5 py-0.5 rounded-full">Nouveau</span>}
                </div>
                <h3 className="font-syne font-bold text-primary text-sm mb-1">{res.title}</h3>
                <p className="text-xs text-gray-500 flex-1 mb-4">{res.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {res.duration && <><i className="fas fa-clock mr-1" />{res.duration}</>}
                    {res.size && <><i className="fas fa-weight-hanging mr-1" />{res.size}</>}
                  </span>
                  <a href={res.url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-semibold text-accent hover:text-secondary transition-colors">
                    {res.type === "PDF" ? "Télécharger" : res.type === "TEMPLATE" ? "Utiliser" : "Accéder"}
                    <i className="fas fa-arrow-right text-xs" />
                  </a>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
