/**
 * app/dashboard/client/profil/page.tsx — Profil & paramètres du compte (client)
 *
 * Permet au client connecté de :
 *  1. Modifier ses informations personnelles (nom, téléphone, avatar)
 *  2. Changer son mot de passe
 *  3. Gérer ses préférences de notifications
 *  4. Consulter son code de parrainage (pour inviter des amis)
 *
 * Consomme :
 *  - GET  /api/user/profile  → charge les infos actuelles de l'utilisateur
 *  - PATCH /api/user/profile → met à jour les infos (nom, téléphone, image)
 *  - PATCH /api/auth/reset-password → changement de mot de passe (flux simplifié)
 *
 * Données : actuellement mockées — remplacer les useState initiaux par
 *           un useEffect qui appelle GET /api/user/profile.
 */

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

// ─── Composant principal ───────────────────────────────────────────────────────

export default function ProfilPage() {
  // ── Informations personnelles ────────────────────────────────────────────
  // TODO: charger depuis GET /api/user/profile au montage
  const [name, setName]   = useState("Kofi Mensah");
  const [email]           = useState("kofi@example.com");  // email non modifiable
  const [phone, setPhone] = useState("+229 97 00 00 00");
  const [savingInfo, setSavingInfo] = useState(false);

  // ── Changement de mot de passe ───────────────────────────────────────────
  const [currentPwd, setCurrentPwd]     = useState("");
  const [newPwd, setNewPwd]             = useState("");
  const [confirmPwd, setConfirmPwd]     = useState("");
  const [showPwds, setShowPwds]         = useState(false);
  const [savingPwd, setSavingPwd]       = useState(false);

  // ── Préférences de notifications ─────────────────────────────────────────
  // Chaque clé correspond à un type d'email ou notification push
  const [notifPrefs, setNotifPrefs] = useState({
    emailPrestations: true,   // avancement des prestations
    emailPaiements:   true,   // confirmation de paiements
    emailPromos:      false,  // offres et actualités
    pushBrowser:      false,  // notifications navigateur
  });

  // ── Code de parrainage (lecture seule) ───────────────────────────────────
  const referralCode = "SU-KM2025";
  const referralLink = `https://shiftup.bj/inscription?ref=${referralCode}`;

  // ─── Sauvegarde des infos personnelles ────────────────────────────────────
  /**
   * saveInfo — Envoie le nom et le téléphone mis à jour au backend.
   *
   * TODO: remplacer le setTimeout par :
   *   const res = await fetch("/api/user/profile", {
   *     method: "PATCH",
   *     headers: { "Content-Type": "application/json" },
   *     body: JSON.stringify({ name, phone }),
   *   });
   */
  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return toast.error("Le nom est obligatoire.");
    setSavingInfo(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingInfo(false);
    toast.success("Profil mis à jour !");
  }

  // ─── Changement de mot de passe ──────────────────────────────────────────
  /**
   * savePassword — Vérifie les deux mots de passe et envoie la requête.
   *
   * TODO: remplacer par PATCH /api/user/password { currentPassword, newPassword }
   *       (route à créer, qui vérifie bcrypt.compare avant de hacher le nouveau).
   */
  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    if (newPwd.length < 8) return toast.error("Minimum 8 caractères.");
    if (newPwd !== confirmPwd) return toast.error("Les mots de passe ne correspondent pas.");
    setSavingPwd(true);
    await new Promise((r) => setTimeout(r, 600));
    setSavingPwd(false);
    setCurrentPwd("");
    setNewPwd("");
    setConfirmPwd("");
    toast.success("Mot de passe modifié !");
  }

  // ─── Copie du lien de parrainage ─────────────────────────────────────────
  async function copyReferral() {
    try {
      await navigator.clipboard.writeText(referralLink);
      toast.success("Lien copié !");
    } catch {
      toast.error("Impossible de copier automatiquement.");
    }
  }

  // ─── Toggle notification ──────────────────────────────────────────────────
  /** Bascule une préférence de notification (optimiste — pas de sauvegarde API ici) */
  function toggleNotif(key: keyof typeof notifPrefs) {
    setNotifPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-2xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Mon Profil</h1>
        <p className="text-gray-500 text-sm">Gérez vos informations et paramètres</p>
      </motion.div>

      {/* ── Carte : Informations personnelles ────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-card p-6"
      >
        {/* Avatar + nom */}
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          {/* Avatar généré avec initiales */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xl font-black">
              {name.split(" ").map((n) => n[0]).slice(0, 2).join("")}
            </span>
          </div>
          <div>
            <p className="font-syne font-bold text-primary">{name}</p>
            <p className="text-sm text-gray-400">{email}</p>
            {/* Bouton upload avatar — TODO: implémenter upload vers /api/user/avatar */}
            <button className="text-xs text-accent hover:underline mt-1">
              <i className="fas fa-camera mr-1" />
              Changer la photo
            </button>
          </div>
        </div>

        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">
          Informations personnelles
        </h2>

        <form onSubmit={saveInfo} className="space-y-4">
          {/* Nom complet */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Votre nom complet"
            />
          </div>

          {/* Email (lecture seule) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Adresse email
              <span className="ml-2 text-xs text-gray-400 font-normal">(non modifiable)</span>
            </label>
            <input
              value={email}
              readOnly
              className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Téléphone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <div className="relative">
              <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                placeholder="+229 97 00 00 00"
              />
            </div>
          </div>

          {/* Bouton de sauvegarde */}
          <button
            type="submit"
            disabled={savingInfo}
            className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
          >
            {savingInfo ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Enregistrement…
              </span>
            ) : (
              <>
                <i className="fas fa-check mr-2" />
                Enregistrer les modifications
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* ── Carte : Changer le mot de passe ──────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-2xl shadow-card p-6"
      >
        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">
          Changer le mot de passe
        </h2>

        <form onSubmit={savePassword} className="space-y-4">
          {/* Mot de passe actuel */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mot de passe actuel
            </label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type={showPwds ? "text" : "password"}
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-accent"
                placeholder="Mot de passe actuel"
              />
              {/* Bouton afficher/masquer (commun aux 3 champs) */}
              <button
                type="button"
                onClick={() => setShowPwds(!showPwds)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <i className={`fas fa-${showPwds ? "eye-slash" : "eye"} text-sm`} />
              </button>
            </div>
          </div>

          {/* Nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type={showPwds ? "text" : "password"}
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent"
                placeholder="Minimum 8 caractères"
              />
            </div>
          </div>

          {/* Confirmer le nouveau mot de passe */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmer le nouveau mot de passe
            </label>
            <div className="relative">
              <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type={showPwds ? "text" : "password"}
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent"
                placeholder="Répéter le nouveau mot de passe"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd}
            className="w-full border-2 border-accent text-accent py-3 rounded-xl font-semibold text-sm hover:bg-accent hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {savingPwd ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Modification…
              </span>
            ) : (
              <>
                <i className="fas fa-key mr-2" />
                Mettre à jour le mot de passe
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* ── Carte : Notifications ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-2xl shadow-card p-6"
      >
        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">
          Préférences de notifications
        </h2>

        <div className="space-y-4">
          {[
            {
              key: "emailPrestations" as const,
              label: "Avancement des prestations",
              desc: "Recevoir un email à chaque changement de statut de vos projets",
            },
            {
              key: "emailPaiements" as const,
              label: "Confirmation de paiements",
              desc: "Reçus et confirmations de transactions",
            },
            {
              key: "emailPromos" as const,
              label: "Offres & actualités SHIFT UP",
              desc: "Nouveaux services, promotions et articles de blog",
            },
            {
              key: "pushBrowser" as const,
              label: "Notifications navigateur",
              desc: "Alertes en temps réel dans votre navigateur",
            },
          ].map((item) => (
            <div key={item.key} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div>
                <p className="text-sm font-medium text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
              </div>
              {/* Toggle switch */}
              <button
                onClick={() => toggleNotif(item.key)}
                className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ml-4 ${
                  notifPrefs[item.key] ? "bg-accent" : "bg-gray-200"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    notifPrefs[item.key] ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Carte : Parrainage ───────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-2xl shadow-card p-6"
      >
        <h2 className="font-syne font-bold text-primary mb-1 text-sm uppercase tracking-widest">
          Mon code de parrainage
        </h2>
        <p className="text-xs text-gray-400 mb-4">
          Partagez ce lien avec vos contacts. Chaque inscription via votre lien
          vous fait bénéficier d'avantages exclusifs.
        </p>

        {/* Code de parrainage */}
        <div className="flex items-center gap-3 bg-gray-50 rounded-xl p-4">
          <span className="font-mono font-bold text-accent text-lg tracking-widest flex-1">
            {referralCode}
          </span>
          <button
            onClick={copyReferral}
            className="flex items-center gap-2 text-sm font-medium text-white bg-accent px-4 py-2 rounded-lg hover:bg-accent/90 transition-colors"
          >
            <i className="fas fa-copy" />
            Copier le lien
          </button>
        </div>

        {/* Lien complet */}
        <p className="text-xs text-gray-400 mt-2 font-mono break-all">{referralLink}</p>
      </motion.div>
    </div>
  );
}
