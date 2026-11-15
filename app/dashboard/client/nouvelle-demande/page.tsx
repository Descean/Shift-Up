"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import toast from "react-hot-toast";

import { televerser } from "@/lib/televerser";
import { SECTEUR_MONTAGE, dossierVide, type DossierSaisie } from "@/lib/montage";
import FicheMarche, { ficheComplete } from "@/components/prestations/FicheMarche";
import { SECTORS as CATALOGUE, trouverDomaine, prixOffre } from "@/lib/catalogue";
/* ─── Types ─────────────────────────────────────────────────────────────── */
interface Service { id: string; title: string; description: string; priceMin: number; priceMax: number | null; duration: string | null; }

/* ─── Catalogue (source commune avec la page /services) ────────────────── */
const SECTORS = [
  ...CATALOGUE.map((d) => ({ value: d.label, id: d.id, icon: d.icon, color: "from-primary to-accent", desc: d.intro })),
  { value: "Autre", id: "autre", icon: "fas fa-box-open", color: "from-primary to-accent", desc: "Besoin spécifique non listé ci-dessus" },
];

/** Offre proposée à l'étape 2 : offre du catalogue (prix indicatif) ou service ajouté dans l'admin. */
type Choix = Service & { source: "catalogue" | "base"; prix: string };

const BUDGETS  = ["< 100 000 XOF", "100 000 – 300 000 XOF", "300 000 – 500 000 XOF", "500 000 – 1 000 000 XOF", "> 1 000 000 XOF", "À discuter"];
const DEADLINES = ["Urgent (< 1 semaine)", "2 semaines", "1 mois", "2-3 mois", "Plus de 3 mois", "Flexible"];

