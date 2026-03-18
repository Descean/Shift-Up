/**
 * app/dashboard/admin/finances/page.tsx — Finances & paiements (admin)
 *
 * Vue d'ensemble financière de la plateforme SHIFT UP :
 *  - Récapitulatif : CA total, revenus du mois, commissions apporteurs, soldes en attente
 *  - Tableau des derniers paiements reçus (toutes prestations confondues)
 *  - Tableau des commissions dues aux apporteurs
 *  - Filtrage par méthode de paiement et par statut
 *
 * Données : actuellement mockées.
 * TODO: brancher sur GET /api/admin/payments (à créer) qui lit prisma.payment.
 *       Les commissions doivent être lues depuis prisma.apporteurProfile.pendingEarnings.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

type PaymentStatus = "COMPLETED" | "PENDING" | "FAILED" | "REFUNDED";

interface Payment {
  id: string;
  reference: string;
  client: string;
  service: string;
  amount: number;
  method: string;
  status: PaymentStatus;
  date: string;
}

interface Commission {
  apporteur: string;
  code: string;
  referrals: number;
  totalGenerated: number; // CA généré par ses filleuls
  commission: number;     // 10% de totalGenerated
  status: "A_PAYER" | "PAYE";
}


// ─── Styles ───────────────────────────────────────────────────────────────────

const statusStyle: Record<PaymentStatus, string> = {
  COMPLETED: "bg-green-50 text-green-700",
  PENDING:   "bg-amber-50 text-amber-700",
  FAILED:    "bg-red-50 text-red-600",
  REFUNDED:  "bg-gray-100 text-gray-500",
};

const statusLabel: Record<PaymentStatus, string> = {
  COMPLETED: "Reçu",
  PENDING:   "En attente",
  FAILED:    "Échoué",
  REFUNDED:  "Remboursé",
};

// ─── Composant principal ───────────────────────────────────────────────────────

export default function AdminFinancesPage() {
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [totals, setTotals]         = useState({ total: 0, thisMonth: 0 });
  const [loading, setLoading]       = useState(true);
  const [filterStatus, setFilter]   = useState<PaymentStatus | "TOUS">("TOUS");
  const [search, setSearch]         = useState("");

  useEffect(() => {
    fetch("/api/admin/payments")
      .then((r) => r.json())
      .then((data) => {
        setPayments(data.payments ?? []);
        setCommissions(data.commissions ?? []);
        setTotals(data.totals ?? { total: 0, thisMonth: 0 });
      })
      .finally(() => setLoading(false));
  }, []);

  const totalCompleted = totals.total;
  const revenueThisMonth = totals.thisMonth;
  const totalPending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.amount, 0);
  const totalCommissions = commissions.reduce((s, c) => s + c.commission, 0);

  const filtered = payments.filter((p) => {
    const matchStatus = filterStatus === "TOUS" || p.status === filterStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      p.client.toLowerCase().includes(q) ||
      p.service.toLowerCase().includes(q) ||
      p.reference.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-6xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Finances & Paiements</h1>
        <p className="text-gray-500 text-sm">Suivi des encaissements et commissions</p>
      </motion.div>

      {/* ── Cartes récapitulatives ───────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "CA encaissé",
            value: totalCompleted,
            icon: "fa-circle-check",
            color: "text-green-600",
            bg: "bg-green-50",
          },
          {
            label: "Ce mois",
            value: revenueThisMonth,
            icon: "fa-calendar",
            color: "text-accent",
            bg: "bg-accent/10",
          },
          {
            label: "En attente",
            value: totalPending,
            icon: "fa-hourglass-half",
            color: "text-amber-600",
            bg: "bg-amber-50",
          },
          {
            label: "Commissions dues",
            value: totalCommissions,
            icon: "fa-hand-holding-dollar",
            color: "text-purple-600",
            bg: "bg-purple-50",
          },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-2xl shadow-card p-5">
            <div className={`w-10 h-10 ${card.bg} rounded-xl flex items-center justify-center mb-4`}>
              <i className={`fas ${card.icon} ${card.color}`} />
            </div>
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">{card.label}</p>
            <p className="font-syne font-black text-xl text-primary">
              {card.value.toLocaleString()}
              <span className="text-sm font-normal text-gray-400 ml-1">FCFA</span>
            </p>
          </div>
        ))}
      </div>

      {/* ── Tableau des paiements ─────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-syne font-bold text-primary mb-4">Historique des paiements</h2>

          {/* Barre de filtres */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <i className="fas fa-search absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Client, service ou référence..."
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilter(e.target.value as any)}
              className="border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent bg-white"
            >
              <option value="TOUS">Tous les statuts</option>
              <option value="COMPLETED">Reçus</option>
              <option value="PENDING">En attente</option>
              <option value="FAILED">Échoués</option>
              <option value="REFUNDED">Remboursés</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Référence</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Client</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Service</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Montant</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Méthode</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Statut</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-400 text-sm">
                    Aucun paiement trouvé.
                  </td>
                </tr>
              )}
              {filtered.map((p) => (
                <tr key={p.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-400">{p.reference}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">{p.client}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.service}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary text-right">
                    {p.amount.toLocaleString()} F
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{p.method}</td>
                  <td className="px-6 py-4 text-sm text-gray-400">
                    {p.date ? new Date(p.date).toLocaleDateString("fr-FR") : "—"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[p.status]}`}>
                      {statusLabel[p.status]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Tableau des commissions apporteurs ───────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="font-syne font-bold text-primary">Commissions apporteurs</h2>
          <p className="text-xs text-gray-400 mt-1">
            Taux de commission : 10% sur le CA des prestations terminées des filleuls
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Apporteur</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Code</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Filleuls</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">CA généré</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Commission (10%)</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {mockCommissions.map((c) => (
                <tr key={c.code} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-primary">{c.apporteur}</td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-mono bg-purple-50 text-purple-700 px-2 py-1 rounded">
                      {c.code}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{c.referrals}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {c.totalGenerated.toLocaleString()} F
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-primary">
                    {c.commission.toLocaleString()} F
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      c.status === "PAYE"
                        ? "bg-green-50 text-green-700"
                        : "bg-amber-50 text-amber-700"
                    }`}>
                      {c.status === "PAYE" ? "Payé" : "À payer"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {c.status === "A_PAYER" && (
                      <button className="text-accent hover:text-secondary text-xs font-medium flex items-center gap-1">
                        <i className="fas fa-paper-plane" />
                        Payer
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
