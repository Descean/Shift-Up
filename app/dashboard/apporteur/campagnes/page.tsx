"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const mockCampagnes = [
  {
    id: "1",
    name: "Campagne Branding Janvier",
    channel: "WhatsApp",
    service: "Identité Visuelle & Branding",
    clicks: 47,
    leads: 8,
    conversions: 2,
    status: "ACTIVE",
    startDate: "02/01/2026",
  },
  {
    id: "2",
    name: "Prospection PME – Dossiers",
    channel: "LinkedIn",
    service: "Montage de Dossiers",
    clicks: 31,
    leads: 5,
    conversions: 1,
    status: "ACTIVE",
    startDate: "15/01/2026",
  },
  {
    id: "3",
    name: "Sites Web – Commerçants",
    channel: "Email",
    service: "Site Web Vitrine",
    clicks: 22,
    leads: 3,
    conversions: 0,
    status: "PAUSEE",
    startDate: "10/12/2025",
  },
];

const channelIcons: Record<string, string> = {
  WhatsApp: "fa-whatsapp",
  LinkedIn: "fa-linkedin",
  Email: "fa-envelope",
  Facebook: "fa-facebook",
  Instagram: "fa-instagram",
};

const statusStyle: Record<string, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  PAUSEE: "bg-amber-100 text-amber-700",
  TERMINEE: "bg-gray-100 text-gray-500",
};

export default function ApporteurCampagnesPage() {
  const [showNew, setShowNew] = useState(false);
  const [form, setForm] = useState({ name: "", channel: "WhatsApp", service: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Campagne créée ! Votre lien de tracking a été généré.");
    setShowNew(false);
    setForm({ name: "", channel: "WhatsApp", service: "" });
  };

  const totalClicks = mockCampagnes.reduce((s, c) => s + c.clicks, 0);
  const totalLeads = mockCampagnes.reduce((s, c) => s + c.leads, 0);
  const totalConversions = mockCampagnes.reduce((s, c) => s + c.conversions, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary">Mes Campagnes</h1>
          <p className="text-gray-500 text-sm mt-1">Organisez et suivez vos actions de prospection.</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="bg-accent text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-accent/90 transition-colors flex items-center gap-2"
        >
          <i className="fas fa-plus" />
          Nouvelle campagne
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Clics totaux", value: totalClicks, icon: "fa-mouse-pointer", color: "from-blue-400 to-accent" },
          { label: "Leads générés", value: totalLeads, icon: "fa-user-plus", color: "from-amber-400 to-orange-400" },
          { label: "Conversions", value: totalConversions, icon: "fa-check-circle", color: "from-secondary to-teal-400" },
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

      {/* New campaign form */}
      {showNew && (
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-card p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-syne font-bold text-primary">Créer une campagne</h2>
            <button onClick={() => setShowNew(false)} className="text-gray-400 hover:text-gray-600">
              <i className="fas fa-times" />
            </button>
          </div>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Nom de la campagne</label>
              <input
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Ex: Prospection PME Cotonou – Mars"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
              />
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Canal de diffusion</label>
                <select
                  value={form.channel}
                  onChange={(e) => setForm({ ...form, channel: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
                >
                  {["WhatsApp", "LinkedIn", "Facebook", "Instagram", "Email", "Autre"].map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Service ciblé</label>
                <select
                  value={form.service}
                  onChange={(e) => setForm({ ...form, service: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none"
                >
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
              <button type="submit" className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors">
                Créer la campagne
              </button>
              <button type="button" onClick={() => setShowNew(false)} className="text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          </form>
        </motion.div>
      )}

      {/* Campagnes list */}
      <div className="space-y-4">
        {mockCampagnes.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white rounded-2xl shadow-card p-5"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-accent/10 rounded-xl flex items-center justify-center">
                  <i className={`fab ${channelIcons[c.channel] || "fa-share-alt"} text-accent`} />
                </div>
                <div>
                  <p className="font-syne font-bold text-primary">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.service} · Depuis le {c.startDate}</p>
                </div>
              </div>
              <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusStyle[c.status]}`}>
                {c.status === "ACTIVE" ? "Active" : c.status === "PAUSEE" ? "En pause" : "Terminée"}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { label: "Clics", value: c.clicks, color: "text-blue-600" },
                { label: "Leads", value: c.leads, color: "text-amber-600" },
                { label: "Conversions", value: c.conversions, color: "text-green-600" },
              ].map((stat) => (
                <div key={stat.label} className="bg-gray-50 rounded-xl py-2">
                  <p className={`font-bold text-lg ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://shiftup.bj?ref=SU-AP-7291&utm_campaign=${c.id}`);
                  toast.success("Lien copié !");
                }}
                className="flex-1 text-center text-xs text-accent font-semibold py-2 rounded-xl bg-accent/5 hover:bg-accent/10 transition-colors"
              >
                <i className="fas fa-copy mr-1" />Copier le lien
              </button>
              <button
                onClick={() => toast.success("Campagne mise en pause.")}
                className="flex-1 text-center text-xs text-gray-500 font-semibold py-2 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <i className="fas fa-pause mr-1" />Mettre en pause
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
