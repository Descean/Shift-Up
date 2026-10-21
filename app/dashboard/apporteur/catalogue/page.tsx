"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const services = [
  {
    id: "1",
    domain: "Branding",
    title: "Identité Visuelle & Branding",
    description: "Logo, charte graphique, univers de marque complet.",
    priceMin: 80000,
    priceMax: 300000,
    commission: 10,
    duration: "3–6 semaines",
    isPopular: true,
    features: ["Logo principal & variantes", "Charte couleurs & typographies", "Guide d'utilisation"],
  },
  {
    id: "2",
    domain: "Web",
    title: "Site Web Vitrine",
    description: "Site professionnel responsive, optimisé SEO et rapide.",
    priceMin: 150000,
    priceMax: 500000,
    commission: 10,
    duration: "4–8 semaines",
    isPopular: true,
    features: ["Design sur mesure", "5 à 10 pages", "SEO de base", "Hébergement 1 an"],
  },
  {
    id: "3",
    domain: "Dossiers",
    title: "Montage de Dossier – Financement",
    description: "Dossiers de demande de financement bancaire ou institutionnel.",
    priceMin: 50000,
    priceMax: 150000,
    commission: 10,
    duration: "2–4 semaines",
    isPopular: false,
    features: ["Analyse besoins", "Business plan", "Dossier financement", "Accompagnement"],
  },
  {
    id: "4",
    domain: "Dossiers",
    title: "Montage de Dossier – Appel d'Offres",
    description: "Réponse aux appels d'offres publics et privés.",
    priceMin: 60000,
    priceMax: 200000,
    commission: 10,
    duration: "1–3 semaines",
    isPopular: false,
    features: ["Étude de l'AO", "Rédaction technique", "Dossier administratif", "Suivi dépôt"],
  },
  {
    id: "5",
    domain: "Marketing",
    title: "Stratégie Marketing & Communication",
    description: "Plan marketing complet, gestion réseaux sociaux, campagnes.",
    priceMin: 75000,
    priceMax: 250000,
    commission: 10,
    duration: "2–4 semaines",
    isPopular: false,
    features: ["Audit communication", "Plan marketing", "Contenus & calendrier", "KPIs"],
  },
  {
    id: "6",
    domain: "Conseil",
    title: "Conseil & Stratégie d'Entreprise",
    description: "Accompagnement stratégique, structuration et développement.",
    priceMin: 100000,
    priceMax: 400000,
    commission: 10,
    duration: "Sur mesure",
    isPopular: false,
    features: ["Diagnostic 360°", "Plan stratégique", "Suivi implémentation"],
  },
];

const domains = ["Tous", ...Array.from(new Set(services.map((s) => s.domain)))];

const domainColors: Record<string, string> = {
  Branding: "bg-accent-100 text-accent-700",
  Web: "bg-accent-100 text-accent-700",
  Dossiers: "bg-amber-100 text-amber-700",
  Marketing: "bg-green-100 text-green-700",
  Conseil: "bg-red-100 text-red-700",
};

export default function ApporteurCataloguePage() {
  const [filter, setFilter] = useState("Tous");
  const [copied, setCopied] = useState<string | null>(null);
  const affiliationCode = "SU-AP-7291";
  const baseUrl = "https://shiftup.bj";

  const filtered = filter === "Tous" ? services : services.filter((s) => s.domain === filter);

  const copyLink = (serviceId: string) => {
    const link = `${baseUrl}/services?ref=${affiliationCode}&service=${serviceId}`;
    navigator.clipboard.writeText(link);
    setCopied(serviceId);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary">Catalogue des Services</h1>
        <p className="text-gray-500 text-sm mt-1">
          Partagez ces services avec vos contacts et gagnez <strong className="text-accent">10% de commission</strong> sur chaque conversion.
        </p>
      </div>

      {/* Commission reminder */}
      <div className="bg-gradient-to-r from-accent to-secondary rounded-2xl p-5 text-white flex items-center gap-4">
        <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">
          <i className="fas fa-coins text-xl" />
        </div>
        <div className="flex-1">
          <p className="font-syne font-bold">Votre code d'affiliation : <span className="bg-white/20 px-2 py-0.5 rounded-lg font-mono">{affiliationCode}</span></p>
          <p className="text-white/80 text-sm mt-0.5">Chaque lien ci-dessous inclut automatiquement votre code.</p>
        </div>
      </div>

      {/* Domain filter */}
      <div className="flex gap-2 flex-wrap">
        {domains.map((d) => (
          <button
            key={d}
            onClick={() => setFilter(d)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filter === d
                ? "bg-accent text-white shadow-sm"
                : "bg-white text-gray-500 hover:text-primary shadow-card"
            }`}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-card p-5 flex flex-col"
          >
            <div className="flex items-start justify-between mb-3">
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${domainColors[s.domain] || "bg-gray-100 text-gray-600"}`}>
                {s.domain}
              </span>
              {s.isPopular && (
                <span className="text-xs bg-accent/10 text-accent font-semibold px-2.5 py-1 rounded-full">
                  <i className="fas fa-fire mr-1" />Populaire
                </span>
              )}
            </div>

            <h3 className="font-syne font-bold text-primary text-base mb-1">{s.title}</h3>
            <p className="text-xs text-gray-500 mb-3 flex-1">{s.description}</p>

            <div className="space-y-1 mb-4">
              {s.features.map((f, fi) => (
                <div key={fi} className="flex items-center gap-2 text-xs text-gray-600">
                  <i className="fas fa-check text-green-500 w-3" />
                  {f}
                </div>
              ))}
            </div>

            <div className="border-t border-gray-50 pt-3 flex items-center justify-between mb-3">
              <div>
                <p className="text-xs text-gray-400">Prix client</p>
                <p className="font-bold text-primary text-sm">
                  {s.priceMin.toLocaleString()}
                  {s.priceMax ? ` – ${s.priceMax.toLocaleString()}` : "+"} F
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">Votre commission</p>
                <p className="font-bold text-accent text-sm">
                  {Math.round(s.priceMin * s.commission / 100).toLocaleString()}
                  {s.priceMax ? ` – ${Math.round(s.priceMax * s.commission / 100).toLocaleString()}` : "+"} F
                </p>
              </div>
            </div>

            <button
              onClick={() => copyLink(s.id)}
              className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                copied === s.id
                  ? "bg-green-500 text-white"
                  : "bg-accent/10 text-accent hover:bg-accent hover:text-white"
              }`}
            >
              <i className={`fas ${copied === s.id ? "fa-check" : "fa-copy"}`} />
              {copied === s.id ? "Lien copié !" : "Copier mon lien de partage"}
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
