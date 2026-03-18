/**
 * app/dashboard/client/factures/page.tsx — Factures et paiements (client)
 *
 * Affiche l'historique des paiements du client connecté.
 * Données mock — à remplacer par fetch /api/prestations?include=payments.
 */

"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";

type Invoice = {
  id: string;
  service: string;
  type: string;
  amount: number;
  status: string;
  method: string;
  date: string;
  reference: string;
  prestationId?: string;
};

const statusStyle: Record<string, string> = {
  "PAYÉ":       "bg-green-50 text-green-700",
  "COMPLETED":  "bg-green-50 text-green-700",
  "EN ATTENTE": "bg-amber-50 text-amber-700",
  "PENDING":    "bg-amber-50 text-amber-700",
  "REMBOURSÉ":  "bg-gray-100 text-gray-500",
  "FAILED":     "bg-red-50 text-red-600",
};

const statusLabel: Record<string, string> = {
  COMPLETED: "Payé",
  PENDING:   "En attente",
  FAILED:    "Échoué",
  REFUNDED:  "Remboursé",
};

export default function FacturesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    fetch("/api/prestations")
      .then((r) => r.json())
      .then((data) => {
        const prestations = data.prestations ?? [];
        const rows: Invoice[] = [];
        prestations.forEach((p: any) => {
          (p.payments ?? []).forEach((pay: any, idx: number) => {
            rows.push({
              id: `FAC-${p.id.slice(-4).toUpperCase()}-${idx + 1}`,
              service: p.service?.title ?? "Service",
              type: idx === 0 ? "Acompte (40%)" : "Solde (60%)",
              amount: pay.amount,
              status: pay.status,
              method: `${pay.provider} (${pay.method})`,
              date: pay.createdAt ? new Date(pay.createdAt).toLocaleDateString("fr-FR") : "—",
              reference: pay.reference,
              prestationId: p.id,
            });
          });
        });
        setInvoices(rows);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalPaid    = invoices.filter(i => i.status === "COMPLETED").reduce((s, i) => s + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === "PENDING").reduce((s, i) => s + i.amount, 0);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* En-tête */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Factures & Paiements</h1>
        <p className="text-gray-500 text-sm">Historique de vos transactions</p>
      </motion.div>

      {/* Récapitulatif */}
      <div className="grid sm:grid-cols-3 gap-5">
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Total payé</p>
          <p className="font-syne font-black text-2xl text-secondary">{totalPaid.toLocaleString()} <span className="text-base font-normal text-gray-500">FCFA</span></p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Solde à régler</p>
          <p className="font-syne font-black text-2xl text-accent">{totalPending.toLocaleString()} <span className="text-base font-normal text-gray-500">FCFA</span></p>
        </div>
        <div className="bg-white rounded-2xl shadow-card p-5">
          <p className="text-xs text-gray-400 uppercase tracking-widest mb-1">Transactions</p>
          <p className="font-syne font-black text-2xl text-primary">{invoices.length}</p>
        </div>
      </div>

      {/* Tableau des factures */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-syne font-bold text-primary">Toutes les factures</h2>
          <button className="flex items-center gap-2 text-accent text-sm font-medium hover:underline">
            <i className="fas fa-download text-xs" />
            Tout télécharger
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-50">
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Référence</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Service</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Type</th>
                <th className="text-right px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Montant</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Méthode</th>
                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Date</th>
                <th className="text-center px-6 py-3 text-xs font-semibold text-gray-400 uppercase tracking-widest">Statut</th>
                <th className="px-6 py-3" />
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 && (
                <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400 text-sm">Aucune transaction pour l'instant.</td></tr>
              )}
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{inv.reference}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">{inv.service}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.type}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary text-right">{inv.amount.toLocaleString()} F</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.method}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[inv.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {statusLabel[inv.status] ?? inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === "COMPLETED" ? (
                      <span className="text-gray-300 text-xs">PDF bientôt</span>
                    ) : inv.status === "PENDING" && inv.prestationId ? (
                      <Link
                        href={`/paiement?type=service&prestationId=${inv.prestationId}&amount=${inv.amount}`}
                        className="text-white bg-gradient-to-r from-accent to-secondary px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                      >
                        Payer maintenant
                      </Link>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}

        {/* Note de bas de tableau */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            <i className="fas fa-info-circle mr-1" />
            Les factures PDF sont générées automatiquement après confirmation du paiement.
            Pour tout litige, contactez <strong>shiftup.eudes@gmail.com</strong>.
          </p>
        </div>
      </div>
    </div>
  );
}
