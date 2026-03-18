"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface PPhase {
  id: string; title: string; description: string | null;
  status: string; progress: number; order: number;
  startDate: string | null; endDate: string | null;
}
interface Livrable { id: string; title: string; type: string; url: string | null; isAvailable: boolean; }
interface Prestation {
  id: string;
  service: { title: string } | null;
  sector: string | null; customService: string | null;
  status: string; globalProgress: number;
  amount: number; amountPaid: number;
  createdAt: string; estimatedEndDate: string | null;
  prestationPhases: PPhase[];
  livrables: Livrable[];
}

const PHASE_STATUS = {
  PENDING:     { label: "À venir",   icon: "fa-circle",       cls: "text-gray-300 bg-white border-gray-200",       bar: "bg-gray-100" },
  IN_PROGRESS: { label: "En cours",  icon: "fa-spinner fa-spin", cls: "text-white bg-accent border-accent",        bar: "bg-accent"   },
  DONE:        { label: "Terminée",  icon: "fa-check",         cls: "text-white bg-green-500 border-green-500",     bar: "bg-green-500"},
};

const LIVRABLE_ICON: Record<string, string> = {
  PDF: "fa-file-pdf", VIDEO: "fa-video", CODE: "fa-code",
  DESIGN: "fa-image", ARCHIVE: "fa-file-zipper", LINK: "fa-external-link-alt",
};

