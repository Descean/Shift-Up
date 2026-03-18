"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Stats = {
  totalEarnings: number; pendingEarnings: number; paidEarnings: number;
  totalReferrals: number; level: string;
};

const levelConfig: Record<string, { color: string; icon: string; next?: string; threshold: number }> = {
  BRONZE:  { color: "from-amber-600 to-amber-400", icon: "fa-medal",  next: "ARGENT",  threshold: 3 },
  ARGENT:  { color: "from-gray-400 to-gray-300",   icon: "fa-medal",  next: "OR",       threshold: 10 },
  OR:      { color: "from-yellow-500 to-amber-300", icon: "fa-crown",  next: "PLATINE",  threshold: 25 },
  PLATINE: { color: "from-slate-500 to-slate-400",  icon: "fa-gem",    next: "DIAMANT",  threshold: 50 },
  DIAMANT: { color: "from-blue-400 to-cyan-400",    icon: "fa-gem",    threshold: 100 },
};

export default function ApporteurCommissionsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apporteur/profile")
      .then((r) => r.json())
      .then((data) => { if (data.profile) setStats(data.profile); })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const s = stats ?? { totalEarnings: 0, pendingEarnings: 0, paidEarnings: 0, totalReferrals: 0, level: "BRONZE" };
  const lvl = levelConfig[s.level] ?? levelConfig.BRONZE;
  const progressToNext = s.level === "DIAMANT" ? 100 : Math.round((s.totalReferrals / lvl.threshold) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Commissions & Revenus</h1>
          <p className="text-gray-500 text-sm mt-1">Consultez vos gains et l'historique de vos commissions.</p>
        </div>
        {s.pendingEarnings >= 30000 && (
          <Link
            href="/dashboard/apporteur/commissions/reclamer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <i className="fas fa-money-bill-transfer" />
            Réclamer mes commissions
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total gagné",  value: `${s.totalEarnings.toLocaleString()} F`,   icon: "fa-coins",        color: "from-accent to-blue-500" },
          { label: "À recevoir",   value: `${s.pendingEarnings.toLocaleString()} F`,  icon: "fa-clock",        color: "from-amber-400 to-orange-400" },
          { label: "Déjà versé",   value: `${s.paidEarnings.toLocaleString()} F`,     icon: "fa-check-circle", color: "from-secondary to-teal-400" },
          { label: "Conversions",  value: s.totalReferrals,                            icon: "fa-handshake",    color: "from-purple-500 to-accent" },
        ].map((card) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${card.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
              <i className={`fas ${card.icon}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="font-syne font-bold text-lg text-primary">{card.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Level card */}
      <div className={`bg-gradient-to-r ${lvl.color} rounded-2xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Votre niveau</p>
            <p className="font-syne font-black text-3xl mt-1">{s.level}</p>
            {lvl.next && (
              <p className="text-white/70 text-sm mt-1">
                {s.totalReferrals} / {lvl.threshold} conversions pour atteindre {lvl.next}
              </p>
            )}
          </div>
          <i className={`fas ${lvl.icon} text-5xl text-white/30`} />
        </div>
        {lvl.next && (
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all duration-700" style={{ width: `${Math.min(progressToNext, 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Commission history placeholder */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4">
          <i className="fas fa-list-ul mr-2 text-accent" />
          Historique des commissions
        </h2>
        <div className="text-center py-10 text-gray-400">
          <i className="fas fa-clock text-3xl mb-3 block" />
          <p className="text-sm">L'historique détaillé des commissions sera disponible prochainement.</p>
        </div>
      </div>

      {/* Payout info */}
      <div className="bg-accent/5 rounded-2xl p-5 text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p>
          <i className="fas fa-info-circle text-accent mr-2" />
          Réclamez vos commissions dès <strong>30 000 F</strong> de solde disponible.
          Versement par Mobile Money sous <strong>48h ouvrées</strong> après validation.
        </p>
        {s.pendingEarnings >= 30000 && (
          <Link href="/dashboard/apporteur/commissions/reclamer" className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:underline whitespace-nowrap">
            <i className="fas fa-arrow-right" />
            Faire une demande
          </Link>
        )}
      </div>
    </div>
  );
}
