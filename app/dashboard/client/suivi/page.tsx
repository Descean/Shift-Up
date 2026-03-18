"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Phase = { id?: number; name?: string; title?: string; done: boolean; date?: string; description?: string; progress?: number };
type Project = {
  id: string;
  service: { title: string };
  status: string;
  globalProgress: number;
  createdAt: string;
  estimatedEndDate?: string;
  phases: Phase[];
};

export default function ClientSuiviPage() {
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"phases" | "activite">("phases");

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((data) => {
        const active = (data.prestations ?? []).find((p: any) =>
          ["EN_COURS","LIVRAISON","REVISION","EN_ATTENTE"].includes(p.status)
        );
        setProject(active ?? null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="space-y-4">
        <h1 className="font-syne font-black text-2xl text-primary">Suivi en Temps Réel</h1>
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400">
          <i className="fas fa-binoculars text-3xl mb-3 block" />
          <p className="font-medium">Aucune prestation active pour le moment.</p>
          <Link href="/services" className="mt-4 inline-block text-accent text-sm hover:underline">
            Découvrir nos services →
          </Link>
        </div>
      </div>
    );
  }

  const phases: Phase[] = Array.isArray(project.phases) ? project.phases : [];
  const doneCount = phases.filter((p) => p.done).length;

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
            <h2 className="font-syne font-bold text-primary text-xl mt-1">{project.service.title}</h2>
            <div className="flex flex-wrap gap-3 mt-2 text-xs text-gray-500">
              <span><i className="fas fa-calendar-alt mr-1" />Début : {new Date(project.createdAt).toLocaleDateString("fr-FR")}</span>
              {project.estimatedEndDate && (
                <span><i className="fas fa-flag-checkered mr-1" />Fin estimée : {new Date(project.estimatedEndDate).toLocaleDateString("fr-FR")}</span>
              )}
              <span><i className="fas fa-user-tie mr-1" />Équipe SHIFT UP</span>
            </div>
          </div>
          <div className="text-center bg-accent/5 rounded-2xl px-6 py-4 flex-shrink-0">
            <p className="text-4xl font-syne font-black text-accent">{project.globalProgress}%</p>
            <p className="text-xs text-gray-500 mt-1">Avancement</p>
          </div>
        </div>

        {/* Big progress bar */}
        <div className="mt-5">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span>{doneCount} phase{doneCount > 1 ? "s" : ""} terminée{doneCount > 1 ? "s" : ""} sur {phases.length}</span>
            <span className="text-accent font-semibold">{project.globalProgress}% complété</span>
          </div>
          <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${project.globalProgress}%` }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-accent to-secondary rounded-full relative"
            >
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-white font-bold">
                {project.globalProgress}%
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
              {phases.length === 0 && (
                <p className="text-center text-gray-400 text-sm py-8">Les phases seront renseignées par l'équipe SHIFT UP.</p>
              )}
              <div className="space-y-6">
                {phases.map((phase, i) => (
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
                        <p className="font-syne font-semibold text-primary">{phase.name ?? phase.title}</p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            phase.done
                              ? "bg-green-100 text-green-700"
                              : i === doneCount
                              ? "bg-accent/10 text-accent"
                              : "bg-gray-100 text-gray-400"
                          }`}
                        >
                          {phase.done ? (phase.date ?? "Terminée") : i === doneCount ? "En cours" : "À venir"}
                        </span>
                      </div>
                      {phase.description && <p className="text-sm text-gray-500 mt-1">{phase.description}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {tab === "activite" && (
            <div className="space-y-4">
              <p className="text-center text-gray-400 text-sm py-4">
                Le journal d'activité sera disponible prochainement.
              </p>
              {[].map((a: any, i: number) => (
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
