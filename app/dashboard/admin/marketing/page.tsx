"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  isActive: boolean;
  subscribedAt: string;
}

interface Contact {
  id: string;
  name: string;
  email: string;
  subject: string | null;
  message: string;
  isRead: boolean;
  createdAt: string;
}

interface Stats {
  totalSubscribers: number;
  activeSubscribers: number;
  unreadContacts: number;
  totalUsers: number;
}

const KPI = ({ icon, label, value, sub, color }: { icon: string; label: string; value: string | number; sub?: string; color: string }) => (
  <div className="bg-white rounded-2xl shadow-card p-5">
    <div className="flex items-start justify-between mb-3">
      <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center`}>
        <i className={`${icon} text-white`} />
      </div>
    </div>
    <p className="text-2xl font-syne font-black text-primary">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
  </div>
);

export default function AdminMarketingPage() {
  const [stats, setStats]           = useState<Stats | null>(null);
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [contacts, setContacts]     = useState<Contact[]>([]);
  const [loading, setLoading]       = useState(true);
  const [tab, setTab]               = useState<"abonnes" | "contacts">("contacts");
  const [selected, setSelected]     = useState<Contact | null>(null);
  const [searchSub, setSearchSub]   = useState("");

  useEffect(() => {
    fetch("/api/admin/marketing")
      .then((r) => r.json())
      .then((d) => {
        setStats(d.stats);
        setSubscribers(d.subscribers ?? []);
        setContacts(d.contacts ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  async function markRead(id: string) {
    try {
      await fetch("/api/admin/marketing", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, isRead: true }),
      });
      setContacts((prev) => prev.map((c) => c.id === id ? { ...c, isRead: true } : c));
      if (stats) setStats({ ...stats, unreadContacts: Math.max(0, stats.unreadContacts - 1) });
    } catch {
      toast.error("Erreur.");
    }
  }

  function openContact(c: Contact) {
    setSelected(c);
    if (!c.isRead) markRead(c.id);
  }

  const filteredSubs = subscribers.filter((s) =>
    s.email.toLowerCase().includes(searchSub.toLowerCase()) ||
    (s.name?.toLowerCase() ?? "").includes(searchSub.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Marketing</h1>
        <p className="text-gray-500 text-sm">Newsletter, contacts entrants & suivi des abonnés</p>
      </motion.div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KPI icon="fas fa-users" label="Abonnés newsletter" value={stats?.totalSubscribers ?? 0} sub={`${stats?.activeSubscribers ?? 0} actifs`} color="bg-gradient-to-br from-accent to-secondary" />
        <KPI icon="fas fa-envelope-open-text" label="Messages non lus" value={stats?.unreadContacts ?? 0} sub="contacts entrants" color="bg-gradient-to-br from-secondary-400 to-secondary-400" />
        <KPI icon="fas fa-user-check" label="Utilisateurs inscrits" value={stats?.totalUsers ?? 0} sub="comptes actifs" color="bg-gradient-to-br from-accent-500 to-secondary-500" />
        <KPI icon="fas fa-chart-line" label="Taux d'activation" value={stats && stats.totalSubscribers > 0 ? `${Math.round((stats.activeSubscribers / stats.totalSubscribers) * 100)}%` : "—"} sub="abonnés actifs" color="bg-gradient-to-br from-primary-500 to-primary-400" />
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab("contacts")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === "contacts" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-accent hover:text-accent"}`}
        >
          <i className="fas fa-inbox mr-1.5" />Contacts entrants
          {(stats?.unreadContacts ?? 0) > 0 && (
            <span className="ml-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full inline-flex items-center justify-center">
              {stats?.unreadContacts}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab("abonnes")}
          className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${tab === "abonnes" ? "bg-primary text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-accent hover:text-accent"}`}
        >
          <i className="fas fa-users mr-1.5" />Abonnés newsletter ({stats?.totalSubscribers ?? 0})
        </button>
      </div>

      {/* ── Tab Contacts ── */}
      {tab === "contacts" && (
        <div className="grid lg:grid-cols-2 gap-4">
          {/* Liste messages */}
          <div className="space-y-2">
            {contacts.length === 0 ? (
              <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
                <i className="fas fa-inbox text-3xl mb-2 block" />Aucun message de contact.
              </div>
            ) : contacts.map((c) => (
              <motion.button
                key={c.id}
                layout
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => openContact(c)}
                className={`w-full text-left bg-white rounded-xl shadow-card p-4 flex items-start gap-3 transition-all hover:shadow-md ${selected?.id === c.id ? "ring-2 ring-accent" : ""}`}
              >
                <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold text-white ${c.isRead ? "bg-gray-300" : "bg-gradient-to-br from-accent to-secondary"}`}>
                  {c.name[0]?.toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-semibold truncate ${c.isRead ? "text-gray-600" : "text-primary"}`}>{c.name}</span>
                    <span className="text-[10px] text-gray-400 flex-shrink-0">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</span>
                  </div>
                  <p className="text-xs text-gray-500 truncate">{c.email}</p>
                  {c.subject && <p className="text-xs text-gray-400 truncate mt-0.5">{c.subject}</p>}
                  {!c.isRead && <span className="inline-block mt-1 text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full">Non lu</span>}
                </div>
              </motion.button>
            ))}
          </div>

          {/* Détail message */}
          <div>
            {selected ? (
              <motion.div key={selected.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-2xl shadow-card p-6 space-y-4 sticky top-4">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-syne font-bold text-primary">{selected.name}</h3>
                    <p className="text-sm text-gray-500">{selected.email}</p>
                    {selected.subject && <p className="text-xs text-gray-400 mt-0.5">Sujet : {selected.subject}</p>}
                  </div>
                  <span className="text-xs text-gray-400">{new Date(selected.createdAt).toLocaleString("fr-FR")}</span>
                </div>
                <div className="bg-gray-50 rounded-xl p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                  {selected.message}
                </div>
                <div className="flex gap-3">
                  <a
                    href={`mailto:${selected.email}?subject=Re: ${selected.subject ?? "Votre message SHIFT UP"}`}
                    className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90"
                  >
                    <i className="fas fa-reply" />Répondre par email
                  </a>
                </div>
              </motion.div>
            ) : (
              <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-300 text-sm flex flex-col items-center gap-3">
                <i className="fas fa-envelope-open text-4xl" />
                <p>Sélectionnez un message pour le lire</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Tab Abonnés ── */}
      {tab === "abonnes" && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <i className="fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                value={searchSub}
                onChange={(e) => setSearchSub(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-accent"
                placeholder="Rechercher un abonné…"
              />
            </div>
            <span className="text-sm text-gray-500">{filteredSubs.length} résultat(s)</span>
          </div>

          {filteredSubs.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
              <i className="fas fa-users-slash text-3xl mb-2 block" />Aucun abonné trouvé.
            </div>
          ) : (
            <div className="bg-white rounded-2xl shadow-card overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left">
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Email</th>
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden sm:table-cell">Nom</th>
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Statut</th>
                    <th className="px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide hidden md:table-cell">Inscrit le</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredSubs.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-5 py-3 text-primary font-medium">{s.email}</td>
                      <td className="px-5 py-3 text-gray-500 hidden sm:table-cell">{s.name ?? "—"}</td>
                      <td className="px-5 py-3">
                        <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.isActive ? "bg-green-100 text-green-600" : "bg-gray-100 text-gray-500"}`}>
                          {s.isActive ? "Actif" : "Désabonné"}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-gray-400 text-xs hidden md:table-cell">
                        {new Date(s.subscribedAt).toLocaleDateString("fr-FR")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
