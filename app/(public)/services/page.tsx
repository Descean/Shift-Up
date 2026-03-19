"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useSession } from "next-auth/react";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface ServiceItem {
  title: string;
  description: string;
  priceLabel?: string;
  price?: string;
  duration?: string;
  features: string[];
  isPopular?: boolean;
}

interface Sector {
  id: string;
  icon: string;
  color: string;         // Tailwind gradient classes
  accent: string;        // accent color class for highlights
  label: string;
  registreRef: string;   // Référence au registre de commerce
  intro: string;
  services: ServiceItem[];
}

/* ─── Données — secteurs issus du registre de commerce ───────────────────── */
const SECTORS: Sector[] = [
  {
    id: "conseil",
    icon: "fas fa-chess",
    color: "from-blue-700 to-blue-500",
    accent: "text-blue-600",
    label: "Conseil & Stratégie",
    registreRef: "Gestion d'entreprise · Conseil de gestion · Bureau d'études",
    intro: "Nous analysons votre environnement, définissons votre cap stratégique et vous accompagnons dans l'exécution de votre plan de croissance.",
    services: [
      {
        title: "Diagnostic & Analyse stratégique",
        description: "Analyse SWOT, étude de marché, benchmark concurrentiel et positionnement.",
        priceLabel: "À partir de", price: "250 000 XOF", duration: "5–10 jours",
        features: ["Rapport complet", "Restitution orale", "Recommandations priorisées"],
      },
      {
        title: "Business Plan complet",
        description: "Élaboration d'un plan d'affaires solide pour lever des fonds ou structurer votre projet.",
        priceLabel: "À partir de", price: "350 000 XOF", duration: "10–15 jours",
        features: ["Étude de faisabilité", "Projections financières", "Pitch deck inclus"],
        isPopular: true,
      },
      {
        title: "Stratégie de croissance & Scale",
        description: "Définir et mettre en œuvre un plan de croissance durable sur 12–36 mois.",
        priceLabel: "À partir de", price: "500 000 XOF", duration: "15–30 jours",
        features: ["KPIs personnalisés", "Roadmap détaillée", "Suivi trimestriel"],
      },
      {
        title: "Gestion de projets",
        description: "Pilotage complet de vos projets : cadrage, planification, suivi et reporting.",
        priceLabel: "À partir de", price: "150 000 XOF / mois", duration: "Mensuel",
        features: ["Chef de projet dédié", "Tableau de bord", "Rapports d'avancement"],
      },
    ],
  },
  {
    id: "marches-publics",
    icon: "fas fa-folder-open",
    color: "from-teal-600 to-emerald-500",
    accent: "text-emerald-600",
    label: "Marchés Publics & Dossiers",
    registreRef: "Montage de dossiers de soumission · Marchés Publics",
    intro: "Nous constituons et optimisons vos dossiers de soumission, de financement et de création d'entreprise pour maximiser vos chances de succès.",
    services: [
      {
        title: "Réponse à appel d'offres",
        description: "Dossier de soumission complet et compétitif pour marchés publics et privés.",
        priceLabel: "À partir de", price: "100 000 XOF", duration: "3–7 jours",
        features: ["Dossier administratif", "Offre technique rédigée", "Offre financière optimisée"],
        isPopular: true,
      },
      {
        title: "Dossier de financement bancaire",
        description: "Constitution d'un dossier solide pour crédit bancaire ou microfinance.",
        priceLabel: "À partir de", price: "75 000 XOF", duration: "5–10 jours",
        features: ["Business plan intégré", "Analyse de faisabilité", "Accompagnement entretien"],
      },
      {
        title: "Dossier de subvention",
        description: "Montage pour programmes FNDA, ADPME, BOAD, BAD et autres.",
        priceLabel: "Sur devis", price: "", duration: "2–4 semaines",
        features: ["Étude d'éligibilité", "Plan de financement", "Suivi du dossier"],
      },
      {
        title: "Veille marchés publics",
        description: "Identification et alerte sur les appels d'offres correspondant à votre domaine.",
        priceLabel: "À partir de", price: "50 000 XOF / mois", duration: "Mensuel",
        features: ["Alertes hebdomadaires", "Analyse des opportunités", "Rapport mensuel"],
      },
    ],
  },
  {
    id: "juridique",
    icon: "fas fa-scale-balanced",
    color: "from-purple-700 to-indigo-500",
    accent: "text-purple-600",
    label: "Juridique & Comptabilité",
    registreRef: "Activités juridiques, comptables et de conseil de gestion",
    intro: "Création d'entreprise, conformité légale OHADA, optimisation fiscale et gestion comptable externalisée pour votre sérénité.",
    services: [
      {
        title: "Création d'entreprise (RCCM + IFU)",
        description: "Accompagnement complet pour la création de votre structure juridique au Bénin.",
        priceLabel: "À partir de", price: "100 000 XOF", duration: "5–10 jours",
        features: ["RCCM inclus", "Statuts rédigés", "Suivi administratif"],
        isPopular: true,
      },
      {
        title: "Conformité OHADA & fiscale",
        description: "Mise en conformité avec les normes OHADA et le droit fiscal béninois.",
        priceLabel: "À partir de", price: "200 000 XOF", duration: "2–4 semaines",
        features: ["Audit juridique", "Plan d'action", "Accompagnement"],
      },
      {
        title: "Rédaction de contrats",
        description: "Contrats commerciaux, partenariats, CGV, NDA, contrats de travail.",
        priceLabel: "À partir de", price: "50 000 XOF", duration: "3–7 jours",
        features: ["Conforme droit béninois", "Clauses protectrices", "Révisions incluses"],
      },
      {
        title: "Externalisation comptable",
        description: "Tenue de comptabilité, déclarations fiscales, états financiers certifiés.",
        priceLabel: "À partir de", price: "75 000 XOF / mois", duration: "Mensuel",
        features: ["Bilan annuel", "Déclarations IS/ITS", "Tableau de bord"],
      },
    ],
  },
  {
    id: "marketing",
    icon: "fas fa-bullhorn",
    color: "from-orange-500 to-red-400",
    accent: "text-orange-500",
    label: "Communication & Marketing",
    registreRef: "Conseils en communication et marketing",
    intro: "Stratégies de croissance, contenus percutants et campagnes ciblées pour attirer et convertir vos clients idéaux.",
    services: [
      {
        title: "Audit & Stratégie digitale",
        description: "Analyse de votre présence en ligne et définition d'une stratégie ROI-driven.",
        priceLabel: "À partir de", price: "150 000 XOF", duration: "1 semaine",
        features: ["Audit complet", "Roadmap 6 mois", "KPIs définis"],
      },
      {
        title: "Gestion réseaux sociaux",
        description: "Création de contenu, community management, croissance de communauté.",
        priceLabel: "À partir de", price: "100 000 XOF / mois", duration: "Mensuel",
        features: ["3 plateformes", "12 posts/mois", "Rapport mensuel"],
        isPopular: true,
      },
      {
        title: "SEO & Publicité payante",
        description: "Optimisation moteurs de recherche, Google Ads, Meta Ads, retargeting.",
        priceLabel: "À partir de", price: "200 000 XOF / mois", duration: "Mensuel",
        features: ["Mots-clés cibles", "Campagnes A/B", "Analytics avancé"],
      },
      {
        title: "Identité visuelle & Branding",
        description: "Logo, charte graphique, supports print et digitaux pour une image cohérente.",
        priceLabel: "À partir de", price: "150 000 XOF", duration: "1–2 semaines",
        features: ["Logo HD + variantes", "Charte graphique", "Fichiers sources"],
      },
    ],
  },
  {
    id: "btp",
    icon: "fas fa-hard-hat",
    color: "from-amber-600 to-yellow-500",
    accent: "text-amber-600",
    label: "BTP & Génie Civil",
    registreRef: "Études, contrôle, suivi et réalisation des travaux de BTP · Génie civil",
    intro: "Bureau d'études techniques, maîtrise d'œuvre, contrôle et suivi de travaux. Nous garantissons la qualité et la conformité de vos chantiers.",
    services: [
      {
        title: "Études techniques & conception",
        description: "Plans d'exécution, études de sol, dimensionnement structurel, APS/APD.",
        priceLabel: "Sur devis", price: "", duration: "1–4 semaines",
        features: ["Plans AutoCAD", "Notes de calcul", "Rapport technique"],
        isPopular: true,
      },
      {
        title: "Maîtrise d'œuvre",
        description: "Direction et coordination des travaux, de la conception à la réception.",
        priceLabel: "Sur devis", price: "", duration: "Selon projet",
        features: ["Suivi de chantier", "Contrôle qualité", "Réception des travaux"],
      },
      {
        title: "Contrôle & Supervision",
        description: "Audit technique d'un chantier en cours, détection de non-conformités.",
        priceLabel: "À partir de", price: "100 000 XOF", duration: "1–3 jours",
        features: ["Rapport d'inspection", "Recommandations", "Photos documentées"],
      },
      {
        title: "Estimation & Devis travaux",
        description: "Estimation précise du coût des travaux pour votre projet de construction.",
        priceLabel: "À partir de", price: "50 000 XOF", duration: "3–5 jours",
        features: ["Métrés détaillés", "Bordereau des prix", "Calendrier prévisionnel"],
      },
    ],
  },
  {
    id: "numerique",
    icon: "fas fa-laptop-code",
    color: "from-accent to-cyan-500",
    accent: "text-accent",
    label: "Solutions Numériques",
    registreRef: "Édition de logiciels et de solutions numériques · Ingénierie informatique",
    intro: "Développement web, mobile et logiciels métiers. Nous créons des solutions digitales performantes adaptées à votre contexte.",
    services: [
      {
        title: "Site Web professionnel",
        description: "Site vitrine ou e-commerce moderne, rapide, sécurisé et optimisé SEO.",
        priceLabel: "À partir de", price: "300 000 XOF", duration: "2–4 semaines",
        features: ["Design sur mesure", "Mobile responsive", "SEO de base"],
      },
      {
        title: "Application Web / SaaS",
        description: "Application métier complète avec tableau de bord, gestion utilisateurs, API.",
        priceLabel: "À partir de", price: "1 500 000 XOF", duration: "6–16 semaines",
        features: ["Architecture scalable", "API REST/GraphQL", "Tests automatisés"],
        isPopular: true,
      },
      {
        title: "Application Mobile (iOS + Android)",
        description: "App cross-platform connectée à vos systèmes existants.",
        priceLabel: "À partir de", price: "1 000 000 XOF", duration: "8–20 semaines",
        features: ["iOS & Android", "Notifications push", "Mode hors ligne"],
      },
      {
        title: "Logiciel métier sur mesure",
        description: "ERP, CRM, GRH, facturation — solution 100% adaptée à vos processus.",
        priceLabel: "Sur devis", price: "", duration: "Variable",
        features: ["Analyse des besoins", "Formation incluse", "Support 12 mois"],
      },
    ],
  },
  {
    id: "transformation",
    icon: "fas fa-rocket",
    color: "from-violet-600 to-purple-500",
    accent: "text-violet-600",
    label: "Transformation Digitale",
    registreRef: "Conseil en transformation numérique · Digitalisation des processus",
    intro: "Nous accompagnons les entreprises dans leur transition numérique : audit, stratégie, déploiement d'outils et conduite du changement.",
    services: [
      {
        title: "Audit de maturité digitale",
        description: "Évaluation de votre niveau de digitalisation et identification des axes d'amélioration.",
        priceLabel: "À partir de", price: "200 000 XOF", duration: "1 semaine",
        features: ["Score de maturité", "Cartographie des processus", "Feuille de route"],
        isPopular: true,
      },
      {
        title: "Digitalisation des processus",
        description: "Automatisation des tâches répétitives et digitalisation des workflows métiers.",
        priceLabel: "À partir de", price: "500 000 XOF", duration: "4–12 semaines",
        features: ["Analyse des processus", "Déploiement outils", "Formation équipes"],
      },
      {
        title: "Intégration IA & Automatisation",
        description: "Chatbots, génération de documents, automatisation de workflows, OCR.",
        priceLabel: "Sur devis", price: "", duration: "Variable",
        features: ["LLM sur mesure", "RAG & base de connaissances", "Intégration ERP/CRM"],
      },
      {
        title: "Conduite du changement",
        description: "Accompagnement humain pour réussir la transition digitale de vos équipes.",
        priceLabel: "À partir de", price: "150 000 XOF / mois", duration: "3–6 mois",
        features: ["Plan de communication", "Ateliers pratiques", "Support continu"],
      },
    ],
  },
  {
    id: "data",
    icon: "fas fa-chart-bar",
    color: "from-cyan-600 to-teal-500",
    accent: "text-cyan-600",
    label: "Data & Business Intelligence",
    registreRef: "Analyses de données et Business Intelligence",
    intro: "Transformez vos données en décisions. Tableaux de bord, rapports analytiques et modèles prédictifs pour piloter votre performance.",
    services: [
      {
        title: "Tableau de bord analytique",
        description: "Dashboard interactif connecté à vos sources de données (Excel, ERP, CRM...).",
        priceLabel: "À partir de", price: "300 000 XOF", duration: "1–3 semaines",
        features: ["Visualisations interactives", "KPIs en temps réel", "Export PDF/Excel"],
        isPopular: true,
      },
      {
        title: "Audit & Nettoyage de données",
        description: "Identification et correction des anomalies dans vos bases de données.",
        priceLabel: "À partir de", price: "150 000 XOF", duration: "1–2 semaines",
        features: ["Rapport qualité", "Doublons supprimés", "Données normalisées"],
      },
      {
        title: "Analyse & Rapport stratégique",
        description: "Analyse approfondie de vos données pour identifier tendances et opportunités.",
        priceLabel: "À partir de", price: "200 000 XOF", duration: "1–2 semaines",
        features: ["Rapport détaillé", "Recommandations", "Présentation incluse"],
      },
      {
        title: "Modèles prédictifs & ML",
        description: "Prévisions de vente, segmentation client, détection d'anomalies.",
        priceLabel: "Sur devis", price: "", duration: "Variable",
        features: ["Modèle entraîné", "API de prédiction", "Documentation"],
      },
    ],
  },
  {
    id: "formation",
    icon: "fas fa-graduation-cap",
    color: "from-green-600 to-emerald-500",
    accent: "text-green-600",
    label: "Formation & Coaching",
    registreRef: "Formation et Coaching professionnel",
    intro: "Programmes certifiants, ateliers pratiques et coaching individuel pour développer vos compétences et celles de vos équipes.",
    services: [
      {
        title: "Formation en présentiel",
        description: "Sessions de 1–5 jours sur des thématiques ciblées (management, digital, vente...).",
        priceLabel: "À partir de", price: "75 000 XOF / pers.", duration: "1–5 jours",
        features: ["Supports inclus", "Attestation", "Exercices pratiques"],
      },
      {
        title: "Coaching dirigeant",
        description: "Accompagnement personnalisé d'un dirigeant sur sa vision, leadership et performance.",
        priceLabel: "À partir de", price: "150 000 XOF / mois", duration: "3–12 mois",
        features: ["Séances hebdomadaires", "Plan de développement", "Accès ressources"],
        isPopular: true,
      },
      {
        title: "Programme e-Learning",
        description: "Formation en ligne asynchrone avec quiz, vidéos et certification numérique.",
        priceLabel: "À partir de", price: "25 000 XOF / mois", duration: "Illimité",
        features: ["Accès 24/7", "Badge numérique", "Communauté apprenants"],
      },
      {
        title: "Formation sur mesure entreprise",
        description: "Programme conçu spécifiquement pour votre organisation et vos équipes.",
        priceLabel: "Sur devis", price: "", duration: "Variable",
        features: ["Analyse des besoins", "Programme personnalisé", "Évaluation finale"],
      },
    ],
  },
  {
    id: "rse",
    icon: "fas fa-leaf",
    color: "from-lime-600 to-green-500",
    accent: "text-lime-600",
    label: "RSE & Développement Durable",
    registreRef: "Développement durable et Responsabilité Sociale des Entreprises (RSE)",
    intro: "Intégrez la durabilité au cœur de votre stratégie. Nous vous aidons à construire une politique RSE crédible, conforme et créatrice de valeur.",
    services: [
      {
        title: "Diagnostic RSE",
        description: "Évaluation de vos pratiques actuelles en matière de responsabilité sociale.",
        priceLabel: "À partir de", price: "150 000 XOF", duration: "1 semaine",
        features: ["Score RSE", "Axes prioritaires", "Recommandations"],
        isPopular: true,
      },
      {
        title: "Stratégie RSE & Plan d'action",
        description: "Définition de votre politique RSE alignée avec votre stratégie d'entreprise.",
        priceLabel: "À partir de", price: "300 000 XOF", duration: "2–4 semaines",
        features: ["Politique RSE formalisée", "Indicateurs de suivi", "Plan d'action annuel"],
      },
      {
        title: "Rapport RSE / Rapport de durabilité",
        description: "Rédaction de votre rapport annuel RSE selon les standards GRI ou ISO 26000.",
        priceLabel: "À partir de", price: "200 000 XOF", duration: "2–3 semaines",
        features: ["Conforme GRI/ISO 26000", "Données vérifiées", "Design professionnel"],
      },
      {
        title: "Accompagnement à la labellisation",
        description: "Préparation et suivi pour l'obtention de labels RSE ou certifications environnementales.",
        priceLabel: "Sur devis", price: "", duration: "3–6 mois",
        features: ["Audit de conformité", "Plan de mise à niveau", "Suivi certification"],
      },
    ],
  },
  {
    id: "finance",
    icon: "fas fa-coins",
    color: "from-yellow-500 to-amber-400",
    accent: "text-yellow-600",
    label: "Finance & Investissement",
    registreRef: "Activités comptables · Conseil de gestion · Plan financier",
    intro: "Gestion financière, levée de fonds, comptabilité normalisée et tableaux de bord pour piloter votre performance financière.",
    services: [
      {
        title: "Plan financier & prévisionnel",
        description: "Élaboration de votre plan financier sur 3–5 ans avec projections et analyses.",
        priceLabel: "À partir de", price: "200 000 XOF", duration: "1–2 semaines",
        features: ["Compte de résultat", "Bilan prévisionnel", "Cash-flow"],
      },
      {
        title: "Accompagnement levée de fonds",
        description: "Structuration du dossier, pitch investors, mise en relation bailleurs.",
        priceLabel: "Sur devis", price: "", duration: "2–6 mois",
        features: ["Mémorandum info", "Valorisation", "Réseau investisseurs"],
        isPopular: true,
      },
      {
        title: "Diagnostic financier",
        description: "Analyse de la santé financière de votre entreprise et identification des risques.",
        priceLabel: "À partir de", price: "150 000 XOF", duration: "3–5 jours",
        features: ["Ratios financiers", "Analyse des risques", "Recommandations"],
      },
      {
        title: "Externalisation comptable",
        description: "Tenue de comptabilité, déclarations fiscales, états financiers certifiés.",
        priceLabel: "À partir de", price: "75 000 XOF / mois", duration: "Mensuel",
        features: ["Bilan annuel", "Déclarations IS/ITS", "Tableau de bord"],
      },
    ],
  },
];

