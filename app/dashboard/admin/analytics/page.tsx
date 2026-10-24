"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import GraphiqueMensuel, { evolution, type Mensuel } from "@/components/dashboard/GraphiqueMensuel";

type Stats = {
  users: { total: number; newThisMonth: number; newLastMonth: number; byRole: Record<string, number> };
  prestations: { total: number; active: number; completed: number; byStatus: Record<string, number> };
  revenue: { total: number; thisMonth: number; lastMonth: number };
  mensuel: Mensuel;
  topServices: { titre: string; total: number }[];
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

  const evoCA = s ? evolution(s.revenue.thisMonth, s.revenue.lastMonth) : null;
  const evoUsers = s ? evolution(s.users.newThisMonth, s.users.newLastMonth) : null;
  const kpis = [
    { label: "CA total",            value: s ? `${(s.revenue.total).toLocaleString("fr-FR")} F`     : "—", change: "", positive: true, icon: "fa-sack-dollar", color: "from-primary to-accent" },
    { label: "CA ce mois",          value: s ? `${(s.revenue.thisMonth).toLocaleString("fr-FR")} F` : "—", change: evoCA ? `${evoCA.texte} vs mois dernier` : s ? "Pas de comparaison (mois dernier à 0)" : "", positive: evoCA?.positif ?? true, neutre: !evoCA, icon: "fa-chart-line", color: "from-primary to-accent" },
    { label: "Utilisateurs",        value: s ? String(s.users.total) : "—", change: s ? `${s.users.newThisMonth} inscrit(s) ce mois${evoUsers ? ` (${evoUsers.texte})` : ""}` : "", positive: evoUsers?.positif ?? true, icon: "fa-users", color: "from-primary to-accent" },
    { label: "Prestations actives", value: s ? String(s.prestations.active) : "—", change: "", positive: true, icon: "fa-briefcase", color: "from-primary to-accent" },
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
              <span className={`text-xs font-semibold ${"neutre" in kpi && kpi.neutre ? "text-gray-500" : kpi.positive ? "text-green-700" : "text-red-600"}`}>
                {kpi.change}
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

      <GraphiqueMensuel key={s ? "pret" : "attente"} initial={s?.mensuel ?? null} titre="Encaissements mensuels" />

      {/* Top services */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-5">Top services demandés</h2>
        <p className="text-xs text-gray-500 mb-4">Nombre de demandes de prestation par service.</p>
        {!s?.topServices?.length ? (
          <p className="text-center text-gray-500 text-sm py-6">Aucune prestation pour le moment.</p>
        ) : (
          <div className="space-y-3">
            {s.topServices.map((t) => (
              <div key={t.titre}>
                <div className="flex justify-between mb-1 gap-3">
                  <span className="text-sm text-gray-700 font-medium">{t.titre}</span>
                  <span className="text-xs text-gray-500 whitespace-nowrap">{t.total} demande{t.total > 1 ? "s" : ""}</span>
                </div>
                <div className="bg-gray-100 rounded-full h-1.5">
                  <div className="h-1.5 rounded-full bg-primary" style={{ width: `${(t.total / s.topServices[0].total) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