export default function ClientSuiviPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [selected, setSelected]       = useState<string | null>(null);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((d) => {
        const active = (d.prestations ?? []).filter((p: Prestation) =>
          ["EN_COURS", "LIVRAISON", "REVISION"].includes(p.status)
        );
        setPrestations(active);
        if (active.length === 1) setSelected(active[0].id);
      })
      .finally(() => setLoading(false));

    // Polling toutes les 30s pour les mises à jour
    const poll = setInterval(() => {
      fetch("/api/prestations").then((r) => r.json()).then((d) => {
        const active = (d.prestations ?? []).filter((p: Prestation) =>
          ["EN_COURS", "LIVRAISON", "REVISION"].includes(p.status)
        );
        setPrestations(active);
      });
    }, 30_000);
    return () => clearInterval(poll);
  }, []);

  const project = prestations.find((p) => p.id === selected) ?? prestations[0] ?? null;

  if (loading) return <div className="flex items-center justify-center h-64"><span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Suivi en Temps Réel</h1>
          <p className="text-gray-500 text-sm mt-0.5">Avancement détaillé de vos projets actifs. <span className="text-accent font-medium">Mis à jour toutes les 30s.</span></p>
        </div>
      </div>

      {/* Sélecteur de projet si plusieurs */}
      {prestations.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {prestations.map((p) => (
            <button key={p.id} onClick={() => setSelected(p.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${selected === p.id ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-accent"}`}>
              {p.service?.title ?? p.customService ?? p.sector}
            </button>
          ))}
        </div>
      )}

      {!project ? (
        <div className="bg-white rounded-2xl shadow-card p-14 text-center text-gray-400">
          <i className="fas fa-binoculars text-4xl mb-3 block" />
          <p className="font-medium text-gray-500">Aucun projet actif pour le moment.</p>
          <p className="text-sm mt-1">Vos projets apparaîtront ici une fois le paiement de l&apos;acompte confirmé.</p>
          <Link href="/dashboard/client/nouvelle-demande" className="mt-4 inline-block text-accent text-sm hover:underline font-medium">
            Soumettre une demande →
          </Link>
        </div>
      ) : (
        <>
          {/* ── Carte projet ──────────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide mb-1">Projet en cours</p>
                <h2 className="font-syne font-bold text-primary text-xl">{project.service?.title ?? project.customService ?? project.sector}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-gray-500">
                  <span><i className="fas fa-calendar-alt mr-1" />Démarrage : {new Date(project.createdAt).toLocaleDateString("fr-FR")}</span>
                  {project.estimatedEndDate && <span><i className="fas fa-flag-checkered mr-1" />Fin estimée : {new Date(project.estimatedEndDate).toLocaleDateString("fr-FR")}</span>}
                </div>
              </div>
              <div className="flex-shrink-0 text-center bg-gradient-to-br from-accent/10 to-secondary/10 rounded-2xl px-6 py-4">
                <p className="text-4xl font-syne font-black text-accent">{project.globalProgress}%</p>
                <p className="text-xs text-gray-500 mt-0.5">Complété</p>
              </div>
            </div>

            {/* Barre de progression */}
            <div>
              <div className="flex justify-between text-xs text-gray-500 mb-2">
                <span>{project.prestationPhases.filter((p) => p.status === "DONE").length} / {project.prestationPhases.length} phases terminées</span>
                <span className="text-accent font-semibold">{project.globalProgress}%</span>
              </div>
              <div className="h-4 bg-gray-100 rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${project.globalProgress}%` }} transition={{ duration: 1.2, ease: "easeOut" }}
                  className="h-full bg-gradient-to-r from-accent to-secondary rounded-full relative flex items-center justify-end pr-2">
                  {project.globalProgress > 10 && <span className="text-[9px] text-white font-bold">{project.globalProgress}%</span>}
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* ── Vue A : Timeline des jalons ───────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-card overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-syne font-bold text-primary flex items-center gap-2">
                <i className="fas fa-route text-accent" />Jalons du projet
              </h3>
              <span className="text-xs text-gray-400">Mis à jour par SHIFT UP</span>
            </div>
            <div className="p-6">
              {project.prestationPhases.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">
                  <i className="fas fa-hourglass-half text-2xl mb-2 block" />
                  Les phases seront définies par l&apos;équipe SHIFT UP.
                </div>
              ) : (
                <div className="relative">
                  {/* Ligne verticale */}
                  <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-gray-100 z-0" />
                  <div className="space-y-4">
                    {project.prestationPhases.map((phase, i) => {
                      const cfg = PHASE_STATUS[phase.status as keyof typeof PHASE_STATUS] ?? PHASE_STATUS.PENDING;
                      return (
                        <motion.div key={phase.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                          className="flex gap-4 relative z-10">
                          {/* Icône phase */}
                          <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${cfg.cls}`}>
                            <i className={`fas ${cfg.icon} text-sm`} />
                          </div>
                          {/* Contenu */}
                          <div className={`flex-1 bg-gray-50 rounded-xl p-4 ${phase.status === "PENDING" ? "opacity-60" : ""}`}>
                            <div className="flex items-center justify-between gap-2 mb-1">
                              <p className="font-syne font-bold text-primary text-sm">{phase.title}</p>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${phase.status === "DONE" ? "bg-green-100 text-green-700" : phase.status === "IN_PROGRESS" ? "bg-accent/10 text-accent" : "bg-gray-100 text-gray-400"}`}>
                                {cfg.label}
                              </span>
                            </div>
                            {phase.description && <p className="text-xs text-gray-500 mb-2">{phase.description}</p>}
                            {/* Barre de progression de la phase */}
                            {phase.status !== "PENDING" && (
                              <div>
                                <div className="h-1.5 bg-white rounded-full overflow-hidden mb-1">
                                  <motion.div animate={{ width: `${phase.progress}%` }} transition={{ duration: 0.8 }}
                                    className={`h-full rounded-full ${cfg.bar}`} />
                                </div>
                                <div className="flex justify-between text-[10px] text-gray-400">
                                  <span>{phase.startDate ? `Début : ${new Date(phase.startDate).toLocaleDateString("fr-FR")}` : ""}</span>
                                  <span className="font-semibold">{phase.progress}%</span>
                                </div>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ── Livrables disponibles ─────────────────────────────────────── */}
          {project.livrables.some((l) => l.isAvailable) && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                  <i className="fas fa-box-open text-green-600 text-sm" />
                </div>
                <h3 className="font-syne font-bold text-primary">Livrables disponibles</h3>
              </div>
              <div className="p-6 space-y-3">
                {project.livrables.filter((l) => l.isAvailable).map((l) => (
                  <a key={l.id} href={l.url ?? "#"} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 bg-green-50 border border-green-100 rounded-xl hover:bg-green-100 transition-colors group">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                      <i className={`fas ${LIVRABLE_ICON[l.type] ?? "fa-file"} text-green-600`} />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-green-900 text-sm">{l.title}</p>
                      <p className="text-xs text-green-600 mt-0.5">{l.type}</p>
                    </div>
                    <i className="fas fa-arrow-down text-green-600 group-hover:translate-y-0.5 transition-transform" />
                  </a>
                ))}
              </div>
            </motion.div>
          )}

          {/* ── Infos financières ─────────────────────────────────────────── */}
          {project.amount > 0 && (
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Total convenu", value: project.amount, color: "text-primary", bg: "bg-white" },
                { label: "Montant payé",  value: project.amountPaid, color: "text-green-600", bg: "bg-green-50" },
                { label: "Solde restant", value: project.amount - project.amountPaid, color: "text-amber-600", bg: "bg-amber-50" },
              ].map(({ label, value, color, bg }) => (
                <div key={label} className={`${bg} rounded-2xl shadow-card p-4 text-center`}>
                  <p className="text-xs text-gray-500 mb-1">{label}</p>
                  <p className={`font-syne font-black text-base ${color}`}>{value.toLocaleString()} F</p>
                </div>
              ))}
            </div>
          )}

          {/* ── CTA message ───────────────────────────────────────────────── */}
          <div className="bg-gradient-to-r from-accent/5 to-secondary/5 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-syne font-bold text-primary">Une question sur votre projet ?</p>
              <p className="text-sm text-gray-500">Notre équipe vous répond sous 24h.</p>
            </div>
            <Link href="/dashboard/client/messages"
              className="bg-accent text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0">
              <i className="fas fa-comments" />Envoyer un message
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
