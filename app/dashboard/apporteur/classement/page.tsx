"use client";

import { motion } from "framer-motion";

const leaderboard = [
  { rank: 1, name: "Rodrigue A.", level: "OR", conversions: 24, earnings: 380000, avatar: "RA" },
  { rank: 2, name: "Fatou M.", level: "ARGENT", conversions: 17, earnings: 215000, avatar: "FM" },
  { rank: 3, name: "Koffi B.", level: "ARGENT", conversions: 12, earnings: 158000, avatar: "KB" },
  { rank: 4, name: "Vous", level: "ARGENT", conversions: 7, earnings: 115000, avatar: "ME", isMe: true },
  { rank: 5, name: "Sonia D.", level: "BRONZE", conversions: 5, earnings: 67000, avatar: "SD" },
  { rank: 6, name: "Alexis N.", level: "BRONZE", conversions: 4, earnings: 52000, avatar: "AN" },
  { rank: 7, name: "Prisca K.", level: "BRONZE", conversions: 3, earnings: 34000, avatar: "PK" },
  { rank: 8, name: "Désiré V.", level: "BRONZE", conversions: 2, earnings: 22000, avatar: "DV" },
];

const levelColors: Record<string, string> = {
  BRONZE: "from-amber-600 to-amber-400",
  ARGENT: "from-gray-400 to-gray-300",
  OR: "from-yellow-500 to-amber-300",
  PLATINE: "from-slate-500 to-slate-300",
  DIAMANT: "from-blue-400 to-cyan-400",
};

const rankColors = ["text-yellow-500", "text-gray-400", "text-amber-600"];
const rankIcons = ["fa-trophy", "fa-medal", "fa-award"];

export default function ApporteurClassementPage() {
  const topThree = leaderboard.slice(0, 3);
  const rest = leaderboard.slice(3);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary">Classement des Apporteurs</h1>
        <p className="text-gray-500 text-sm mt-1">
          Comparez vos performances et progressez vers les niveaux supérieurs.
        </p>
      </div>

      {/* Podium */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-6 text-center">
          <i className="fas fa-trophy mr-2 text-yellow-500" />Top 3 du mois
        </h2>
        <div className="flex items-end justify-center gap-4">
          {/* 2nd */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-gray-400 to-gray-300 rounded-full flex items-center justify-center text-white font-syne font-bold text-lg mb-2">
              {topThree[1].avatar}
            </div>
            <p className="text-sm font-semibold text-primary text-center">{topThree[1].name}</p>
            <p className="text-xs text-gray-400">{topThree[1].conversions} conversions</p>
            <div className="mt-3 h-16 w-20 bg-gray-100 rounded-t-xl flex items-center justify-center">
              <span className="text-2xl font-syne font-black text-gray-400">2</span>
            </div>
          </div>
          {/* 1st */}
          <div className="flex flex-col items-center">
            <i className="fas fa-crown text-yellow-500 text-xl mb-1" />
            <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-amber-300 rounded-full flex items-center justify-center text-white font-syne font-bold text-xl mb-2">
              {topThree[0].avatar}
            </div>
            <p className="text-sm font-semibold text-primary text-center">{topThree[0].name}</p>
            <p className="text-xs text-gray-400">{topThree[0].conversions} conversions</p>
            <div className="mt-3 h-24 w-20 bg-yellow-50 rounded-t-xl flex items-center justify-center border-2 border-yellow-300">
              <span className="text-3xl font-syne font-black text-yellow-500">1</span>
            </div>
          </div>
          {/* 3rd */}
          <div className="flex flex-col items-center">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-600 to-amber-400 rounded-full flex items-center justify-center text-white font-syne font-bold text-lg mb-2">
              {topThree[2].avatar}
            </div>
            <p className="text-sm font-semibold text-primary text-center">{topThree[2].name}</p>
            <p className="text-xs text-gray-400">{topThree[2].conversions} conversions</p>
            <div className="mt-3 h-10 w-20 bg-amber-50 rounded-t-xl flex items-center justify-center">
              <span className="text-xl font-syne font-black text-amber-600">3</span>
            </div>
          </div>
        </div>
      </div>

      {/* Full leaderboard */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4">Classement complet</h2>
        <div className="space-y-3">
          {leaderboard.map((ap, i) => (
            <motion.div
              key={ap.rank}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${
                ap.isMe ? "bg-accent/5 ring-1 ring-accent/30" : "hover:bg-gray-50"
              }`}
            >
              {/* Rank */}
              <div className="w-8 text-center flex-shrink-0">
                {ap.rank <= 3 ? (
                  <i className={`fas ${rankIcons[ap.rank - 1]} ${rankColors[ap.rank - 1]}`} />
                ) : (
                  <span className="text-gray-400 text-sm font-bold">{ap.rank}</span>
                )}
              </div>

              {/* Avatar */}
              <div className={`w-9 h-9 bg-gradient-to-br ${levelColors[ap.level]} rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                {ap.avatar}
              </div>

              {/* Name */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${ap.isMe ? "text-accent" : "text-primary"}`}>
                  {ap.name} {ap.isMe && <span className="text-xs font-normal">(vous)</span>}
                </p>
                <p className="text-xs text-gray-400">Niveau {ap.level}</p>
              </div>

              {/* Stats */}
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
      <div className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-2xl p-5 text-center">
        <i className="fas fa-rocket text-accent text-2xl mb-2 block" />
        <p className="font-syne font-bold text-primary">Vous êtes 4ème ce mois-ci !</p>
        <p className="text-sm text-gray-500 mt-1">
          Encore <strong>5 conversions</strong> pour décrocher la médaille d'<strong>Or</strong> et doubler vos avantages.
        </p>
      </div>
    </div>
  );
}
