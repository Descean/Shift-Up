"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Service { id: string; title: string; description: string; priceMin: number; priceMax: number | null; duration: string | null; }

/* ─── Données statiques ──────────────────────────────────────────────────── */
const SECTORS = [
  { value: "Conseil Stratégique",  icon: "fas fa-chess",         color: "from-blue-500 to-blue-700",    desc: "Stratégie d'entreprise, audit, feuille de route" },
  { value: "Solutions Numériques", icon: "fas fa-code",           color: "from-accent to-secondary",     desc: "Sites web, applications, logiciels sur mesure" },
  { value: "Formation",            icon: "fas fa-graduation-cap", color: "from-purple-500 to-pink-500",  desc: "Formation professionnelle et montée en compétences" },
  { value: "Marketing Digital",    icon: "fas fa-bullhorn",       color: "from-orange-400 to-red-500",   desc: "SEO, réseaux sociaux, publicité digitale" },
  { value: "Juridique & Finance",  icon: "fas fa-scale-balanced", color: "from-gray-500 to-gray-700",    desc: "Droit des affaires, comptabilité, fiscalité" },
  { value: "Design & Branding",    icon: "fas fa-palette",        color: "from-pink-500 to-rose-500",    desc: "Identité visuelle, logo, supports marketing" },
  { value: "Autre",                icon: "fas fa-box-open",       color: "from-teal-500 to-cyan-500",    desc: "Besoin spécifique non listé ci-dessus" },
];

const BUDGETS  = ["< 100 000 XOF", "100 000 – 300 000 XOF", "300 000 – 500 000 XOF", "500 000 – 1 000 000 XOF", "> 1 000 000 XOF", "À discuter"];
const DEADLINES = ["Urgent (< 1 semaine)", "2 semaines", "1 mois", "2-3 mois", "Plus de 3 mois", "Flexible"];

