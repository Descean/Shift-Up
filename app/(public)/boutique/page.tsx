"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

const categories = ["Tous", "Templates", "Guides", "Outils", "Formation"];

const products = [
  {
    id: "1",
    category: "Templates",
    icon: "fas fa-file-powerpoint",
    color: "from-red-500 to-orange-400",
    title: "Template Business Plan Pro",
    description: "Modèle complet de business plan en Word + Excel avec tableaux financiers automatisés, projections sur 5 ans et guide de rédaction.",
    price: 15000,
    originalPrice: 25000,
    format: "Word + Excel",
    pages: "45 pages",
    isPopular: true,
    features: [
      "Plan financier automatisé",
      "Projections cash-flow 5 ans",
      "Guide de rédaction inclus",
      "Compatible banques et investisseurs",
    ],
  },
  {
    id: "2",
    category: "Templates",
    icon: "fas fa-file-invoice",
    color: "from-blue-500 to-accent",
    title: "Pack Dossier Financement Bancaire",
    description: "Tous les documents nécessaires pour constituer un dossier de demande de crédit bancaire au Bénin et dans la sous-région UEMOA.",
    price: 12000,
    originalPrice: null,
    format: "PDF + Word",
    pages: "30 pages",
    isPopular: false,
    features: [
      "Formulaire de demande de crédit",
      "Modèle de garanties",
      "Check-list documentaire",
      "Lettre de présentation de projet",
    ],
  },
  {
    id: "3",
    category: "Guides",
    icon: "fas fa-book",
    color: "from-secondary to-teal-400",
    title: "Guide : Créer son entreprise au Bénin",
    description: "Le guide complet pour créer votre SARL ou SAS au Bénin en 2026 : RCCM, IFU, compte bancaire, et premières obligations fiscales.",
    price: 8000,
    originalPrice: null,
    format: "PDF",
    pages: "60 pages",
    isPopular: false,
    features: [
      "Étapes légales détaillées",
      "Formulaires téléchargeables",
      "Coûts et délais réels",
      "Contacts utiles inclus",
    ],
  },
  {
    id: "4",
    category: "Outils",
    icon: "fas fa-table",
    color: "from-green-500 to-emerald-400",
    title: "Tableau de Bord PME – Excel Pro",
    description: "Tableau de bord de gestion PME tout-en-un : suivi CA, charges, BFR, trésorerie, rentabilité — adapté à la réalité africaine.",
    price: 20000,
    originalPrice: 35000,
    format: "Excel",
    pages: "10 onglets",
    isPopular: true,
    features: [
      "Suivi CA et charges mensuel",
      "Indicateurs KPIs automatiques",
      "Graphiques dynamiques",
      "Prévisions de trésorerie",
    ],
  },
  {
    id: "5",
    category: "Guides",
    icon: "fas fa-bullhorn",
    color: "from-purple-500 to-pink-400",
    title: "Guide Marketing Digital PMEA",
    description: "Stratégies marketing digital éprouvées pour les PME africaines : réseaux sociaux, WhatsApp Business, Google My Business, SEO local.",
    price: 10000,
    originalPrice: null,
    format: "PDF",
    pages: "80 pages",
    isPopular: false,
    features: [
      "Stratégies réseaux sociaux",
      "WhatsApp Business guide",
      "Google My Business optimisation",
      "Modèles de posts inclus",
    ],
  },
  {
    id: "6",
    category: "Formation",
    icon: "fas fa-graduation-cap",
    color: "from-amber-500 to-orange-400",
    title: "Mini-Formation : Maîtrisez votre comptabilité",
    description: "4 modules vidéo + PDF pour comprendre les bases comptables de votre entreprise sans être expert-comptable.",
    price: 25000,
    originalPrice: 40000,
    format: "Vidéo + PDF",
    pages: "4 modules",
    isPopular: false,
    features: [
      "4 modules vidéo HD",
      "Exercices pratiques",
      "Attestation numérique",
      "Accès à vie",
    ],
  },
  {
    id: "7",
    category: "Templates",
    icon: "fas fa-handshake",
    color: "from-slate-600 to-slate-400",
    title: "Pack Contrats Commerciaux OHADA",
    description: "10 modèles de contrats conformes au droit OHADA : contrat de prestation, partenariat, NDA, bail commercial, CGV.",
    price: 18000,
    originalPrice: 30000,
    format: "Word",
    pages: "10 contrats",
    isPopular: false,
    features: [
      "10 modèles personnalisables",
      "Conformes droit OHADA",
      "Clauses protectrices",
      "Guide d'utilisation",
    ],
  },
  {
    id: "8",
    category: "Outils",
    icon: "fas fa-chart-line",
    color: "from-cyan-500 to-blue-400",
    title: "Simulateur d'Appel d'Offres",
    description: "Outil Excel pour analyser la rentabilité d'un appel d'offres avant de répondre : calcul coûts, marge, probabilité de gain.",
    price: 15000,
    originalPrice: null,
    format: "Excel",
    pages: "5 onglets",
    isPopular: false,
    features: [
      "Calcul coûts direct/indirect",
      "Simulation marge bénéficiaire",
      "Analyse risques",
      "Score de compétitivité",
    ],
  },
];

