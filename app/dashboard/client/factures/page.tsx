/**
 * app/dashboard/client/factures/page.tsx — Factures et paiements (client)
 *
 * Affiche l'historique des paiements du client connecté.
 * Données mock — à remplacer par fetch /api/prestations?include=payments.
 */

"use client";

import { motion } from "framer-motion";

// Factures mock — remplacer par données réelles depuis /api/prestations
const mockInvoices = [
  {
    id: "FAC-2025-001",
    service: "Application Web / SaaS",
    type: "Acompte (40%)",
    amount: 600000,
    status: "PAYÉ",
    method: "FedaPay (MTN MoMo)",
    date: "15/10/2025",
    reference: "SU-PAY-1729000000-XK3A",
  },
  {
    id: "FAC-2025-002",
    service: "Stratégie digitale",
    type: "Règlement total",
    amount: 200000,
    status: "PAYÉ",
    method: "Stripe (Carte Visa)",
    date: "02/11/2025",
    reference: "SU-PAY-1730600000-M9TZ",
  },
  {
    id: "FAC-2025-003",
    service: "Application Web / SaaS",
    type: "Solde (60%)",
    amount: 900000,
    status: "EN ATTENTE",
    method: "—",
    date: "—",
    reference: "—",
  },
];

const statusStyle: Record<string, string> = {
  "PAYÉ":       "bg-green-50 text-green-700",
  "EN ATTENTE": "bg-amber-50 text-amber-700",
  "REMBOURSÉ":  "bg-gray-100 text-gray-500",
};

export default function FacturesPage() {
  const totalPaid    = mockInvoices.filter(i => i.status === "PAYÉ").reduce((s, i) => s + i.amount, 0);
  const totalPending = mockInvoices.filter(i => i.status === "EN ATTENTE").reduce((s, i) => s + i.amount, 0);

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
          <p className="font-syne font-black text-2xl text-primary">{mockInvoices.length}</p>
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
              {mockInvoices.map((inv) => (
                <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-xs font-mono text-gray-500">{inv.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-primary">{inv.service}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.type}</td>
                  <td className="px-6 py-4 text-sm font-bold text-primary text-right">{inv.amount.toLocaleString()} F</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.method}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{inv.date}</td>
                  <td className="px-6 py-4 text-center">
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[inv.status] ?? "bg-gray-100 text-gray-500"}`}>
                      {inv.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {inv.status === "PAYÉ" ? (
                      <button className="text-accent hover:text-secondary transition-colors text-xs font-medium flex items-center gap-1">
                        <i className="fas fa-download" />
                        PDF
                      </button>
                    ) : (
                      <button className="text-white bg-gradient-to-r from-accent to-secondary px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity whitespace-nowrap">
                        Payer maintenant
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

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
