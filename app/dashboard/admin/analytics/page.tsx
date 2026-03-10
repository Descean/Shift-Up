/**
 * app/dashboard/admin/analytics/page.tsx — Analytiques & statistiques (admin)
 *
 * Vue d'ensemble des métriques clés de la plateforme SHIFT UP :
 *  - KPIs : CA total, CA du mois, utilisateurs, prestations actives
 *  - Répartition des prestations par statut
 *  - Répartition des utilisateurs par rôle
 *  - Activité mensuelle (nouveaux clients + revenus)
 *  - Top 5 des services les plus demandés
 *
 * Données : actuellement mockées.
 * TODO: brancher sur GET /api/admin/stats pour les KPIs réels.
 *       Utiliser une librairie de graphiques (Recharts, Chart.js) pour
 *       remplacer les barres CSS par de vrais graphiques interactifs.
 */

"use client";

import { motion } from "framer-motion";

// ─── Données mock ─────────────────────────────────────────────────────────────

/** KPIs principaux affichés en haut de page */
const kpis = [
  {
    label: "CA Total",
    value: "2 350 000 F",
    change: "+18%",
    positive: true,
    icon: "fa-sack-dollar",
    color: "from-accent to-secondary",
  },
  {
    label: "CA ce mois",
    value: "450 000 F",
    change: "+32%",
    positive: true,
    icon: "fa-chart-line",
    color: "from-green-400 to-teal-500",
  },
  {
    label: "Utilisateurs",
    value: "128",
    change: "+12",
    positive: true,
    icon: "fa-users",
    color: "from-purple-400 to-pink-500",
  },
  {
    label: "Prestations actives",
    value: "14",
    change: "-2",
    positive: false,
    icon: "fa-briefcase",
    color: "from-amber-400 to-orange-500",
  },
];

/** Répartition des prestations par statut (pour mini-graphique en barres) */
const prestationsByStatus = [
  { label: "En attente",  count: 8,  color: "bg-gray-400",   pct: 16 },
  { label: "En cours",    count: 14, color: "bg-blue-500",   pct: 28 },
  { label: "Livraison",   count: 5,  color: "bg-purple-500", pct: 10 },
  { label: "Révision",    count: 3,  color: "bg-amber-500",  pct: 6  },
  { label: "Terminée",    count: 18, color: "bg-green-500",  pct: 36 },
  { label: "Annulée",     count: 2,  color: "bg-red-400",    pct: 4  },
];

/** Répartition des utilisateurs par rôle */
const usersByRole = [
  { label: "Clients",    count: 94,  color: "bg-blue-400",   pct: 73 },
  { label: "Apporteurs", count: 18,  color: "bg-purple-400", pct: 14 },
  { label: "Étudiants",  count: 12,  color: "bg-amber-400",  pct: 9  },
  { label: "Équipe",     count: 4,   color: "bg-gray-400",   pct: 3  },
  { label: "Admins",     count: 1,   color: "bg-red-400",    pct: 1  },
];

/**
 * Activité mensuelle sur les 6 derniers mois.
 * revenue en FCFA (divisé par 1 000 pour l'affichage des barres).
 */
const monthlyActivity = [
  { month: "Juil",  clients: 8,  revenue: 320000 },
  { month: "Août",  clients: 12, revenue: 480000 },
  { month: "Sept",  clients: 15, revenue: 620000 },
  { month: "Oct",   clients: 22, revenue: 890000 },
  { month: "Nov",   clients: 18, revenue: 710000 },
  { month: "Déc",   clients: 25, revenue: 950000 },
];

/** Valeur maximale de revenu pour normaliser la hauteur des barres */
const maxRevenue = Math.max(...monthlyActivity.map((m) => m.revenue));

