"use client";

import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";

const microTasks = [
  { id: "1", title: "Saisie de données produits", type: "DATA_ENTRY", reward: 5000, deadline: "20/11/2025", status: "DISPONIBLE" },
  { id: "2", title: "Rédaction article blog 800 mots", type: "REDACTION", reward: 15000, deadline: "22/11/2025", status: "DISPONIBLE" },
  { id: "3", title: "Recherche fournisseurs BTP", type: "RECHERCHE", reward: 8000, deadline: "25/11/2025", status: "EN_COURS" },
  { id: "4", title: "Test interface application web", type: "TEST_LOGICIEL", reward: 10000, deadline: "30/11/2025", status: "DISPONIBLE" },
];

const badges = [
  { icon: "fas fa-pen", label: "Rédacteur Junior", color: "text-blue-500", earned: true },
  { icon: "fas fa-database", label: "Data Analyst", color: "text-secondary", earned: true },
  { icon: "fas fa-laptop-code", label: "Testeur Web", color: "text-purple-500", earned: false },
  { icon: "fas fa-graduation-cap", label: "Apprenant Actif", color: "text-orange-500", earned: false },
];

interface Props {
  user?: { name?: string | null };
}

export default function EtudiantDashboard({ user }: Props) {
  return (
    <div className="space-y-6 max-w-6xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">
          Espace Étudiant — {user?.name}
        </h1>
        <p className="text-gray-500 text-sm">Apprenez, contribuez et développez vos compétences</p>
      </motion.div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard label="Tâches complétées" value="7" icon={<i className="fas fa-check-circle" />} color="secondary" trend="up" trendValue="3 ce mois" />
        <StatCard label="Gains accumulés" value="63 000 F" icon={<i className="fas fa-wallet" />} color="accent" />
        <StatCard label="Badges obtenus" value="2/4" icon={<i className="fas fa-award" />} color="primary" />
        <StatCard label="Cours terminés" value="5" icon={<i className="fas fa-graduation-cap" />} color="accent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Micro-tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne font-bold text-lg text-primary">Micro-tâches disponibles</h2>
            <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full">
              {microTasks.filter((t) => t.status === "DISPONIBLE").length} disponibles
            </span>
          </div>
          <div className="space-y-3">
            {microTasks.map((task) => {
              const typeColors: Record<string, string> = {
                DATA_ENTRY: "from-blue-500 to-accent",
                REDACTION: "from-purple-500 to-pink-500",
                RECHERCHE: "from-orange-400 to-yellow-400",
                TEST_LOGICIEL: "from-secondary to-teal-500",
              };
              const typeLabels: Record<string, string> = {
                DATA_ENTRY: "Saisie données",
                REDACTION: "Rédaction",
                RECHERCHE: "Recherche",
                TEST_LOGICIEL: "Test logiciel",
              };
              return (
                <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-accent/30 hover:bg-accent/2 transition-all cursor-pointer">
                  <div className={`w-10 h-10 bg-gradient-to-br ${typeColors[task.type]} rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}>
                    {typeLabels[task.type].charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-primary truncate">{task.title}</p>
                    <p className="text-gray-400 text-xs">
                      <span className="mr-3">{typeLabels[task.type]}</span>
                      <i className="fas fa-calendar text-xs mr-1" />
                      {task.deadline}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="font-bold text-secondary text-sm">{task.reward.toLocaleString()} F</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      task.status === "DISPONIBLE" ? "bg-green-50 text-green-600" :
                      task.status === "EN_COURS" ? "bg-accent/10 text-accent" :
                      "bg-gray-100 text-gray-500"
                    }`}>
                      {task.status === "DISPONIBLE" ? "Disponible" : task.status === "EN_COURS" ? "En cours" : task.status}
                    </span>
                  </div>
                  {task.status === "DISPONIBLE" && (
                    <button className="bg-accent text-white text-xs px-3 py-2 rounded-lg font-semibold hover:bg-accent/90 transition-colors flex-shrink-0">
                      Postuler
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Badges & Portfolio */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-4">Mes badges</h3>
            <div className="grid grid-cols-2 gap-3">
              {badges.map((b) => (
                <div
                  key={b.label}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl border-2 transition-all ${
                    b.earned ? "border-secondary/30 bg-secondary/5" : "border-gray-100 opacity-40"
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl ${b.earned ? "bg-gray-50" : "bg-gray-100"} flex items-center justify-center`}>
                    <i className={`${b.icon} ${b.color} text-lg`} />
                  </div>
                  <p className="text-xs font-medium text-gray-600 text-center leading-tight">{b.label}</p>
                  {b.earned && <span className="text-[10px] text-secondary font-bold">Obtenu</span>}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary rounded-2xl p-5">
            <h3 className="font-syne font-bold text-white mb-3">Passerelle emploi</h3>
            <p className="text-white/50 text-xs mb-4">
              Complétez 10 tâches et obtenez 3 badges pour accéder aux opportunités de stage et d'emploi chez SHIFT UP.
            </p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: "70%" }} />
            </div>
            <p className="text-white/40 text-xs mt-2">7/10 tâches complétées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
