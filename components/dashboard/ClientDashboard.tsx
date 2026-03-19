"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { StatCard } from "@/components/ui/Card";
import { PrestationStatusBadge } from "@/components/ui/Badge";

type Phase = { title: string; progress: number; done: boolean; active?: boolean };
type Prestation = {
  id: string;
  service: { title: string; domain: string };
  status: string;
  amount: number;
  amountPaid: number;
  globalProgress: number;
  phases: Phase[];
};

interface ClientDashboardProps {
  user?: { name?: string | null; email?: string | null; affiliationCode?: string };
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((data) => setPrestations(data.prestations ?? []))
      .finally(() => setLoading(false));
  }, []);

  const active    = prestations.filter((p) => ["EN_COURS","LIVRAISON","REVISION"].includes(p.status));
  const completed = prestations.filter((p) => p.status === "TERMINEE");
  const pending   = prestations.reduce((s, p) => s + (p.amount - p.amountPaid), 0);
  const current   = active[0] ?? null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

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
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Prestations actives" value={String(active.length)} icon={<i className="fas fa-briefcase" />} color="accent" trend="neutral" />
        <StatCard label="Prestations terminées" value={String(completed.length)} icon={<i className="fas fa-check-circle" />} color="secondary" trend="up" />
        <StatCard label="Solde à régler" value={`${pending.toLocaleString()} F`} icon={<i className="fas fa-wallet" />} color="primary" />
        <StatCard label="Total prestations" value={String(prestations.length)} icon={<i className="fas fa-star" />} color="accent" />
      </div>

      {/* Active prestation */}
      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!current ? (
            <div className="bg-white rounded-2xl shadow-card p-10 text-center text-gray-400">
              <i className="fas fa-briefcase text-3xl mb-3 block" />
              <p className="font-medium">Aucune prestation en cours</p>
              <Link href="/services" className="mt-4 inline-block text-accent text-sm hover:underline">
                Découvrir nos services →
              </Link>
            </div>
          ) : (
          <div className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Prestation en cours</p>
                <h2 className="font-syne font-bold text-xl text-primary">{current.service.title}</h2>
                <p className="text-gray-500 text-sm capitalize">{current.service.domain}</p>
              </div>
              <PrestationStatusBadge status={current.status} />
            </div>

            {/* Global progress */}
            <div className="mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">Progression globale</span>
                <span className="text-sm font-bold text-accent">{current.globalProgress}%</span>
              </div>
              <div className="progress-bar h-3">
                <motion.div
                  className="progress-fill h-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${current.globalProgress}%` }}
                  transition={{ duration: 1, delay: 0.3 }}
                />
              </div>
            </div>

            {/* Phases */}
            {Array.isArray(current.phases) && current.phases.length > 0 && (
              <div className="space-y-3">
                {current.phases.map((phase, i) => (
                  <div key={i} className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                    phase.active ? "bg-accent/5 border border-accent/20" : "bg-gray-50"
                  }`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                      phase.done ? "bg-secondary text-white" : phase.active ? "bg-accent text-white" : "bg-gray-200 text-gray-500"
                    }`}>
                      {phase.done ? <i className="fas fa-check text-xs" /> : i + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        phase.done ? "text-gray-400 line-through" : phase.active ? "text-primary font-semibold" : "text-gray-500"
                      }`}>{phase.title}</p>
                    </div>
                    <span className={`text-xs font-semibold ${phase.done ? "text-secondary" : phase.active ? "text-accent" : "text-gray-300"}`}>
                      {phase.progress}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          )}
        </div>

        {/* Side cards */}
        <div className="space-y-5">
          {/* Payment */}
          {current && (
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-4">Paiement</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Montant total</span>
                <span className="font-bold text-primary text-sm">{current.amount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Payé</span>
                <span className="font-bold text-secondary text-sm">{current.amountPaid.toLocaleString()} FCFA</span>
              </div>
              <hr className="border-gray-100" />
              <div className="flex justify-between">
                <span className="text-gray-500 text-sm">Solde restant</span>
                <span className="font-bold text-accent text-sm">
                  {(current.amount - current.amountPaid).toLocaleString()} FCFA
                </span>
              </div>
            </div>
            <div className="progress-bar mt-3">
              <div
                className="h-2 rounded-full bg-gradient-to-r from-secondary to-accent"
                style={{ width: `${current.amount > 0 ? (current.amountPaid / current.amount) * 100 : 0}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {current.amount > 0 ? ((current.amountPaid / current.amount) * 100).toFixed(0) : 0}% payé
            </p>
          </div>
          )}

          {/* Affiliation code */}
          {user?.affiliationCode && (
          <div className="bg-gradient-to-br from-primary to-primary/90 rounded-2xl p-5">
            <h3 className="font-syne font-bold text-white mb-3 flex items-center gap-2">
              <i className="fas fa-share-nodes text-accent" />
              Mon code d'affiliation
            </h3>
            <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
              <span className="text-white font-mono font-bold tracking-widest">{user.affiliationCode}</span>
              <button onClick={() => navigator.clipboard.writeText(user.affiliationCode!)} className="text-accent hover:text-secondary transition-colors">
                <i className="fas fa-copy" />
              </button>
            </div>
            <p className="text-white/50 text-xs">
              Partagez ce code et gagnez des commissions sur chaque nouveau client.
            </p>
          </div>
          )}

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
