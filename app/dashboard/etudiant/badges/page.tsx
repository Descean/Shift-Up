"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  unlocked: boolean;
  unlockedAt?: string;
  requirement: string;
}

export default function EtudiantBadgesPage() {
  const [badges, setBadges]   = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/etudiant/badges")
      .then((r) => r.json())
      .then((data) => setBadges(data.badges ?? []))
      .finally(() => setLoading(false));
  }, []);

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount    = badges.length;
  const progress      = totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Mes Badges</h1>
        <p className="text-gray-500 text-sm">Vos récompenses et accomplissements</p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">Progression — {unlockedCount}/{totalCount} badges débloqués</p>
          <span className="font-syne font-bold text-accent">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <motion.div className="h-3 rounded-full bg-gradient-to-r from-accent to-secondary"
            initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.8, ease: "easeOut" }} />
        </div>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge, i) => (
          <motion.div key={badge.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
            className={`bg-white rounded-2xl shadow-card p-5 flex flex-col items-center text-center transition-all ${badge.unlocked ? "" : "opacity-50 grayscale"}`}>
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-4 ${badge.unlocked ? "shadow-lg" : ""}`}>
              {badge.unlocked
                ? <i className={`fas ${badge.icon} text-white text-2xl`} />
                : <i className="fas fa-lock text-white text-xl" />}
            </div>
            <h3 className="font-syne font-bold text-primary text-sm mb-1">{badge.title}</h3>
            <p className="text-xs text-gray-500 mb-3">{badge.description}</p>
            {badge.unlocked ? (
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                <i className="fas fa-check mr-1" />Obtenu
              </span>
            ) : (
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                <i className="fas fa-lock mr-1" />{badge.requirement}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
