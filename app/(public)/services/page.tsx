"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BandeauTitre, TitrePoints, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";
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
    color: "from-primary to-accent",
    accent: "text-accent-600",
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
    color: "from-primary to-accent",
    accent: "text-primary-600",
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
    color: "from-primary to-accent",
    accent: "text-accent-600",
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
    color: "from-primary to-accent",
    accent: "text-secondary-500",
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
    color: "from-primary to-accent",
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
    color: "from-primary to-accent",
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
    color: "from-primary to-accent",
    accent: "text-accent-600",
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
    color: "from-primary to-accent",
    accent: "text-accent-600",
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
    color: "from-primary to-accent",
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
    color: "from-primary to-accent",
    accent: "text-primary-600",
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
    color: "from-primary to-accent",
    accent: "text-secondary-600",
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

/* ─── Icône de chaque domaine (jeu d'icônes du site) ─────────────────────── */
const ICONES: Record<string, string> = {
  conseil: "conseil", "marches-publics": "dossiers", juridique: "juridique", marketing: "marketing", btp: "entreprise",
  numerique: "numerique", transformation: "numerique", data: "documents", formation: "formation", rse: "personne", finance: "finance",
};

/* ─── Composant carte service ────────────────────────────────────────────── */
function ServiceCard({ service, sectorId, index }: { service: ServiceItem; sectorId: string; index: number }) {
  const { data: session } = useSession();
  const href = session
    ? `/dashboard/client/nouvelle-demande?sector=${encodeURIComponent(sectorId)}&service=${encodeURIComponent(service.title)}`
    : `/connexion?callbackUrl=/dashboard/client/nouvelle-demande`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.06 }}
      className={`relative flex flex-col gap-3 rounded-2xl bg-white p-6 transition-shadow hover:shadow-[0_12px_30px_rgba(30,46,79,0.12)] ${
        service.isPopular ? "border-2 border-su-bleu" : "border border-su-lavande"
      }`}
    >
      {service.isPopular && (
        <span className="absolute -top-3 left-6 rounded-full bg-su-bleu px-3.5 py-1 text-xs font-bold text-white">Le plus demandé</span>
      )}
      <h3 className={`${titreFont} m-0 text-lg font-bold leading-snug text-su-nuit`}>{service.title}</h3>
      <p className="m-0 flex-1 text-sm leading-relaxed text-[#4B5563]">{service.description}</p>
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
        {service.features.map((f) => (
          <li key={f} className="flex items-center gap-2 text-sm text-[#374151]">
            <span className="text-su-bleu"><Icone nom="coche" taille={15} epaisseur={2.2} /></span>{f}
          </li>
        ))}
      </ul>
      <div className="mt-1 flex items-end justify-between gap-3 border-t border-su-lavande pt-4">
        <div className="flex flex-col">
          {service.priceLabel && <span className="text-xs text-[#6B7280]">{service.priceLabel}</span>}
          <span className={`${titreFont} text-lg font-extrabold text-su-nuit`}>{service.price || "Sur devis"}</span>
        </div>
        {service.duration && (
          <span className="flex items-center gap-1.5 text-[13px] text-[#4B5563]"><span className="text-su-bleu"><Icone nom="horloge" taille={16} /></span>{service.duration}</span>
        )}
      </div>
      <Link href={href}
        className={`inline-flex items-center justify-center gap-2 rounded-full py-3 text-sm font-semibold transition-colors ${
          service.isPopular ? "bg-su-bleu text-white hover:bg-su-cadet" : "border border-su-clair text-su-bleu hover:border-su-bleu"
        }`}>
        Souscrire <Icone nom="fleche" taille={16} epaisseur={2} />
      </Link>
    </motion.div>
  );
}

