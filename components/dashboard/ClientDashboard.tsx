"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { StatCard } from "@/components/ui/Card";
import { PrestationStatusBadge, StarBadge } from "@/components/ui/Badge";

// Mock data — replace with real Supabase/API calls
const mockPrestation = {
  id: "1",
  service: "Application Web / SaaS",
  domain: "Solutions Numériques",
  status: "EN_COURS",
  assignedTo: "Équipe Développement",
  amount: 1500000,
  amountPaid: 600000,
  globalProgress: 65,
  currentPhase: 3,
  phases: [
    { title: "Analyse & Cahier des charges", progress: 100, done: true },
    { title: "Maquettes & Design UI", progress: 100, done: true },
    { title: "Développement Front-end", progress: 80, done: false, active: true },
    { title: "Développement Back-end", progress: 40, done: false },
    { title: "Tests & Recette", progress: 0, done: false },
    { title: "Déploiement & Formation", progress: 0, done: false },
  ],
};

interface ClientDashboardProps {
  user?: {
    name?: string | null;
    email?: string | null;
  };
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
  return (
    <div className="space-y-6 max-w-7xl">
      {/* Welcome */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
      >
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">
            Bonjour, {user?.name?.split(" ")[0]} !
          </h1>
          <p className="text-gray-500 text-sm">Voici un résumé de votre espace client</p>
        </div>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-plus" />
          Nouvelle prestation
        </Link>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Prestations actives" value="1" icon={<i className="fas fa-briefcase" />} color="accent" trend="neutral" />
        <StatCard label="Prestations terminées" value="3" icon={<i className="fas fa-check-circle" />} color="secondary" trendValue="2 ce trimestre" trend="up" />
        <StatCard label="Solde à régler" value="900 000 F" icon={<i className="fas fa-wallet" />} color="primary" />
        <StatCard label="Mes étoiles" value="2 / 5" icon={<i className="fas fa-star" />} color="accent" />
      </div>

      {/* Active prestation */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Prestation en cours</p>
                <h2 className="font-syne font-bold text-xl text-primary">{mockPrestation.service}</h2>
                <p className="text-gray-500 text-sm">{mockPrestation.domain}</p>
              </div>
              <PrestationStatusBadge status={mockPrestation.status} />
            </div>

            {/* Global progress */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progression globale</span>
                <span className="text-sm font-bold text-accent">{mockPrestation.globalProgress}%</span>
              </div>
              <div className="progress-bar h-3">
                <motion.div
                  className="progress-fill h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${mockPrestation.globalProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>

            {/* Phases */}
            <div className="space-y-3">
              {mockPrestation.phases.map((phase, i) => (
                <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                  (phase as any).active ? "bg-accent/5 border border-accent/20" : "bg-gray-50"
                }`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    phase.done
                      ? "bg-secondary text-white"
                      : (phase as any).active
                      ? "bg-accent text-white"
                      : "bg-gray-200 text-gray-500"
                  }`}>
                    {phase.done ? <i className="fas fa-check text-xs" /> : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      phase.done ? "text-gray-400 line-through" :
                      (phase as any).active ? "text-primary font-semibold" : "text-gray-500"
                    }`}>
                      {phase.title}
                    </p>
                    {phase.progress > 0 && phase.progress < 100 && (
                      <div className="progress-bar h-1 mt-1">
                        <div className="progress-fill h-full" style={{ width: `${phase.progress}%` }} />
                      </div>
                    )}
                  </div>
                  <span className={`text-xs font-semibold ${
                    phase.done ? "text-secondary" : (phase as any).active ? "text-accent" : "text-gray-300"
                  }`}>
                    {phase.progress}%
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Side cards */}
        <div className="space-y-5">
          {/* Payment */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-4">Paiement</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Montant total</span>
                <span className="font-bold text-primary text-sm">{mockPrestation.amount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Acompte payé (40%)</span>
                <span className="font-bold text-secondary text-sm">{mockPrestation.amountPaid.toLocaleString()} FCFA</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Solde restant</span>
                <span className="font-bold text-accent text-sm">
                  {(mockPrestation.amount - mockPrestation.amountPaid).toLocaleString()} FCFA
                </span>
              </div>
            </div>
            <div className="progress-bar mt-3">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-secondary to-accent"
                style={{ width: `${(mockPrestation.amountPaid / mockPrestation.amount) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {((mockPrestation.amountPaid / mockPrestation.amount) * 100).toFixed(0)}% payé
            </p>
          </div>

          {/* Affiliation code */}
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-5">
            <h3 className="font-syne font-bold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-share-nodes text-accent" />
              Mon code d'affiliation
            </h3>
            <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
              <span className="text-white font-mono font-bold tracking-widest">SU-2025-KA8</span>
              <button className="text-accent hover:text-secondary transition-colors">
                <i className="fas fa-copy" />
              </button>
            </div>
            <p className="text-white/50 text-xs">
              Partagez ce code et gagnez des commissions sur chaque nouveau client.
            </p>
          </div>

          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-4">Actions rapides</h3>
            <div className="space-y-2">
              {[
                { icon: "fas fa-comments", label: "Contacter mon équipe", href: "/dashboard/client/messages" },
                { icon: "fas fa-file-invoice", label: "Télécharger ma facture", href: "/dashboard/client/factures" },
                { icon: "fas fa-star", label: "Laisser un avis", href: "#" },
              ].map((a) => (
                <Link
                  key={a.label}
                  href={a.href}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 hover:text-accent transition-colors text-sm"
                >
                  <i className={`${a.icon} w-4 text-accent`} />
                  {a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
