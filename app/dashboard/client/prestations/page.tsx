"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import toast from "react-hot-toast";

import { televerser } from "@/lib/televerser";
import { bilanPieces, lireMontage } from "@/lib/montage";
import { PiecesClient, ResumeDossier } from "@/components/prestations/Pieces";
import SuiviDossier, { BadgeSuivi } from "@/components/prestations/Suivi";
/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Phase { id: string; title: string; status: string; progress: number; order: number; }
interface Livrable { id: string; title: string; type: string; url: string | null; isAvailable: boolean; verrouille?: boolean; observation?: string | null; phase?: { id: string; title: string; order: number } | null; }
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
  customFields?: unknown;
}

/* ─── Config statuts ─────────────────────────────────────────────────────── */
const STATUS: Record<string, { label: string; style: string; icon: string; dot: string }> = {
  EN_ATTENTE:          { label: "En attente",        style: "bg-amber-100 text-amber-700",  icon: "fa-clock",           dot: "bg-amber-400" },
  DEVIS_ENVOYE:        { label: "Devis disponible",  style: "bg-accent-100 text-accent-700",    icon: "fa-file-invoice",    dot: "bg-accent-500" },
  EN_ATTENTE_PAIEMENT: { label: "Attente paiement",  style: "bg-accent-100 text-accent-700",icon: "fa-credit-card",     dot: "bg-accent-500" },
  EN_COURS:            { label: "En cours",           style: "bg-accent-100 text-accent-700",    icon: "fa-spinner fa-spin", dot: "bg-accent-500" },
  LIVRAISON:           { label: "Livrables dispo",   style: "bg-green-100 text-green-700",  icon: "fa-box-open",        dot: "bg-green-500" },
  REVISION:            { label: "En révision",       style: "bg-secondary-100 text-secondary-700",icon: "fa-rotate",          dot: "bg-secondary-400" },
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

  const [agit, setAgit]               = useState<string | null>(null);

  function charger() {
    return fetch("/api/prestations")
      .then((r) => r.json())
      .then((d) => setPrestations(d.prestations ?? []))
      .finally(() => setLoading(false));
  }
  useEffect(() => { charger(); }, []);

  /** Décision du client (devis, livraison). Renvoie true si elle a été enregistrée. */
  async function decider(id: string, action: string, commentaire?: string) {
    setAgit(action);
    try {
      const r = await fetch(`/api/prestations/${id}/decision`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, commentaire: commentaire ?? null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Action impossible."); return false; }
      if (action !== "accepter_devis") toast.success(d.message ?? "C'est noté.");
      await charger();
      return true;
    } catch { toast.error("Erreur réseau."); return false; }
    finally { setAgit(null); }
  }

  async function accepterEtPayer(p: Prestation) {
    if (p.status === "DEVIS_ENVOYE" && !(await decider(p.id, "accepter_devis"))) return;
    pay(p.id, p.quote!.deposit, serviceName(p), true);
  }

  const active = prestations.filter((p) => !["TERMINEE", "ANNULEE"].includes(p.status));
  const past   = prestations.filter((p) =>  ["TERMINEE", "ANNULEE"].includes(p.status));
  const detail = prestations.find((p) => p.id === selected);

  function serviceName(p: Prestation) {
    return p.service?.title ?? p.customService ?? p.sector ?? "Prestation";
  }

  async function pay(prestationId: string, amount: number, label: string, isDeposit: boolean) {
    setPaying(true);
    const params = new URLSearchParams({ type: "service", prestationId, amount: String(amount), label: isDeposit ? `Acompte 60% — ${label}` : `Solde — ${label}`, ...(isDeposit ? {} : { step: "solde" }) });
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
          <span className="w-2 h-2 bg-accent-500 rounded-full" />En cours ({active.length})
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

              {/* Montage de dossier : appel d'offres + pièces à fournir */}
              {(() => {
                const m = lireMontage(detail.customFields);
                if (!m.dossier && m.pieces.length === 0) return null;
                return (
                  <div className="space-y-5">
                    {m.dossier && <ResumeDossier dossier={m.dossier} depot={m.depot} resultat={m.resultat} />}
                    {m.dossier && (
                      <SuiviDossier key={`suivi-${detail.id}`} prestationId={detail.id} dossier={m.dossier} depot={m.depot} resultat={m.resultat} close={detail.status === "ANNULEE"} onMaj={charger} />
                    )}
                    {m.pieces.length > 0 && (
                      <PiecesClient key={detail.id} prestationId={detail.id} pieces={m.pieces} close={["TERMINEE", "ANNULEE"].includes(detail.status)} onMaj={charger} />
                    )}
                  </div>
                );
              })()}

              {/* Brief */}
              {detail.brief && !lireMontage(detail.customFields).dossier && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Votre besoin</p>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3 line-clamp-3">{detail.brief}</p>
                </div>
              )}

              {/* Phases de réalisation */}
              {detail.prestationPhases.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
                    <i className="fas fa-tasks mr-1.5" />Phases du projet
                  </p>
                  <div className="space-y-2">
                    {detail.prestationPhases.map((ph) => (
                      <div key={ph.id} className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          ph.status === "DONE"        ? "bg-green-100 text-green-600" :
                          ph.status === "IN_PROGRESS" ? "bg-accent-100 text-accent-600" :
                          "bg-gray-100 text-gray-400"
                        }`}>
                          <i className={`fas fa-${ph.status === "DONE" ? "check" : ph.status === "IN_PROGRESS" ? "circle-dot" : "clock"} text-[9px]`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <p className={`text-sm ${ph.status === "DONE" ? "text-gray-400 line-through" : ph.status === "IN_PROGRESS" ? "font-semibold text-primary" : "text-gray-500"}`}>
                              {ph.title}
                            </p>
                            <span className="text-xs text-gray-400 flex-shrink-0">{ph.progress}%</span>
                          </div>
                          {ph.status !== "PENDING" && (
                            <div className="h-1 bg-gray-100 rounded-full mt-1.5">
                              <div
                                className={`h-full rounded-full transition-all ${ph.status === "DONE" ? "bg-green-400" : "bg-gradient-to-r from-accent to-secondary"}`}
                                style={{ width: `${ph.progress}%` }}
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── VUE DEVIS (status DEVIS_ENVOYE ou EN_ATTENTE_PAIEMENT) ── */}
              {(detail.status === "DEVIS_ENVOYE" || detail.status === "EN_ATTENTE_PAIEMENT") && detail.quote && (
                <div className="border-2 border-accent-200 rounded-2xl overflow-hidden">
                  <div className="bg-accent-50 px-5 py-3 flex items-center gap-2">
                    <i className="fas fa-file-invoice text-accent-600" />
                    <p className="font-syne font-bold text-accent-700 text-sm">Votre devis est prêt</p>
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
                          <td className="text-sm text-gray-500">Acompte pour démarrer (60%)</td>
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
                      onClick={() => accepterEtPayer(detail)}
                      disabled={paying || agit !== null}
                      className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                      <i className="fas fa-lock-open" />
                      {detail.status === "DEVIS_ENVOYE" ? "Accepter le devis et payer l'acompte" : "Payer l'acompte et démarrer"} — {detail.quote.deposit.toLocaleString()} XOF
                    </button>
                    <ChoixDevis onDecider={(action, c) => decider(detail.id, action, c)} occupe={agit !== null} />
                  </div>
                </div>
              )}

              {/* Pièces jointes (hors pièces du dossier, déjà listées plus haut) */}
              {(() => {
                const mm = lireMontage(detail.customFields);
                const dejaListes = new Set([
                  ...mm.pieces.flatMap((x) => x.fichiers.map((f) => f.url)),
                  ...[mm.depot?.recepisse?.url, mm.resultat?.document?.url].filter((u): u is string => Boolean(u)),
                ]);
                const autres = detail.attachments.filter((u) => !dejaListes.has(u));
                return autres.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Fichiers joints</p>
                  <div className="flex flex-wrap gap-2">
                    {autres.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1.5 rounded-lg text-xs transition-colors">
                        <i className="fas fa-file" />Fichier {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
                );
              })()}

              {/* Livrables disponibles */}
              {detail.livrables.filter((l) => l.isAvailable).length > 0 && (
                <LivrablesSection livrables={detail.livrables.filter((l) => l.isAvailable)} prestationId={detail.id} />
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

              {/* Solde (une fois l'acompte payé) : il ouvre le téléchargement des livrables */}
              {["EN_COURS", "LIVRAISON", "REVISION"].includes(detail.status) && detail.amountPaid > 0 && detail.amount > detail.amountPaid && (
                <button
                  onClick={() => pay(detail.id, detail.amount - detail.amountPaid, serviceName(detail), false)}
                  disabled={paying}
                  className={`w-full py-3 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 ${detail.status === "EN_COURS" ? "border-2 border-accent text-accent hover:bg-accent/5" : "bg-gradient-to-r from-accent to-secondary text-white hover:opacity-90"}`}
                >
                  <i className="fas fa-credit-card" />
                  Payer le solde — {(detail.amount - detail.amountPaid).toLocaleString()} XOF
                </button>
              )}

              {/* Validation de la livraison */}
              {["LIVRAISON", "REVISION"].includes(detail.status) && (
                <ChoixLivraison
                  statut={detail.status}
                  solde={detail.amount > 0 && detail.amountPaid >= detail.amount - 1}
                  occupe={agit !== null}
                  onDecider={(action, c) => decider(detail.id, action, c)}
                />
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

/* ─── Livrables + Observations ───────────────────────────────────────────── */
function LivrablesSection({ livrables, prestationId }: { livrables: Livrable[]; prestationId: string }) {
  const [obs, setObs] = useState<Record<string, string>>({});
  const [sending, setSending] = useState<string | null>(null);
  const [recording, setRecording] = useState<string | null>(null); // livrableId en cours d'enregistrement
  const [voiceUrls, setVoiceUrls] = useState<Record<string, string>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const mediaRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const typeIcon: Record<string, string> = { PDF: "file-pdf", VIDEO: "video", CODE: "code", DESIGN: "pen-nib", ARCHIVE: "file-zipper", LINK: "external-link-alt" };

  async function toggleRecording(livrableId: string) {
    if (recording === livrableId) {
      // Stop
      mediaRef.current?.stop();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      chunksRef.current = [];
      mr.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data); };
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setRecording(null);
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const file = new File([blob], `voicenote-${Date.now()}.webm`, { type: "audio/webm" });
        setUploading(livrableId);
        try {
          const { url } = await televerser(file);
          setVoiceUrls((prev) => ({ ...prev, [livrableId]: url }));
          toast.success("Note vocale enregistrée !");
        } catch {
          toast.error("Erreur lors de l'envoi de la note vocale.");
        } finally {
          setUploading(null);
        }
      };
      mr.start();
      mediaRef.current = mr;
      setRecording(livrableId);
    } catch {
      toast.error("Microphone inaccessible. Vérifiez les permissions.");
    }
  }

  async function sendObservation(livrableId: string) {
    const text = obs[livrableId]?.trim() ?? "";
    const voiceNoteUrl = voiceUrls[livrableId] ?? null;
    if (!text && !voiceNoteUrl) return;
    setSending(livrableId);
    try {
      const res = await fetch(`/api/prestations/${prestationId}/observation`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ livrableId, observation: text, voiceNoteUrl }),
      });
      if (res.ok) {
        toast.success("Observation envoyée à l'équipe SHIFT UP !");
        setObs((prev) => ({ ...prev, [livrableId]: "" }));
        setVoiceUrls((prev) => { const n = { ...prev }; delete n[livrableId]; return n; });
      } else {
        toast.error("Erreur lors de l'envoi.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setSending(null);
    }
  }

  // Grouper par phase (les livrables sans phase vont dans "Sans phase")
  const grouped: { phaseId: string | null; phaseTitle: string | null; phaseOrder: number; items: Livrable[] }[] = [];
  for (const l of livrables) {
    const key = l.phase?.id ?? null;
    const existing = grouped.find((g) => g.phaseId === key);
    if (existing) {
      existing.items.push(l);
    } else {
      grouped.push({ phaseId: key, phaseTitle: l.phase?.title ?? null, phaseOrder: l.phase?.order ?? 999, items: [l] });
    }
  }
  grouped.sort((a, b) => a.phaseOrder - b.phaseOrder);

  return (
    <div>
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
        <i className="fas fa-box-open mr-1.5" />Livrables disponibles
      </p>
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.phaseId ?? "no-phase"}>
            {group.phaseTitle && (
              <p className="text-xs font-semibold text-accent mb-1.5 flex items-center gap-1">
                <i className="fas fa-layer-group text-[10px]" />{group.phaseTitle}
              </p>
            )}
            <div className="space-y-3">
        {group.items.map((l) => (
          <div key={l.id} className={`${l.verrouille ? "bg-gray-50 border-gray-200" : "bg-green-50 border-green-200"} border rounded-xl overflow-hidden`}>
            {l.verrouille ? (
              <div className="flex items-center gap-3 p-3">
                <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-lock text-gray-500 text-sm" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700">{l.title}</p>
                  <p className="text-xs text-gray-500">Téléchargeable après le règlement du solde</p>
                </div>
              </div>
            ) : (
            <a href={l.url ?? "#"} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-3 hover:bg-green-100 transition-colors">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <i className={`fas fa-${l.type === "APERCU" ? "eye" : (typeIcon[l.type] ?? "file")} text-green-600 text-sm`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-green-800">{l.title}</p>
                <p className="text-xs text-green-600">{l.type === "APERCU" ? "Aperçu provisoire, pour relecture" : l.type}</p>
              </div>
              <i className="fas fa-arrow-up-right-from-square text-green-600 text-xs" />
            </a>
            )}
            {/* Observation */}
            <div className="px-3 pb-3 border-t border-green-200 pt-2 space-y-2">
              {l.observation && (
                <p className="text-xs text-gray-500 italic">
                  <i className="fas fa-comment mr-1" />Votre dernière observation : {l.observation}
                </p>
              )}
              <textarea
                rows={2}
                placeholder="Ajouter une observation ou retour sur ce livrable…"
                value={obs[l.id] ?? ""}
                onChange={(e) => setObs((prev) => ({ ...prev, [l.id]: e.target.value }))}
                className="w-full text-xs border border-green-200 rounded-lg px-3 py-2 focus:outline-none focus:border-accent resize-none bg-white"
              />
              {/* Voice note status */}
              {uploading === l.id && (
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <span className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Upload de la note vocale…
                </div>
              )}
              {voiceUrls[l.id] && (
                <div className="flex items-center gap-2 text-xs text-green-700 bg-green-100 rounded-lg px-3 py-1.5">
                  <i className="fas fa-check-circle" />
                  Note vocale prête
                  <button onClick={() => setVoiceUrls((prev) => { const n = { ...prev }; delete n[l.id]; return n; })}
                    className="ml-auto text-red-400 hover:text-red-600">
                    <i className="fas fa-times" />
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                {/* Mic button */}
                <button
                  onClick={() => toggleRecording(l.id)}
                  disabled={uploading === l.id}
                  title={recording === l.id ? "Arrêter l'enregistrement" : "Démarrer une note vocale"}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                    recording === l.id
                      ? "bg-red-500 text-white animate-pulse"
                      : voiceUrls[l.id]
                      ? "bg-green-200 text-green-700"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  } disabled:opacity-40`}
                >
                  <i className={`fas fa-${recording === l.id ? "stop" : "microphone"} text-xs`} />
                </button>
                {/* Send button */}
                <button
                  onClick={() => sendObservation(l.id)}
                  disabled={(!obs[l.id]?.trim() && !voiceUrls[l.id]) || sending === l.id}
                  className="flex-1 h-9 bg-accent rounded-lg flex items-center justify-center text-white hover:opacity-90 disabled:opacity-40 gap-1.5 text-xs font-medium"
                >
                  {sending === l.id
                    ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <><i className="fas fa-paper-plane text-xs" />Envoyer</>}
                </button>
              </div>
            </div>
          </div>
        ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ─── Choix sur le devis : modifier / refuser ───────────────────────────── */
function ChoixDevis({ onDecider, occupe }: { onDecider: (action: string, commentaire?: string) => Promise<boolean>; occupe: boolean }) {
  const [mode, setMode] = useState<null | "modifier" | "refuser">(null);
  const [texte, setTexte] = useState("");
  return (
    <div className="space-y-2">
      {mode === null && (
        <div className="flex gap-2">
          <button onClick={() => setMode("modifier")} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
            <i className="fas fa-pen mr-1.5" />Demander une modification
          </button>
          <button onClick={() => setMode("refuser")} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-500 hover:bg-gray-50">
            <i className="fas fa-xmark mr-1.5" />Refuser le devis
          </button>
        </div>
      )}
      {mode === "modifier" && (
        <div className="space-y-2">
          <textarea rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Que faut-il changer ? (prix, contenu, délai…)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setMode(null)} className="flex-1 border border-gray-200 rounded-xl py-2 text-xs text-gray-600">Annuler</button>
            <button disabled={occupe || !texte.trim()} onClick={async () => { if (await onDecider("modifier_devis", texte)) { setMode(null); setTexte(""); } }}
              className="flex-1 bg-primary text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-50">Envoyer la demande</button>
          </div>
        </div>
      )}
      {mode === "refuser" && (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <p className="text-xs text-gray-600">Confirmez-vous le refus du devis ? La demande sera close.</p>
          <textarea rows={2} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Motif (facultatif)"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none bg-white" />
          <div className="flex gap-2">
            <button onClick={() => setMode(null)} className="flex-1 border border-gray-200 rounded-xl py-2 text-xs text-gray-600 bg-white">Annuler</button>
            <button disabled={occupe} onClick={async () => { if (await onDecider("refuser_devis", texte)) setMode(null); }}
              className="flex-1 bg-gray-700 text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-50">Oui, refuser</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── Validation de la livraison / demande de révision ─────────────────── */
function ChoixLivraison({ statut, solde, occupe, onDecider }: { statut: string; solde: boolean; occupe: boolean; onDecider: (action: string, commentaire?: string) => Promise<boolean> }) {
  const [revision, setRevision] = useState(false);
  const [texte, setTexte] = useState("");
  return (
    <div className="border border-gray-100 rounded-2xl p-4 space-y-3">
      <p className="text-sm font-semibold text-primary">
        {statut === "REVISION" ? "Révision en cours" : "Votre avis sur la livraison"}
      </p>
      {statut === "REVISION" && <p className="text-xs text-gray-500">Nous reprenons les points signalés. Vous serez prévenu dès que la nouvelle version sera prête.</p>}
      {!revision && (
        <div className="flex flex-col sm:flex-row gap-2">
          <button disabled={occupe || !solde} onClick={() => onDecider("valider_livraison")}
            className="flex-1 bg-green-600 text-white rounded-xl py-2.5 text-xs font-semibold hover:bg-green-700 disabled:opacity-50">
            <i className="fas fa-circle-check mr-1.5" />Valider la livraison
          </button>
          {statut === "LIVRAISON" && (
            <button disabled={occupe} onClick={() => setRevision(true)} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <i className="fas fa-rotate mr-1.5" />Demander une révision
            </button>
          )}
        </div>
      )}
      {!solde && !revision && <p className="text-xs text-gray-400">La validation est possible une fois le solde réglé.</p>}
      {revision && (
        <div className="space-y-2">
          <textarea rows={3} value={texte} onChange={(e) => setTexte(e.target.value)} placeholder="Points à corriger ou à compléter"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
          <div className="flex gap-2">
            <button onClick={() => setRevision(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-xs text-gray-600">Annuler</button>
            <button disabled={occupe || !texte.trim()} onClick={async () => { if (await onDecider("demander_revision", texte)) { setRevision(false); setTexte(""); } }}
              className="flex-1 bg-primary text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-50">Envoyer</button>
          </div>
        </div>
      )}
    </div>
  );
}

function PrestationCard({ p, index, name, onSelect, selected }: { p: Prestation; index: number; name: string; onSelect: (id: string) => void; selected: boolean }) {
  const cfg = STATUS[p.status] ?? STATUS["EN_ATTENTE"];
  const hasDevis = p.status === "DEVIS_ENVOYE" || p.status === "LIVRAISON";
  const m = lireMontage(p.customFields);
  const enAttente = m.pieces.length ? bilanPieces(m.pieces).attendues : 0;
  const ouverte = !["TERMINEE", "ANNULEE"].includes(p.status);
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.04 }}
      onClick={() => onSelect(p.id)}
      className={`bg-white rounded-2xl shadow-card p-5 cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-accent" : ""} ${hasDevis ? "border-l-4 border-accent-500" : ""}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot}`} />
            <p className="font-syne font-bold text-primary text-sm truncate">{name}</p>
            {hasDevis && <span className="text-[10px] bg-accent-100 text-accent-600 font-bold px-2 py-0.5 rounded-full animate-pulse">ACTION REQUISE</span>}
          </div>
          <div className="flex items-center gap-3 ml-4">
            <StatusBadge status={p.status} />
            {p.budget && <span className="text-xs text-gray-400">{p.budget}</span>}
            {m.dossier && p.status !== "ANNULEE" && <BadgeSuivi dossier={m.dossier} depot={m.depot} resultat={m.resultat} />}
          </div>
          {ouverte && enAttente > 0 && !m.depot && (
            <p className="text-xs text-primary mt-1.5 ml-4"><i className="fas fa-folder-open mr-1 text-accent" />{enAttente} pièce(s) à fournir</p>
          )}
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
        {p.status === "DEVIS_ENVOYE" ? "Cliquez pour voir et accepter le devis →" : p.status === "LIVRAISON" ? "Livraison prête : cliquez pour la valider →" : "Cliquer pour les détails →"}
      </p>
    </motion.div>
  );
}