/** Top 5 des services les plus commandés */
const topServices = [
  { title: "Application Web / SaaS", count: 18, pct: 90 },
  { title: "Logo & Identité visuelle", count: 14, pct: 70 },
  { title: "Stratégie digitale", count: 11, pct: 55 },
  { title: "E-commerce / Boutique", count: 8, pct: 40 },
  { title: "Community Management", count: 6, pct: 30 },
];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function AdminAnalyticsPage() {
  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Analytiques</h1>
        <p className="text-gray-500 text-sm">Vue d'ensemble de la plateforme</p>
      </motion.div>

      {/* ── KPIs en cartes ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div
            key={kpi.label}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-card p-5"
          >
            {/* Icône avec gradient */}
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-4`}>
              <i className={`fas ${kpi.icon} text-white text-sm`} />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            <p className="font-syne font-black text-2xl text-primary mb-1">{kpi.value}</p>
            {/* Variation par rapport à la période précédente */}
            <span className={`text-xs font-semibold ${kpi.positive ? "text-green-600" : "text-red-500"}`}>
              {kpi.change} vs mois dernier
            </span>
          </motion.div>
        ))}
      </div>

      {/* ── Ligne 2 : Répartitions ───────────────────────────────────────── */}
      <div className="grid lg:grid-cols-2 gap-5">

        {/* Répartition des prestations par statut */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-syne font-bold text-primary mb-5">Prestations par statut</h2>
          <div className="space-y-3">
            {prestationsByStatus.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                {/* Label */}
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">{item.label}</span>
                {/* Barre de progression */}
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                {/* Compteur */}
                <span className="text-xs font-semibold text-primary w-6 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          {/* Total prestations */}
          <p className="text-xs text-gray-400 mt-4">
            Total : {prestationsByStatus.reduce((s, i) => s + i.count, 0)} prestations
          </p>
        </div>

        {/* Répartition des utilisateurs par rôle */}
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-syne font-bold text-primary mb-5">Utilisateurs par rôle</h2>
          <div className="space-y-3">
            {usersByRole.map((item) => (
              <div key={item.label} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${item.color} transition-all`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
                <span className="text-xs font-semibold text-primary w-8 text-right">
                  {item.count}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">
            Total : {usersByRole.reduce((s, i) => s + i.count, 0)} utilisateurs
          </p>
        </div>
      </div>

      {/* ── Activité mensuelle (barres) ──────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-syne font-bold text-primary">Activité mensuelle</h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-accent rounded-sm" />
              Revenus
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 bg-secondary rounded-sm" />
              Nouveaux clients
            </span>
          </div>
        </div>

        {/* Graphique en barres CSS — remplacer par Recharts pour interactivité */}
        <div className="flex items-end gap-3 h-40">
          {monthlyActivity.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              {/* Barres empilées côte à côte (revenus + clients) */}
              <div className="flex items-end gap-0.5 w-full">
                {/* Barre revenus */}
                <div
                  className="flex-1 bg-accent rounded-t-sm transition-all hover:bg-accent/80"
                  style={{ height: `${(m.revenue / maxRevenue) * 120}px` }}
                  title={`${m.revenue.toLocaleString()} FCFA`}
                />
                {/* Barre clients (normalisée sur max 25) */}
                <div
                  className="flex-1 bg-secondary rounded-t-sm transition-all hover:bg-secondary/80"
                  style={{ height: `${(m.clients / 25) * 120}px` }}
                  title={`${m.clients} clients`}
                />
              </div>
              {/* Étiquette du mois */}
              <span className="text-xs text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Top services ─────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-5">Top services demandés</h2>
        <div className="space-y-4">
          {topServices.map((svc, i) => (
            <div key={svc.title} className="flex items-center gap-4">
              {/* Rang */}
              <span className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                {i + 1}
              </span>
              {/* Titre + barre */}
              <div className="flex-1">
                <div className="flex justify-between mb-1">
                  <span className="text-sm text-gray-700 font-medium">{svc.title}</span>
                  <span className="text-xs text-gray-400">{svc.count} commandes</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div
                    className="h-1.5 rounded-full bg-gradient-to-r from-accent to-secondary"
                    style={{ width: `${svc.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Note de bas de page ───────────────────────────────────────────── */}
      <div className="bg-amber-50 rounded-2xl p-4 text-xs text-amber-700">
        <i className="fas fa-info-circle mr-2" />
        Ces statistiques sont basées sur des données mock.
        Pour les données réelles, connectez <strong>GET /api/admin/stats</strong> et
        intégrez <strong>Recharts</strong> ou <strong>Chart.js</strong> pour les graphiques interactifs.
      </div>
    </div>
  );
}
