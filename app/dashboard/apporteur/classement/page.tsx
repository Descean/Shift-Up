"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type Leader = {
  rank: number; name: string; level: string; conversions: number;
  earnings: number; avatar: string; isCurrentUser: boolean;
};

const levelColors: Record<string, string> = {
  BRONZE:  "from-amber-600 to-amber-400",
  ARGENT:  "from-gray-400 to-gray-300",
  OR:      "from-yellow-500 to-amber-300",
  PLATINE: "from-slate-500 to-slate-300",
  DIAMANT: "from-blue-400 to-cyan-400",
};

const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const rankIcons  = ["fa-trophy", "fa-medal", "fa-award"];

export default function ApporteurClassementPage() {
  const [leaderboard, setLeaderboard] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/apporteur/leaderboard")
      .then((r) => r.json())
      .then((data) => setLeaderboard(data.leaderboard ?? []))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const topThree = leaderboard.slice(0, 3);
  const rest     = leaderboard.slice(3);
  const me       = leaderboard.find((a) => a.isCurrentUser);
  const nextLevelMap: Record<string, string> = { BRONZE: "Argent", ARGENT: "Or", OR: "Platine", PLATINE: "Diamant" };
  const convNeeded: Record<string, number>   = { BRONZE: 3, ARGENT: 10, OR: 25, PLATINE: 50 };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary">Classement des Apporteurs</h1>
        <p className="text-gray-500 text-sm mt-1">Comparez vos performances et progressez vers les niveaux supérieurs.</p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400">
          <i className="fas fa-trophy text-3xl mb-3 block" />
          <p>Aucun apporteur enregistré pour le moment.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {topThree.length >= 3 && (
            <div className="bg-white rounded-2xl shadow-card p-6">
              <h2 className="font-syne font-bold text-primary mb-6 text-center"><i className="fas fa-trophy mr-2 text-yellow-500" />Top 3 du mois</h2>
              <div className="flex items-end justify-center gap-4">
                {/* 2nd */}
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 bg-gradient-to-br ${levelColors[topThree[1].level] ?? levelColors.BRONZE} rounded-full flex items-center justify-center text-white font-syne font-bold text-lg mb-2`}>{topThree[1].avatar}</div>
                  <p className="text-sm font-semibold text-primary text-center">{topThree[1].name}</p>
                  <p className="text-xs text-gray-400">{topThree[1].conversions} conversions</p>
                  <div className="mt-3 h-16 w-20 bg-gray-100 rounded-t-xl flex items-center justify-center"><span className="text-2xl font-syne font-black text-gray-400">2</span></div>
                </div>
                {/* 1st */}
                <div className="flex flex-col items-center">
                  <i className="fas fa-crown text-yellow-500 text-xl mb-1" />
                  <div className={`w-16 h-16 bg-gradient-to-br ${levelColors[topThree[0].level] ?? levelColors.BRONZE} rounded-full flex items-center justify-center text-white font-syne font-bold text-xl mb-2`}>{topThree[0].avatar}</div>
                  <p className="text-sm font-semibold text-primary text-center">{topThree[0].name}</p>
                  <p className="text-xs text-gray-400">{topThree[0].conversions} conversions</p>
                  <div className="mt-3 h-24 w-20 bg-yellow-50 rounded-t-xl flex items-center justify-center border-2 border-yellow-300"><span className="text-3xl font-syne font-black text-yellow-500">1</span></div>
                </div>
                {/* 3rd */}
                <div className="flex flex-col items-center">
                  <div className={`w-14 h-14 bg-gradient-to-br ${levelColors[topThree[2].level] ?? levelColors.BRONZE} rounded-full flex items-center justify-center text-white font-syne font-bold text-lg mb-2`}>{topThree[2].avatar}</div>
                  <p className="text-sm font-semibold text-primary text-center">{topThree[2].name}</p>
                  <p className="text-xs text-gray-400">{topThree[2].conversions} conversions</p>
                  <div className="mt-3 h-10 w-20 bg-amber-50 rounded-t-xl flex items-center justify-center"><span className="text-xl font-syne font-black text-amber-600">3</span></div>
                </div>
              </div>
            </div>
          )}

          {/* Full leaderboard */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <h2 className="font-syne font-bold text-primary mb-4">Classement complet</h2>
            <div className="space-y-3">
              {leaderboard.map((ap, i) => (
                <motion.div key={ap.rank} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${ap.isCurrentUser ? "bg-accent/5 ring-1 ring-accent/30" : "hover:bg-gray-50"}`}>
                  <div className="w-8 text-center flex-shrink-0">
                    {ap.rank <= 3 ? <i className={`fas ${rankIcons[ap.rank - 1]} ${rankColors[ap.rank - 1]}`} /> : <span className="text-gray-400 text-sm font-bold">{ap.rank}</span>}
                  </div>
                  <div className={`w-9 h-9 bg-gradient-to-br ${levelColors[ap.level] ?? levelColors.BRONZE} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>{ap.avatar}</div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${ap.isCurrentUser ? "text-accent" : "text-primary"}`}>{ap.name} {ap.isCurrentUser && <span className="text-xs font-normal">(vous)</span>}</p>
                    <p className="text-xs text-gray-400">Niveau {ap.level}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-bold text-primary">{ap.conversions}</p>
                    <p className="text-xs text-gray-400">conv.</p>
                  </div>
                  <div className="text-right flex-shrink-0 hidden sm:block">
                    <p className="text-sm font-bold text-accent">{ap.earnings.toLocaleString()} F</p>
                    <p className="text-xs text-gray-400">gains</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Motivation */}
          {me && nextLevelMap[me.level] && (
            <div className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-2xl p-5 text-center">
              <i className="fas fa-rocket text-accent text-2xl mb-2 block" />
              <p className="font-syne font-bold text-primary">Vous êtes {me.rank}ème !</p>
              <p className="text-sm text-gray-500 mt-1">
                Encore <strong>{Math.max(0, (convNeeded[me.level] ?? 0) - me.conversions)} conversions</strong> pour atteindre le niveau <strong>{nextLevelMap[me.level]}</strong>.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
