"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

type Profile = {
  name: string; email: string; ifu: string; level: string;
  totalEarnings: number; pendingEarnings: number; totalReferrals: number;
  affiliationCode: string; joinedAt: string;
};

const levelConfig: Record<string, { label: string; color: string; gradient: string; nextLevel?: string; nextThreshold?: number }> = {
  BRONZE:  { label: "Bronze",  color: "text-amber-600", gradient: "from-primary to-accent",  nextLevel: "Argent",  nextThreshold: 10 },
  ARGENT:  { label: "Argent",  color: "text-gray-500",  gradient: "from-primary to-accent",    nextLevel: "Or",      nextThreshold: 25 },
  OR:      { label: "Or",      color: "text-secondary-500",gradient: "from-primary to-accent", nextLevel: "Platine", nextThreshold: 50 },
  PLATINE: { label: "Platine", color: "text-gray-500", gradient: "from-primary to-accent",  nextLevel: "Diamant", nextThreshold: 100 },
  DIAMANT: { label: "Diamant", color: "text-accent-500",  gradient: "from-primary to-accent" },
};

export default function ApporteurProfilPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ name: "", phone: "", paymentMethod: "MTN Mobile Money", paymentNumber: "" });
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetch("/api/apporteur/profile")
      .then((r) => r.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setForm((f) => ({ ...f, name: data.profile.name }));
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Profil mis à jour !");
    setEditing(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="bg-white rounded-2xl shadow-card p-12 text-center text-gray-400">
        <i className="fas fa-user-slash text-3xl mb-3 block" />
        <p>Profil apporteur introuvable.</p>
      </div>
    );
  }

  const lvl = levelConfig[profile.level] ?? levelConfig.BRONZE;
  const initials = profile.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  const joinedAt = new Date(profile.joinedAt).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary">Mon Profil Apporteur</h1>
        <p className="text-gray-500 text-sm mt-1">Gérez vos informations et vos préférences de paiement.</p>
      </div>

      {/* Level card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-r ${lvl.gradient} rounded-2xl p-6 text-white`}
      >
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
            <span className="font-syne font-black text-2xl">{initials}</span>
          </div>
          <div>
            <p className="font-syne font-black text-2xl">{profile.name}</p>
            <p className="text-white/70 text-sm">Apporteur d'affaires · Niveau <strong>{lvl.label}</strong></p>
            <p className="text-white/50 text-xs mt-0.5">Membre depuis {joinedAt}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-3 gap-4">
          {[
            { label: "Conversions",  value: profile.totalReferrals },
            { label: "Total gagné",  value: `${profile.totalEarnings.toLocaleString()} F` },
            { label: "Code",         value: profile.affiliationCode },
          ].map((s) => (
            <div key={s.label} className="bg-white/10 rounded-xl p-3 text-center">
              <p className="font-syne font-bold text-lg">{s.value}</p>
              <p className="text-white/70 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
        {lvl.nextLevel && (
          <div className="mt-4">
            <p className="text-white/70 text-xs mb-1">
              {profile.totalReferrals} / {lvl.nextThreshold} conversions pour atteindre le niveau {lvl.nextLevel}
            </p>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full"
                style={{ width: `${Math.min((profile.totalReferrals / (lvl.nextThreshold || 1)) * 100, 100)}%` }}
              />
            </div>
          </div>
        )}
      </motion.div>

      {/* Profile form */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-syne font-bold text-primary">
            <i className="fas fa-user-edit mr-2 text-accent" />
            Informations personnelles
          </h2>
          {!editing && (
            <button onClick={() => setEditing(true)} className="text-sm text-accent font-semibold hover:underline flex items-center gap-1">
              <i className="fas fa-pen text-xs" /> Modifier
            </button>
          )}
        </div>

        <form onSubmit={save}>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Nom complet</label>
              <input
                disabled={!editing}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Email</label>
              <input disabled value={profile.email} className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400" />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">Téléphone</label>
              <input
                disabled={!editing}
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Non renseigné"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none disabled:bg-gray-50 disabled:text-gray-500"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 font-medium block mb-1">IFU (Numéro fiscal)</label>
              <input disabled value={profile.ifu} className="w-full border border-gray-100 rounded-xl px-4 py-2.5 text-sm bg-gray-50 text-gray-400" />
            </div>
          </div>

          <div className="mt-5 border-t border-gray-50 pt-5">
            <p className="text-sm font-semibold text-primary mb-3">
              <i className="fas fa-mobile-alt mr-2 text-accent" />
              Préférences de paiement
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Méthode de paiement</label>
                <select
                  disabled={!editing}
                  value={form.paymentMethod}
                  onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                >
                  <option>MTN Mobile Money</option>
                  <option>Moov Money</option>
                  <option>Virement bancaire</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium block mb-1">Numéro de paiement</label>
                <input
                  disabled={!editing}
                  value={form.paymentNumber}
                  onChange={(e) => setForm({ ...form, paymentNumber: e.target.value })}
                  placeholder="Non renseigné"
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-accent/30 focus:border-accent outline-none disabled:bg-gray-50 disabled:text-gray-500"
                />
              </div>
            </div>
          </div>

          {editing && (
            <div className="flex gap-3 mt-5">
              <button type="submit" className="bg-accent text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-accent/90 transition-colors">
                Enregistrer les modifications
              </button>
              <button type="button" onClick={() => setEditing(false)} className="text-gray-500 px-5 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
                Annuler
              </button>
            </div>
          )}
        </form>
      </div>

      {/* Code affiliation */}
      <div className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4">
          <i className="fas fa-link mr-2 text-accent" />
          Mon code & lien d'affiliation
        </h2>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <span className="font-mono font-bold text-accent flex-1">{profile.affiliationCode}</span>
          <button onClick={() => { navigator.clipboard.writeText(profile.affiliationCode); toast.success("Code copié !"); }}
            className="text-xs text-accent hover:underline flex items-center gap-1">
            <i className="fas fa-copy" /> Copier
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3 bg-gray-50 rounded-xl px-4 py-3 border border-gray-200">
          <span className="text-xs text-gray-600 truncate flex-1">
            https://www.shiftup.bj/inscription?ref={profile.affiliationCode}
          </span>
          <button onClick={() => { navigator.clipboard.writeText(`https://www.shiftup.bj/inscription?ref=${profile.affiliationCode}`); toast.success("Lien copié !"); }}
            className="text-xs text-accent hover:underline flex-shrink-0">
            <i className="fas fa-copy" />
          </button>
        </div>
      </div>
    </div>
  );
}
