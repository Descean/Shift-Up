/**
 * app/dashboard/admin/finances/versements/page.tsx
 *
 * Page admin — Gestion des demandes de versement de commissions (PayoutRequest).
 * Permet de voir les demandes PENDING/PROCESSING et de les marquer comme PAID ou REJECTED.
 */

"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";

type PayoutRequest = {
  id:             string;
  reference:      string;
  userId:         string;
  userName:       string;
  userEmail:      string;
  amount:         number;
  currency:       string;
  mobileProvider: string;
  mobileNumber:   string;
  status:         string;
  notes:          string | null;
  createdAt:      string;
  processedAt:    string | null;
};

const PROVIDER_LABELS: Record<string, string> = {
  MTN_MOMO:    "MTN MoMo",
  MOOV_MONEY:  "Moov Money",
  WAVE:        "Wave",
  CELTIIS:     "Celtiis",
};

const STATUS_STYLE: Record<string, string> = {
  PENDING:    "bg-amber-100 text-amber-700",
  PROCESSING: "bg-accent-100 text-accent-700",
  PAID:       "bg-green-100 text-green-700",
  REJECTED:   "bg-red-100 text-red-700",
};

const STATUS_LABEL: Record<string, string> = {
  PENDING:    "En attente",
  PROCESSING: "En cours",
  PAID:       "Versé",
  REJECTED:   "Rejeté",
};

export default function AdminVersementsPage() {
  const [requests, setRequests]   = useState<PayoutRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState<string>("PENDING");
  const [actionId, setActionId]   = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState<string>("");
  const [rejectTarget, setRejectTarget] = useState<string | null>(null);

  async function loadRequests() {
    setLoading(true);
    try {
      const res = await fetch(`/api/payout/admin?status=${filter}`);
      const data = await res.json();
      setRequests(data.requests || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadRequests(); }, [filter]);

  async function updateStatus(id: string, status: "PROCESSING" | "PAID" | "REJECTED", notes?: string) {
    setActionId(id);
    try {
      const res = await fetch("/api/payout/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status, notes }),
      });
      if (res.ok) {
        await loadRequests();
        setRejectTarget(null);
        setRejectNote("");
      }
    } finally {
      setActionId(null);
    }
  }

  const totalAmount = requests
    .filter((r) => r.status === "PENDING" || r.status === "PROCESSING")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Demandes de versement</h1>
          <p className="text-gray-500 text-sm mt-1">
            Gérez les demandes de commissions des apporteurs.
          </p>
        </div>
        {(filter === "PENDING" || filter === "PROCESSING") && requests.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 text-sm text-amber-700">
            <i className="fas fa-coins mr-2" />
            <strong>{totalAmount.toLocaleString()} F CFA</strong> à verser
          </div>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {["PENDING", "PROCESSING", "PAID", "REJECTED"].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
              filter === s
                ? "bg-primary text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300"
            }`}
          >
            {STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <i className="fas fa-inbox text-3xl mb-3 block" />
            <p>Aucune demande {STATUS_LABEL[filter].toLowerCase()}</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Apporteur</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Référence</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Opérateur</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Numéro</th>
                  <th className="text-right text-xs text-gray-500 font-medium px-5 py-3">Montant</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Statut</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Date</th>
                  <th className="text-left text-xs text-gray-500 font-medium px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-5 py-3">
                      <p className="font-medium text-primary">{r.userName}</p>
                      <p className="text-xs text-gray-400">{r.userEmail}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{r.reference}</td>
                    <td className="px-5 py-3 text-gray-600">{PROVIDER_LABELS[r.mobileProvider] || r.mobileProvider}</td>
                    <td className="px-5 py-3 font-mono text-xs text-gray-600">{r.mobileNumber}</td>
                    <td className="px-5 py-3 text-right font-semibold text-primary">
                      {r.amount.toLocaleString()} F
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_STYLE[r.status]}`}>
                        {STATUS_LABEL[r.status]}
                      </span>
                      {r.notes && (
                        <p className="text-xs text-gray-400 mt-0.5 max-w-[150px] truncate" title={r.notes}>
                          {r.notes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3 text-xs text-gray-400">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-5 py-3">
                      {r.status === "PENDING" && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => updateStatus(r.id, "PROCESSING")}
                            disabled={actionId === r.id}
                            className="text-xs bg-accent-50 text-accent-700 hover:bg-accent-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                          >
                            <i className="fas fa-spinner mr-1" />
                            Traiter
                          </button>
                          <button
                            onClick={() => setRejectTarget(r.id)}
                            className="text-xs bg-red-50 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
                          >
                            <i className="fas fa-times mr-1" />
                            Rejeter
                          </button>
                        </div>
                      )}
                      {r.status === "PROCESSING" && (
                        <button
                          onClick={() => updateStatus(r.id, "PAID")}
                          disabled={actionId === r.id}
                          className="text-xs bg-green-50 text-green-700 hover:bg-green-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <i className="fas fa-check mr-1" />
                          Marquer versé
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Reject modal */}
      {rejectTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6"
          >
            <h3 className="font-syne font-bold text-lg text-primary mb-4">
              Rejeter la demande
            </h3>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Raison du rejet <span className="text-gray-400">(facultatif)</span>
            </label>
            <textarea
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              placeholder="ex. Numéro invalide, montant insuffisant…"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none h-24"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => updateStatus(rejectTarget, "REJECTED", rejectNote || undefined)}
                disabled={actionId === rejectTarget}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm transition-colors disabled:opacity-50"
              >
                {actionId === rejectTarget ? "..." : "Confirmer le rejet"}
              </button>
              <button
                onClick={() => { setRejectTarget(null); setRejectNote(""); }}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-xl font-medium text-sm hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