/* ─── Composant principal ────────────────────────────────────────────────── */
export default function NouvelleDemandePage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep]           = useState(1); // 1=Secteur 2=Service 3=Besoin 4=Infos 5=Confirmation
  const [sector, setSector]       = useState<string>("");
  const [services, setServices]   = useState<Choix[]>([]);
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
  const [loadingServices, setLoadingServices] = useState(false);
  // Montage de dossier : fiche de l'appel d'offres + DAO
  const [fiche, setFiche]         = useState<DossierSaisie>(dossierVide());
  const [dao, setDao]             = useState<{ url: string; name: string } | null>(null);
  const [envoiDao, setEnvoiDao]   = useState(false);
  const daoRef = useRef<HTMLInputElement>(null);
  const montage = sector === SECTEUR_MONTAGE;
  // « Mes entreprises » : entreprise soumissionnaire et reprise automatique des pièces de son coffre
  const [entreprises, setEntreprises] = useState<{ id: string; nom: string; pieces: { dateExpiration: string | null }[] }[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  useEffect(() => {
    fetch("/api/client/entreprises").then((r) => r.json()).then((d) => {
      const liste = d.entreprises ?? [];
      setEntreprises(liste);
      // Arrivée depuis « Mes entreprises » : entreprise déjà choisie
      const choisie = liste.find((x: { id: string }) => x.id === new URLSearchParams(window.location.search).get("entreprise"));
      if (choisie) { setEntrepriseId(choisie.id); setFiche((f) => ({ ...f, soumissionnaire: choisie.nom })); setCompany(choisie.nom); }
    }).catch(() => {});
  }, []);

  // Service choisi sur la page /services (?sector=…&service=…)
  const [servicePrevu, setServicePrevu] = useState("");
  // « Monter ce dossier » depuis la veille : fiche pré-remplie avec l'avis
  const [avisVeille, setAvisVeille] = useState<string | null>(null);
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("avis");
    if (!id) return;
    fetch(`/api/veille/avis/${encodeURIComponent(id)}`).then((r) => (r.ok ? r.json() : null)).then((d) => {
      const a = d?.avis;
      if (!a) return;
      const types = ["Travaux", "Fournitures", "Services courants", "Prestations intellectuelles"];
      const limite = a.dateLimite ? new Date(new Date(a.dateLimite).getTime() + 3_600_000).toISOString().slice(0, 16) : "";
      setSector(SECTEUR_MONTAGE);
      setServiceId("autre");
      setCustomService("Montage de dossier de soumission");
      setFiche((f) => ({
        ...f, referenceAvis: a.reference ?? "", intitule: (a.objet ?? "").slice(0, 400), autorite: a.autorite ?? "",
        typeMarche: types.includes(a.typeMarche) ? a.typeMarche : f.typeMarche, financement: a.financement ?? "", dateLimite: limite,
      }));
      setAvisVeille(a.reference ?? "");
      setStep(3);
    }).catch(() => {});
  }, []);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.get("avis")) return;
    const sec = trouverDomaine(q.get("sector"))?.label;
    if (sec) {
      setSector(sec);
      setServicePrevu(q.get("service") ?? "");
      setStep(2);
    }
  }, []);

  // Offres du domaine : catalogue commun + services ajoutés dans l'admin (sans doublon d'intitulé)
  useEffect(() => {
    if (!sector || sector === "Autre") { setServices([]); setServiceId(""); return; }
    const domaine = trouverDomaine(sector);
    const duCatalogue: Choix[] = (domaine?.services ?? []).map((o) => ({
      id: `offre:${o.title}`, title: o.title, description: o.description, priceMin: 0, priceMax: null,
      duration: o.duration ?? null, source: "catalogue", prix: prixOffre(o),
    }));
    const choisir = (liste: Choix[]) => {
      setServices(liste);
      const prevu = servicePrevu.trim().toLowerCase();
      const trouve = prevu ? liste.find((s) => s.title.trim().toLowerCase() === prevu) : null;
      if (trouve) { setServiceId(trouve.id); setCustomService(trouve.source === "catalogue" ? trouve.title : ""); }
      else if (prevu) { setServiceId("autre"); setCustomService(servicePrevu); }
      else setServiceId("");
    };
    choisir(duCatalogue);
    setLoadingServices(true);
    fetch("/api/services")
      .then((r) => r.json())
      .then((d) => {
        const titres = new Set(duCatalogue.map((o) => o.title.trim().toLowerCase()));
        const deLaBase: Choix[] = (d.services ?? [])
          .filter((s: Service & { domain: string; isActive: boolean }) => s.isActive && trouverDomaine(s.domain)?.id === domaine?.id && !titres.has(s.title.trim().toLowerCase()))
          .map((s: Service) => ({ ...s, source: "base" as const, prix: `${s.priceMin.toLocaleString("fr-FR")}${s.priceMax ? ` – ${s.priceMax.toLocaleString("fr-FR")}` : " et plus"} XOF` }));
        if (deLaBase.length) choisir([...duCatalogue, ...deLaBase]);
      })
      .catch(() => {})
      .finally(() => setLoadingServices(false));
  }, [sector, servicePrevu]);

  /* ─── Upload pièce jointe ──────────────────────────────────────────────── */
  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const d = await televerser(file);
      setFiles((prev) => [...prev, { url: d.url, name: d.name ?? file.name }]);
      toast.success("Fichier joint !");
    } catch (err) { toast.error((err as Error).message || "Erreur lors de l'envoi."); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ""; }
  }

  async function deposerDao(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (daoRef.current) daoRef.current.value = "";
    if (!file) return;
    setEnvoiDao(true);
    try {
      const d = await televerser(file);
      setDao({ url: d.url, name: d.name ?? file.name });
      toast.success("DAO joint !");
    } catch (err) { toast.error((err as Error).message || "Erreur lors de l'envoi."); }
    finally { setEnvoiDao(false); }
  }

  /* ─── Soumission finale ────────────────────────────────────────────────── */
  async function submit() {
    if (montage ? !ficheComplete(fiche) : !brief.trim()) { toast.error(montage ? "Complétez la fiche de l'appel d'offres." : "Décrivez votre besoin."); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/prestations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sector,
          serviceId: selectedService?.source === "base" ? selectedService.id : null,
          customService: selectedService?.source === "catalogue" ? selectedService.title : (customService || null),
          brief, budget, deadline, company, phone,
          attachments: files.map((f) => f.url),
          ...(montage ? { dossier: fiche, dao: dao ? { url: dao.url, nom: dao.name } : null, entrepriseId: entrepriseId || null } : {}),
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
  const canGoStep3 = sector === "Autre" ? !!customService.trim() : (serviceId === "autre" ? !!customService.trim() : !!serviceId);
  const canSubmit  = montage ? ficheComplete(fiche) : !!brief.trim();

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
              className="h-full bg-su-bleu rounded-full"
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
              className="w-full bg-su-bleu text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40 transition-opacity"
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
            ) : loadingServices && services.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-6 text-center text-gray-400 text-sm">
                <i className="fas fa-spinner fa-spin text-2xl mb-2 block" />
                Chargement des services…
              </div>
            ) : services.length === 0 ? (
              <div className="bg-gray-50 rounded-2xl p-5 space-y-3">
                <p className="text-gray-600 text-sm font-medium">Quel service souhaitez-vous ?</p>
                <input
                  value={customService}
                  onChange={(e) => { setCustomService(e.target.value); setServiceId("autre"); }}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent bg-white"
                  placeholder="Ex : montage d'un dossier de soumission, dossier de financement…"
                />
              </div>
            ) : (
              <div className="space-y-3">
                {services.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setServiceId(s.id); setCustomService(s.source === "catalogue" ? s.title : ""); }}
                    className={`w-full text-left p-4 rounded-2xl border-2 transition-all ${serviceId === s.id ? "border-accent bg-accent/5" : "border-gray-100 bg-white hover:border-gray-200"}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className={`font-syne font-bold text-sm ${serviceId === s.id ? "text-accent" : "text-primary"}`}>{s.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{s.description}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                          <span><i className="fas fa-tag mr-1" />{s.prix}</span>
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
                disabled={!canGoStep3}
                className="flex-1 bg-su-bleu text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40"
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
              <h2 className="font-syne font-bold text-lg text-primary">{montage ? "L'appel d'offres" : "Décrivez votre besoin"}</h2>
            </div>

            {/* Récapitulatif service */}
            {(selectedService || customService) && (
              <div className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${sectorInfo?.color ?? "from-accent to-secondary"} text-white text-sm`}>
                <i className={`${sectorInfo?.icon ?? "fas fa-box"}`} />
                <span className="font-medium">{selectedService?.title ?? customService}</span>
              </div>
            )}

            {montage && (
              <>
                {avisVeille && <p className="text-xs text-accent bg-accent/5 rounded-xl px-3 py-2"><i className="fas fa-binoculars mr-1.5" />Fiche pré-remplie depuis votre veille (avis {avisVeille}). Vérifiez-la et indiquez l&apos;entreprise qui soumissionne.</p>}
                <div className="rounded-2xl border border-su-lavande bg-su-brume p-4 space-y-2">
                  <label htmlFor="f-entreprise" className="block text-sm font-medium text-su-nuit">Entreprise qui soumissionne</label>
                  {entreprises.length > 0 ? (
                    <select id="f-entreprise" value={entrepriseId}
                      onChange={(e) => {
                        const id = e.target.value; setEntrepriseId(id);
                        const ent = entreprises.find((x) => x.id === id);
                        if (ent) { setFiche((f) => ({ ...f, soumissionnaire: ent.nom })); setCompany(ent.nom); }
                      }}
                      className="w-full border border-su-lavande bg-white rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-su-bleu">
                      <option value="">Autre entreprise (saisie ci-dessous)</option>
                      {entreprises.map((x) => <option key={x.id} value={x.id}>{x.nom} — {x.pieces.length} pièce(s) au coffre</option>)}
                    </select>
                  ) : null}
                  <p className="text-xs text-gray-500">
                    {entreprises.length > 0
                      ? "Les pièces de son coffre encore valides à la date limite seront reprises automatiquement."
                      : "Enregistrez vos entreprises et leurs pièces une fois pour toutes : elles seront reprises à chaque dossier."}
                    {" "}<a href="/dashboard/client/entreprises" className="font-semibold text-su-bleu underline">Mes entreprises</a>
                  </p>
                </div>
                <FicheMarche valeur={fiche} onChange={setFiche} />
                <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-700"><i className="fas fa-file-contract mr-1.5 text-accent" />Dossier d&apos;appel d&apos;offres (DAO) <span className="text-gray-400 font-normal">— recommandé</span></p>
                  {dao ? (
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 text-xs text-gray-700">
                      <i className="fas fa-file-pdf text-accent" /><span className="truncate flex-1">{dao.name}</span>
                      <button onClick={() => setDao(null)} aria-label="Retirer le DAO" className="text-red-400 hover:text-red-600"><i className="fas fa-times" /></button>
                    </div>
                  ) : (
                    <button onClick={() => daoRef.current?.click()} disabled={envoiDao}
                      className="w-full flex items-center justify-center gap-2 border-2 border-dashed border-gray-200 bg-white rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-accent hover:text-accent disabled:opacity-50">
                      {envoiDao ? <><span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />Envoi…</> : <><i className="fas fa-cloud-arrow-up" />Joindre le DAO (PDF, Word ou ZIP)</>}
                    </button>
                  )}
                  <input ref={daoRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.zip" onChange={deposerDao} />
                  <p className="text-xs text-gray-400">Après l&apos;envoi, la liste des pièces à fournir (RCCM, attestations, bilans, références…) apparaîtra dans votre espace : vous pourrez y déposer chaque document.</p>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {montage
                  ? <>Précisions <span className="text-gray-400 font-normal">(facultatif : additifs, visite de site, difficultés particulières…)</span></>
                  : <>Décrivez votre besoin en détail * <span className="text-gray-400 font-normal">(plus c&apos;est précis, mieux c&apos;est)</span></>}
              </label>
              <textarea
                value={brief}
                onChange={(e) => setBrief(e.target.value)}
                rows={montage ? 3 : 6}
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent resize-none"
                placeholder={montage
                  ? "Ex : l'additif n°1 a repoussé la date ; nous avons besoin du dossier imprimé en 4 exemplaires."
                  : "Ex: Nous sommes une PME de 15 personnes. Nous avons besoin d'un site vitrine pour présenter nos services, avec un formulaire de contact et une page tarifs. Nous souhaitons un design moderne..."}
              />
              <p className="text-xs text-gray-400 mt-1">{brief.length} caractères</p>
            </div>

            {/* Pièces jointes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <i className="fas fa-paperclip mr-1.5 text-gray-400" />Pièces jointes <span className="text-gray-400 font-normal">(facultatif — 50 Mo maximum par fichier)</span>
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
                disabled={uploading || files.length >= 10}
                className="flex items-center gap-2 border-2 border-dashed border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-500 hover:border-accent hover:text-accent transition-colors w-full justify-center disabled:opacity-50"
              >
                {uploading ? <><span className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />Upload en cours…</> : <><i className="fas fa-cloud-arrow-up" />Ajouter un fichier (PDF, image, Word…)</>}
              </button>
              <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.gif,.webp,.zip,.txt" onChange={handleFileUpload} />
              {files.length >= 10 && <p className="text-xs text-gray-400 mt-1">Maximum 10 fichiers atteint.</p>}
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600">Retour</button>
              <button
                onClick={() => canSubmit && setStep(4)}
                disabled={!canSubmit}
                className="flex-1 bg-su-bleu text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-40"
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
              {!montage && <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Délai souhaité</label>
                <select value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-accent">
                  <option value="">Sélectionner…</option>
                  {DEADLINES.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Entreprise / Organisation</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="Votre structure" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Téléphone (pour ce projet)</label>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-accent" placeholder="+229 01 97 00 00 00" />
              </div>
            </div>

            {/* Récapitulatif */}
            <div className="bg-gray-50 rounded-2xl p-4 space-y-2 text-sm">
              <p className="font-syne font-bold text-primary text-sm mb-3">Récapitulatif de votre demande</p>
              <div className="flex justify-between"><span className="text-gray-500">Secteur</span><span className="font-medium text-primary">{sector}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Service</span><span className="font-medium text-primary">{selectedService?.title ?? customService ?? "Personnalisé"}</span></div>
              {montage && <div className="flex justify-between gap-4"><span className="text-gray-500">Avis</span><span className="font-medium text-primary text-right">{fiche.referenceAvis}</span></div>}
              {montage && entrepriseId && <div className="flex justify-between gap-4"><span className="text-gray-500">Coffre</span><span className="font-medium text-primary text-right">Pièces valides reprises de {entreprises.find((x) => x.id === entrepriseId)?.nom}</span></div>}
              {montage && <div className="flex justify-between gap-4"><span className="text-gray-500">DAO</span><span className="font-medium text-primary text-right">{dao ? "Joint" : "À déposer plus tard"}</span></div>}
              <div className="flex justify-between"><span className="text-gray-500">Pièces jointes</span><span className="font-medium text-primary">{files.length} fichier(s)</span></div>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setStep(3)} className="flex-1 border border-gray-200 rounded-xl py-3 text-sm font-medium text-gray-600">Retour</button>
              <button
                onClick={submit}
                disabled={submitting}
                className="flex-1 bg-su-bleu text-white py-3 rounded-xl font-semibold text-sm hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {submitting ? <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi…</> : <><i className="fas fa-paper-plane" />Envoyer ma demande</>}
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Étape 5 : Confirmation ───────────────────────────────────────── */}
        {step === 5 && (
          <motion.div key="step5" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-8">
            <div className="w-20 h-20 bg-su-bleu rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-check text-white text-3xl" />
            </div>
            <div>
              <h2 className="font-syne font-black text-2xl text-primary mb-2">Demande envoyée !</h2>
              <p className="text-gray-500 text-sm max-w-sm mx-auto">Notre équipe va analyser votre besoin et vous enverra un devis personnalisé <strong>sous 48h ouvrées</strong>. Un email de confirmation vous a été envoyé.</p>
              {montage && <p className="text-gray-600 text-sm max-w-sm mx-auto mt-3">La liste des pièces à fournir vous attend dans « Mes prestations » : déposez dès maintenant les documents dont vous disposez.</p>}
            </div>
            <div className="bg-accent/5 border border-accent/20 rounded-2xl p-4 text-sm text-accent mx-auto max-w-xs">
              <i className="fas fa-info-circle mr-1.5" />Suivez l&apos;état de votre demande dans &ldquo;Mes prestations&rdquo;
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button onClick={() => router.push("/dashboard/client/prestations")} className="bg-su-bleu text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90">
                <i className="fas fa-briefcase mr-2" />Voir mes prestations
              </button>
              <button onClick={() => { setStep(1); setSector(""); setServiceId(""); setBrief(""); setFiles([]); setFiche(dossierVide()); setDao(null); setEntrepriseId(""); }} className="border border-gray-200 px-6 py-3 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50">
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
