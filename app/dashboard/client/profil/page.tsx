"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import NotificationsWhatsApp from "@/components/notifications/NotificationsWhatsApp";

export default function ProfilPage() {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [referralCode, setReferralCode] = useState("SU-CLIENT");
  const [loading, setLoading]     = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwds, setShowPwds]     = useState(false);
  const [savingPwd, setSavingPwd]   = useState(false);

  const [notifPrefs, setNotifPrefs] = useState({
    emailPrestations: true, emailPaiements: true, emailPromos: false, pushBrowser: false,
  });

  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.json())
      .then((data) => {
        const u = data.user;
        setName(u?.name ?? "");
        setEmail(u?.email ?? "");
        setPhone(u?.phone ?? "");
        setReferralCode(u?.affiliationCode ?? "SU-CLIENT");
      })
      .finally(() => setLoading(false));
  }, []);

  const referralLink = `https://www.shiftup.bj/inscription?ref=${referralCode}`;

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Le nom est obligatoire.");
    setSavingInfo(true);
    try {
      const r = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone }),
      });
      if (!r.ok) throw new Error();
      toast.success("Profil mis à jour !");
    } catch {
      toast.error("Erreur lors de la sauvegarde.");
    } finally {
      setSavingInfo(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 8) return toast.error("Minimum 8 caractères.");
    if (newPwd !== confirmPwd) return toast.error("Les mots de passe ne correspondent pas.");
    setSavingPwd(true);
    try {
      const r = await fetch("/api/user/password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd }),
      });
      const data = await r.json();
      if (!r.ok) return toast.error(data.error ?? "Erreur.");
      toast.success("Mot de passe modifié !");
      setCurrentPwd(""); setNewPwd(""); setConfirmPwd("");
    } catch {
      toast.error("Erreur lors de la modification.");
    } finally {
      setSavingPwd(false);
    }
  }

  async function copyReferral() {
    try { await navigator.clipboard.writeText(referralLink); toast.success("Lien copié !"); }
    catch { toast.error("Impossible de copier automatiquement."); }
  }

  function toggleNotif(key: keyof typeof notifPrefs) {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Mon Profil</h1>
        <p className="text-gray-500 text-sm">Gérez vos informations et paramètres</p>
      </motion.div>

      {/* Informations personnelles */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-black">
              {name.split(" ").map((n) => n[0]).slice(0, 2).join("") || "?"}
            </span>
          </div>
          <div>
            <p className="font-syne font-bold text-primary">{name}</p>
            <p className="text-sm text-gray-400">{email}</p>
            <button className="text-xs text-accent hover:underline mt-1">
              <i className="fas fa-camera mr-1" />Changer la photo
            </button>
          </div>
        </div>

        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">Informations personnelles</h2>
        <form onSubmit={saveInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Votre nom complet" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email <span className="text-xs text-gray-400 font-normal">(non modifiable)</span>
            </label>
            <input value={email} readOnly className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <div className="relative">
              <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                placeholder="+229 01 97 00 00 00" />
            </div>
          </div>
          <button type="submit" disabled={savingInfo}
            className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60">
            {savingInfo ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</span>
              : <><i className="fas fa-check mr-2" />Enregistrer les modifications</>}
          </button>
        </form>
      </motion.div>

      {/* Mot de passe */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">Changer le mot de passe</h2>
        <form onSubmit={savePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe actuel</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type={showPwds ? "text" : "password"} value={currentPwd} onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-accent"
                placeholder="Mot de passe actuel" />
              <button type="button" onClick={() => setShowPwds(!showPwds)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                <i className={`fas fa-${showPwds ? "eye-slash" : "eye"} text-sm`} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type={showPwds ? "text" : "password"} value={newPwd} onChange={(e) => setNewPwd(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent"
                placeholder="Minimum 8 caractères" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirmer le nouveau mot de passe</label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input type={showPwds ? "text" : "password"} value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent"
                placeholder="Répéter le nouveau mot de passe" />
            </div>
          </div>
          <button type="submit" disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd}
            className="w-full border-2 border-accent text-accent py-3 rounded-xl font-semibold text-sm hover:bg-accent hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {savingPwd ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Modification…</span>
              : <><i className="fas fa-key mr-2" />Mettre à jour le mot de passe</>}
          </button>
        </form>
      </motion.div>

      {/* Notifications */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">Préférences de notifications</h2>
        <div className="space-y-4">
          {[
            { key: "emailPrestations" as const, label: "Avancement des prestations",   desc: "Recevoir un email à chaque changement de statut de vos projets" },
            { key: "emailPaiements"   as const, label: "Confirmation de paiements",    desc: "Reçus et confirmations de transactions" },
            { key: "emailPromos"      as const, label: "Offres & actualités SHIFT UP", desc: "Nouveaux services, promotions et articles de blog" },
            { key: "pushBrowser"      as const, label: "Notifications navigateur",     desc: "Alertes en temps réel dans votre navigateur" },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              <button onClick={() => toggleNotif(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${notifPrefs[item.key] ? "bg-accent" : "bg-gray-200"}`}>
                <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${notifPrefs[item.key] ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Notifications WhatsApp */}
      <NotificationsWhatsApp />

      {/* Parrainage */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-1 text-sm uppercase tracking-widest">Mon code de parrainage</h2>
        <p className="text-xs text-gray-400 mb-4">Partagez ce lien avec vos contacts. Chaque inscription via votre lien vous fait bénéficier d'avantages exclusifs.</p>
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
          <span className="font-mono font-bold text-accent text-lg tracking-widest flex-1">{referralCode}</span>
          <button onClick={copyReferral} className="flex items-center gap-2 text-sm font-medium text-white bg-accent px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors">
            <i className="fas fa-copy" />Copier le lien
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 font-mono break-all">{referralLink}</p>
      </motion.div>
    </div>
  );
}
