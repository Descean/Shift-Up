"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import Button from "@/components/ui/Button";
import type { Metadata } from "next";

const domains = [
  {
    id: "conseil",
    icon: "fas fa-chess",
    color: "from-blue-600 to-accent",
    badge: "Stratégie",
    title: "Conseil Stratégique",
    intro: "Nous analysons votre environnement, définissons votre cap et vous accompagnons dans l'exécution de votre stratégie de croissance.",
    services: [
      {
        title: "Diagnostic & Analyse stratégique",
        description: "Analyse SWOT, étude de marché, benchmark concurrentiel, positionnement.",
        priceLabel: "À partir de",
        price: "250 000 FCFA",
        duration: "5-10 jours",
        features: ["Rapport complet", "Restitution orale", "Recommandations priorisées"],
      },
      {
        title: "Business Plan complet",
        description: "Élaboration d'un plan d'affaires solide pour lever des fonds ou structurer votre projet.",
        priceLabel: "À partir de",
        price: "350 000 FCFA",
        duration: "10-15 jours",
        features: ["Étude de faisabilité", "Projections financières", "Pitch deck inclus"],
        isPopular: true,
      },
      {
        title: "Stratégie de croissance & Scale",
        description: "Définir et mettre en œuvre un plan de croissance durable sur 12-36 mois.",
        priceLabel: "À partir de",
        price: "500 000 FCFA",
        duration: "15-30 jours",
        features: ["KPIs personnalisés", "Roadmap détaillée", "Suivi trimestriel"],
      },
    ],
  },
  {
    id: "numerique",
    icon: "fas fa-laptop-code",
    color: "from-accent to-purple-600",
    badge: "Digital",
    title: "Solutions Numériques",
    intro: "Développement web, mobile et IA. Nous créons des solutions digitales performantes adaptées à votre contexte africain.",
    services: [
      {
        title: "Site Web professionnel",
        description: "Site vitrine ou e-commerce moderne, rapide, sécurisé et optimisé SEO.",
        priceLabel: "À partir de",
        price: "300 000 FCFA",
        duration: "2-4 semaines",
        features: ["Design sur mesure", "Mobile responsive", "SEO de base"],
      },
      {
        title: "Application Web / SaaS",
        description: "Application métier complète avec tableau de bord, gestion utilisateurs, API.",
        priceLabel: "À partir de",
        price: "1 500 000 FCFA",
        duration: "6-16 semaines",
        features: ["Architecture scalable", "API REST/GraphQL", "Tests automatisés"],
        isPopular: true,
      },
      {
        title: "Application Mobile (iOS + Android)",
        description: "App cross-platform avec React Native ou Flutter, connectée à vos systèmes.",
        priceLabel: "À partir de",
        price: "1 000 000 FCFA",
        duration: "8-20 semaines",
        features: ["iOS & Android", "Notifications push", "Mode hors ligne"],
      },
      {
        title: "Intégration IA & Automatisation",
        description: "Chatbots, génération de documents, automatisation de workflows, OCR.",
        priceLabel: "Sur devis",
        price: "",
        duration: "Variable",
        features: ["LLM sur mesure", "RAG & base de connaissances", "Intégration ERP/CRM"],
      },
    ],
  },
  {
    id: "formation",
    icon: "fas fa-graduation-cap",
    color: "from-secondary to-teal-500",
    badge: "Formation",
    title: "Formation & Coaching",
    intro: "Programmes certifiants, ateliers pratiques et coaching individuel pour développer vos compétences et celles de vos équipes.",
    services: [
      {
        title: "Formation en présentiel",
        description: "Sessions de 1-5 jours sur des thématiques ciblées (management, digital, vente...).",
        priceLabel: "À partir de",
        price: "75 000 FCFA / pers.",
        duration: "1-5 jours",
        features: ["Supports inclus", "Attestation", "Exercices pratiques"],
      },
      {
        title: "Coaching dirigeant",
        description: "Accompagnement personnalisé d'un dirigeant sur sa vision, leadership et performance.",
        priceLabel: "À partir de",
        price: "150 000 FCFA / mois",
        duration: "3-12 mois",
        features: ["Séances hebdomadaires", "Plan de développement", "Accès ressources"],
        isPopular: true,
      },
      {
        title: "Programme e-Learning",
        description: "Formation en ligne asynchrone avec quiz, vidéos et certification numérique.",
        priceLabel: "À partir de",
        price: "25 000 FCFA / mois",
        duration: "Illimité",
        features: ["Accès 24/7", "Badge numérique", "Communauté apprenants"],
      },
    ],
  },
  {
    id: "marketing",
    icon: "fas fa-bullhorn",
    color: "from-orange-500 to-red-400",
    badge: "Marketing",
    title: "Marketing Digital",
    intro: "Stratégies de croissance, contenus percutants et campagnes ciblées pour attirer et convertir vos clients idéaux.",
    services: [
      {
        title: "Audit & Stratégie digitale",
        description: "Analyse de votre présence en ligne et définition d'une stratégie ROI-driven.",
        priceLabel: "À partir de",
        price: "150 000 FCFA",
        duration: "1 semaine",
        features: ["Audit complet", "Roadmap 6 mois", "KPIs définis"],
      },
      {
        title: "Gestion réseaux sociaux",
        description: "Création de contenu, community management, croissance de communauté.",
        priceLabel: "À partir de",
        price: "100 000 FCFA / mois",
        duration: "Mensuel",
        features: ["3 plateformes", "12 posts/mois", "Rapport mensuel"],
        isPopular: true,
      },
      {
        title: "SEO & Publicité payante",
        description: "Optimisation moteurs de recherche, Google Ads, Meta Ads, retargeting.",
        priceLabel: "À partir de",
        price: "200 000 FCFA / mois",
        duration: "Mensuel",
        features: ["Mots-clés cibles", "Campagnes A/B", "Analytics avancé"],
      },
    ],
  },
  {
    id: "juridique",
    icon: "fas fa-scale-balanced",
    color: "from-purple-600 to-indigo-500",
    badge: "Juridique",
    title: "Juridique & Fiscal",
    intro: "Création d'entreprise, conformité légale OHADA, optimisation fiscale et protection de vos intérêts juridiques.",
    services: [
      {
        title: "Création d'entreprise (RCCM + IFU)",
        description: "Accompagnement complet pour la création de votre structure juridique au Bénin.",
        priceLabel: "À partir de",
        price: "100 000 FCFA",
        duration: "5-10 jours",
        features: ["RCCM inclus", "Statuts rédigés", "Suivi administratif"],
      },
      {
        title: "Conformité OHADA & fiscale",
        description: "Mise en conformité de votre entreprise avec les normes OHADA et le droit fiscal béninois.",
        priceLabel: "À partir de",
        price: "200 000 FCFA",
        duration: "2-4 semaines",
        features: ["Audit juridique", "Plan d'action", "Accompagnement"],
      },
      {
        title: "Rédaction de contrats",
        description: "Contrats commerciaux, partenariats, CGV, NDA, contrats de travail.",
        priceLabel: "À partir de",
        price: "50 000 FCFA",
        duration: "3-7 jours",
        features: ["Conforme droit béninois", "Clauses protectrices", "Révisions incluses"],
      },
    ],
  },
  {
    id: "dossiers",
    icon: "fas fa-folder-open",
    color: "from-teal-600 to-emerald-400",
    badge: "Dossiers",
    title: "Montage de Dossiers",
    intro: "Nous constituons et optimisons vos dossiers de financement, d'appels d'offres et de création d'entreprise pour maximiser vos chances de succès.",
    services: [
      {
        title: "Dossier de financement bancaire",
        description: "Constitution d'un dossier complet et solide pour l'obtention d'un crédit auprès d'une banque ou institution de microfinance.",
        priceLabel: "À partir de",
        price: "75 000 FCFA",
        duration: "5-10 jours",
        features: ["Business plan intégré", "Analyse de faisabilité", "Accompagnement entretien banque"],
        isPopular: true,
      },
      {
        title: "Réponse à appel d'offres",
        description: "Préparation d'un dossier de soumission complet et compétitif pour les marchés publics et privés.",
        priceLabel: "À partir de",
        price: "100 000 FCFA",
        duration: "3-7 jours",
        features: ["Dossier administratif complet", "Offre technique rédigée", "Offre financière optimisée"],
      },
      {
        title: "Dossier de création d'entreprise",
        description: "Accompagnement complet pour la création officielle de votre structure (SARL, SAS, GIE…) au Bénin.",
        priceLabel: "À partir de",
        price: "60 000 FCFA",
        duration: "5-10 jours",
        features: ["Statuts et actes constitutifs", "Immatriculation RCCM + IFU", "Compte bancaire professionnel"],
      },
      {
        title: "Dossier de subvention / programme",
        description: "Montage de dossier pour des programmes de financement public : FNDA, ADPME, BOAD, BAD et autres.",
        priceLabel: "Sur devis",
        price: "",
        duration: "2-4 semaines",
        features: ["Étude d'éligibilité", "Plan de financement", "Suivi du dossier"],
      },
    ],
  },
  {
    id: "finance",
    icon: "fas fa-chart-bar",
    color: "from-yellow-500 to-amber-400",
    badge: "Finance",
    title: "Finance & Comptabilité",
    intro: "Gestion financière, levée de fonds, comptabilité normalisée et tableau de bord pour piloter votre performance.",
    services: [
      {
        title: "Plan financier & prévisionnel",
        description: "Élaboration de votre plan financier sur 3-5 ans avec projections et analyses.",
        priceLabel: "À partir de",
        price: "200 000 FCFA",
        duration: "1-2 semaines",
        features: ["Compte de résultat", "Bilan prévisionnel", "Cash-flow"],
      },
      {
        title: "Accompagnement levée de fonds",
        description: "Structuration du dossier, pitch investors, mise en relation bailleurs.",
        priceLabel: "Sur devis",
        price: "",
        duration: "2-6 mois",
        features: ["Mémorandum info", "Valorisation", "Réseau investisseurs"],
        isPopular: true,
      },
      {
        title: "Externalisation comptable",
        description: "Tenue de comptabilité, déclarations fiscales, états financiers certifiés.",
        priceLabel: "À partir de",
        price: "75 000 FCFA / mois",
        duration: "Mensuel",
        features: ["Bilan annuel", "Déclarations IS/ITS", "Tableau de bord"],
      },
    ],
  },
];

