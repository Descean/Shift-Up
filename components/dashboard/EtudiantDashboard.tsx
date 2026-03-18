"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { StatCard } from "@/components/ui/Card";

type MicroTask = {
  id: string;
  title: string;
  type: string;
  reward: number;
  deadline: string;
  status: string;
};

interface Props {
  user?: { name?: string | null };
}

const typeColors: Record<string, string> = {
  DATA_ENTRY:    "from-blue-500 to-accent",
  REDACTION:     "from-purple-500 to-pink-500",
  RECHERCHE:     "from-orange-400 to-yellow-400",
  TEST_LOGICIEL: "from-secondary to-teal-500",
  AUTRE:         "from-gray-400 to-gray-500",
};

const typeLabels: Record<string, string> = {
  DATA_ENTRY:    "Saisie données",
  REDACTION:     "Rédaction",
  RECHERCHE:     "Recherche",
  TEST_LOGICIEL: "Test logiciel",
  AUTRE:         "Autre",
};

export default function EtudiantDashboard({ user }: Props) {
  const [tasks, setTasks]           = useState<MicroTask[]>([]);
  const [completed, setCompleted]   = useState(0);
  const [earnings, setEarnings]     = useState(0);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    fetch("/api/micro-tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks(data.tasks ?? []);
        setCompleted(data.completedCount ?? 0);
        setEarnings(data.totalEarnings ?? 0);
      })
      .finally(() => setLoading(false));
  }, []);

  const available = tasks.filter((t) => t.status === "DISPONIBLE");

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
        <StatCard label="Tâches complétées" value={String(completed)} icon={<i className="fas fa-check-circle" />} color="secondary" trend="up" />
        <StatCard label="Gains accumulés" value={`${earnings.toLocaleString()} F`} icon={<i className="fas fa-wallet" />} color="accent" />
        <StatCard label="Tâches disponibles" value={String(available.length)} icon={<i className="fas fa-list-check" />} color="primary" />
        <StatCard label="En cours" value={String(tasks.filter((t) => t.status === "EN_COURS").length)} icon={<i className="fas fa-spinner" />} color="accent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Micro-tasks */}
        <div className="lg:col-span-2 bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-syne font-bold text-lg text-primary">Micro-tâches disponibles</h2>
            <span className="bg-accent/10 text-accent text-xs font-semibold px-3 py-1 rounded-full">
              {available.length} disponibles
            </span>
          </div>
          {loading && (
            <div className="flex justify-center py-8">
              <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!loading && tasks.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">Aucune tâche disponible pour le moment.</p>
          )}
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div key={task.id} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-accent/30 transition-all">
                <div className={`w-10 h-10 bg-gradient-to-br ${typeColors[task.type] ?? "from-gray-400 to-gray-500"} rounded-xl flex items-center justify-center flex-shrink-0 text-white text-xs font-bold`}>
                  {(typeLabels[task.type] ?? "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm text-primary truncate">{task.title}</p>
                  <p className="text-gray-400 text-xs">
                    <span className="mr-3">{typeLabels[task.type] ?? task.type}</span>
                    <i className="fas fa-calendar text-xs mr-1" />
                    {new Date(task.deadline).toLocaleDateString("fr-FR")}
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
              </div>
            ))}
          </div>
        </div>

        {/* Progression */}
        <div className="space-y-5">
          <div className="bg-primary rounded-2xl p-5">
            <h3 className="font-syne font-bold text-white mb-3">Passerelle emploi</h3>
            <p className="text-white/50 text-xs mb-4">
              Complétez 10 tâches pour accéder aux opportunités de stage et d'emploi chez SHIFT UP.
            </p>
            <div className="progress-bar">
              <div className="progress-fill" style={{ width: `${Math.min((completed / 10) * 100, 100)}%` }} />
            </div>
            <p className="text-white/40 text-xs mt-2">{completed}/10 tâches complétées</p>
          </div>

          <div className="bg-white rounded-2xl shadow-card p-5">
            <h3 className="font-syne font-bold text-primary mb-3">Accès rapides</h3>
            <div className="space-y-2 text-sm">
              <a href="/dashboard/etudiant/taches" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                <i className="fas fa-tasks text-accent w-4" />Toutes les tâches
              </a>
              <a href="/dashboard/etudiant/ressources" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                <i className="fas fa-book text-accent w-4" />Ressources & cours
              </a>
              <a href="/dashboard/etudiant/portfolio" className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 text-gray-600 transition-colors">
                <i className="fas fa-folder text-accent w-4" />Mon portfolio
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
