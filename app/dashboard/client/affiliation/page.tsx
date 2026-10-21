"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

type Referral = { id: string; name: string; email: string; date: string; status: string; commission: number; };

export default function ClientAffiliationPage() {
  const { data: session } = useSession();
  const affiliationCode = (session?.user as any)?.affiliationCode ?? "";
  const affiliationUrl = `https://shiftup.bj/inscription?ref=${affiliationCode}`;

  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/client/affiliation")
      .then((r) => r.json())
      .then((data) => setReferrals(data.referrals ?? []))
      .finally(() => setLoading(false));
  }, []);

  const copyCode = () => {
    navigator.clipboard.writeText(affiliationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const converted = referrals.filter((r) => r.status === "CONVERTI");
  const pending   = referrals.filter((r) => r.status === "EN_ATTENTE");
  const totalCommission = converted.reduce((s, r) => s + r.commission, 0);
  const conversionRate  = referrals.length > 0 ? Math.round((converted.length / referrals.length) * 100) : 0;

  const statusStyle: Record<string, string> = {
    CONVERTI: "bg-green-100 text-green-700",
    EN_ATTENTE: "bg-amber-100 text-amber-700",
    ANNULE: "bg-red-100 text-red-700",
  };
  const statusLabel: Record<string, string> = { CONVERTI: "Converti", EN_ATTENTE: "En attente", ANNULE: "Annulé" };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary">Affiliation & Gains</h1>
        <p className="text-gray-500 text-sm mt-1">Parrainez vos contacts et gagnez des commissions sur leurs prestations.</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Filleuls parrainés",  value: referrals.length,                        icon: "fas fa-users",       color: "from-primary to-accent" },
          { label: "Commissions dues",    value: `${pending.reduce((s,r)=>s+r.commission,0).toLocaleString()} F`, icon: "fas fa-clock", color: "from-primary to-accent" },
          { label: "Commissions perçues", value: `${totalCommission.toLocaleString()} F`,  icon: "fas fa-check-circle",color: "from-primary to-accent" },
          { label: "Taux de conversion",  value: `${conversionRate}%`,                     icon: "fas fa-chart-pie",   color: "from-primary to-accent" },
        ].map((s) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-2xl shadow-card p-5 flex items-center gap-4">
            <div className={`w-12 h-12 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
              <i className={s.icon} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-syne font-bold text-lg text-primary">{s.value}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Code + lien */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4">
          <i className="fas fa-link mr-2 text-accent" />
          Mon code & lien de parrainage
        </h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-gray-500 mb-2">Code d'affiliation</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <span className="font-mono font-bold text-accent flex-1">{affiliationCode || "—"}</span>
              <button onClick={copyCode} className="text-xs text-accent hover:underline flex items-center gap-1">
                <i className={`fas ${copied ? "fa-check" : "fa-copy"}`} />
                {copied ? "Copié !" : "Copier"}
              </button>
            </div>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-2">Lien de parrainage</p>
            <div className="flex items-center gap-2 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
              <span className="text-xs text-gray-600 truncate flex-1">{affiliationUrl}</span>
              <button onClick={() => navigator.clipboard.writeText(affiliationUrl)} className="text-xs text-accent hover:underline">
                <i className="fas fa-copy" />
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 bg-accent/5 rounded-xl p-4 text-sm text-gray-600">
          <i className="fas fa-info-circle text-accent mr-2" />
          Vous gagnez <strong>10% de commission</strong> sur la première prestation de chaque filleul converti.
        </div>
      </div>

      {/* Tableau des filleuls */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4">
          <i className="fas fa-user-plus mr-2 text-accent" />
          Mes filleuls ({referrals.length})
        </h2>
        {loading ? (
          <div className="flex justify-center py-8">
            <span className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        ) : referrals.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <i className="fas fa-user-group text-4xl mb-3 block" />
            <p>Aucun filleul pour le moment. Partagez votre lien !</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">Filleul</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">Date</th>
                  <th className="text-left text-xs text-gray-500 font-medium pb-3">Statut</th>
                  <th className="text-right text-xs text-gray-500 font-medium pb-3">Commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                    <td className="py-3">
                      <p className="font-medium text-primary">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.email}</p>
                    </td>
                    <td className="py-3 text-gray-500">{r.date}</td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyle[r.status] ?? "bg-gray-100 text-gray-500"}`}>
                        {statusLabel[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-3 text-right font-semibold text-primary">
                      {r.commission > 0 ? `${r.commission.toLocaleString()} F` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Comment ça marche */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4">
          <i className="fas fa-question-circle mr-2 text-accent" />
          Comment fonctionne le parrainage ?
        </h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { icon: "fas fa-share-nodes", title: "Partagez votre lien", desc: "Envoyez votre lien ou code à vos contacts entrepreneurs et entreprises." },
            { icon: "fas fa-user-check",  title: "Votre contact s'inscrit", desc: "Il crée un compte et commande une prestation SHIFT UP via votre lien." },
            { icon: "fas fa-coins",       title: "Vous touchez 10%", desc: "Une fois la prestation réglée, 10% de la valeur vous est versé." },
          ].map((s, i) => (
            <div key={i} className="text-center p-4 bg-gray-50 rounded-xl">
              <div className="w-10 h-10 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <i className={`${s.icon} text-accent`} />
              </div>
              <p className="font-semibold text-primary text-sm mb-1">{s.title}</p>
              <p className="text-xs text-gray-500">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
