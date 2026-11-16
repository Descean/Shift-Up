"use client";

/** « Espace Direction » : statistiques et tarifs (planchers, livraison physique, Express, acompte). */
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { NATURES, type Tarifs } from "@/lib/tarifs-montage";
import { dateFr } from "@/components/espace/elements";

type Monteur = { id: string; nom: string | null; email: string | null; telephone: string | null; ville: string | null; experience: string | null; specialites: string[]; presentation: string | null; creeLe: string; statut: string; type: string; dossiersEnCours: number; solde: number };
type Versement = { id: string; monteur: string | null; montant: number; operateur: string; numero: string; statut: string; reference: string; date: string };
const STATUT_M: Record<string, string> = { EN_ATTENTE: "En attente", ACTIF: "Actif", SUSPENDU: "Suspendu" };

function Monteurs() {
  const [liste, setListe] = useState<Monteur[] | null>(null);
  const [versements, setVersements] = useState<Versement[]>([]);
  const charger = () => {
    fetch("/api/equipe/monteurs").then((r) => r.json()).then((d) => setListe(d.monteurs ?? [])).catch(() => setListe([]));
    fetch("/api/equipe/versements").then((r) => r.json()).then((d) => setVersements(d.versements ?? [])).catch(() => {});
  };
  useEffect(charger, []);
  async function changer(m: Monteur, statut: string, type = m.type) {
    const r = await fetch("/api/equipe/monteurs", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId: m.id, statut, type }) });
    if (!r.ok) { toast.error((await r.json().catch(() => ({}))).error ?? "Impossible."); return; }
    toast.success(statut === "ACTIF" && m.statut === "EN_ATTENTE" ? "Monteur activé : il a reçu son lien de connexion." : "Monteur mis à jour."); charger();
  }
  async function verser(v: Versement, statut: "PAID" | "REJECTED") {
    const note = statut === "REJECTED" ? window.prompt("Motif du refus ?") ?? "" : undefined;
    if (statut === "PAID" && !window.confirm(`Confirmer le versement de ${Math.round(v.montant).toLocaleString("fr-FR")} F au ${v.numero} ?`)) return;
    const r = await fetch("/api/equipe/versements", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: v.id, statut, note }) });
    if (!r.ok) { toast.error((await r.json().catch(() => ({}))).error ?? "Impossible."); return; }
    toast.success(statut === "PAID" ? "Versement noté comme fait." : "Demande refusée."); charger();
  }
  const aVerser = versements.filter((v) => v.statut === "PENDING" || v.statut === "PROCESSING");
  return (
    <>
      <div className="mt-6 overflow-hidden rounded-2xl border border-su-lavande bg-white shadow-sm">
        <div className="border-b border-su-lavande bg-su-brume/40 px-5 py-4">
          <p className="font-bold text-su-nuit"><i className="fas fa-user-gear mr-2 text-su-bleu" />Monteurs</p>
          <p className="mt-0.5 text-xs text-gray-500">Validez les candidatures, suspendez un compte, choisissez indépendant (ses clients, gains reversés) ou interne (équipe SHIFT UP).</p>
        </div>
        <ul className="divide-y divide-su-lavande">
          {liste === null && <li className="h-20 animate-pulse bg-su-brume/30" />}
          {liste?.length === 0 && <li className="px-5 py-6 text-center text-sm text-gray-400">Aucun monteur pour l&apos;instant.</li>}
          {liste?.map((m) => (
            <li key={m.id} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-semibold text-su-nuit">{m.nom} <span className={`ml-2 rounded-full px-2 py-0.5 text-[10px] font-bold ${m.statut === "ACTIF" ? "bg-emerald-50 text-emerald-700" : m.statut === "EN_ATTENTE" ? "bg-amber-50 text-amber-700" : "bg-red-50 text-red-700"}`}>{STATUT_M[m.statut] ?? m.statut}</span>
                  <span className="ml-1 rounded-full bg-su-brume px-2 py-0.5 text-[10px] font-bold text-su-bleu">{m.type === "INDEPENDANT" ? "Indépendant" : "Interne"}</span></p>
                <p className="text-xs text-gray-500">{m.email} · {m.telephone ?? "—"}{m.ville ? ` · ${m.ville}` : ""}{m.experience ? ` · ${m.experience}` : ""} · inscrit le {dateFr(m.creeLe)}</p>
                {m.presentation && <p className="mt-1 line-clamp-2 text-xs text-gray-600">{m.presentation}</p>}
                <p className="mt-1 text-xs text-gray-500">{m.dossiersEnCours} dossier(s) en cours{m.type === "INDEPENDANT" ? ` · solde ${Math.round(m.solde).toLocaleString("fr-FR")} F` : ""}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {m.statut !== "ACTIF" && <button type="button" onClick={() => changer(m, "ACTIF")} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white">Activer</button>}
                {m.statut === "ACTIF" && <button type="button" onClick={() => changer(m, "SUSPENDU")} className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600">Suspendre</button>}
                <button type="button" onClick={() => changer(m, m.statut, m.type === "INDEPENDANT" ? "INTERNE" : "INDEPENDANT")} className="rounded-lg border border-su-lavande px-3 py-1.5 text-xs font-semibold text-su-bleu">
                  Passer {m.type === "INDEPENDANT" ? "interne" : "indépendant"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-su-lavande bg-white shadow-sm">
        <div className="border-b border-su-lavande bg-su-brume/40 px-5 py-4">
          <p className="font-bold text-su-nuit"><i className="fas fa-money-bill-transfer mr-2 text-su-bleu" />Versements aux monteurs</p>
          <p className="mt-0.5 text-xs text-gray-500">Faites le transfert Mobile Money, puis notez-le comme versé.</p>
        </div>
        <ul className="divide-y divide-su-lavande text-sm">
          {versements.length === 0 && <li className="px-5 py-6 text-center text-gray-400">Aucune demande.</li>}
          {[...aVerser, ...versements.filter((v) => !aVerser.includes(v)).slice(0, 10)].map((v) => (
            <li key={v.id} className="flex flex-col gap-2 px-5 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span><strong className="text-su-nuit">{Math.round(v.montant).toLocaleString("fr-FR")} F</strong> — {v.monteur} <span className="block text-xs text-gray-500">{v.operateur.replace("_", " ")} {v.numero} · {dateFr(v.date)} · {v.reference}</span></span>
              {v.statut === "PENDING" || v.statut === "PROCESSING" ? (
                <span className="flex gap-2">
                  <button type="button" onClick={() => verser(v, "PAID")} className="rounded-lg bg-su-nuit px-3 py-1.5 text-xs font-semibold text-white">Versement fait</button>
                  <button type="button" onClick={() => verser(v, "REJECTED")} className="rounded-lg border border-su-lavande px-3 py-1.5 text-xs text-gray-600">Refuser</button>
                </span>
              ) : <span className={`text-xs font-semibold ${v.statut === "PAID" ? "text-emerald-700" : "text-red-600"}`}>{v.statut === "PAID" ? "Versé" : "Refusé"}</span>}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

type Stats = { chiffreAffaires: number; dossiersEnCours: number; clientsUniques: number };

function Champ({ id, label, valeur, onChange, unite = "FCFA" }: { id: string; label: string; valeur: number; onChange: (n: number) => void; unite?: string }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-xs font-semibold text-gray-600">{label}</label>
      <div className="relative">
        <input id={id} inputMode="numeric" value={Number.isFinite(valeur) ? String(valeur) : ""} onChange={(e) => onChange(Number(e.target.value.replace(/[^\d]/g, "")) || 0)}
          className="w-full rounded-xl border border-su-lavande px-3 py-2.5 pr-14 text-sm focus:border-su-bleu focus:outline-none" />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">{unite}</span>
      </div>
    </div>
  );
}

export default function Direction() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [t, setT] = useState<Tarifs | null>(null);
  const [envoi, setEnvoi] = useState(false);

  useEffect(() => {
    fetch("/api/equipe/direction").then((r) => r.json()).then((d) => { setStats(d.stats); setT(d.tarifs); }).catch(() => {});
  }, []);

  async function enregistrer() {
    if (!t) return;
    setEnvoi(true);
    try {
      const r = await fetch("/api/equipe/direction", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Enregistrement impossible."); return; }
      toast.success("Les tarifs ont été mis à jour.");
    } finally { setEnvoi(false); }
  }

  const tuile = (label: string, valeur: string) => (
    <div className="rounded-2xl border border-su-lavande bg-white p-5 shadow-sm">
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-1 text-3xl font-extrabold text-su-nuit">{valeur}</p>
    </div>
  );

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 border-b border-su-lavande pb-5">
        <h1 className="text-2xl font-bold text-su-nuit">Espace Direction</h1>
        <p className="mt-1 text-sm text-gray-500">Statistiques et paramétrage de l&apos;entreprise.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {tuile("Chiffre d'Affaires Généré", stats ? `${Math.round(stats.chiffreAffaires).toLocaleString("fr-FR")} FCFA` : "…")}
        {tuile("Dossiers en cours", stats ? String(stats.dossiersEnCours) : "…")}
        {tuile("Clients uniques", stats ? String(stats.clientsUniques) : "…")}
      </div>

      <div className="mt-6 overflow-hidden rounded-2xl border border-su-lavande bg-white shadow-sm">
        <div className="border-b border-su-lavande bg-su-brume/40 px-5 py-4">
          <p className="font-bold text-su-nuit"><i className="fas fa-tags mr-2 text-su-bleu" />Tarifs Planchers (Minimums)</p>
          <p className="mt-0.5 text-xs text-gray-500">Ces montants servent de guide et empêchent les monteurs de sous-facturer un dossier.</p>
        </div>
        {t ? (
          <div className="space-y-6 p-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {NATURES.map((n) => (
                <Champ key={n.id} id={`p-${n.id}`} label={n.label} valeur={t.planchers[n.id]} onChange={(v) => setT({ ...t, planchers: { ...t.planchers, [n.id]: v } })} />
              ))}
            </div>
            <div className="grid gap-4 border-t border-su-lavande pt-5 sm:grid-cols-2 lg:grid-cols-4">
              <Champ id="p-physique" label="Livraison physique (impression, reliure, pli)" valeur={t.livraisonPhysique} onChange={(v) => setT({ ...t, livraisonPhysique: v })} />
              <Champ id="p-express" label="Majoration Express" unite="%" valeur={Math.round(t.majorationExpress * 100)} onChange={(v) => setT({ ...t, majorationExpress: Math.min(v, 200) / 100 })} />
              <Champ id="p-acompte" label="Acompte demandé" unite="%" valeur={Math.round(t.acompte * 100)} onChange={(v) => setT({ ...t, acompte: Math.min(Math.max(v, 10), 100) / 100 })} />
              <Champ id="p-commission" label="Part SHIFT UP (monteurs indépendants)" unite="%" valeur={Math.round(t.commissionMonteurs * 100)} onChange={(v) => setT({ ...t, commissionMonteurs: Math.min(v, 90) / 100 })} />
            </div>
          </div>
        ) : <div className="h-40 animate-pulse bg-su-brume/40" />}
        <div className="flex justify-end border-t border-su-lavande bg-su-brume/30 px-5 py-4">
          <button type="button" onClick={enregistrer} disabled={envoi || !t} className="rounded-xl bg-su-nuit px-5 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet disabled:opacity-60">
            {envoi ? "Enregistrement…" : "Enregistrer les tarifs"}
          </button>
        </div>
      </div>

      <Monteurs />
    </div>
  );
}