/* ─── Composant carte service ────────────────────────────────────────────── */
function ServiceCard({ service, sectorId, accentColor, index }: { service: ServiceItem; sectorId: string; accentColor: string; index: number }) {
  const { data: session } = useSession();
  const href = session
    ? `/dashboard/client/nouvelle-demande?sector=${encodeURIComponent(sectorId)}&service=${encodeURIComponent(service.title)}`
    : `/connexion?callbackUrl=/dashboard/client/nouvelle-demande`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`bg-white rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 relative flex flex-col ${
        service.isPopular ? "ring-2 ring-accent" : "border border-gray-100"
      }`}
    >
      {service.isPopular && (
        <div className="absolute -top-3 left-6 bg-gradient-to-r from-accent to-secondary text-white text-xs font-bold px-4 py-1 rounded-full shadow">
          Plus demandé
        </div>
      )}

      <h3 className="font-syne font-bold text-lg text-primary mb-2 leading-tight">{service.title}</h3>
      <p className="text-gray-500 text-sm leading-relaxed mb-4 flex-1">{service.description}</p>

      <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-100">
        <div>
          {service.priceLabel && <p className="text-xs text-gray-400">{service.priceLabel}</p>}
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

      <ul className="space-y-2 mb-5">
        {service.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
            <i className="fas fa-check text-secondary text-xs flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>

      <Link
        href={href}
        className={`mt-auto flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold transition-all ${
          service.isPopular
            ? "bg-gradient-to-r from-accent to-secondary text-white hover:opacity-90"
            : "border border-accent text-accent hover:bg-accent/5"
        }`}
      >
        Démarrer <i className="fas fa-arrow-right text-xs" />
      </Link>
    </motion.div>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function ServicesPage() {
  const [activeSector, setActiveSector] = useState<string>(SECTORS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessage, setChatMessage] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const sector = SECTORS.find((s) => s.id === activeSector) ?? SECTORS[0];

  const filtered = search.trim()
    ? SECTORS.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.registreRef.toLowerCase().includes(search.toLowerCase())
      )
    : SECTORS;

  function selectSector(id: string) {
    setActiveSector(id);
    setSidebarOpen(false);
    // Scroll to content on mobile
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  // Trigger chatbot when "Parler à l'assistant" is clicked
  function openChatbot(prefill: string) {
    setChatMessage(prefill);
    setChatOpen(true);
    // Try to open chatbot widget if it exposes a global method
    if (typeof window !== "undefined") {
      const event = new CustomEvent("shiftup:open-chat", { detail: { message: prefill } });
      window.dispatchEvent(event);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="bg-primary pt-28 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
        <div className="container-custom relative z-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl">
            <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-5">
              <i className="fas fa-grid-2" />Catalogue de services
            </span>
            <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">
              Nos domaines <span className="gradient-text">d'intervention</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-xl">
              {SECTORS.length} secteurs couverts, des centaines de solutions. Trouvez ce dont vous avez besoin ou décrivez votre projet — nous vous proposerons le meilleur accompagnement.
            </p>
          </motion.div>

          {/* Stats rapides */}
          <div className="flex flex-wrap gap-6 mt-8">
            {[
              { icon: "fas fa-briefcase", value: `${SECTORS.length}`, label: "Secteurs" },
              { icon: "fas fa-check-circle", value: `${SECTORS.reduce((a, s) => a + s.services.length, 0)}+`, label: "Services" },
              { icon: "fas fa-users", value: "200+", label: "Clients accompagnés" },
            ].map((stat) => (
              <div key={stat.label} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2.5 rounded-xl">
                <i className={`${stat.icon} text-accent`} />
                <div>
                  <p className="font-syne font-black text-white text-lg leading-none">{stat.value}</p>
                  <p className="text-white/50 text-xs">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Layout : Sidebar + Contenu ────────────────────────────────────── */}
      <div className="container-custom py-10">
        <div className="flex gap-8 items-start">

          {/* ── Sidebar secteurs (desktop) ──────────────────────────────── */}
          <aside className="hidden lg:flex flex-col w-72 flex-shrink-0 sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden rounded-2xl bg-white shadow-card">
            {/* Header + search */}
            <div className="p-4 border-b border-gray-100">
              <h2 className="font-syne font-bold text-primary text-sm mb-3 flex items-center gap-2">
                <i className="fas fa-list-ul text-accent" />Secteurs d'activité
              </h2>
              <div className="relative">
                <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-accent"
                  placeholder="Rechercher…"
                />
              </div>
            </div>

            {/* Liste */}
            <nav className="flex-1 overflow-y-auto py-2">
              {filtered.length === 0 ? (
                <p className="text-center text-gray-400 text-sm py-6">Aucun résultat</p>
              ) : filtered.map((s) => (
                <button
                  key={s.id}
                  onClick={() => selectSector(s.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all group ${
                    activeSector === s.id
                      ? "bg-primary/5 border-r-2 border-accent"
                      : "hover:bg-gray-50 border-r-2 border-transparent"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                    <i className={`${s.icon} text-white text-sm`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold leading-tight truncate ${activeSector === s.id ? "text-primary" : "text-gray-700 group-hover:text-primary"}`}>
                      {s.label}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{s.services.length} services</p>
                  </div>
                  {activeSector === s.id && <i className="fas fa-chevron-right text-accent text-xs flex-shrink-0" />}
                </button>
              ))}
            </nav>

            {/* Footer sidebar */}
            <div className="p-4 border-t border-gray-100 bg-gray-50/60">
              <p className="text-xs text-gray-400 text-center leading-relaxed">
                Secteurs issus du<br />registre de commerce SHIFT UP
              </p>
            </div>
          </aside>

          {/* ── Mobile : sélecteur de secteur ────────────────────────────── */}
          <div className="lg:hidden w-full mb-6">
            <button
              onClick={() => setSidebarOpen(true)}
              className="w-full flex items-center justify-between bg-white shadow-card rounded-2xl px-5 py-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 bg-gradient-to-br ${sector.color} rounded-xl flex items-center justify-center`}>
                  <i className={`${sector.icon} text-white text-sm`} />
                </div>
                <div className="text-left">
                  <p className="font-syne font-bold text-primary text-sm">{sector.label}</p>
                  <p className="text-xs text-gray-400">{sector.services.length} services</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-accent text-sm">
                <span className="font-medium">Changer</span>
                <i className="fas fa-chevron-down" />
              </div>
            </button>

            {/* Mobile drawer */}
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/50 z-40" />
                  <motion.div
                    initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed top-0 left-0 bottom-0 w-80 bg-white z-50 flex flex-col shadow-2xl"
                  >
                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                      <h2 className="font-syne font-bold text-primary">Secteurs d'activité</h2>
                      <button onClick={() => setSidebarOpen(false)} className="text-gray-400 hover:text-gray-600 p-2">
                        <i className="fas fa-times" />
                      </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto py-2">
                      {SECTORS.map((s) => (
                        <button key={s.id} onClick={() => selectSector(s.id)} className={`w-full flex items-center gap-3 px-4 py-3 text-left ${activeSector === s.id ? "bg-primary/5 border-r-2 border-accent" : "hover:bg-gray-50 border-r-2 border-transparent"}`}>
                          <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                            <i className={`${s.icon} text-white text-sm`} />
                          </div>
                          <div className="flex-1">
                            <p className={`text-sm font-semibold ${activeSector === s.id ? "text-primary" : "text-gray-700"}`}>{s.label}</p>
                            <p className="text-[10px] text-gray-400">{s.services.length} services</p>
                          </div>
                        </button>
                      ))}
                    </nav>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* ── Contenu principal ─────────────────────────────────────────── */}
          <div ref={contentRef} className="flex-1 min-w-0 space-y-8">
            <AnimatePresence mode="wait">
              <motion.div key={sector.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}>

                {/* En-tête du secteur */}
                <div className="bg-white rounded-2xl shadow-card p-6 mb-6 flex items-start gap-5">
                  <div className={`w-16 h-16 bg-gradient-to-br ${sector.color} rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg`}>
                    <i className={`${sector.icon} text-white text-2xl`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h2 className="font-syne font-black text-2xl text-primary mb-1">{sector.label}</h2>
                        <p className="text-gray-500 text-sm leading-relaxed">{sector.intro}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex items-center gap-2 flex-wrap">
                      <i className="fas fa-certificate text-gray-400 text-xs" />
                      <span className="text-xs text-gray-400 italic">{sector.registreRef}</span>
                    </div>
                  </div>
                </div>

                {/* Grille de services */}
                <div className="grid md:grid-cols-2 gap-5">
                  {sector.services.map((service, i) => (
                    <ServiceCard key={service.title} service={service} sectorId={sector.id} accentColor={sector.accent} index={i} />
                  ))}
                </div>

                {/* ── "De quoi avez-vous besoin ?" ──────────────────────── */}
                <div className="mt-8 bg-gradient-to-br from-primary to-primary/90 rounded-2xl overflow-hidden">
                  <div className="p-8">
                    <div className="grid lg:grid-cols-2 gap-8 items-center">
                      {/* Texte */}
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center">
                            <i className="fas fa-robot text-accent text-lg" />
                          </div>
                          <span className="text-accent text-sm font-semibold uppercase tracking-wide">Assistant SHIFT UP</span>
                        </div>
                        <h3 className="font-syne font-black text-2xl text-white mb-2">
                          De quoi avez-vous besoin ?
                        </h3>
                        <p className="text-white/60 text-sm leading-relaxed">
                          Vous ne trouvez pas exactement ce qu'il vous faut ? Notre assistant analyse votre besoin et vous oriente vers la solution la plus adaptée.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-4">
                          {["Besoin urgent", "Budget limité", "Projet complexe", "Débutant"].map((tag) => (
                            <button
                              key={tag}
                              onClick={() => openChatbot(`Bonjour, j'ai un besoin ${tag.toLowerCase()} dans le secteur "${sector.label}"`)}
                              className="text-xs bg-white/10 hover:bg-white/20 text-white/80 hover:text-white px-3 py-1.5 rounded-full transition-colors"
                            >
                              {tag}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Zone de saisie */}
                      <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 space-y-3">
                        <p className="text-white/80 text-sm font-medium">Décrivez votre besoin en quelques mots</p>
                        <textarea
                          value={chatMessage}
                          onChange={(e) => setChatMessage(e.target.value)}
                          rows={3}
                          className="w-full bg-white/15 text-white placeholder-white/40 border border-white/20 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent/60 resize-none"
                          placeholder={`Ex: J'ai besoin d'aide pour ${sector.services[0]?.title.toLowerCase()}…`}
                        />
                        <div className="flex gap-3">
                          <button
                            onClick={() => openChatbot(chatMessage || `Bonjour, je cherche un service dans le secteur "${sector.label}"`)}
                            className="flex-1 flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          >
                            <i className="fas fa-robot" />Parler à l'assistant
                          </button>
                          <Link
                            href="/contact"
                            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
                          >
                            <i className="fas fa-envelope" />
                          </Link>
                        </div>
                        <p className="text-white/30 text-xs text-center">
                          Ou <Link href="/dashboard/client/nouvelle-demande" className="underline hover:text-white/60">soumettre directement une demande →</Link>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Bande bas — chiffres clés du secteur */}
                  <div className="border-t border-white/10 px-8 py-4 flex flex-wrap gap-6">
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <i className="fas fa-layer-group text-accent" />
                      <span><strong className="text-white">{sector.services.length}</strong> services disponibles</span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <i className="fas fa-clock text-accent" />
                      <span>Devis sous <strong className="text-white">48h ouvrées</strong></span>
                    </div>
                    <div className="flex items-center gap-2 text-white/50 text-xs">
                      <i className="fas fa-lock-open text-accent" />
                      <span>Acompte <strong className="text-white">40%</strong> au démarrage</span>
                    </div>
                  </div>
                </div>

              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ── Vue d'ensemble tous secteurs (bas de page) ──────────────────────── */}
      <section className="bg-white border-t border-gray-100 py-14">
        <div className="container-custom">
          <div className="text-center mb-10">
            <h2 className="font-syne font-black text-2xl text-primary mb-2">Tous nos secteurs d'intervention</h2>
            <p className="text-gray-500 text-sm">Cliquez sur un secteur pour explorer ses services</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {SECTORS.map((s) => (
              <button
                key={s.id}
                onClick={() => { selectSector(s.id); window.scrollTo({ top: 0, behavior: "smooth" }); }}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all hover:shadow-md text-center ${
                  activeSector === s.id ? "border-accent bg-accent/5 shadow-md" : "border-gray-100 bg-white hover:border-accent/30"
                }`}
              >
                <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center shadow-sm`}>
                  <i className={`${s.icon} text-white`} />
                </div>
                <p className="text-xs font-semibold text-primary leading-tight">{s.label}</p>
                <p className="text-[10px] text-gray-400">{s.services.length} services</p>
              </button>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
