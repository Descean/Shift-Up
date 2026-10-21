"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { StatCard } from "@/components/ui/Card";

const levels = [
  { name: "Bronze", icon: "fas fa-medal", color: "text-amber-700", min: 0, max: 5 },
  { name: "Argent", icon: "fas fa-medal", color: "text-gray-400", min: 5, max: 15 },
  { name: "Or", icon: "fas fa-medal", color: "text-secondary-500", min: 15, max: 30 },
  { name: "Platine", icon: "fas fa-gem", color: "text-accent-500", min: 30, max: 60 },
  { name: "Diamant", icon: "fas fa-gem", color: "text-accent-500", min: 60, max: Infinity },
];

type Profile = {
  totalEarnings: number;
  pendingEarnings: number;
  totalReferrals: number;
  affiliationCode: string;
};

interface Props {
  user?: { name?: string | null };
}

export default function ApporteurDashboard({ user }: Props) {
  const [profile, setProfile] = useState<Profile | null>(null);

  useEffect(() => {
    fetch("/api/apporteur/profile")
      .then((r) => r.json())
      .then((data) => setProfile(data.profile))
      .catch(() => {});
  }, []);

  const totalReferrals = profile?.totalReferrals ?? 0;
  const currentLevel = levels.findLast((l) => totalReferrals >= l.min) ?? levels[0];
  const nextLevel = levels[levels.indexOf(currentLevel) + 1];
  const nextLevelMin = nextLevel?.min ?? currentLevel.max;

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
        <StatCard label="Gains totaux" value={`${(profile?.totalEarnings ?? 0).toLocaleString()} F`} icon={<i className="fas fa-coins" />} color="secondary" trend="up" />
        <StatCard label="Affiliés" value={String(totalReferrals)} icon={<i className="fas fa-users" />} color="accent" />
        <StatCard label="Gains en attente" value={`${(profile?.pendingEarnings ?? 0).toLocaleString()} F`} icon={<i className="fas fa-clock" />} color="primary" />
        <StatCard label="Niveau actuel" value={currentLevel.name} icon={<i className={`${currentLevel.icon} ${currentLevel.color}`} />} color="accent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Accès rapides */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <h2 className="font-syne font-bold text-lg text-primary mb-5">Mes commissions & actions</h2>
          <div className="space-y-3">
            <Link href="/dashboard/apporteur/commissions" className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center text-white flex-shrink-0">
                <i className="fas fa-coins text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-primary">Voir mes commissions</p>
                <p className="text-gray-400 text-xs">Détail de toutes vos commissions</p>
              </div>
              <span className="text-accent font-bold text-sm">{(profile?.pendingEarnings ?? 0).toLocaleString()} F</span>
            </Link>
            <Link href="/dashboard/apporteur/commissions/reclamer" className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-mobile-screen-button text-green-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-primary">Réclamer mes commissions</p>
                <p className="text-gray-400 text-xs">Versement Mobile Money (min. 30 000 F)</p>
              </div>
              <i className="fas fa-arrow-right text-gray-300" />
            </Link>
            <Link href="/dashboard/apporteur/campagnes" className="flex items-center gap-4 p-4 rounded-xl hover:bg-gray-50 transition-colors border border-gray-100">
              <div className="w-10 h-10 bg-accent-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <i className="fas fa-bullhorn text-accent-600 text-sm" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm text-primary">Mes campagnes</p>
                <p className="text-gray-400 text-xs">Gérer vos liens de parrainage</p>
              </div>
              <i className="fas fa-arrow-right text-gray-300" />
            </Link>
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">
            Les versements sont traités sous 48h ouvrées après validation.
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
                    <span className="text-accent-200 text-xs font-bold">Actuel</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-3">Progression vers {nextLevel?.name ?? "Diamant"}</h3>
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-500">Affiliés</span>
              <span className="text-sm font-bold text-primary">{totalReferrals} / {nextLevelMin}</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${nextLevelMin > 0 ? Math.min((totalReferrals / nextLevelMin) * 100, 100) : 100}%` }}
              />
            </div>
            <p className="text-xs text-gray-400 mt-2">
              {nextLevel
                ? `Encore ${Math.max(nextLevelMin - totalReferrals, 0)} affiliés pour le niveau ${nextLevel.name}`
                : "Niveau maximum atteint !"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
