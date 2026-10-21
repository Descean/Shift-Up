"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Stats = {
  users: { total: number; newThisMonth: number; byRole: Record<string, number> };
  prestations: { total: number; active: number; completed: number; byStatus: Record<string, number> };
  revenue: { total: number; thisMonth: number };
};

const STATUS_CONFIG: { key: string; label: string; color: string }[] = [
  { key: "EN_ATTENTE", label: "En attente",  color: "bg-gray-400" },
  { key: "EN_COURS",   label: "En cours",    color: "bg-accent-500" },
  { key: "LIVRAISON",  label: "Livraison",   color: "bg-accent-500" },
  { key: "REVISION",   label: "Révision",    color: "bg-amber-500" },
  { key: "TERMINEE",   label: "Terminée",    color: "bg-green-500" },
  { key: "ANNULEE",    label: "Annulée",     color: "bg-red-400" },
];

const ROLE_CONFIG: { key: string; label: string; color: string }[] = [
  { key: "CLIENT",    label: "Clients",    color: "bg-accent-400" },
  { key: "APPORTEUR", label: "Apporteurs", color: "bg-accent-400" },
  { key: "ETUDIANT",  label: "Étudiants",  color: "bg-secondary-400" },
  { key: "DEVELOPER", label: "Équipe",     color: "bg-gray-400" },
  { key: "ADMIN",     label: "Admins",     color: "bg-primary" },
];

const monthlyActivity = [
  { month: "Juil", clients: 8,  revenue: 320000 },
  { month: "Août", clients: 12, revenue: 480000 },
  { month: "Sept", clients: 15, revenue: 620000 },
  { month: "Oct",  clients: 22, revenue: 890000 },
  { month: "Nov",  clients: 18, revenue: 710000 },
  { month: "Déc",  clients: 25, revenue: 950000 },
];
const maxRevenue = Math.max(...monthlyActivity.map((m) => m.revenue));

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => setStats(data))
      .finally(() => setLoading(false));
  }, []);

  const s = stats;
  const totalPrestations = s?.prestations.total ?? 0;

  const kpis = [
    { label: "CA Total",            value: s ? `${(s.revenue.total).toLocaleString()} F`      : "—", change: "+18%", positive: true,  icon: "fa-sack-dollar",  color: "from-primary to-accent" },
    { label: "CA ce mois",          value: s ? `${(s.revenue.thisMonth).toLocaleString()} F`  : "—", change: "+32%", positive: true,  icon: "fa-chart-line",   color: "from-primary to-accent" },
    { label: "Utilisateurs",        value: s ? String(s.users.total)                          : "—", change: `+${s?.users.newThisMonth ?? 0}`, positive: true, icon: "fa-users", color: "from-primary to-accent" },
    { label: "Prestations actives", value: s ? String(s.prestations.active)                   : "—", change: "",     positive: true,  icon: "fa-briefcase",    color: "from-primary to-accent" },
  ];

  const prestationsByStatus = STATUS_CONFIG.map((cfg) => {
    const count = s?.prestations.byStatus[cfg.key] ?? 0;
    const pct = totalPrestations > 0 ? Math.round((count / totalPrestations) * 100) : 0;
    return { ...cfg, count, pct };
  });

  const totalUsers = s?.users.total ?? 1;
  const usersByRole = ROLE_CONFIG.map((cfg) => {
    const count = s?.users.byRole[cfg.key] ?? 0;
    const pct = totalUsers > 0 ? Math.round((count / totalUsers) * 100) : 0;
    return { ...cfg, count, pct };
  }).filter((r) => r.count > 0);

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Analytiques</h1>
        <p className="text-gray-500 text-sm">Vue d'ensemble de la plateforme</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, i) => (
          <motion.div key={kpi.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-white rounded-2xl shadow-card p-5">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-4`}>
              <i className={`fas ${kpi.icon} text-white text-sm`} />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{kpi.label}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-100 rounded animate-pulse mb-1" />
            ) : (
              <p className="font-syne font-black text-2xl text-primary mb-1">{kpi.value}</p>
            )}
            {kpi.change && (
              <span className={`text-xs font-semibold ${kpi.positive ? "text-green-600" : "text-red-500"}`}>
                {kpi.change} vs mois dernier
              </span>
            )}
          </motion.div>
        ))}
      </div>

      {/* Répartitions */}
      <div className="grid lg:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-syne font-bold text-primary mb-5">Prestations par statut</h2>
          <div className="space-y-3">
            {prestationsByStatus.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.color} transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-primary w-6 text-right">{item.count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Total : {totalPrestations} prestations</p>
        </div>

        <div className="bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-syne font-bold text-primary mb-5">Utilisateurs par rôle</h2>
          <div className="space-y-3">
            {usersByRole.map((item) => (
              <div key={item.key} className="flex items-center gap-3">
                <span className="text-xs text-gray-500 w-24 flex-shrink-0">{item.label}</span>
                <div className="flex-1 bg-gray-100 rounded-full h-2">
                  <div className={`h-2 rounded-full ${item.color} transition-all`} style={{ width: `${item.pct}%` }} />
                </div>
                <span className="text-xs font-semibold text-primary w-8 text-right">{item.count}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4">Total : {s?.users.total ?? 0} utilisateurs</p>
        </div>
      </div>

      {/* Activité mensuelle */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-syne font-bold text-primary">Activité mensuelle</h2>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-accent rounded-sm" />Revenus</span>
            <span className="flex items-center gap-1"><span className="w-3 h-3 bg-secondary rounded-sm" />Nouveaux clients</span>
          </div>
        </div>
        <div className="flex items-end gap-3 h-40">
          {monthlyActivity.map((m) => (
            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
              <div className="flex items-end gap-0.5 w-full">
                <div className="flex-1 bg-accent rounded-t-sm transition-all hover:bg-accent/80" style={{ height: `${(m.revenue / maxRevenue) * 120}px` }} title={`${m.revenue.toLocaleString()} FCFA`} />
                <div className="flex-1 bg-secondary rounded-t-sm transition-all hover:bg-secondary/80" style={{ height: `${(m.clients / 25) * 120}px` }} title={`${m.clients} clients`} />
              </div>
              <span className="text-xs text-gray-400">{m.month}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-3">* Activité mensuelle basée sur les 6 derniers mois (données historiques à venir)</p>
      </div>

      {/* Top services */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-5">Top services demandés</h2>
        <p className="text-xs text-gray-400 mb-4">Basé sur les prestations enregistrées en base de données.</p>
        {s && totalPrestations === 0 ? (
          <p className="text-center text-gray-400 text-sm py-6">Aucune prestation pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {STATUS_CONFIG.map((cfg) => {
              const count = s?.prestations.byStatus[cfg.key] ?? 0;
              if (count === 0) return null;
              return (
                <div key={cfg.key} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-gray-700 font-medium">{cfg.label}</span>
                      <span className="text-xs text-gray-400">{count} prestation{count > 1 ? "s" : ""}</span>
                    </div>
                    <div className="bg-gray-100 rounded-full h-1.5">
                      <div className="h-1.5 rounded-full bg-gradient-to-r from-accent to-secondary" style={{ width: `${totalPrestations > 0 ? (count / totalPrestations) * 100 : 0}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
