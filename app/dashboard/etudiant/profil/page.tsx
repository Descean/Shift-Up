"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

const allSkills = [
  "React", "Next.js", "TypeScript", "HTML/CSS", "Tailwind",
  "Figma", "SEO", "Community Management", "Rédaction web",
  "Photoshop", "WordPress", "Python", "Node.js", "Git / GitHub",
];

interface EtudiantStat {
  completedTasks: number;
  totalEarnings: number;
  badgesCount: number;
}

export default function EtudiantProfilPage() {
  const [name, setName]   = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio]     = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [etudiantStats, setEtudiantStats] = useState<EtudiantStat>({ completedTasks: 0, totalEarnings: 0, badgesCount: 0 });
  const [loading, setLoading]   = useState(true);
  const [savingInfo, setSavingInfo] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd]         = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showPwds, setShowPwds]     = useState(false);
  const [savingPwd, setSavingPwd]   = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/user/profile").then((r) => r.json()),
      fetch("/api/etudiant/badges").then((r) => r.json()),
      fetch("/api/micro-tasks").then((r) => r.json()),
    ]).then(([profileData, badgesData, tasksData]) => {
      const u = profileData.user;
      setName(u?.name ?? "");
      setEmail(u?.email ?? "");
      setPhone(u?.phone ?? "");
      const badgesUnlocked = (badgesData.badges ?? []).filter((b: { unlocked: boolean }) => b.unlocked).length;
      setEtudiantStats({
        completedTasks: u?.etudiantProfile?.completedTasks ?? 0,
        totalEarnings:  tasksData.totalEarnings ?? 0,
        badgesCount:    badgesUnlocked,
      });
    }).finally(() => setLoading(false));
  }, []);

  const niveau = etudiantStats.completedTasks >= 20 ? "Senior" : etudiantStats.completedTasks >= 10 ? "Confirmé" : etudiantStats.completedTasks >= 5 ? "Intermédiaire" : "Junior";

  function toggleSkill(skill: string) {
    setSkills((prev) => prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]);
  }

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const stats = [
    { label: "Tâches complétées", value: etudiantStats.completedTasks, icon: "fa-check-circle", color: "text-green-600" },
    { label: "Total gagné",       value: `${etudiantStats.totalEarnings.toLocaleString()} F`, icon: "fa-coins", color: "text-amber-600" },
    { label: "Badges obtenus",    value: etudiantStats.badgesCount,    icon: "fa-award",       color: "text-purple-600" },
    { label: "Niveau",            value: niveau,                        icon: "fa-layer-group", color: "text-accent" },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Mon Profil</h1>
        <p className="text-gray-500 text-sm">Gérez vos informations et compétences</p>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="bg-white rounded-2xl shadow-card p-4 text-center">
            <i className={`fas ${s.icon} ${s.color} text-lg mb-2`} />
            <p className="font-syne font-black text-primary">{s.value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Informations personnelles */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-white rounded-2xl shadow-card p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-accent to-secondary flex items-center justify-center">
            <span className="text-white text-xl font-black">{name.split(" ").map((n) => n[0]).slice(0, 2).join("") || "?"}</span>
          </div>
          <div>
            <p className="font-syne font-bold text-primary">{name}</p>
            <p className="text-sm text-gray-400">{email}</p>
            <button className="text-xs text-accent hover:underline mt-1"><i className="fas fa-camera mr-1" />Changer la photo</button>
          </div>
        </div>

        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">Informations personnelles</h2>
        <form onSubmit={saveInfo} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet</label>
            <input value={name} onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email <span className="text-xs text-gray-400 font-normal">(non modifiable)</span></label>
            <input value={email} readOnly className="w-full border border-gray-100 rounded-xl px-4 py-3 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <div className="relative">
              <i className="fas fa-phone absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-accent"
                placeholder="+229 96 00 00 00" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bio courte <span className="text-xs text-gray-400 font-normal ml-1">(visible sur votre profil public)</span>
            </label>
            <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={2} maxLength={150}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none"
              placeholder="Décrivez-vous en quelques mots..." />
            <p className="text-xs text-gray-400 text-right mt-1">{bio.length}/150</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Compétences <span className="text-xs text-gray-400 font-normal">({skills.length} sélectionnée{skills.length > 1 ? "s" : ""})</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {allSkills.map((skill) => (
                <button key={skill} type="button" onClick={() => toggleSkill(skill)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${skills.includes(skill) ? "bg-accent text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}>
                  {skills.includes(skill) && <i className="fas fa-check mr-1 text-xs" />}{skill}
                </button>
              ))}
            </div>
          </div>
          <button type="submit" disabled={savingInfo}
            className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60">
            {savingInfo ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Enregistrement…</span>
              : <><i className="fas fa-check mr-2" />Enregistrer les modifications</>}
          </button>
        </form>
      </motion.div>

      {/* Mot de passe */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white rounded-2xl shadow-card p-6">
        <h2 className="font-syne font-bold text-primary mb-4 text-sm uppercase tracking-widest">Changer le mot de passe</h2>
        <form onSubmit={savePassword} className="space-y-4">
          {[
            { label: "Mot de passe actuel",              value: currentPwd, setter: setCurrentPwd, placeholder: "Mot de passe actuel", showToggle: true },
            { label: "Nouveau mot de passe",             value: newPwd,     setter: setNewPwd,     placeholder: "Minimum 8 caractères", showToggle: false },
            { label: "Confirmer le nouveau mot de passe", value: confirmPwd, setter: setConfirmPwd, placeholder: "Répéter le nouveau mot de passe", showToggle: false },
          ].map((field) => (
            <div key={field.label}>
              <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
              <div className="relative">
                <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                <input type={showPwds ? "text" : "password"} value={field.value}
                  onChange={(e) => field.setter(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3 text-sm focus:outline-none focus:border-accent"
                  placeholder={field.placeholder} />
                {field.showToggle && (
                  <button type="button" onClick={() => setShowPwds(!showPwds)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                    <i className={`fas fa-${showPwds ? "eye-slash" : "eye"} text-sm`} />
                  </button>
                )}
              </div>
            </div>
          ))}
          <button type="submit" disabled={savingPwd || !currentPwd || !newPwd || !confirmPwd}
            className="w-full border-2 border-accent text-accent py-3 rounded-xl font-semibold text-sm hover:bg-accent hover:text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
            {savingPwd ? <span className="flex items-center justify-center gap-2"><span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />Modification…</span>
              : <><i className="fas fa-key mr-2" />Mettre à jour le mot de passe</>}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
