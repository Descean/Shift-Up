"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

type TaskStatus = "DISPONIBLE" | "EN_COURS" | "SOUMIS" | "VALIDE" | "REFUSE";

interface MicroTask {
  id: string;
  title: string;
  description: string;
  reward: number;
  deadline: string;
  difficulty: "FACILE" | "MOYEN" | "DIFFICILE";
  status: TaskStatus;
  deliverable?: string;
  feedback?: string;
}

const statusStyle: Record<TaskStatus, string> = {
  DISPONIBLE: "bg-blue-50 text-blue-700",
  EN_COURS:   "bg-amber-50 text-amber-700",
  SOUMIS:     "bg-purple-50 text-purple-700",
  VALIDE:     "bg-green-50 text-green-700",
  REFUSE:     "bg-red-50 text-red-600",
};

const statusLabel: Record<TaskStatus, string> = {
  DISPONIBLE: "Disponible",
  EN_COURS:   "En cours",
  SOUMIS:     "Soumis",
  VALIDE:     "Validé ✓",
  REFUSE:     "Refusé",
};

const difficultyStyle: Record<string, string> = {
  FACILE:    "text-green-600 bg-green-50",
  MOYEN:     "text-amber-600 bg-amber-50",
  DIFFICILE: "text-red-600 bg-red-50",
};

function fmtDeadline(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function EtudiantTachesPage() {
  const [tasks, setTasks] = useState<MicroTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilter] = useState<TaskStatus | "TOUS">("TOUS");
  const [submitting, setSubmitting]     = useState<MicroTask | null>(null);
  const [deliverableUrl, setDeliverable] = useState("");
  const [saving, setSaving]             = useState(false);

  useEffect(() => {
    fetch("/api/micro-tasks")
      .then((r) => r.json())
      .then((data) => {
        setTasks((data.tasks ?? []).map((t: any) => ({
          ...t,
          difficulty: t.type === "AUTRE" ? "FACILE" : t.difficulty ?? "FACILE",
          deadline: fmtDeadline(t.deadline),
        })));
      })
      .finally(() => setLoading(false));
  }, []);

  const filtered   = tasks.filter((t) => filterStatus === "TOUS" || t.status === filterStatus);
  const totalEarned = tasks.filter((t) => t.status === "VALIDE").reduce((s, t) => s + t.reward, 0);

  async function takeTask(id: string) {
    try {
      const r = await fetch(`/api/micro-tasks/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assign: true }),
      });
      if (!r.ok) throw new Error();
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, status: "EN_COURS" } : t));
      toast.success("Tâche prise en charge !");
    } catch {
      toast.error("Erreur lors de la prise en charge.");
    }
  }

  async function submitTask() {
    if (!submitting || !deliverableUrl.trim()) return;
    setSaving(true);
    try {
      const r = await fetch(`/api/micro-tasks/${submitting.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "SOUMIS", deliverable: deliverableUrl }),
      });
      if (!r.ok) throw new Error();
      setTasks((prev) => prev.map((t) => t.id === submitting.id ? { ...t, status: "SOUMIS", deliverable: deliverableUrl } : t));
      toast.success("Livrable soumis avec succès !");
      setSubmitting(null);
      setDeliverable("");
    } catch {
      toast.error("Erreur lors de la soumission.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
      >
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Mes Micro-tâches</h1>
          <p className="text-gray-500 text-sm">Gagnez de l'expérience et des revenus</p>
        </div>
        <div className="bg-green-50 rounded-2xl px-5 py-3">
          <p className="text-xs text-gray-400">Total gagné</p>
          <p className="font-syne font-black text-xl text-green-700">
            {totalEarned.toLocaleString()} <span className="text-sm font-normal">FCFA</span>
          </p>
        </div>
      </motion.div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-2">
        {(["TOUS", "DISPONIBLE", "EN_COURS", "SOUMIS", "VALIDE", "REFUSE"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filterStatus === s ? "bg-accent text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
            }`}
          >
            {s === "TOUS" ? "Toutes" : statusLabel[s as TaskStatus]}
          </button>
        ))}
      </div>

      {/* Liste */}
      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
            {tasks.length === 0 ? "Aucune tâche disponible pour le moment." : "Aucune tâche dans cette catégorie."}
          </div>
        )}

        {filtered.map((task) => (
          <motion.div key={task.id} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5">
            <div className="flex flex-col sm:flex-row sm:items-start gap-4">
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${statusStyle[task.status]}`}>{statusLabel[task.status]}</span>
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${difficultyStyle[task.difficulty]}`}>{task.difficulty}</span>
                </div>
                <h3 className="font-syne font-bold text-primary mb-1">{task.title}</h3>
                <p className="text-sm text-gray-500 mb-3">{task.description}</p>

                {task.status === "REFUSE" && task.feedback && (
                  <div className="bg-red-50 border border-red-100 rounded-xl p-3 mb-3">
                    <p className="text-xs font-semibold text-red-600 mb-1"><i className="fas fa-circle-exclamation mr-1" />Retour de l'administrateur</p>
                    <p className="text-xs text-red-700">{task.feedback}</p>
                  </div>
                )}

                <div className="flex items-center gap-4 text-xs text-gray-400">
                  <span><i className="fas fa-calendar mr-1" />Deadline : {task.deadline}</span>
                  <span className="font-bold text-green-600"><i className="fas fa-coins mr-1" />{task.reward.toLocaleString()} FCFA</span>
                </div>
              </div>

              <div className="flex-shrink-0 flex flex-col gap-2 min-w-[120px]">
                {task.status === "DISPONIBLE" && (
                  <button onClick={() => takeTask(task.id)} className="bg-gradient-to-r from-accent to-secondary text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90">
                    <i className="fas fa-hand-pointer mr-1" />Prendre
                  </button>
                )}
                {(task.status === "EN_COURS" || task.status === "REFUSE") && (
                  <button onClick={() => { setSubmitting(task); setDeliverable(task.deliverable ?? ""); }}
                    className="bg-purple-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90">
                    <i className="fas fa-upload mr-1" />Soumettre
                  </button>
                )}
                {task.status === "SOUMIS" && <span className="text-xs text-purple-600 font-medium text-center"><i className="fas fa-clock mr-1" />En validation</span>}
                {task.status === "VALIDE"  && <span className="text-xs text-green-600 font-medium text-center"><i className="fas fa-circle-check mr-1" />Validé</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal soumission */}
      <AnimatePresence>
        {submitting && (
          <>
            <motion.div className="fixed inset-0 bg-black/40 z-40" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => !saving && setSubmitting(null)} />
            <motion.div className="fixed inset-0 flex items-center justify-center z-50 p-4" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
              <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-syne font-bold text-primary">Soumettre le livrable</h3>
                  <button onClick={() => setSubmitting(null)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-xmark" /></button>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-700">{submitting.title}</div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lien du livrable (GitHub, Google Drive, Figma, etc.)</label>
                  <input
                    value={deliverableUrl}
                    onChange={(e) => setDeliverable(e.target.value)}
                    placeholder="https://..."
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setSubmitting(null)} disabled={saving} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm font-medium text-gray-600">Annuler</button>
                  <button onClick={submitTask} disabled={saving || !deliverableUrl.trim()}
                    className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-60">
                    {saving ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi…</span> : "Envoyer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
