"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { televerser } from "@/lib/televerser";
// ─── Types ────────────────────────────────────────────────────────────────────

type PrestationStatus =
  | "EN_ATTENTE"
  | "DEVIS_ENVOYE"
  | "EN_ATTENTE_PAIEMENT"
  | "EN_COURS"
  | "LIVRAISON"
  | "REVISION"
  | "TERMINEE"
  | "ANNULEE";

interface PrestationPhase {
  id: string;
  title: string;
  description: string | null;
  status: string;
  progress: number;
  order: number;
}

interface Livrable {
  id: string;
  title: string;
  type: string;
  url: string | null;
  isAvailable: boolean;
  phase?: { id: string; title: string; order: number } | null;
}

interface QuoteItem {
  label: string;
  amount: number;
}

interface Quote {
  items: QuoteItem[];
  deposit: number;
  total: number;
  validity?: string;
  terms?: string;
}

interface Prestation {
  id: string;
  client: { id: string; name: string; email: string };
  service: { title: string; domain: string } | null;
  sector: string | null;
  customService: string | null;
  brief: string | null;
  budget: string | null;
  deadline: string | null;
  company: string | null;
  phone: string | null;
  attachments: string[];
  status: string;
  globalProgress: number;
  amount: number;
  amountPaid: number;
  quote: Quote | null;
  plan: { phases: { title: string; description: string; duration: string }[] } | null;
  adminNote: string | null;
  createdAt: string;
  estimatedEndDate: string | null;
  prestationPhases: PrestationPhase[];
  livrables: Livrable[];
  payments: { status: string; amount: number }[];
}

// ─── Status config ────────────────────────────────────────────────────────────

const statusLabel: Record<PrestationStatus, string> = {
  EN_ATTENTE: "En attente",
  DEVIS_ENVOYE: "Devis envoyé",
  EN_ATTENTE_PAIEMENT: "Attente paiement",
  EN_COURS: "En cours",
  LIVRAISON: "Livraison",
  REVISION: "Révision",
  TERMINEE: "Terminée",
  ANNULEE: "Annulée",
};

const statusBadge: Record<PrestationStatus, string> = {
  EN_ATTENTE: "bg-amber-100 text-amber-700 border border-amber-200",
  DEVIS_ENVOYE: "bg-accent-100 text-accent-700 border border-accent-200",
  EN_ATTENTE_PAIEMENT: "bg-accent-100 text-accent-700 border border-accent-200",
  EN_COURS: "bg-accent-100 text-accent-700 border border-accent-200",
  LIVRAISON: "bg-green-100 text-green-700 border border-green-200",
  REVISION: "bg-secondary-100 text-secondary-700 border border-secondary-200",
  TERMINEE: "bg-gray-100 text-gray-600 border border-gray-200",
  ANNULEE: "bg-red-100 text-red-600 border border-red-200",
};

const statusDot: Record<PrestationStatus, string> = {
  EN_ATTENTE: "bg-amber-400",
  DEVIS_ENVOYE: "bg-accent-500",
  EN_ATTENTE_PAIEMENT: "bg-accent-500",
  EN_COURS: "bg-accent-500",
  LIVRAISON: "bg-green-500",
  REVISION: "bg-secondary-500",
  TERMINEE: "bg-gray-400",
  ANNULEE: "bg-red-500",
};

/** Transitions autorisées par statut courant */
const statusTransitions: Record<PrestationStatus, PrestationStatus[]> = {
  EN_ATTENTE: ["DEVIS_ENVOYE", "ANNULEE"],
  DEVIS_ENVOYE: ["EN_ATTENTE_PAIEMENT", "EN_ATTENTE", "ANNULEE"],
  EN_ATTENTE_PAIEMENT: ["EN_COURS", "ANNULEE"],
  EN_COURS: ["LIVRAISON", "REVISION", "ANNULEE"],
  LIVRAISON: ["TERMINEE", "REVISION", "EN_COURS"],
  REVISION: ["EN_COURS", "LIVRAISON", "ANNULEE"],
  TERMINEE: [],
  ANNULEE: [],
};

const livrableTypes = ["PDF", "LINK", "VIDEO", "CODE", "DESIGN", "ARCHIVE"];

function progressBarColor(p: number): string {
  if (p === 100) return "bg-green-500";
  if (p >= 60) return "bg-accent-500";
  if (p >= 30) return "bg-amber-400";
  return "bg-gray-300";
}

function serviceLabel(p: Prestation): string {
  if (p.service) return p.service.title;
  if (p.customService) return p.customService;
  if (p.sector) return p.sector;
  return "—";
}

