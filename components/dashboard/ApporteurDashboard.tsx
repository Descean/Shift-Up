"use client";

import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/Card";

const levels = [
  { name: "Bronze", icon: "fas fa-medal", color: "text-amber-700", min: 0, max: 5 },
  { name: "Argent", icon: "fas fa-medal", color: "text-gray-400", min: 5, max: 15 },
  { name: "Or", icon: "fas fa-medal", color: "text-yellow-500", min: 15, max: 30 },
  { name: "Platine", icon: "fas fa-gem", color: "text-cyan-500", min: 30, max: 60 },
  { name: "Diamant", icon: "fas fa-gem", color: "text-purple-500", min: 60, max: Infinity },
];

const recentReferrals = [
  { name: "Kossi A.", date: "12/11/2025", amount: "350 000", commission: "35 000", paid: true },
  { name: "Amina S.", date: "05/11/2025", amount: "1 500 000", commission: "150 000", paid: false },
  { name: "Pierre D.", date: "28/10/2025", amount: "450 000", commission: "45 000", paid: false },
];

interface Props {
  user?: { name?: string | null };
}

export default function ApporteurDashboard({ user }: Props) {
  const currentLevel = levels[1]; // Argent (exemple)
  const totalReferrals = 8;
  const nextLevelMin = currentLevel.max;

  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">
          Espace Apporteur — {user?.name}
        </h1>
        <p className="text-gray-500 text-sm">Suivez vos commissions et votre progression</p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Gains totaux" value="230 000 F" icon={<i className="fas fa-coins" />} color="secondary" trend="up" trendValue="2 ce mois" />
        <StatCard label="Affiliés actifs" value="8" icon={<i className="fas fa-users" />} color="accent" />
        <StatCard label="Gains en attente" value="195 000 F" icon={<i className="fas fa-clock" />} color="primary" />
        <StatCard label="Niveau actuel" value="Argent" icon={<i className="fas fa-medal text-gray-400" />} color="accent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Referrals table */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-syne font-bold text-lg text-primary mb-5">Mes affaires récentes</h2>
          <div className="space-y-3">
            {recentReferrals.map((r, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {r.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-primary">{r.name}</p>
                  <p className="text-gray-400 text-xs">{r.date}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Affaire : {r.amount} F</p>
                  <p className="text-sm font-bold text-secondary">Commission : +{r.commission} F</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${r.paid ? "bg-green-50 text-green-600" : "bg-amber-50 text-amber-600"}`}>
                  {r.paid ? "Versé" : "En attente"}
                </span>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Les gains sont versés automatiquement le 25 décembre de chaque année.
          </p>
        </div>

        {/* Level progression */}
        <div className="space-y-4">
          <div className="bg-primary rounded-2xl p-5">
            <h3 className="font-syne font-bold text-white mb-4">Classement trimestriel</h3>
            <div className="space-y-3">
              {levels.map((l, i) => (
                <div
                  key={l.name}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    l.name === currentLevel.name ? "bg-white/15" : "opacity-40"
                  }`}
                >
                  <i className={`${l.icon} ${l.color} text-lg`} />
                  <div className="flex-1">
                    <p className="text-white text-sm font-medium">{l.name}</p>
                    <p className="text-white/40 text-xs">
                      {l.max === Infinity ? `≥ ${l.min} affiliés` : `${l.min}–${l.max} affiliés`}
                    </p>
                  </div>
                  {l.name === currentLevel.name && (
                    <span className="text-accent text-xs font-bold">Actuel</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-3">Progression vers Or</h3>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Affiliés actifs</span>
              <span className="text-sm font-bold text-primary">{totalReferrals} / {nextLevelMin}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${(totalReferrals / nextLevelMin) * 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              Encore {nextLevelMin - totalReferrals} affiliés pour atteindre le niveau Or
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
