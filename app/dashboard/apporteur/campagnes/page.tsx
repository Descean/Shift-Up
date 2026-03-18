"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";

interface Campaign {
  id: string;
  name: string;
  channel: string;
  service: string;
  clicks: number;
  leads: number;
  conversions: number;
  status: string;
  startDate: string;
}

const channelIcons: Record<string, string> = {
  WhatsApp: "fa-whatsapp",
  LinkedIn: "fa-linkedin",
  Email: "fa-envelope",
  Facebook: "fa-facebook",
  Instagram: "fa-instagram",
};

const statusStyle: Record<string, string> = {
  ACTIVE:   "bg-green-100 text-green-700",
  PAUSEE:   "bg-amber-100 text-amber-700",
  TERMINEE: "bg-gray-100 text-gray-500",
};

const statusLabel: Record<string, string> = {
  ACTIVE: "Active", PAUSEE: "En pause", TERMINEE: "Terminée",
};

export default function ApporteurCampagnesPage() {
  const { data: session } = useSession();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading]     = useState(true);
  const [showNew, setShowNew]     = useState(false);
  const [form, setForm]           = useState({ name: "", channel: "WhatsApp", service: "" });
  const [saving, setSaving]       = useState(false);

  useEffect(() => {
    fetch("/api/apporteur/campagnes")
      .then((r) => r.json())
      .then((data) => setCampaigns(data.campaigns ?? []))
      .finally(() => setLoading(false));
  }, []);

  const totalClicks      = campaigns.reduce((s, c) => s + c.clicks, 0);
  const totalLeads       = campaigns.reduce((s, c) => s + c.leads, 0);
  const totalConversions = campaigns.reduce((s, c) => s + c.conversions, 0);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const r = await fetch("/api/apporteur/campagnes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await r.json();
      setCampaigns((prev) => [data.campaign, ...prev]);
      toast.success("Campagne créée ! Votre lien de tracking a été généré.");
      setShowNew(false);
      setForm({ name: "", channel: "WhatsApp", service: "" });
    } catch {
      toast.error("Erreur lors de la création.");
    } finally {
      setSaving(false);
    }
  }

  async function togglePause(c: Campaign) {
    const newStatus = c.status === "ACTIVE" ? "PAUSEE" : "ACTIVE";
    try {
      await fetch("/api/apporteur/campagnes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: c.id, status: newStatus }),
      });
      setCampaigns((prev) => prev.map((x) => x.id === c.id ? { ...x, status: newStatus } : x));
      toast.success(newStatus === "PAUSEE" ? "Campagne mise en pause." : "Campagne réactivée.");
    } catch {
      toast.error("Erreur.");
    }
  }

  const affiliationCode = (session?.user as { affiliationCode?: string })?.affiliationCode ?? "SU-AP";

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
          <h1 className="font-syne font-black text-2xl text-primary">Mes Campagnes</h1>
          <p className="text-gray-500 text-sm mt-1">Organisez et suivez vos actions de prospection.</p>
        </div>
        <button onClick={() => setShowNew(true)}
          className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2">
          <i className="fas fa-plus" />Nouvelle campagne
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Clics totaux",  value: totalClicks,       icon: "fa-mouse-pointer", color: "from-blue-400 to-accent" },
          { label: "Leads générés", value: totalLeads,        icon: "fa-user-plus",     color: "from-amber-400 to-orange-400" },
          { label: "Conversions",   value: totalConversions,  icon: "fa-check-circle",  color: "from-secondary to-teal-400" },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-card p-4 flex items-center gap-3">
            <div className={`w-10 h-10 bg-gradient-to-br ${s.color} rounded-xl flex items-center justify-center text-white flex-shrink-0`}>
              <i className={`fas ${s.icon} text-sm`} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{s.label}</p>
              <p className="font-syne font-bold text-lg text-primary">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Formulaire nouvelle campagne */}
      {showNew && (
        <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-2xl shadow-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-primary">Créer une campagne</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-times" /></button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Nom de la campagne</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Prospection PME Cotonou – Mars"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none" />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Canal de diffusion</label>
                <select value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none">
                  {["WhatsApp", "LinkedIn", "Facebook", "Instagram", "Email", "Autre"].map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Service ciblé</label>
                <select value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none">
                  <option value="">Tous les services</option>
                  <option>Identité Visuelle & Branding</option>
                  <option>Site Web Vitrine</option>
                  <option>Montage de Dossiers</option>
                  <option>Stratégie Marketing</option>
                  <option>Conseil Stratégique</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={saving}
                className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors disabled:opacity-60">
                {saving ? "Création…" : "Créer la campagne"}
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Liste */}
      {campaigns.length === 0 ? (
        <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400 text-sm">
          <i className="fas fa-bullhorn text-3xl mb-3 block" />
          Aucune campagne. Créez votre première campagne pour commencer à prospecter.
        </div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c, i) => (
            <motion.div key={c.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-white rounded-2xl shadow-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                    <i className={`fab ${channelIcons[c.channel] ?? "fa-share-alt"} text-accent`} />
                  </div>
                  <div>
                    <p className="font-syne font-bold text-primary">{c.name}</p>
                    <p className="text-xs text-gray-400">{c.service || "Tous services"} · Depuis le {c.startDate}</p>
                  </div>
                </div>
                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[c.status] ?? statusStyle.TERMINEE}`}>
                  {statusLabel[c.status] ?? c.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "Clics",       value: c.clicks,      color: "text-blue-600" },
                  { label: "Leads",       value: c.leads,       color: "text-amber-600" },
                  { label: "Conversions", value: c.conversions, color: "text-green-600" },
                ].map((stat) => (
                  <div key={stat.label} className="bg-gray-50 rounded-xl py-2">
                    <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                    <p className="text-xs text-gray-400">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-4 flex gap-2">
                <button onClick={() => {
                    navigator.clipboard.writeText(`https://shiftup.bj?ref=${affiliationCode}&utm_campaign=${c.id}`);
                    toast.success("Lien copié !");
                  }}
                  className="flex-1 text-center text-xs text-accent font-semibold py-2 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors">
                  <i className="fas fa-copy mr-1" />Copier le lien
                </button>
                <button onClick={() => togglePause(c)}
                  className="flex-1 text-center text-xs text-gray-500 font-semibold py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <i className={`fas fa-${c.status === "ACTIVE" ? "pause" : "play"} mr-1`} />
                  {c.status === "ACTIVE" ? "Mettre en pause" : "Réactiver"}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