// ─── Spinner ──────────────────────────────────────────────────────────────────

function Spinner({ sm }: { sm?: boolean }) {
  return (
    <span
      className={`inline-block border-2 border-accent border-t-transparent rounded-full animate-spin ${sm ? "w-4 h-4" : "w-6 h-6"}`}
    />
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const s = status as PrestationStatus;
  const isPulsing = s === "DEVIS_ENVOYE";
  return (
    <span
      className={`relative inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${statusBadge[s] ?? "bg-gray-100 text-gray-500"}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${statusDot[s] ?? "bg-gray-400"} ${isPulsing ? "animate-pulse" : ""}`}
      />
      {statusLabel[s] ?? s}
    </span>
  );
}

// ─── Phase status label ───────────────────────────────────────────────────────

function phaseStatusLabel(s: string): string {
  if (s === "DONE") return "Terminée";
  if (s === "IN_PROGRESS") return "En cours";
  return "En attente";
}

// ─── Tab "Devis & Plan" ───────────────────────────────────────────────────────

function TabDevis({
  prestation,
  onRefresh,
}: {
  prestation: Prestation;
  onRefresh: () => void;
}) {
  const isReadOnly =
    prestation.status !== "EN_ATTENTE" && prestation.status !== "DEVIS_ENVOYE";
  const hasSentQuote = prestation.status === "DEVIS_ENVOYE" && prestation.quote;

  const defaultItems: QuoteItem[] = prestation.quote?.items ?? [
    { label: "", amount: 0 },
  ];
  const defaultPhases =
    prestation.plan?.phases ??
    prestation.service
      ? []
      : [];

  const [items, setItems] = useState<QuoteItem[]>(defaultItems);
  const [validity, setValidity] = useState(prestation.quote?.validity ?? "7 jours");
  const [terms, setTerms] = useState(prestation.quote?.terms ?? "");
  const [planPhases, setPlanPhases] = useState<
    { title: string; description: string; duration: string }[]
  >(prestation.plan?.phases ?? []);
  const [editMode, setEditMode] = useState(!hasSentQuote);
  const [sending, setSending] = useState(false);

  const total = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const deposit = Math.round(total * 0.6);

  function addItem() {
    setItems((prev) => [...prev, { label: "", amount: 0 }]);
  }

  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateItem(idx: number, field: keyof QuoteItem, value: string | number) {
    setItems((prev) =>
      prev.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    );
  }

  function addPlanPhase() {
    setPlanPhases((prev) => [...prev, { title: "", description: "", duration: "" }]);
  }

  function removePlanPhase(idx: number) {
    setPlanPhases((prev) => prev.filter((_, i) => i !== idx));
  }

  function updatePlanPhase(
    idx: number,
    field: "title" | "description" | "duration",
    value: string
  ) {
    setPlanPhases((prev) =>
      prev.map((ph, i) => (i === idx ? { ...ph, [field]: value } : ph))
    );
  }

  async function sendDevis() {
    if (items.some((i) => !i.label.trim())) {
      toast.error("Tous les postes doivent avoir un libellé.");
      return;
    }
    setSending(true);
    try {
      const res = await fetch(`/api/admin/prestations/${prestation.id}/devis`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quote: { items, deposit, total, validity, terms },
          plan: { phases: planPhases },
          amount: total,
        }),
      });
      if (res.ok) {
        toast.success("Devis envoyé avec succès !");
        setEditMode(false);
        onRefresh();
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data?.error ?? "Erreur lors de l'envoi du devis.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setSending(false);
    }
  }

  if (isReadOnly) {
    return (
      <div className="p-4 text-center text-gray-400 text-sm">
        Le devis ne peut être édité que pour les statuts{" "}
        <span className="font-semibold">EN_ATTENTE</span> et{" "}
        <span className="font-semibold">DEVIS_ENVOYE</span>.
      </div>
    );
  }

  if (hasSentQuote && !editMode) {
    const q = prestation.quote!;
    return (
      <div className="space-y-4 p-1">
        <div className="flex items-center justify-between">
          <h4 className="font-syne font-bold text-sm text-primary">Devis envoyé</h4>
          <button
            onClick={() => setEditMode(true)}
            className="text-xs text-accent hover:text-secondary font-semibold flex items-center gap-1"
          >
            <i className="fas fa-pen" /> Modifier
          </button>
        </div>
        <div className="bg-gray-50 rounded-xl p-4 space-y-2">
          {q.items.map((item, i) => (
            <div key={i} className="flex justify-between text-sm">
              <span className="text-gray-700">{item.label}</span>
              <span className="font-semibold text-primary">
                {item.amount.toLocaleString()} F
              </span>
            </div>
          ))}
          <div className="border-t border-gray-200 pt-2 mt-2 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Acompte (60%)</span>
              <span className="text-accent-600 font-semibold">
                {q.deposit.toLocaleString()} F
              </span>
            </div>
            <div className="flex justify-between text-sm font-bold">
              <span className="text-primary">Total</span>
              <span className="text-primary">{q.total.toLocaleString()} F</span>
            </div>
          </div>
        </div>
        {q.validity && (
          <p className="text-xs text-gray-500">
            Validité : <span className="font-medium text-gray-700">{q.validity}</span>
          </p>
        )}
        {q.terms && (
          <div className="bg-gray-50 rounded-xl p-3">
            <p className="text-xs text-gray-500 whitespace-pre-wrap">{q.terms}</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-5 p-1">
      {/* Lignes du devis */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-syne font-bold text-sm text-primary">Postes du devis</h4>
          <button
            onClick={addItem}
            className="text-xs text-accent hover:text-secondary font-semibold flex items-center gap-1"
          >
            <i className="fas fa-plus" /> Ajouter
          </button>
        </div>
        <div className="space-y-2">
          {items.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <input
                value={item.label}
                onChange={(e) => updateItem(idx, "label", e.target.value)}
                placeholder="Libellé du poste"
                className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <input
                type="number"
                value={item.amount || ""}
                onChange={(e) => updateItem(idx, "amount", Number(e.target.value))}
                placeholder="Montant (F)"
                className="w-32 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
              />
              <button
                onClick={() => removeItem(idx)}
                className="text-red-400 hover:text-red-600 px-2"
                disabled={items.length === 1}
              >
                <i className="fas fa-trash text-xs" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Récapitulatif */}
      <div className="bg-gray-50 rounded-xl p-4 space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Acompte (60%)</span>
          <span className="font-semibold text-accent-600">{deposit.toLocaleString()} F</span>
        </div>
        <div className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5">
          <span className="text-primary">Total</span>
          <span className="text-primary">{total.toLocaleString()} F</span>
        </div>
      </div>

      {/* Validité */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Validité du devis
        </label>
        <input
          value={validity}
          onChange={(e) => setValidity(e.target.value)}
          placeholder="ex: 7 jours"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
      </div>

      {/* Conditions */}
      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1.5">
          Conditions générales / Notes
        </label>
        <textarea
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          rows={3}
          placeholder="Conditions, remarques, délais de paiement…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
        />
      </div>

      {/* Plan de phases */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-syne font-bold text-sm text-primary">Plan de phases</h4>
          <button
            onClick={addPlanPhase}
            className="text-xs text-accent hover:text-secondary font-semibold flex items-center gap-1"
          >
            <i className="fas fa-plus" /> Phase
          </button>
        </div>
        <div className="space-y-3">
          {planPhases.map((ph, idx) => (
            <div key={idx} className="border border-gray-200 rounded-xl p-3 space-y-2">
              <div className="flex gap-2">
                <input
                  value={ph.title}
                  onChange={(e) => updatePlanPhase(idx, "title", e.target.value)}
                  placeholder="Titre de la phase"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                />
                <input
                  value={ph.duration}
                  onChange={(e) => updatePlanPhase(idx, "duration", e.target.value)}
                  placeholder="Durée (ex: 3j)"
                  className="w-24 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent"
                />
                <button
                  onClick={() => removePlanPhase(idx)}
                  className="text-red-400 hover:text-red-600 px-1"
                >
                  <i className="fas fa-trash text-xs" />
                </button>
              </div>
              <textarea
                value={ph.description}
                onChange={(e) => updatePlanPhase(idx, "description", e.target.value)}
                placeholder="Description de la phase…"
                rows={2}
                className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent resize-none"
              />
            </div>
          ))}
          {planPhases.length === 0 && (
            <p className="text-xs text-gray-400 italic text-center py-3">
              Aucune phase définie — cliquez sur "Phase" pour en ajouter.
            </p>
          )}
        </div>
      </div>

      {/* Bouton envoi */}
      <button
        onClick={sendDevis}
        disabled={sending || total === 0}
        className="w-full bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {sending ? (
          <>
            <Spinner sm /> Envoi en cours…
          </>
        ) : (
          <>
            <i className="fas fa-paper-plane" /> Envoyer le devis
          </>
        )}
      </button>
    </div>
  );
}

// ─── Tab "Phases" ─────────────────────────────────────────────────────────────

function PhaseLivrableForm({ prestation, phase, onDone }: { prestation: Prestation; phase: PrestationPhase; onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [type, setType] = useState("LINK");
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function detectType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "PDF";
    if (["mp4", "mov", "avi", "webm"].includes(ext)) return "VIDEO";
    if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "ARCHIVE";
    if (["fig", "sketch", "xd", "psd", "ai"].includes(ext)) return "DESIGN";
    if (["js", "ts", "py", "html", "css", "json", "xml", "sql", "sh"].includes(ext)) return "CODE";
    return "LINK";
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const { url: fileUrl } = await televerser(file);
      setUrl(fileUrl);
      if (!title) setTitle(file.name.replace(/\.[^.]+$/, ""));
      setType(detectType(file.name));
    } catch (e) { toast.error((e as Error).message || "Erreur réseau."); }
    finally { setUploading(false); }
  }

  async function submit() {
    if (!title.trim()) { toast.error("Titre requis."); return; }
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/prestations/${prestation.id}/livrable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, type, url: url || null, isAvailable: true, phaseId: phase.id }),
      });
      if (res.ok) { toast.success("Livrable ajouté et disponible pour le client."); setTitle(""); setUrl(""); onDone(); }
      else { toast.error("Erreur lors de l'ajout."); }
    } catch { toast.error("Erreur réseau."); }
    finally { setAdding(false); }
  }

  return (
    <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 space-y-2">
      <p className="text-xs font-semibold text-green-700 flex items-center gap-1.5"><i className="fas fa-upload" />Livrable pour cette phase</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Titre du livrable"
        className="w-full border border-green-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent bg-white" />
      <div className="flex gap-2">
        <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="URL ou télécharger ci-dessous"
          className="flex-1 border border-green-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-accent bg-white" />
        <select value={type} onChange={(e) => setType(e.target.value)}
          className="border border-green-200 rounded-lg px-2 py-1.5 text-xs focus:outline-none focus:border-accent bg-white">
          {["PDF","LINK","VIDEO","CODE","DESIGN","ARCHIVE"].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <input ref={fileInputRef} type="file" className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }} />
      <div className="flex gap-2">
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading}
          className="flex-1 border border-green-200 bg-white rounded-lg py-1.5 text-xs text-green-700 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
          {uploading ? <><Spinner sm />Upload…</> : url.startsWith("http") ? <><i className="fas fa-check" />Fichier prêt</> : <><i className="fas fa-cloud-upload-alt" />Télécharger</>}
        </button>
        <button onClick={submit} disabled={adding || uploading}
          className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-lg py-1.5 text-xs font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5">
          {adding ? <><Spinner sm />Ajout…</> : <><i className="fas fa-check" />Valider</>}
        </button>
      </div>
    </div>
  );
}

