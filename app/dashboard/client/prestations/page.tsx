"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

interface Phase { name?: string; title?: string; done: boolean; }
interface Prestation {
  id: string;
  service: string;
  status: string;
  progress: number;
  amount: number;
  amountPaid: number;
  startDate: string;
  estimatedEnd: string;
  phases: Phase[];
}

const statusConfig: Record<string, { label: string; style: string; icon: string }> = {
  EN_ATTENTE: { label: "En attente",   style: "bg-amber-100 text-amber-700",  icon: "fa-clock" },
  EN_COURS:   { label: "En cours",     style: "bg-blue-100 text-blue-700",    icon: "fa-spinner fa-spin" },
  LIVRAISON:  { label: "En livraison", style: "bg-purple-100 text-purple-700",icon: "fa-truck" },
  REVISION:   { label: "En révision",  style: "bg-orange-100 text-orange-700",icon: "fa-rotate" },
  TERMINEE:   { label: "Terminée",     style: "bg-green-100 text-green-700",  icon: "fa-check-circle" },
  ANNULEE:    { label: "Annulée",      style: "bg-red-100 text-red-700",      icon: "fa-times-circle" },
};

function fmt(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("fr-FR");
}

export default function ClientPrestationsPage() {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((data) => {
        const rows: Prestation[] = (data.prestations ?? []).map((p: any) => ({
          id: p.id,
          service: p.service?.title ?? "Service",
          status: p.status,
          progress: p.globalProgress ?? 0,
          amount: p.amount ?? p.service?.price ?? 0,
          amountPaid: (p.payments ?? []).filter((pay: any) => pay.status === "COMPLETED").reduce((s: number, pay: any) => s + pay.amount, 0),
          startDate: fmt(p.createdAt),
          estimatedEnd: fmt(p.estimatedEndDate ?? null),
          phases: Array.isArray(p.phases) ? p.phases : [],
        }));
        setPrestations(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  const active = prestations.filter((p) => p.status !== "TERMINEE" && p.status !== "ANNULEE");
  const past   = prestations.filter((p) => p.status === "TERMINEE" || p.status === "ANNULEE");
  const detail = prestations.find((p) => p.id === selected);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Mes Prestations</h1>
          <p className="text-gray-500 text-sm mt-1">Suivez l'avancement de vos projets SHIFT UP.</p>
        </div>
        <Link href="/services" className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2">
          <i className="fas fa-plus" />
          Nouvelle commande
        </Link>
      </div>

      {/* Active */}
      <section>
        <h2 className="font-syne font-bold text-primary mb-3 flex items-center gap-2">
          <span className="w-2 h-2 bg-blue-500 rounded-full inline-block" />
          Prestations en cours ({active.length})
        </h2>
        <div className="space-y-4">
          {active.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center text-gray-400">
              <i className="fas fa-briefcase text-4xl mb-3 block" />
              <p>Aucune prestation en cours.</p>
              <Link href="/services" className="text-accent text-sm mt-2 inline-block hover:underline">Découvrir nos services →</Link>
            </div>
          ) : (
            active.map((p, i) => <PrestationCard key={p.id} p={p} index={i} onSelect={setSelected} selected={selected === p.id} />)
          )}
        </div>
      </section>

      {/* Past */}
      {past.length > 0 && (
        <section>
          <h2 className="font-syne font-bold text-primary mb-3 flex items-center gap-2">
            <span className="w-2 h-2 bg-gray-400 rounded-full inline-block" />
            Historique ({past.length})
          </h2>
          <div className="space-y-4">
            {past.map((p, i) => <PrestationCard key={p.id} p={p} index={i} onSelect={setSelected} selected={selected === p.id} />)}
          </div>
        </section>
      )}

      {/* Detail panel */}
      {detail && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="font-syne font-bold text-primary text-lg">{detail.service}</h3>
              <p className="text-xs text-gray-400 mt-0.5">Démarrage : {detail.startDate} · Fin estimée : {detail.estimatedEnd}</p>
            </div>
            <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times" /></button>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>Avancement global</span>
              <span className="font-semibold text-primary">{detail.progress}%</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <motion.div initial={{ width: 0 }} animate={{ width: `${detail.progress}%` }} transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-accent to-secondary rounded-full" />
            </div>
          </div>

          {detail.phases.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Phases</p>
              <div className="space-y-2">
                {detail.phases.map((ph, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${ph.done ? "bg-green-500" : "bg-gray-200"}`}>
                      {ph.done && <i className="fas fa-check text-white text-[9px]" />}
                    </div>
                    <span className={`text-sm ${ph.done ? "text-gray-700" : "text-gray-400"}`}>{ph.name ?? ph.title}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-3 gap-4 border-t border-gray-50 pt-4 mb-4">
            <div><p className="text-xs text-gray-500">Montant total</p><p className="font-bold text-primary">{detail.amount.toLocaleString()} F</p></div>
            <div><p className="text-xs text-gray-500">Payé</p><p className="font-bold text-green-600">{detail.amountPaid.toLocaleString()} F</p></div>
            <div><p className="text-xs text-gray-500">Reste à payer</p><p className="font-bold text-amber-600">{(detail.amount - detail.amountPaid).toLocaleString()} F</p></div>
          </div>

          {detail.status !== "TERMINEE" && detail.status !== "ANNULEE" && detail.amount > detail.amountPaid && (
            <PayButton
              prestationId={detail.id}
              label={detail.service}
              amount={detail.amountPaid === 0 ? Math.round(detail.amount * 0.4) : detail.amount - detail.amountPaid}
              isDeposit={detail.amountPaid === 0}
            />
          )}
        </motion.div>
      )}
    </div>
  );
}

function PayButton({ prestationId, label, amount, isDeposit }: { prestationId: string; label: string; amount: number; isDeposit: boolean }) {
  const router = useRouter();
  return (
    <button
      onClick={() => {
        const params = new URLSearchParams({ type: "service", prestationId, amount: String(amount), label: isDeposit ? `Acompte 40% — ${label}` : `Solde 60% — ${label}` });
        router.push(`/paiement?${params.toString()}`);
      }}
      className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
    >
      <i className="fas fa-credit-card" />
      {isDeposit ? `Payer l'acompte (40%) — ${amount.toLocaleString()} F` : `Payer le solde (60%) — ${amount.toLocaleString()} F`}
    </button>
  );
}

function PrestationCard({ p, index, onSelect, selected }: { p: Prestation; index: number; onSelect: (id: string) => void; selected: boolean }) {
  const cfg = statusConfig[p.status] ?? { label: p.status, style: "bg-gray-100 text-gray-500", icon: "fa-circle" };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }}
      onClick={() => onSelect(p.id)}
      className={`bg-white rounded-2xl shadow-card p-5 cursor-pointer transition-all hover:shadow-md ${selected ? "ring-2 ring-accent" : ""}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <p className="font-syne font-bold text-primary truncate">{p.service}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${cfg.style}`}>
              <i className={`fas ${cfg.icon} text-[10px]`} />{cfg.label}
            </span>
            <span className="text-xs text-gray-400">{p.amount.toLocaleString()} F CFA</span>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <p className="text-sm font-bold text-primary">{p.progress}%</p>
          <p className="text-xs text-gray-400">avancement</p>
        </div>
      </div>
      {p.progress > 0 && (
        <div className="mt-3">
          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all duration-700" style={{ width: `${p.progress}%` }} />
          </div>
        </div>
      )}
      <div className="mt-3 flex items-center justify-between text-xs text-gray-400">
        <span>Démarrage : {p.startDate}</span>
        <span className="text-accent font-medium">Voir détails →</span>
      </div>
    </motion.div>
  );
}
