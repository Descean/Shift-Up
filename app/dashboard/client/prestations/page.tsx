"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Phase { id: string; title: string; status: string; progress: number; order: number; }
interface Livrable { id: string; title: string; type: string; url: string | null; isAvailable: boolean; }
interface QuoteItem { label: string; amount: number; }
interface Quote { items: QuoteItem[]; deposit: number; total: number; validity?: string; terms?: string; }
interface Prestation {
  id: string;
  service: { title: string } | null;
  sector: string | null;
  customService: string | null;
  brief: string | null;
  status: string;
  globalProgress: number;
  amount: number;
  amountPaid: number;
  quote: Quote | null;
  plan: { phases: { title: string; description: string; duration: string }[] } | null;
  attachments: string[];
  budget: string | null;
  deadline: string | null;
  company: string | null;
  createdAt: string;
  estimatedEndDate: string | null;
  prestationPhases: Phase[];
  livrables: Livrable[];
  payments: { status: string; amount: number }[];
}

/* ─── Config statuts ─────────────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; style: string; icon: string; dot: string }> = {
  EN_ATTENTE:          { label: "En attente",        style: "bg-amber-100 text-amber-700",  icon: "fa-clock",           dot: "bg-amber-400" },
  DEVIS_ENVOYE:        { label: "Devis disponible",  style: "bg-blue-100 text-blue-700",    icon: "fa-file-invoice",    dot: "bg-blue-500" },
  EN_ATTENTE_PAIEMENT: { label: "Attente paiement",  style: "bg-purple-100 text-purple-700",icon: "fa-credit-card",     dot: "bg-purple-500" },
  EN_COURS:            { label: "En cours",           style: "bg-cyan-100 text-cyan-700",    icon: "fa-spinner fa-spin", dot: "bg-cyan-500" },
  LIVRAISON:           { label: "Livrables dispo",   style: "bg-green-100 text-green-700",  icon: "fa-box-open",        dot: "bg-green-500" },
  REVISION:            { label: "En révision",       style: "bg-orange-100 text-orange-700",icon: "fa-rotate",          dot: "bg-orange-400" },
  TERMINEE:            { label: "Terminée",           style: "bg-gray-100 text-gray-600",   icon: "fa-check-circle",    dot: "bg-gray-400" },
  ANNULEE:             { label: "Annulée",            style: "bg-red-100 text-red-600",      icon: "fa-times-circle",    dot: "bg-red-400" },
};

const fmt = (d: string | null) => d ? new Date(d).toLocaleDateString("fr-FR") : "—";

/* ─── Composant ─────────────────────────────────────────────────────────── */
export default function ClientPrestationsPage() {
  const router = useRouter();
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading]         = useState(true);
  const [selected, setSelected]       = useState<string | null>(null);
  const [paying, setPaying]           = useState(false);

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((d) => setPrestations(d.prestations ?? []))
      .finally(() => setLoading(false));
  }, []);

  const active = prestations.filter((p) => !["TERMINEE", "ANNULEE"].includes(p.status));
  const past   = prestations.filter((p) =>  ["TERMINEE", "ANNULEE"].includes(p.status));
  const detail = prestations.find((p) => p.id === selected);

  function serviceName(p: Prestation) {
    return p.service?.title ?? p.customService ?? p.sector ?? "Prestation";
  }

  async function pay(prestationId: string, amount: number, label: string, isDeposit: boolean) {
    setPaying(true);
    const params = new URLSearchParams({ type: "service", prestationId, amount: String(amount), label: isDeposit ? `Acompte 40% — ${label}` : `Solde — ${label}` });
    router.push(`/paiement?${params.toString()}`);
  }

  if (loading) return <div className="flex items-center justify-center h-64"><span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Mes Prestations</h1>
          <p className="text-gray-500 text-sm mt-0.5">Suivez l&apos;avancement de vos projets SHIFT UP.</p>
        </div>
        <Link href="/dashboard/client/nouvelle-demande" className="bg-gradient-to-r from-accent to-secondary text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:opacity-90 transition-opacity flex items-center gap-2">
          <i className="fas fa-plus" />Nouvelle demande
        </Link>
      </div>

      {/* Prestations actives */}
      <section>
        <h2 className="font-syne font-bold text-primary mb-3 flex items-center gap-2 text-sm">
          <span className="w-2 h-2 bg-cyan-500 rounded-full" />En cours ({active.length})
        </h2>
        <div className="space-y-3">
          {active.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-10 text-center text-gray-400">
              <i className="fas fa-briefcase text-3xl mb-3 block" />
              <p className="font-medium">Aucune prestation en cours.</p>
              <Link href="/dashboard/client/nouvelle-demande" className="text-accent text-sm mt-2 inline-block hover:underline">
                Soumettre une demande →
              </Link>
            </div>
          ) : active.map((p, i) => (
            <PrestationCard key={p.id} p={p} index={i} name={serviceName(p)} onSelect={setSelected} selected={selected === p.id} />
          ))}
        </div>
      </section>

      {/* Historique */}
      {past.length > 0 && (
        <section>
          <h2 className="font-syne font-bold text-primary mb-3 flex items-center gap-2 text-sm">
            <span className="w-2 h-2 bg-gray-400 rounded-full" />Historique ({past.length})
          </h2>
          <div className="space-y-3">
            {past.map((p, i) => <PrestationCard key={p.id} p={p} index={i} name={serviceName(p)} onSelect={setSelected} selected={selected === p.id} />)}
          </div>
        </section>
      )}

      {/* Panneau détail */}
      <AnimatePresence>
        {detail && (
          <motion.div key={detail.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} className="bg-white rounded-2xl shadow-card overflow-hidden">
            {/* Header panneau */}
            <div className="bg-gradient-to-r from-primary to-primary/90 p-5 flex items-start justify-between">
              <div>
                <h3 className="font-syne font-bold text-white text-lg">{serviceName(detail)}</h3>
                <p className="text-white/60 text-xs mt-0.5">Demande du {fmt(detail.createdAt)}</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-white/60 hover:text-white"><i className="fas fa-times" /></button>
            </div>

            <div className="p-6 space-y-5">
              {/* Statut + progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <StatusBadge status={detail.status} />
                  <span className="text-sm font-bold text-primary">{detail.globalProgress}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${detail.globalProgress}%` }} transition={{ duration: 1 }} className="h-full bg-gradient-to-r from-accent to-secondary rounded-full" />
                </div>
              </div>

              {/* Brief */}
              {detail.brief && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Votre besoin</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 line-clamp-3">{detail.brief}</p>
                </div>
              )}

              {/* ── VUE DEVIS (status DEVIS_ENVOYE ou EN_ATTENTE_PAIEMENT) ── */}
              {(detail.status === "DEVIS_ENVOYE" || detail.status === "EN_ATTENTE_PAIEMENT") && detail.quote && (
                <div className="border-2 border-blue-200 rounded-2xl overflow-hidden">
                  <div className="bg-blue-50 px-5 py-3 flex items-center gap-2">
                    <i className="fas fa-file-invoice text-blue-600" />
                    <p className="font-syne font-bold text-blue-700 text-sm">Votre devis est prêt</p>
                  </div>
                  <div className="p-5 space-y-3">
                    {/* Lignes devis */}
                    <table className="w-full text-sm">
                      <tbody>
                        {detail.quote.items?.map((item, i) => (
                          <tr key={i} className="border-b border-gray-50">
                            <td className="py-2 text-gray-700">{item.label}</td>
                            <td className="py-2 text-right font-medium text-primary">{item.amount.toLocaleString()} XOF</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td className="pt-3 font-bold text-primary">Total</td>
                          <td className="pt-3 text-right font-black text-primary text-base">{detail.quote.total.toLocaleString()} XOF</td>
                        </tr>
                        <tr>
                          <td className="text-sm text-gray-500">Acompte pour démarrer (40%)</td>
                          <td className="text-right font-bold text-accent">{detail.quote.deposit.toLocaleString()} XOF</td>
                        </tr>
                      </tfoot>
                    </table>

                    {/* Clauses */}
                    {detail.quote.terms && (
                      <div className="bg-gray-50 rounded-xl p-3 text-xs text-gray-600 leading-relaxed">
                        <p className="font-semibold mb-1">Conditions :</p>
                        {detail.quote.terms}
                      </div>
                    )}
                    {detail.quote.validity && (
                      <p className="text-xs text-gray-400"><i className="fas fa-calendar-alt mr-1" />Validité du devis : {detail.quote.validity}</p>
                    )}

                    {/* Plan de réalisation */}
                    {detail.plan?.phases && detail.plan.phases.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Plan de réalisation</p>
                        <div className="space-y-2">
                          {detail.plan.phases.map((ph, i) => (
                            <div key={i} className="flex gap-3 items-start">
                              <div className="w-6 h-6 bg-accent/10 text-accent rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</div>
                              <div>
                                <p className="text-sm font-medium text-primary">{ph.title}</p>
                                <p className="text-xs text-gray-500">{ph.description} — <span className="text-accent">{ph.duration}</span></p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Bouton payer */}
                    <button
                      onClick={() => pay(detail.id, detail.quote!.deposit, serviceName(detail), true)}
                      disabled={paying}
                      className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-lock-open" />
                      Payer l&apos;acompte &amp; démarrer — {detail.quote.deposit.toLocaleString()} XOF
                    </button>
                  </div>
                </div>
              )}

              {/* Pièces jointes */}
              {detail.attachments.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fichiers joints</p>
                  <div className="flex flex-wrap gap-2">
                    {detail.attachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs transition-colors">
                        <i className="fas fa-file" />Fichier {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Livrables disponibles */}
              {detail.livrables.filter((l) => l.isAvailable).length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Livrables disponibles</p>
                  <div className="space-y-2">
                    {detail.livrables.filter((l) => l.isAvailable).map((l) => (
                      <a key={l.id} href={l.url ?? "#"} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-3 hover:bg-green-100 transition-colors">
                        <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                          <i className={`fas fa-${l.type === "PDF" ? "file-pdf" : l.type === "VIDEO" ? "video" : l.type === "CODE" ? "code" : "external-link-alt"} text-green-600 text-sm`} />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-green-800">{l.title}</p>
                          <p className="text-xs text-green-600">{l.type}</p>
                        </div>
                        <i className="fas fa-arrow-down text-green-600 text-xs" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Infos financières (EN_COURS et au-delà) */}
              {["EN_COURS", "LIVRAISON", "REVISION", "TERMINEE"].includes(detail.status) && detail.amount > 0 && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-bold text-primary text-sm">{detail.amount.toLocaleString()} F</p>
                  </div>
                  <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Payé</p>
                    <p className="font-bold text-green-600 text-sm">{detail.amountPaid.toLocaleString()} F</p>
                  </div>
                  <div className="bg-amber-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-gray-500">Reste</p>
                    <p className="font-bold text-amber-600 text-sm">{(detail.amount - detail.amountPaid).toLocaleString()} F</p>
                  </div>
                </div>
              )}

              {/* Solde à payer si EN_COURS */}
              {detail.status === "LIVRAISON" && detail.amount > detail.amountPaid && (
                <button
                  onClick={() => pay(detail.id, detail.amount - detail.amountPaid, serviceName(detail), false)}
                  disabled={paying}
                  className="w-full border-2 border-accent text-accent py-3 rounded-xl font-semibold text-sm hover:bg-accent/5 transition-colors flex items-center justify-center gap-2"
                >
                  <i className="fas fa-credit-card" />
                  Payer le solde — {(detail.amount - detail.amountPaid).toLocaleString()} XOF
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Sous-composants ────────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS[status] ?? { label: status, style: "bg-gray-100 text-gray-500", icon: "fa-circle", dot: "bg-gray-400" };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${cfg.style}`}>
      <i className={`fas ${cfg.icon} text-[10px]`} />{cfg.label}
    </span>
  );
}

function PrestationCard({ p, index, name, onSelect, selected }: { p: Prestation; index: number; name: string; onSelect: (id: string) => void; selected: boolean }) {
  const cfg = STATUS[p.status] ?? STATUS["EN_ATTENTE"];
  const hasDevis = p.status === "DEVIS_ENVOYE";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      onClick={() => onSelect(p.id)}
      className={`bg-white rounded-2xl shadow-card p-5 cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-accent" : ""} ${hasDevis ? "border-l-4 border-blue-500" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <p className="font-syne font-bold text-primary text-sm truncate">{name}</p>
            {hasDevis && <span className="text-[10px] bg-blue-100 text-blue-600 font-bold px-2 py-0.5 rounded-full animate-pulse">ACTION REQUISE</span>}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <StatusBadge status={p.status} />
            {p.budget && <span className="text-xs text-gray-400">{p.budget}</span>}
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          {p.globalProgress > 0 ? (
            <>
              <p className="text-sm font-bold text-primary">{p.globalProgress}%</p>
              <p className="text-xs text-gray-400">avancement</p>
            </>
          ) : (
            <p className="text-xs text-gray-400">Demande du<br />{new Date(p.createdAt).toLocaleDateString("fr-FR")}</p>
          )}
        </div>
      </div>
      {p.globalProgress > 0 && (
        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-secondary rounded-full" style={{ width: `${p.globalProgress}%` }} />
        </div>
      )}
      <p className="text-xs text-accent font-medium mt-2 ml-4">
        {hasDevis ? "Cliquez pour voir et accepter le devis →" : "Cliquer pour les détails →"}
      </p>
    </motion.div>
  );
}
