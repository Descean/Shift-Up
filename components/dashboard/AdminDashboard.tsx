"use client";

import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/Card";
import { PrestationStatusBadge } from "@/components/ui/Badge";
import Link from "next/link";

const recentPrestations = [
  { id: "1", client: "Kossi Adigbli", service: "Application Web", status: "EN_COURS", amount: "1 500 000", date: "12/11/2025" },
  { id: "2", client: "Amina Soumaïla", service: "Business Plan", status: "TERMINEE", amount: "350 000", date: "05/11/2025" },
  { id: "3", client: "Pierre Dossa", service: "Formation équipe", status: "LIVRAISON", amount: "450 000", date: "01/11/2025" },
  { id: "4", client: "Marie-Claire Adjovi", service: "Stratégie digitale", status: "EN_ATTENTE", amount: "200 000", date: "28/10/2025" },
];

const kpis = [
  { label: "CA ce mois", value: "4.5M FCFA", icon: <i className="fas fa-chart-line" />, color: "secondary" as const, trend: "up" as const, trendValue: "12% vs mois dernier" },
  { label: "Prestations actives", value: "8", icon: <i className="fas fa-briefcase" />, color: "accent" as const },
  { label: "Nouveaux clients", value: "14", icon: <i className="fas fa-users" />, color: "accent" as const, trend: "up" as const, trendValue: "5 cette semaine" },
  { label: "Taux satisfaction", value: "4.9/5", icon: <i className="fas fa-star" />, color: "secondary" as const },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Tableau de bord Admin</h1>
        <p className="text-gray-500 text-sm">Vue globale — SHIFT UP</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {kpis.map((kpi, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
            <StatCard {...kpi} />
          </motion.div>
        ))}
      </div>

      {/* Main grid */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Recent prestations */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne font-bold text-lg text-primary">Prestations récentes</h2>
            <Link href="/dashboard/admin/prestations" className="text-accent text-sm hover:underline">
              Voir tout
            </Link>
          </div>
          <div className="space-y-3">
            {recentPrestations.map((p) => (
              <div key={p.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {p.client.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-primary truncate">{p.client}</p>
                  <p className="text-gray-400 text-xs truncate">{p.service}</p>
                </div>
                <PrestationStatusBadge status={p.status} />
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-primary">{p.amount} F</p>
                  <p className="text-gray-400 text-xs">{p.date}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick links */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-4">Accès rapides</h3>
            <div className="space-y-2">
              {[
                { icon: "fas fa-users", label: "Gérer les utilisateurs", href: "/dashboard/admin/utilisateurs", color: "text-accent" },
                { icon: "fas fa-newspaper", label: "Éditeur de blog", href: "/dashboard/admin/blog", color: "text-secondary" },
                { icon: "fas fa-bullhorn", label: "Campagnes marketing", href: "/dashboard/admin/marketing", color: "text-orange-500" },
                { icon: "fas fa-chart-bar", label: "Analytics", href: "/dashboard/admin/analytics", color: "text-purple-500" },
              ].map((a) => (
                <Link key={a.label} href={a.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-primary transition-colors text-sm">
                  <i className={`${a.icon} ${a.color} w-4`} />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Finance access (DG only) */}
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <i className="fas fa-lock text-accent" />
              <h3 className="font-syne font-bold text-white text-sm">Accès financier (DG)</h3>
            </div>
            <p className="text-white/50 text-xs mb-4">
              Accès restreint au tableau de bord financier et fiscal. Clé unique requise.
            </p>
            <Link
              href="/dashboard/admin/finances"
              className="flex items-center justify-center gap-2 bg-accent hover:bg-accent/90 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors"
            >
              <i className="fas fa-key text-xs" />
              Accéder (auth. requise)
            </Link>
          </div>
        </div>
      </div>

      {/* Revenue chart placeholder */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="font-syne font-bold text-lg text-primary">Chiffre d'affaires mensuel</h2>
            <p className="text-gray-400 text-sm">12 derniers mois</p>
          </div>
          <select className="border border-gray-100 rounded-xl px-3 py-2 text-sm text-gray-600 focus:outline-none">
            <option>2025</option>
            <option>2024</option>
          </select>
        </div>
        {/* Bar chart placeholder */}
        <div className="flex items-end gap-2 h-40">
          {[65, 45, 80, 72, 90, 60, 95, 78, 88, 70, 100, 85].map((h, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${h}%` }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="w-full bg-gradient-to-t from-accent to-secondary rounded-t-lg opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
              />
              <span className="text-[10px] text-gray-400">
                {["J","F","M","A","M","J","J","A","S","O","N","D"][i]}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