function BoutonDomaine({ s, actif, onClick }: { s: Sector; actif: boolean; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} aria-current={actif ? "true" : undefined}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${actif ? "bg-su-bleu text-white" : "text-su-nuit hover:bg-su-brume"}`}>
      <span className={`flex h-9 w-9 flex-none items-center justify-center rounded-lg ${actif ? "bg-white/15 text-white" : "bg-su-brume text-su-bleu"}`}>
        <Icone nom={ICONES[s.id] ?? "conseil"} taille={19} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold">{s.label}</span>
        <span className={`block text-[11px] ${actif ? "text-su-lavande" : "text-[#6B7280]"}`}>{s.services.length} offres</span>
      </span>
    </button>
  );
}

/* ─── Page principale ────────────────────────────────────────────────────── */
export default function ServicesPage() {
  const [activeSector, setActiveSector] = useState<string>(SECTORS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [chatMessage, setChatMessage] = useState("");
  const contentRef = useRef<HTMLDivElement>(null);

  const sector = SECTORS.find((s) => s.id === activeSector) ?? SECTORS[0];

  const filtered = search.trim()
    ? SECTORS.filter((s) =>
        s.label.toLowerCase().includes(search.toLowerCase()) ||
        s.registreRef.toLowerCase().includes(search.toLowerCase())
      )
    : SECTORS;

  // Ouvre directement le service demandé dans l'URL (ex. /services#numerique, depuis l'accueil ou le menu)
  useEffect(() => {
    const ALIAS: Record<string, string> = { dossiers: "marches-publics" };
    const lireAncre = () => {
      const brut = decodeURIComponent(window.location.hash.replace("#", "")).trim();
      const id = ALIAS[brut] ?? brut;
      if (id && SECTORS.some((s) => s.id === id)) {
        setActiveSector(id);
        setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 150);
      }
    };
    lireAncre();
    window.addEventListener("hashchange", lireAncre);
    return () => window.removeEventListener("hashchange", lireAncre);
  }, []);

  function selectSector(id: string) {
    setActiveSector(id);
    setSidebarOpen(false);
    setTimeout(() => contentRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  }

  // Ouvre l'assistant (widget de discussion) avec un message prérempli
  function openChatbot(prefill: string) {
    window.dispatchEvent(new CustomEvent("shiftup:open-chat", { detail: { message: prefill } }));
  }

  const nbOffres = SECTORS.reduce((a, s) => a + s.services.length, 0);

  return (
    <div className="min-h-screen bg-white">
      <BandeauTitre titre="Nos domaines" accent="d'intervention."
        texte={`${SECTORS.length} domaines et ${nbOffres} offres, du dossier d'appel d'offres au tableau de bord. Choisissez un domaine pour voir les prix et les délais ; chaque devis est envoyé sous 48 heures ouvrées.`} />

      <div className="mx-auto max-w-[1200px] px-6 py-14">
        <div className="flex flex-col items-start gap-8 lg:flex-row">

          {/* Domaines (ordinateur) */}
          <aside className="sticky top-28 hidden max-h-[calc(100vh-8rem)] w-[290px] flex-none flex-col overflow-hidden rounded-[20px] border border-su-lavande bg-white lg:flex">
            <div className="border-b border-su-lavande p-4">
              <label className="relative block">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9CA3AF]"><Icone nom="loupe" taille={16} /></span>
                <input value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Rechercher un domaine"
                  className="w-full rounded-full border border-su-lavande py-2.5 pl-9 pr-3 text-sm focus:border-su-bleu focus:outline-none" placeholder="Rechercher un domaine" />
              </label>
            </div>
            <nav aria-label="Domaines" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5">
              {filtered.length === 0
                ? <p className="py-6 text-center text-sm text-[#6B7280]">Aucun résultat</p>
                : filtered.map((s) => <BoutonDomaine key={s.id} s={s} actif={activeSector === s.id} onClick={() => selectSector(s.id)} />)}
            </nav>
          </aside>

          {/* Domaines (mobile) */}
          <div className="w-full lg:hidden">
            <button type="button" onClick={() => setSidebarOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-su-lavande bg-white px-5 py-4">
              <span className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-su-brume text-su-bleu"><Icone nom={ICONES[sector.id] ?? "conseil"} taille={20} /></span>
                <span className="text-left">
                  <span className={`${titreFont} block text-sm font-bold text-su-nuit`}>{sector.label}</span>
                  <span className="block text-xs text-[#6B7280]">{sector.services.length} offres</span>
                </span>
              </span>
              <span className="text-sm font-semibold text-su-bleu">Changer</span>
            </button>
            <AnimatePresence>
              {sidebarOpen && (
                <>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSidebarOpen(false)} className="fixed inset-0 z-40 bg-su-nuit/60" />
                  <motion.div initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="fixed bottom-0 left-0 top-0 z-50 flex w-80 flex-col bg-white shadow-2xl">
                    <div className="flex items-center justify-between border-b border-su-lavande p-4">
                      <span className={`${titreFont} font-bold text-su-nuit`}>Domaines</span>
                      <button type="button" onClick={() => setSidebarOpen(false)} aria-label="Fermer" className="p-2 text-su-bleu"><Icone nom="plus" taille={20} /></button>
                    </div>
                    <nav aria-label="Domaines" className="flex flex-1 flex-col gap-1 overflow-y-auto p-2.5">
                      {SECTORS.map((s) => <BoutonDomaine key={s.id} s={s} actif={activeSector === s.id} onClick={() => selectSector(s.id)} />)}
                    </nav>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Contenu du domaine */}
          <div ref={contentRef} className="min-w-0 flex-1 scroll-mt-28">
            <AnimatePresence mode="wait">
              <motion.div key={sector.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.3 }}
                className="flex flex-col gap-6">
                <div className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] bg-su-nuit p-7 sm:flex-row sm:items-center sm:gap-6 sm:p-9">
                  <span aria-hidden="true" className="absolute right-[-100px] top-[-140px] h-[340px] w-[340px] rounded-full border-[36px] border-su-cadet" />
                  <span className="relative flex h-16 w-16 flex-none items-center justify-center rounded-2xl bg-su-bleu text-white"><Icone nom={ICONES[sector.id] ?? "conseil"} taille={32} epaisseur={1.6} /></span>
                  <div className="relative flex flex-col gap-2">
                    <h2 className={`${titreFont} m-0 text-[26px] font-extrabold leading-tight text-white sm:text-[30px]`}>{sector.label}</h2>
                    <p className="m-0 text-[15px] leading-relaxed text-su-lavande">{sector.intro}</p>
                    <p className="m-0 text-xs text-su-ciel">{sector.registreRef}</p>
                  </div>
                </div>

                <div className="grid gap-5 pt-2 md:grid-cols-2">
                  {sector.services.map((service, i) => (
                    <ServiceCard key={service.title} service={service} sectorId={sector.id} index={i} />
                  ))}
                </div>

                <div className="flex flex-col gap-5 rounded-[20px] border border-su-lavande bg-su-brume p-7 sm:p-8">
                  <div className="flex flex-col gap-2">
                    <TitrePoints taille="text-2xl">Votre besoin n&apos;est pas dans la liste ?</TitrePoints>
                    <p className="m-0 text-[15px] leading-relaxed text-[#4B5563]">
                      Décrivez-le en quelques mots : nous vous orientons vers la bonne offre ou vous envoyons un devis sous 48 heures ouvrées. Un acompte de 60 % est demandé au démarrage.
                    </p>
                  </div>
                  <textarea value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} rows={3} aria-label="Décrivez votre besoin"
                    className="w-full resize-none rounded-xl border border-su-lavande bg-white px-4 py-3 text-[15px] focus:border-su-bleu focus:outline-none"
                    placeholder={`Ex. : j'ai besoin d'aide pour ${sector.services[0]?.title.toLowerCase()}…`} />
                  <div className="flex flex-wrap gap-3">
                    <Link href="/dashboard/client/nouvelle-demande"
                      className="inline-flex items-center gap-2 rounded-full bg-su-bleu px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-su-cadet">
                      Demander un devis <Icone nom="fleche" taille={16} epaisseur={2} />
                    </Link>
                    <button type="button" onClick={() => openChatbot(chatMessage || `Bonjour, je cherche un service dans le domaine « ${sector.label} »`)}
                      className="rounded-full border border-su-clair bg-white px-6 py-3 text-sm font-semibold text-su-bleu transition-colors hover:border-su-bleu">
                      Parler à l&apos;assistant
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