export default function BoutiquePage() {
  const [filter, setFilter] = useState("Tous");
  const [buying, setBuying] = useState<string | null>(null);

  const filtered = filter === "Tous" ? products : products.filter((p) => p.category === filter);

  const handleBuy = (product: (typeof products)[0]) => {
    setBuying(product.id);
    // Simulate payment intent — in production, call /api/payments/create-checkout
    setTimeout(() => {
      setBuying(null);
      toast.success(`"${product.title}" — Paiement en cours de déploiement. Contactez-nous pour acheter ce produit.`);
    }, 1000);
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              <i className="fas fa-store" />
              Boutique digitale
            </span>
            <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4">
              Ressources & <span className="gradient-text">outils pro</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed">
              Templates, guides et outils téléchargeables pour accélérer votre croissance.
              Conçus spécifiquement pour les entrepreneurs béninois et africains.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          {/* Filters */}
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  filter === c
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-500 hover:text-primary shadow-card"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Products grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product, i) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.07 }}
                className={`bg-white rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 flex flex-col relative ${
                  product.isPopular ? "ring-2 ring-accent" : "border border-gray-100"
                }`}
              >
                {product.isPopular && (
                  <div className="absolute -top-3 left-6 bg-gradient-to-r from-accent to-secondary text-white text-xs font-bold px-4 py-1 rounded-full">
                    Best-seller
                  </div>
                )}
                {product.originalPrice && (
                  <div className="absolute -top-3 right-6 bg-red-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                    -{Math.round((1 - product.price / product.originalPrice) * 100)}%
                  </div>
                )}

                {/* Icon */}
                <div className={`m-5 mb-0 h-20 bg-gradient-to-br ${product.color} rounded-xl flex items-center justify-center`}>
                  <i className={`${product.icon} text-white text-3xl`} />
                </div>

                <div className="p-5 flex flex-col flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">{product.category}</span>
                    <span className="text-xs text-gray-400">{product.format} · {product.pages}</span>
                  </div>

                  <h3 className="font-syne font-bold text-primary mb-2 text-base leading-snug">{product.title}</h3>
                  <p className="text-xs text-gray-500 mb-4 flex-1 leading-relaxed">{product.description}</p>

                  <ul className="space-y-1.5 mb-4">
                    {product.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-xs text-gray-600">
                        <i className="fas fa-check text-green-500 mt-0.5 w-3 flex-shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <div className="border-t border-gray-50 pt-4">
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="font-syne font-black text-xl text-primary">{product.price.toLocaleString()} F</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-400 line-through">{product.originalPrice.toLocaleString()} F</span>
                      )}
                    </div>
                    <button
                      onClick={() => handleBuy(product)}
                      disabled={buying === product.id}
                      className={`w-full py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                        product.isPopular
                          ? "bg-gradient-to-r from-accent to-secondary text-white hover:opacity-90"
                          : "bg-primary text-white hover:bg-primary/90"
                      } disabled:opacity-60`}
                    >
                      {buying === product.id ? (
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <i className="fas fa-download" />
                          Acheter & télécharger
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Custom order CTA */}
          <div className="mt-12 bg-primary rounded-2xl p-8 text-center">
            <i className="fas fa-tools text-accent text-3xl mb-4 block" />
            <h3 className="font-syne font-bold text-xl text-white mb-2">Besoin d'un outil sur mesure ?</h3>
            <p className="text-white/50 mb-6">
              Nous créons des templates et outils personnalisés adaptés à votre secteur d'activité.
            </p>
            <Link
              href="/services/souscrire?service=numerique"
              className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-semibold hover:bg-accent/90 transition-colors"
            >
              <i className="fas fa-envelope" />
              Demander un outil personnalisé
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
