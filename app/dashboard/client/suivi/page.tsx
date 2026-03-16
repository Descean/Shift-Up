"use client";

import { useState } from "react";
import { motion } from "framer-motion";

const mockProject = {
  id: "1",
  service: "Identité Visuelle & Branding",
  status: "EN_COURS",
  progress: 65,
  startDate: "05/01/2026",
  estimatedEnd: "05/03/2026",
  assignedTo: "Équipe SHIFT UP",
  phases: [
    {
      id: 1,
      name: "Brief & Stratégie",
      done: true,
      date: "06/01/2026",
      description: "Analyse de vos besoins, de votre cible et de votre positionnement.",
    },
    {
      id: 2,
      name: "Moodboard & Concepts",
      done: true,
      date: "14/01/2026",
      description: "Présentation de 3 univers visuels pour validation.",
    },
    {
      id: 3,
      name: "Design Logo",
      done: false,
      date: "En cours",
      description: "Création du logotype principal, variantes et déclinaisons couleur.",
    },
    {
      id: 4,
      name: "Charte Graphique",
      done: false,
      date: "—",
      description: "Typographies, palette de couleurs, règles d'usage, icônes.",
    },
    {
      id: 5,
      name: "Livraison Finale",
      done: false,
      date: "~05/03/2026",
      description: "Remise des fichiers sources (AI, PDF, PNG) et du guide de marque.",
    },
  ],
  activity: [
    { date: "14/01/2026 à 10:22", actor: "SHIFT UP", message: "Moodboard validé — passage à la phase Design Logo." },
    { date: "12/01/2026 à 15:44", actor: "Vous", message: "Moodboard N°2 approuvé avec commentaires." },
    { date: "10/01/2026 à 09:00", actor: "SHIFT UP", message: "3 moodboards envoyés pour validation." },
    { date: "06/01/2026 à 11:30", actor: "SHIFT UP", message: "Brief validé. Démarrage de la phase Moodboard." },
    { date: "05/01/2026 à 14:00", actor: "Vous", message: "Commande confirmée et acompte de 40% reçu." },
  ],
};

export default function ClientSuiviPage() {
  const [tab, setTab] = useState<"phases" | "activite">("phases");
  const doneCount = mockProject.phases.filter((p) => p.done).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary">Suivi en Temps Réel</h1>
        <p className="text-gray-500 text-sm mt-1">Suivez l'avancement détaillé de votre projet.</p>
      </div>

      {/* Project header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl shadow-card p-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Projet actif</p>
            <h2 className="font-syne font-bold text-primary text-xl mt-1">{mockProject.service}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span><i className="fas fa-calendar-alt mr-1" />Début : {mockProject.startDate}</span>
              <span><i className="fas fa-flag-checkered mr-1" />Fin estimée : {mockProject.estimatedEnd}</span>
              <span><i className="fas fa-user-tie mr-1" />{mockProject.assignedTo}</span>
            </div>
          </div>
          <div className="text-center bg-accent/5 rounded-2xl px-6 py-4 flex-shrink-0">
            <p className="text-4xl font-syne font-black text-accent">{mockProject.progress}%</p>
            <p className="text-xs text-gray-500 mt-1">Avancement</p>
          </div>
        </div>

        {/* Big progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{doneCount} phase{doneCount > 1 ? "s" : ""} terminée{doneCount > 1 ? "s" : ""} sur {mockProject.phases.length}</span>
            <span className="text-accent font-semibold">{mockProject.progress}% complété</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${mockProject.progress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-accent to-secondary rounded-full relative"
            >
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">
                {mockProject.progress}%
              </span>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: "phases", label: "Phases du projet", icon: "fa-tasks" },
            { key: "activite", label: "Journal d'activité", icon: "fa-list-ul" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key as "phases" | "activite")}
              className={`flex-1 py-4 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
                tab === t.key
                  ? "text-accent border-b-2 border-accent bg-accent/5"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              <i className={`fas ${t.icon}`} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-6">
          {tab === "phases" && (
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-100" />
              <div className="space-y-6">
                {mockProject.phases.map((phase, i) => (
                  <motion.div
                    key={phase.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08 }}
                    className="flex gap-5 pl-10 relative"
                  >
                    {/* Node */}
                    <div
                      className={`absolute left-0 w-8 h-8 rounded-full flex items-center justify-center border-2 flex-shrink-0 z-10 ${
                        phase.done
                          ? "bg-green-500 border-green-500"
                          : i === doneCount
                          ? "bg-accent border-accent animate-pulse"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      {phase.done ? (
                        <i className="fas fa-check text-white text-xs" />
                      ) : i === doneCount ? (
                        <i className="fas fa-spinner fa-spin text-white text-xs" />
                      ) : (
                        <span className="text-xs text-gray-400 font-bold">{i + 1}</span>
                      )}
                    </div>

                    {/* Content */}
                    <div className={`flex-1 pb-2 ${!phase.done && i !== doneCount ? "opacity-50" : ""}`}>
                      <div className="flex items-center justify-between">
                        <p className="font-syne font-semibold text-primary">{phase.name}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            phase.done
                              ? "bg-green-100 text-green-700"
                              : i === doneCount
                              ? "bg-accent/10 text-accent"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {phase.done ? phase.date : i === doneCount ? "En cours" : "À venir"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {tab === "activite" && (
            <div className="space-y-4">
              {mockProject.activity.map((a, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="flex gap-4"
                >
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs ${
                      a.actor === "Vous"
                        ? "bg-accent/10 text-accent"
                        : "bg-secondary/10 text-secondary"
                    }`}
                  >
                    <i className={`fas ${a.actor === "Vous" ? "fa-user" : "fa-building"}`} />
                  </div>
                  <div className="flex-1 border-b border-gray-50 pb-4">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-primary">{a.actor}</span>
                      <span className="text-xs text-gray-400">{a.date}</span>
                    </div>
                    <p className="text-sm text-gray-600">{a.message}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Contact CTA */}
      <div className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <p className="font-syne font-bold text-primary">Une question sur votre projet ?</p>
          <p className="text-sm text-gray-500">Notre équipe vous répond sous 24h.</p>
        </div>
        <a
          href="/dashboard/client/messages"
          className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2 flex-shrink-0"
        >
          <i className="fas fa-comments" />
          Envoyer un message
        </a>
      </div>
    </div>
  );
}
