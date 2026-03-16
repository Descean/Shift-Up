"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const mockStats = {
  totalEarnings: 145000,
  pendingEarnings: 30000,
  paidEarnings: 115000,
  conversions: 7,
  level: "ARGENT",
};

const mockCommissions = [
  { id: "1", client: "Kouassi Ange", service: "Identité Visuelle", date: "12/01/2026", amount: 15000, status: "PAYEE" },
  { id: "2", client: "Boni Sylvie", service: "Site Web Vitrine", date: "20/01/2026", amount: 30000, status: "EN_ATTENTE" },
  { id: "3", client: "Dossou Marc", service: "Montage Dossier", date: "05/02/2026", amount: 7500, status: "PAYEE" },
  { id: "4", client: "Akpo Reine", service: "Stratégie Marketing", date: "14/02/2026", amount: 12500, status: "PAYEE" },
  { id: "5", client: "Favi Jean", service: "Conseil Stratégique", date: "01/03/2026", amount: 50000, status: "EN_ATTENTE" },
];

const levelConfig: Record<string, { color: string; icon: string; next?: string; threshold: number }> = {
  BRONZE: { color: "from-amber-600 to-amber-400", icon: "fa-medal", next: "ARGENT", threshold: 3 },
  ARGENT: { color: "from-gray-400 to-gray-300", icon: "fa-medal", next: "OR", threshold: 10 },
  OR: { color: "from-yellow-500 to-amber-300", icon: "fa-crown", next: "PLATINE", threshold: 25 },
  PLATINE: { color: "from-slate-500 to-slate-400", icon: "fa-gem", next: "DIAMANT", threshold: 50 },
  DIAMANT: { color: "from-blue-400 to-cyan-400", icon: "fa-gem", threshold: 100 },
};

const statusStyle: Record<string, string> = {
  PAYEE: "bg-green-100 text-green-700",
  EN_ATTENTE: "bg-amber-100 text-amber-700",
  ANNULEE: "bg-red-100 text-red-700",
};

export default function ApporteurCommissionsPage() {
  const lvl = levelConfig[mockStats.level];
  const progressToNext = mockStats.level === "DIAMANT" ? 100 : Math.round((mockStats.conversions / (lvl.threshold)) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Commissions & Revenus</h1>
          <p className="text-gray-500 text-sm mt-1">Consultez vos gains et l'historique de vos commissions.</p>
        </div>
        {mockStats.pendingEarnings >= 30000 && (
          <Link
            href="/dashboard/apporteur/commissions/reclamer"
            className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
          >
            <i className="fas fa-money-bill-transfer" />
            Réclamer mes commissions
          </Link>
        )}
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total gagné", value: `${mockStats.totalEarnings.toLocaleString()} F`, icon: "fa-coins", color: "from-accent to-blue-500" },
          { label: "À recevoir", value: `${mockStats.pendingEarnings.toLocaleString()} F`, icon: "fa-clock", color: "from-amber-400 to-orange-400" },
          { label: "Déjà versé", value: `${mockStats.paidEarnings.toLocaleString()} F`, icon: "fa-check-circle", color: "from-secondary to-teal-400" },
          { label: "Conversions", value: mockStats.conversions, icon: "fa-handshake", color: "from-purple-500 to-accent" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
              <i className={`fas ${s.icon}`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-syne font-bold text-lg text-primary">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Level card */}
      <div className={`bg-gradient-to-r ${lvl.color} rounded-2xl p-6 text-white`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/70 text-sm font-medium">Votre niveau</p>
            <p className="font-syne font-black text-3xl mt-1">{mockStats.level}</p>
            {lvl.next && (
              <p className="text-white/70 text-sm mt-1">
                {mockStats.conversions} / {lvl.threshold} conversions pour atteindre {lvl.next}
              </p>
            )}
          </div>
          <i className={`fas ${lvl.icon} text-5xl text-white/30`} />
        </div>
        {lvl.next && (
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${Math.min(progressToNext, 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Commissions table */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4">
          <i className="fas fa-list-ul mr-2 text-accent" />
          Historique des commissions
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Client</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Service</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Date</th>
                <th className="text-left text-xs text-gray-500 font-medium pb-3">Statut</th>
                <th className="text-right text-xs text-gray-500 font-medium pb-3">Commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockCommissions.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-primary">{c.client}</td>
                  <td className="py-3 text-gray-500 text-xs">{c.service}</td>
                  <td className="py-3 text-gray-400 text-xs">{c.date}</td>
                  <td className="py-3">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[c.status]}`}>
                      {c.status === "PAYEE" ? "Versée" : c.status === "EN_ATTENTE" ? "En attente" : "Annulée"}
                    </span>
                  </td>
                  <td className="py-3 text-right font-semibold text-primary">{c.amount.toLocaleString()} F</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payout info */}
      <div className="bg-accent/5 rounded-2xl p-5 text-sm text-gray-600 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <p>
          <i className="fas fa-info-circle text-accent mr-2" />
          Réclamez vos commissions dès <strong>30 000 F</strong> de solde disponible.
          Versement par Mobile Money sous <strong>48h ouvrées</strong> après validation.
        </p>
        {mockStats.pendingEarnings >= 30000 && (
          <Link
            href="/dashboard/apporteur/commissions/reclamer"
            className="inline-flex items-center gap-2 text-accent font-semibold text-sm hover:underline whitespace-nowrap"
          >
            <i className="fas fa-arrow-right" />
            Faire une demande
          </Link>
        )}
      </div>
    </div>
  );
}