function TabPhases({
  prestation,
  onRefresh,
}: {
  prestation: Prestation;
  onRefresh: () => void;
}) {
  const [phases, setPhases] = useState<PrestationPhase[]>(prestation.prestationPhases);
  const [updating, setUpdating] = useState<string | null>(null);
  const [addingPhase, setAddingPhase] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [showLivrableForm, setShowLivrableForm] = useState<string | null>(null);

  async function updatePhase(
    phase: PrestationPhase,
    newStatus: string,
    newProgress: number
  ) {
    setUpdating(phase.id);
    try {
      const res = await fetch(`/api/admin/prestations/${prestation.id}/phase`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phaseId: phase.id,
          status: newStatus,
          progress: newProgress,
        }),
      });
      if (res.ok) {
        setPhases((prev) =>
          prev.map((p) =>
            p.id === phase.id ? { ...p, status: newStatus, progress: newProgress } : p
          )
        );
        toast.success("Phase mise à jour.");
        onRefresh();
      } else {
        toast.error("Erreur lors de la mise à jour de la phase.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setUpdating(null);
    }
  }

  async function addPhase() {
    if (!newTitle.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    setAddingPhase(true);
    try {
      const res = await fetch(`/api/admin/prestations/${prestation.id}/phase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          description: newDesc.trim(),
          order: phases.length + 1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPhases((prev) => [...prev, data.phase]);
        setNewTitle("");
        setNewDesc("");
        toast.success("Phase ajoutée.");
        onRefresh();
      } else {
        toast.error("Erreur lors de l'ajout de la phase.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setAddingPhase(false);
    }
  }

  return (
    <div className="space-y-4 p-1">
      {phases.length === 0 && (
        <p className="text-center text-sm text-gray-400 italic py-4">
          Aucune phase pour cette prestation.
        </p>
      )}

      {phases.map((phase) => (
        <div
          key={phase.id}
          className="border border-gray-200 rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-primary">{phase.title}</p>
              {phase.description && (
                <p className="text-xs text-gray-500 mt-0.5">{phase.description}</p>
              )}
            </div>
            {updating === phase.id && <Spinner sm />}
          </div>

          {/* Barre de progression */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-gray-100 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${progressBarColor(phase.progress)}`}
                style={{ width: `${phase.progress}%` }}
              />
            </div>
            <span className="text-xs text-gray-500 w-8 text-right">{phase.progress}%</span>
          </div>

          {/* Contrôles */}
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={phase.status}
              onChange={(e) =>
                updatePhase(phase, e.target.value, phase.progress)
              }
              disabled={updating === phase.id}
              className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:border-accent disabled:opacity-60"
            >
              <option value="PENDING">{phaseStatusLabel("PENDING")}</option>
              <option value="IN_PROGRESS">{phaseStatusLabel("IN_PROGRESS")}</option>
              <option value="DONE">{phaseStatusLabel("DONE")}</option>
            </select>
            <div className="flex items-center gap-2 flex-1">
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={phase.progress}
                onChange={(e) =>
                  setPhases((prev) =>
                    prev.map((p) =>
                      p.id === phase.id
                        ? { ...p, progress: Number(e.target.value) }
                        : p
                    )
                  )
                }
                className="flex-1 accent-accent"
                disabled={updating === phase.id}
              />
              <button
                onClick={() => updatePhase(phase, phase.status, phase.progress)}
                disabled={updating === phase.id}
                className="text-xs bg-gradient-to-r from-accent to-secondary text-white px-3 py-1.5 rounded-lg font-semibold hover:opacity-90 disabled:opacity-60"
              >
                OK
              </button>
            </div>
          </div>

          {/* Bouton livrable pour phase terminée */}
          {phase.status === "DONE" && (
            <div>
              <button
                onClick={() => setShowLivrableForm((prev) => prev === phase.id ? null : phase.id)}
                className="text-xs text-green-700 bg-green-50 hover:bg-green-100 border border-green-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <i className="fas fa-upload" />
                {showLivrableForm === phase.id ? "Annuler" : "Charger le livrable"}
              </button>
              {showLivrableForm === phase.id && (
                <PhaseLivrableForm
                  prestation={prestation}
                  phase={phase}
                  onDone={() => { setShowLivrableForm(null); onRefresh(); }}
                />
              )}
            </div>
          )}
        </div>
      ))}

      {/* Formulaire ajout phase */}
      <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Ajouter une phase
        </h5>
        <input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Titre de la phase"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
        />
        <textarea
          value={newDesc}
          onChange={(e) => setNewDesc(e.target.value)}
          placeholder="Description (optionnel)"
          rows={2}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none"
        />
        <button
          onClick={addPhase}
          disabled={addingPhase}
          className="w-full bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {addingPhase ? (
            <>
              <Spinner sm /> Ajout…
            </>
          ) : (
            <>
              <i className="fas fa-plus" /> Ajouter une phase
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Tab "Livrables" ──────────────────────────────────────────────────────────

function TabLivrables({
  prestation,
  onRefresh,
}: {
  prestation: Prestation;
  onRefresh: () => void;
}) {
  const [livrables, setLivrables] = useState<Livrable[]>(prestation.livrables);
  const [toggling, setToggling] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const [newTitle, setNewTitle] = useState("");
  const [newType, setNewType] = useState("LINK");
  const [newUrl, setNewUrl] = useState("");
  const [newAvailable, setNewAvailable] = useState(false);

  function detectType(filename: string): string {
    const ext = filename.split(".").pop()?.toLowerCase() ?? "";
    if (ext === "pdf") return "PDF";
    if (["mp4", "mov", "avi", "webm"].includes(ext)) return "VIDEO";
    if (["zip", "tar", "gz", "rar", "7z"].includes(ext)) return "ARCHIVE";
    if (["fig", "sketch", "xd", "psd", "ai"].includes(ext)) return "DESIGN";
    if (["js", "ts", "py", "html", "css", "json", "xml", "sql", "sh"].includes(ext)) return "CODE";
    return "LINK";
  }

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const { url } = await televerser(file);
      setNewUrl(url);
      if (!newTitle) setNewTitle(file.name.replace(/\.[^.]+$/, ""));
      setNewType(detectType(file.name));
    } catch (e) {
      toast.error((e as Error).message || "Erreur réseau lors du téléchargement.");
    } finally {
      setUploading(false);
    }
  }

  async function toggleLivrable(livrable: Livrable) {
    setToggling(livrable.id);
    try {
      const res = await fetch(`/api/admin/prestations/${prestation.id}/livrable`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          livrableId: livrable.id,
          isAvailable: !livrable.isAvailable,
        }),
      });
      if (res.ok) {
        setLivrables((prev) =>
          prev.map((l) =>
            l.id === livrable.id ? { ...l, isAvailable: !l.isAvailable } : l
          )
        );
        toast.success(
          !livrable.isAvailable
            ? "Livrable rendu disponible."
            : "Livrable masqué au client."
        );
        onRefresh();
      } else {
        toast.error("Erreur lors du changement de disponibilité.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setToggling(null);
    }
  }

  async function addLivrable() {
    if (!newTitle.trim()) {
      toast.error("Le titre est requis.");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch(`/api/admin/prestations/${prestation.id}/livrable`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newTitle.trim(),
          type: newType,
          url: newUrl.trim() || null,
          isAvailable: newAvailable,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setLivrables((prev) => [...prev, data.livrable]);
        setNewTitle("");
        setNewUrl("");
        setNewAvailable(false);
        setNewType("LINK");
        toast.success("Livrable ajouté.");
        onRefresh();
      } else {
        toast.error("Erreur lors de l'ajout du livrable.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setAdding(false);
    }
  }

  const typeIcon: Record<string, string> = {
    PDF: "fa-file-pdf",
    LINK: "fa-link",
    VIDEO: "fa-video",
    CODE: "fa-code",
    DESIGN: "fa-paintbrush",
    ARCHIVE: "fa-file-zipper",
  };

  return (
    <div className="space-y-4 p-1">
      {livrables.length === 0 && (
        <p className="text-center text-sm text-gray-400 italic py-4">
          Aucun livrable pour cette prestation.
        </p>
      )}

      {livrables.map((livrable) => (
        <div
          key={livrable.id}
          className="flex items-center gap-3 border border-gray-200 rounded-xl p-3"
        >
          <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
            <i
              className={`fas ${typeIcon[livrable.type] ?? "fa-file"} text-sm text-gray-500`}
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-primary truncate">{livrable.title}</p>
            <div className="flex items-center gap-2 flex-wrap mt-0.5">
              <span className="text-xs text-gray-400">{livrable.type}</span>
              {livrable.phase && (
                <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded-full font-medium">
                  <i className="fas fa-layer-group mr-1 text-[9px]" />{livrable.phase.title}
                </span>
              )}
            </div>
            {livrable.url && (
              <a
                href={livrable.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-accent hover:text-secondary truncate block mt-0.5"
              >
                {livrable.url}
              </a>
            )}
          </div>
          <button
            onClick={() => toggleLivrable(livrable)}
            disabled={toggling === livrable.id}
            className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
              livrable.isAvailable ? "bg-green-500" : "bg-gray-300"
            } disabled:opacity-60`}
            title={livrable.isAvailable ? "Masquer au client" : "Rendre disponible"}
          >
            {toggling === livrable.id ? (
              <span className="absolute inset-0 flex items-center justify-center">
                <Spinner sm />
              </span>
            ) : (
              <span
                className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                  livrable.isAvailable ? "translate-x-5" : "translate-x-0.5"
                }`}
              />
            )}
          </button>
        </div>
      ))}

      {/* Formulaire ajout livrable */}
      <div className="border border-dashed border-gray-300 rounded-xl p-4 space-y-3">
        <h5 className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
          Ajouter un livrable
        </h5>
        <div className="flex gap-2">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Titre"
            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <select
            value={newType}
            onChange={(e) => setNewType(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          >
            {livrableTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        {/* URL ou Fichier */}
        <div className="space-y-2">
          <input
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            placeholder="URL du livrable"
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-accent"
          />
          <div className="flex items-center gap-2">
            <div className="flex-1 border-t border-gray-200" />
            <span className="text-xs text-gray-400">ou</span>
            <div className="flex-1 border-t border-gray-200" />
          </div>
          <input
            ref={fileRef}
            type="file"
            className="hidden"
            accept=".pdf,.zip,.tar,.gz,.rar,.7z,.mp4,.mov,.avi,.webm,.fig,.sketch,.xd,.psd,.ai,.js,.ts,.py,.html,.css,.json,.xml,.sql,.sh,.docx,.xlsx,.pptx"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f); }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="w-full border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:border-accent hover:text-accent transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {uploading ? (
              <><Spinner sm /> Téléchargement en cours…</>
            ) : newUrl.startsWith("http") ? (
              <><i className="fas fa-check text-green-600" /><span className="text-green-600 text-xs truncate max-w-[200px]">Fichier prêt</span></>
            ) : (
              <><i className="fas fa-cloud-upload-alt" /> Télécharger un fichier</>
            )}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <label className="text-sm text-gray-600">Disponible dès maintenant</label>
          <button
            onClick={() => setNewAvailable(!newAvailable)}
            className={`relative w-10 h-5 rounded-full transition-colors ${
              newAvailable ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                newAvailable ? "translate-x-5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>
        <button
          onClick={addLivrable}
          disabled={adding || uploading}
          className="w-full bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {adding ? (
            <>
              <Spinner sm /> Ajout…
            </>
          ) : (
            <>
              <i className="fas fa-plus" /> Ajouter le livrable
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Detail Panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  prestation,
  onClose,
  onRefresh,
}: {
  prestation: Prestation;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"devis" | "phases" | "livrables">("devis");
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const status = prestation.status as PrestationStatus;
  const transitions = statusTransitions[status] ?? [];

  async function changeStatus(newStatus: PrestationStatus) {
    setUpdatingStatus(true);
    try {
      const res = await fetch("/api/admin/prestations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prestationId: prestation.id, status: newStatus }),
      });
      if (res.ok) {
        toast.success(`Statut mis à jour : ${statusLabel[newStatus]}`);
        onRefresh();
      } else {
        toast.error("Erreur lors de la mise à jour du statut.");
      }
    } catch {
      toast.error("Erreur réseau.");
    } finally {
      setUpdatingStatus(false);
    }
  }

  const tabs = [
    { id: "devis" as const, label: "Devis & Plan" },
    { id: "phases" as const, label: "Phases" },
    { id: "livrables" as const, label: "Livrables" },
  ];

  return (
    <motion.div
      key={prestation.id}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="bg-white rounded-2xl shadow-card flex flex-col h-full overflow-hidden"
    >
      {/* Header */}
      <div className="p-5 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="font-syne font-bold text-base text-primary truncate">
              {prestation.client.name}
            </h3>
            <p className="text-xs text-gray-400 truncate">{prestation.client.email}</p>
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {serviceLabel(prestation)}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={prestation.status} />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1"
            >
              <i className="fas fa-xmark" />
            </button>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${progressBarColor(prestation.globalProgress)}`}
              style={{ width: `${prestation.globalProgress}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 font-medium w-8 text-right">
            {prestation.globalProgress}%
          </span>
        </div>
      </div>

      {/* Client info */}
      <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0 space-y-2">
        <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Informations client
        </h4>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
          {prestation.company && (
            <div>
              <p className="text-xs text-gray-400">Entreprise</p>
              <p className="text-sm text-primary font-medium">{prestation.company}</p>
            </div>
          )}
          {prestation.phone && (
            <div>
              <p className="text-xs text-gray-400">Téléphone</p>
              <p className="text-sm text-primary font-medium">{prestation.phone}</p>
            </div>
          )}
          {prestation.sector && (
            <div>
              <p className="text-xs text-gray-400">Secteur</p>
              <p className="text-sm text-primary font-medium">{prestation.sector}</p>
            </div>
          )}
          {prestation.budget && (
            <div>
              <p className="text-xs text-gray-400">Budget</p>
              <p className="text-sm text-primary font-medium">{prestation.budget}</p>
            </div>
          )}
          {prestation.deadline && (
            <div>
              <p className="text-xs text-gray-400">Délai souhaité</p>
              <p className="text-sm text-primary font-medium">{prestation.deadline}</p>
            </div>
          )}
          <div>
            <p className="text-xs text-gray-400">Créé le</p>
            <p className="text-sm text-primary font-medium">
              {new Date(prestation.createdAt).toLocaleDateString("fr-FR")}
            </p>
          </div>
        </div>
        {prestation.brief && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1">Brief</p>
            <p className="text-xs text-gray-700 bg-gray-50 rounded-lg p-2.5 leading-relaxed line-clamp-4">
              {prestation.brief}
            </p>
          </div>
        )}

        {/* Attachments */}
        {prestation.attachments.length > 0 && (
          <div className="mt-2">
            <p className="text-xs text-gray-400 mb-1.5">Pièces jointes</p>
            <div className="flex flex-wrap gap-1.5">
              {prestation.attachments.map((url, i) => (
                <a
                  key={i}
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent hover:text-secondary border border-accent/30 rounded-lg px-2.5 py-1 hover:bg-accent/5 transition-colors"
                >
                  <i className="fas fa-paperclip text-xs" />
                  Fichier {i + 1}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Status transitions */}
      {transitions.length > 0 && (
        <div className="px-5 py-3 border-b border-gray-100 flex-shrink-0">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Changer le statut
          </p>
          <div className="flex flex-wrap gap-2">
            {transitions.map((s) => (
              <button
                key={s}
                onClick={() => changeStatus(s)}
                disabled={updatingStatus}
                className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all hover:opacity-80 disabled:opacity-50 ${statusBadge[s]}`}
              >
                {updatingStatus ? (
                  <Spinner sm />
                ) : (
                  <>→ {statusLabel[s]}</>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="px-5 pt-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 text-xs font-semibold rounded-t-lg transition-colors ${
                activeTab === tab.id
                  ? "bg-white border-b-2 border-accent text-accent"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {activeTab === "devis" && (
            <motion.div
              key="devis"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <TabDevis prestation={prestation} onRefresh={onRefresh} />
            </motion.div>
          )}
          {activeTab === "phases" && (
            <motion.div
              key="phases"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <TabPhases prestation={prestation} onRefresh={onRefresh} />
            </motion.div>
          )}
          {activeTab === "livrables" && (
            <motion.div
              key="livrables"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <TabLivrables prestation={prestation} onRefresh={onRefresh} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function AdminPrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState<PrestationStatus | "TOUS">("TOUS");
  const [selected, setSelected] = useState<Prestation | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ limit: "100" });
    if (filterStatus !== "TOUS") params.set("status", filterStatus);
    if (search) params.set("search", search);
    fetch(`/api/admin/prestations?${params}`)
      .then((r) => r.json())
      .then((data) => {
        const list: Prestation[] = data.prestations ?? [];
        setPrestations(list);
        setTotal(data.total ?? list.length);
        // Refresh selected prestation if it exists in the new list
        if (selected) {
          const refreshed = list.find((p) => p.id === selected.id);
          if (refreshed) setSelected(refreshed);
        }
      })
      .catch(() => toast.error("Impossible de charger les prestations."))
      .finally(() => setLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterStatus, search]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  const allStatuses = Object.keys(statusLabel) as PrestationStatus[];

  return (
    <div className="h-full flex flex-col gap-6 max-w-[1600px]">

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">
          Gestion des Prestations
        </h1>
        <p className="text-gray-500 text-sm">{total} prestation(s) au total</p>
      </motion.div>

      {/* Filter bar */}
      <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
        <div className="relative flex-1">
          <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher par nom client…"
            className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value as any)}
          className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white"
        >
          <option value="TOUS">Tous les statuts</option>
          {allStatuses.map((s) => (
            <option key={s} value={s}>
              {statusLabel[s]}
            </option>
          ))}
        </select>
      </div>

      {/* Main layout: list + detail */}
      <div className="flex-1 flex flex-col lg:flex-row gap-4 min-h-0">

        {/* List */}
        <div
          className={`bg-white rounded-2xl shadow-card overflow-hidden flex flex-col ${
            selected ? "lg:w-[40%]" : "w-full"
          } transition-all duration-300`}
        >
          {loading ? (
            <div className="flex-1 flex items-center justify-center py-12">
              <Spinner />
            </div>
          ) : (
            <div className="overflow-y-auto flex-1">
              {prestations.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  Aucune prestation trouvée.
                </div>
              ) : (
                <div className="divide-y divide-gray-50">
                  {prestations.map((p) => (
                    <motion.button
                      key={p.id}
                      onClick={() => setSelected(selected?.id === p.id ? null : p)}
                      className={`w-full text-left px-5 py-4 hover:bg-gray-50 transition-colors flex flex-col gap-2 ${
                        selected?.id === p.id
                          ? "bg-accent/5 border-l-4 border-accent"
                          : "border-l-4 border-transparent"
                      }`}
                      layout
                    >
                      {/* Client + service */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-primary truncate">
                            {p.client.name}
                          </p>
                          <p className="text-xs text-gray-400 truncate">
                            {p.client.email}
                          </p>
                          <p className="text-xs text-gray-600 mt-0.5 font-medium truncate">
                            {serviceLabel(p)}
                          </p>
                        </div>
                        <StatusBadge status={p.status} />
                      </div>

                      {/* Progress + date */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 bg-gray-100 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${progressBarColor(p.globalProgress)}`}
                            style={{ width: `${p.globalProgress}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {p.globalProgress}%
                        </span>
                        <span className="text-xs text-gray-400 flex-shrink-0">
                          {new Date(p.createdAt).toLocaleDateString("fr-FR")}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Detail panel */}
        <AnimatePresence>
          {selected && (
            <div className="lg:flex-1 lg:min-w-0 min-h-[500px] lg:min-h-0">
              <DetailPanel
                key={selected.id}
                prestation={selected}
                onClose={() => setSelected(null)}
                onRefresh={load}
              />
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