export default function ServicesPage() {
  const [activeTab, setActiveTab] = useState("conseil");
  const activeDomain = domains.find((d) => d.id === activeTab) || domains[0];

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl"
          >
            <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
              <i className="fas fa-grid-2" />
              Catalogue de services
            </span>
            <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4">
              Nos services & <span className="gradient-text">tarifs</span>
            </h1>
            <p className="text-white/60 text-xl leading-relaxed">
              Des solutions adaptées à votre réalité et votre budget. Acompte 40% à la souscription, solde à la livraison.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-100 sticky top-16 z-40">
        <div className="container-custom">
          <div className="flex gap-1 overflow-x-auto py-3 no-scrollbar">
            {domains.map((d) => (
              <button
                key={d.id}
                onClick={() => setActiveTab(d.id)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200 flex-shrink-0 ${
                  activeTab === d.id
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-500 hover:text-primary hover:bg-gray-50"
                }`}
              >
                <i className={d.icon} />
                {d.title}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {/* Domain header */}
            <div className="flex items-start gap-6 mb-10 p-6 bg-white rounded-2xl shadow-card">
              <div
                className={`w-16 h-16 bg-gradient-to-br ${activeDomain.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}
              >
                <i className={`${activeDomain.icon} text-white text-2xl`} />
              </div>
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-accent">
                  {activeDomain.badge}
                </span>
                <h2 className="font-syne font-black text-2xl text-primary mb-2">{activeDomain.title}</h2>
                <p className="text-gray-500">{activeDomain.intro}</p>
              </div>
            </div>

            {/* Services grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {activeDomain.services.map((service, i) => (
                <motion.div
                  key={service.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 relative ${
                    service.isPopular ? "ring-2 ring-accent" : "border border-gray-100"
                  }`}
                >
                  {service.isPopular && (
                    <div className="absolute -top-3 left-6 bg-gradient-to-r from-accent to-secondary text-white text-xs font-bold px-4 py-1 rounded-full">
                      Plus demandé
                    </div>
                  )}

                  <h3 className="font-syne font-bold text-lg text-primary mb-2">{service.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.description}</p>

                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
                    <div>
                      <p className="text-xs text-gray-400">{service.priceLabel}</p>
                      <p className="font-syne font-bold text-accent text-lg">
                        {service.price || "Devis personnalisé"}
                      </p>
                    </div>
                    {service.duration && (
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Durée</p>
                        <p className="text-sm font-medium text-gray-600">{service.duration}</p>
                      </div>
                    )}
                  </div>

                  <ul className="space-y-2 mb-6">
                    {service.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                        <i className="fas fa-check text-secondary text-xs" />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Button href={`/services/souscrire?service=${activeDomain.id}`} variant={service.isPopular ? "gradient" : "outline"} size="md" className="w-full">
                    Souscrire
                    <i className="fas fa-arrow-right text-sm" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Custom quote CTA */}
            <div className="mt-10 bg-primary rounded-2xl p-8 text-center">
              <i className="fas fa-sliders text-accent text-3xl mb-4 block" />
              <h3 className="font-syne font-bold text-xl text-white mb-2">
                Besoin d'une solution sur mesure ?
              </h3>
              <p className="text-white/50 mb-6">
                Chaque projet est unique. Contactez-nous pour un devis personnalisé adapté à votre budget.
              </p>
              <div className="flex flex-wrap gap-4 justify-center">
                <Button href="/contact" variant="gradient" size="md">
                  <i className="fas fa-envelope" />
                  Demander un devis
                </Button>
                <Button href="/contact" variant="outline" size="md" className="border-white/30 text-white hover:bg-white hover:text-primary">
                  <i className="fas fa-phone" />
                  Appeler maintenant
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