/* ─── Composant principal ────────────────────────────────────────────────── */
export default function NouvelleDemandePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]           = useState(1); // 1=Secteur 2=Service 3=Besoin 4=Infos 5=Confirmation
  const [sector, setSector]       = useState<string>("");
  const [services, setServices]   = useState<Service[]>([]);
  const [serviceId, setServiceId] = useState<string>("");
  const [customService, setCustomService] = useState("");
  const [brief, setBrief]         = useState("");
  const [budget, setBudget]       = useState("");
  const [deadline, setDeadline]   = useState("");
  const [company, setCompany]     = useState("");
  const [phone, setPhone]         = useState("");
  const [files, setFiles]         = useState<{ url: string; name: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Chargement des services du secteur sélectionné
  useEffect(() => {
    if (!sector || sector === "Autre") { setServices([]); setServiceId(""); return; }
    fetch("/api/admin/services")
      .then((r) => r.json())
      .then((d) => {
        const filtered = (d.services ?? []).filter((s: Service & { domain: string; isActive: boolean }) =>
          s.domain === sector && s.isActive
        );
        setServices(filtered);
        setServiceId("");
      });
  }, [sector]);

  /* ─── Upload pièce jointe ──────────────────────────────────────────────── */
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Erreur upload"); return; }
      setFiles((prev) => [...prev, { url: d.url, name: d.name ?? file.name }]);
      toast.success("Fichier joint !");
    } catch { toast.error("Erreur lors de l'upload."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  /* ─── Soumission finale ────────────────────────────────────────────────── */
  async function submit() {
    if (!brief.trim()) { toast.error("Décrivez votre besoin."); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/prestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector, serviceId: serviceId || null, customService: customService || null,
          brief, budget, deadline, company, phone,
          attachments: files.map((f) => f.url),
        }),
      });
      const d = await r.json();
      if (!r.ok) { toast.error(d.error ?? "Erreur"); return; }
      setStep(5);
    } catch { toast.error("Erreur serveur."); }
    finally { setSubmitting(false); }
  }

  /* ─── Helpers ──────────────────────────────────────────────────────────── */
  const sectorInfo = SECTORS.find((s) => s.value === sector);
  const selectedService = services.find((s) => s.id === serviceId);
  const canGoStep2 = !!sector;
  const canGoStep3 = sector === "Autre" ? true : (!!serviceId || sector === "Autre");
  const canSubmit  = !!brief.trim();

  const stepLabel = ["", "Secteur", "Service", "Votre besoin", "Informations", "Confirmation"][step];

  /* ─── UI ─────────────────────────────────────────────────────────────────── */
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Nouvelle demande</h1>
        <p className="text-gray-500 text-sm">Décrivez votre besoin — nous vous enverrons un devis sous 48h.</p>
      </motion.div>

      {/* Progress bar */}
      {step < 5 && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-gray-400">
            {["Secteur", "Service", "Besoin", "Infos"].map((l, i) => (
              <span key={l} className={`font-medium ${step > i + 1 ? "text-accent" : step === i + 1 ? "text-primary" : ""}`}>
                {step > i + 1 && <i className="fas fa-check-circle mr-1 text-accent" />}{l}
              </span>
            ))}
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              animate={{ width: `${((step - 1) / 4) * 100}%` }}
              transition={{ duration: 0.4 }}
              className="h-full bg-gradient-to-r from-accent to-secondary rounded-full"
            />
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ── Étape 1 : Secteur ────────────────────────────────────────────── */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <h2 className="font-syne font-bold text-lg text-primary">Dans quel domaine avez-vous besoin d&apos;aide ?</h2>
            <div className="grid gap-3">
              {SECTORS.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setSector(s.value)}
                  className={`w-full text-left flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${sector === s.value ? "border-accent bg-accent/5" : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"}`}
                >
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${s.color} flex items-center justify-center flex-shrink-0`}>
                    <i className={`${s.icon} text-white text-lg`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-syne font-bold text-sm ${sector === s.value ? "text-accent" : "text-primary"}`}>{s.value}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{s.desc}</p>
                  </div>
                  {sector === s.value && <i className="fas fa-circle-check text-accent text-lg flex-shrink-0" />}
                </button>
              ))}
            </div>
            <button
              onClick={() => canGoStep2 && setStep(2)}
              disabled={!canGoStep2}
              className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
            >
              Continuer <i className="fas fa-arrow-right ml-1" />
            </button>
          </motion.div>
        )}

        {/* ── Étape 2 : Service ────────────────────────────────────────────── */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(1)} className="text-gray-400 hover:text-gray-600">
                <i className="fas fa-arrow-left" />
              </button>
              <h2 className="font-syne font-bold text-lg text-primary">
                {sector === "Autre" ? "Décrivez votre service" : `Services disponibles — ${sector}`}
              </h2>
            </div>

            {sector === "Autre" ? (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Intitulé de votre besoin *</label>
                <input
                  value={customService}
                  onChange={(e) => setCustomService(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
                  placeholder="Ex: Traduction de documents, photographie..."
                />
              </div>
            ) : services.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400 text-sm">
                <i className="fas fa-spinner fa-spin text-2xl mb-2 block" />
                Chargement des services…
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(s.id)}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${serviceId === s.id ? "border-accent bg-accent/5" : "border-gray-100 bg-white hover:border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className={`font-syne font-bold text-sm ${serviceId === s.id ? "text-accent" : "text-primary"}`}>{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span><i className="fas fa-tag mr-1" />{s.priceMin.toLocaleString()}{s.priceMax ? ` – ${s.priceMax.toLocaleString()}` : "+"} XOF</span>
                          {s.duration && <span><i className="fas fa-clock mr-1" />{s.duration}</span>}
                        </div>
                      </div>
                      {serviceId === s.id && <i className="fas fa-circle-check text-accent text-lg flex-shrink-0 mt-0.5" />}
                    </div>
                  </button>
                ))}
                {/* Option autre */}
                <button
                  onClick={() => { setServiceId("autre"); setCustomService(""); }}
                  className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${serviceId === "autre" ? "border-accent bg-accent/5" : "border-gray-100 bg-white hover:border-gray-200"}`}
                >
                  <p className={`font-syne font-bold text-sm ${serviceId === "autre" ? "text-accent" : "text-gray-500"}`}>
                    <i className="fas fa-plus-circle mr-2" />Autre / Besoin personnalisé
                  </p>
                </button>
                {serviceId === "autre" && (
                  <input
                    value={customService}
                    onChange={(e) => setCustomService(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent"
                    placeholder="Décrivez votre besoin spécifique..."
                    autoFocus
                  />
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600">Retour</button>
              <button
                onClick={() => canGoStep3 && setStep(3)}
                disabled={!canGoStep3 && sector !== "Autre"}
                className="flex-1 bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              >
                Continuer <i className="fas fa-arrow-right ml-1" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Étape 3 : Besoin ─────────────────────────────────────────────── */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(2)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left" /></button>
              <h2 className="font-syne font-bold text-lg text-primary">Décrivez votre besoin</h2>
            </div>

            {/* Récapitulatif service */}
            {(selectedService || customService) && (
              <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${sectorInfo?.color ?? "from-accent to-secondary"} text-white text-sm`}>
                <i className={`${sectorInfo?.icon ?? "fas fa-box"}`} />
                <span className="font-medium">{selectedService?.title ?? customService}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Décrivez votre besoin en détail * <span className="text-gray-400 font-normal">(plus c&apos;est précis, mieux c&apos;est)</span>
              </label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none"
                placeholder="Ex: Nous sommes une PME de 15 personnes. Nous avons besoin d'un site vitrine pour présenter nos services, avec un formulaire de contact et une page tarifs. Nous souhaitons un design moderne..."
              />
              <p className="text-xs text-gray-400 mt-1">{brief.length} caractères</p>
            </div>

            {/* Pièces jointes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-paperclip mr-1.5 text-gray-400" />Pièces jointes <span className="text-gray-400 font-normal">(optionnel — max 10 MB)</span>
              </label>
              {files.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-2">
                  {files.map((f, i) => (
                    <div key={i} className="flex items-center gap-2 bg-gray-100 rounded-lg px-3 py-1.5 text-xs text-gray-700">
                      <i className="fas fa-file text-gray-400" />
                      <span className="max-w-[120px] truncate">{f.name}</span>
                      <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 ml-1">
                        <i className="fas fa-times" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading || files.length >= 5}
                className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-accent hover:text-accent transition-colors w-full justify-center disabled:opacity-50"
              >
                {uploading ? <><span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />Upload en cours…</> : <><i className="fas fa-cloud-arrow-up" />Ajouter un fichier (PDF, image, Word…)</>}
              </button>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt" onChange={handleFileUpload} />
              {files.length >= 5 && <p className="text-xs text-gray-400 mt-1">Maximum 5 fichiers atteint.</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600">Retour</button>
              <button
                onClick={() => canSubmit && setStep(4)}
                disabled={!canSubmit}
                className="flex-1 bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40"
              >
                Continuer <i className="fas fa-arrow-right ml-1" />
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Étape 4 : Informations complémentaires ───────────────────────── */}
        {step === 4 && (
          <motion.div key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-5">
            <div className="flex items-center gap-3">
              <button onClick={() => setStep(3)} className="text-gray-400 hover:text-gray-600"><i className="fas fa-arrow-left" /></button>
              <h2 className="font-syne font-bold text-lg text-primary">Informations complémentaires</h2>
            </div>
            <p className="text-gray-500 text-sm">Ces informations nous aident à préparer un devis adapté à votre contexte.</p>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Budget estimé</label>
                <select value={budget} onChange={(e) => setBudget(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                  <option value="">Sélectionner…</option>
                  {BUDGETS.map((b) => <option key={b}>{b}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Délai souhaité</label>
                <select value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                  <option value="">Sélectionner…</option>
                  {DEADLINES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise / Organisation</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="Votre structure" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (pour ce projet)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="+229 97 00 00 00" />
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <p className="font-syne font-bold text-primary text-sm mb-3">Récapitulatif de votre demande</p>
              <div className="flex justify-between"><span className="text-gray-500">Secteur</span><span className="font-medium text-primary">{sector}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium text-primary">{selectedService?.title ?? customService ?? "Personnalisé"}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Pièces jointes</span><span className="font-medium text-primary">{files.length} fichier(s)</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600">Retour</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi…</> : <><i className="fas fa-paper-plane" />Envoyer ma demande</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Étape 5 : Confirmation ───────────────────────────────────────── */}
        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-check text-white text-3xl" />
            </div>
            <div>
              <h2 className="font-syne font-black text-2xl text-primary mb-2">Demande envoyée !</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">Notre équipe va analyser votre besoin et vous enverra un devis personnalisé <strong>sous 48h ouvrées</strong>. Un email de confirmation vous a été envoyé.</p>
            </div>
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 text-sm text-accent mx-auto max-w-xs">
              <i className="fas fa-info-circle mr-1.5" />Suivez l&apos;état de votre demande dans &ldquo;Mes prestations&rdquo;
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => router.push("/dashboard/client/prestations")} className="bg-gradient-to-r from-accent to-secondary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90">
                <i className="fas fa-briefcase mr-2" />Voir mes prestations
              </button>
              <button onClick={() => { setStep(1); setSector(""); setServiceId(""); setBrief(""); setFiles([]); }} className="border border-gray-200 px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
                Nouvelle demande
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <p className="text-xs text-gray-400 text-center">Étape {Math.min(step, 4)} sur 4 — {stepLabel}</p>
    </div>
  );
}
