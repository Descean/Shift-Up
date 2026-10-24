"use client";

import { useState, useId, isValidElement, cloneElement } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { HCaptchaField } from "@/components/ui/HCaptchaField";

// ─── Props ────────────────────────────────────────────────────────────────────
export interface FormationHighlight {
  icon: string;
  text: string;
}

export interface FormationSession {
  formationId: string;
  label: string;        // "Présentiel" | "En ligne"
  icon: string;         // icône Font Awesome représentant le mode
  dateDebut: string;
  dateFin: string;
  lieu: string;         // ex: "Présentiel · Cotonou, Bénin" ou "En ligne · Classe virtuelle"
  prixFCFA: number;
  placesRestantes: number;
  badge?: string;       // ex: "Meilleure offre"
  terminee?: boolean;   // session commencée ou passée : inscription fermée
}

export interface FormationProps {
  id: string;
  titre: string;
  description: string;
  dateDebut: string;
  dateFin: string;
  lieu: string;
  prixFCFA: number;
  placesRestantes: number;
  terminee?: boolean;
  dureeJours?: number;
  // Sélecteur de sessions (optionnel — affiche un picker si présent)
  sessions?: FormationSession[];
  // Contenu riche (optionnel)
  about?: string;
  highlights?: FormationHighlight[];
  heroImage?: string;
  audience?: string[];
  inclusText?: string;
  whatsapp?: string; // format local, ex: "01 40 80 91 08"
  // Succès : set par la page parente après retour FedaPay
  succes?: boolean;
  reference?: string;
  echec?: boolean;
}

// Convertit un numéro local béninois ("01 40 80 91 08") en lien wa.me
function waLink(local?: string): string {
  const digits = (local ?? "01 95 03 50 99").replace(/\D/g, "");
  return `https://wa.me/229${digits}`;
}

// ─── Schéma Zod ───────────────────────────────────────────────────────────────
// max → transform(trim) → pipe(min) : garantit le rejet des espaces-only et le trim côté client
const t = (min: number, max: number, msg: string) =>
  z.string().max(max).transform((s) => s.trim()).pipe(z.string().min(min, msg));

const schema = z.object({
  prenom:   t(2, 80,  "Prénom requis (2 caractères min)"),
  nom:      t(2, 80,  "Nom requis (2 caractères min)"),
  email:    z.string().email("Email invalide"),
  telephone: z.string().max(30).transform((s) => s.trim()).pipe(z.string().min(6, "Téléphone requis")),
  ville:    z.string().min(1, "Ville requise"),
  structure: t(2, 120, "Structure requise (2 caractères min)"),
  poste:    t(2, 120, "Poste requis (2 caractères min)"),
  secteur:  z.string().min(1, "Secteur requis"),
  attente:  z.string().min(1, "Sélectionnez votre attente"),
  detail:   z.string().max(1000).transform((s) => s.trim()).optional(),
  source:   z.string().min(1, "Indiquez comment vous nous avez trouvés"),
  methodePaiement: z.enum(
    ["MTN Mobile Money", "Moov / Flooz", "Wave", "Virement bancaire"],
    { errorMap: () => ({ message: "Moyen de paiement requis" }) }
  ),
  consent: z.boolean().refine((v) => v === true, { message: "Consentement requis" }),
});

type FormData = z.infer<typeof schema>;

const ATTENTES = [
  { value: "Apprendre à utiliser l'IA pour rédiger mes DAO", sub: "Partir de zéro et maîtriser les outils IA appliqués aux marchés" },
  { value: "Améliorer la qualité de mes offres existantes", sub: "Je réponds déjà aux DAO, je veux être plus compétitif" },
  { value: "Gagner du temps sur la préparation des dossiers", sub: "Automatiser les tâches répétitives avec l'IA" },
  { value: "Comprendre les marchés publics et décrocher mes 1ers contrats", sub: "Formation complète pour débutants en marchés publics" },
];

const SOURCES = ["LinkedIn", "WhatsApp / Groupe WhatsApp", "Facebook / Réseaux sociaux", "Bouche à oreille / collègue", "Site web Shift Up", "Autre"];
const VILLES = ["Cotonou", "Porto-Novo", "Abomey-Calavi", "Parakou", "Bohicon", "Natitingou", "Autre ville du Bénin", "Hors Bénin"];
const SECTEURS = [
  "BTP / Génie civil", "Conseil & Audit", "Informatique & Numérique", "Santé",
  "Agriculture & Agroalimentaire", "Éducation & Formation", "Commerce & Distribution",
  "Services & Prestation", "Administration publique", "ONG / Association", "Autre",
];

export default function FormationForm({ formation }: { formation: FormationProps }) {
  const [submitting, setSubmitting] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");
  const [selectedSession, setSelectedSession] = useState<FormationSession | null>(
    formation.sessions?.find((s) => !s.terminee) ?? formation.sessions?.[0] ?? null
  );
  const [typeInscription, setTypeInscription] = useState<"COMPLET" | "ACOMPTE">("COMPLET");

  // Valeurs effectives : session sélectionnée ou fallback sur les props
  const effectiveId     = selectedSession?.formationId     ?? formation.id;
  const effectivePrix   = selectedSession?.prixFCFA        ?? formation.prixFCFA;
  const effectiveDebut  = selectedSession?.dateDebut       ?? formation.dateDebut;
  const effectiveFin    = selectedSession?.dateFin         ?? formation.dateFin;
  const effectiveLieu   = selectedSession?.lieu            ?? formation.lieu;
  const effectivePlaces = selectedSession?.placesRestantes ?? formation.placesRestantes;
  const effectiveTerminee = selectedSession?.terminee ?? formation.terminee ?? false;

  const ACOMPTE = 15_000;
  const montantAPayer  = typeInscription === "ACOMPTE" ? ACOMPTE : effectivePrix;
  const soldeRestant   = typeInscription === "ACOMPTE" ? effectivePrix - ACOMPTE : 0;

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const watchedAttente = watch("attente");
  const watchedSource = watch("source");

  // ── Page de succès ─────────────────────────────────────────────────────────
  if (formation.succes) {
    return (
      <div className="min-h-screen bg-paper">
        <section className="bg-primary py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
          <div className="container-custom relative z-10 text-center">
            <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring" }}>
              <div className="w-20 h-20 bg-secondary/20 border-2 border-secondary/40 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">✅</div>
              <h1 className="font-syne font-black text-3xl sm:text-4xl text-white mb-3">Inscription confirmée !</h1>
              <p className="text-white/60 text-lg max-w-lg mx-auto">
                Votre paiement a été reçu. Un reçu-billet vous a été envoyé par email.
              </p>
            </motion.div>
          </div>
        </section>

        <section className="section-padding">
          <div className="container-custom max-w-2xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
              <div className="bg-white rounded-2xl shadow-card overflow-hidden mb-6">
                <div className="bg-gradient-to-r from-accent to-secondary p-5 text-center">
                  <p className="text-xs font-bold tracking-widest text-white/70 uppercase mb-1">Billet d'entrée officiel</p>
                  <p className="font-syne font-black text-xl text-white">{formation.titre}</p>
                </div>
                <div className="p-6">
                  <div className="bg-secondary/10 border-2 border-secondary/30 rounded-xl p-4 text-center mb-6">
                    <p className="text-xs font-bold tracking-widest text-secondary uppercase mb-1">Numéro de billet</p>
                    <p className="font-mono font-black text-2xl text-primary tracking-widest">{formation.reference}</p>
                    <p className="text-xs text-gray-400 mt-1">Présentez cet email à l'accueil le jour J</p>
                  </div>
                  <dl className="space-y-3">
                    {[
                      ["Formation", formation.titre],
                      ["Dates", `${formation.dateDebut} → ${formation.dateFin}`],
                      ["Lieu", `${formation.lieu} (détails à J-3)`],
                      ["Montant payé", `${formation.prixFCFA.toLocaleString("fr-FR")} FCFA`],
                    ].map(([label, value]) => (
                      <div key={label} className="flex justify-between text-sm border-b border-gray-100 pb-2 last:border-0">
                        <dt className="text-gray-400">{label}</dt>
                        <dd className="font-semibold text-primary text-right">{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
                <p className="text-xs font-bold uppercase tracking-wider text-amber-700 mb-3">Prochaines étapes</p>
                {[
                  ["1", "Vérifiez votre email — votre billet vous a été envoyé"],
                  ["2", "Conservez le billet : il est votre passe d'entrée le jour J"],
                  ["3", "Le lieu exact sera communiqué 3 jours avant la formation"],
                ].map(([n, text]) => (
                  <div key={n} className="flex gap-3 items-start text-sm text-amber-800 mb-2 last:mb-0">
                    <span className="w-6 h-6 bg-amber-200 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">{n}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>
    );
  }

  // (banner echec supprimé — l'utilisateur recommence simplement)

  // ── Formulaire ─────────────────────────────────────────────────────────────
  const onSubmit = async (data: FormData) => {
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) {
      toast.error("Veuillez compléter le captcha.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/formations/inscription", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, formationId: effectiveId, typeInscription, captchaToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur d'inscription");
      // Redirection vers la page de paiement FedaPay
      window.location.href = json.checkoutUrl;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'inscription";
      toast.error(msg);
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-0 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40 pointer-events-none" />
        <div className="container-custom relative z-10 text-center pb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="font-syne font-black text-3xl sm:text-5xl text-white leading-tight mb-4">
              {formation.titre.includes("&") ? (
                <>
                  <span className="gradient-text">{formation.titre.split("&")[0].trim()}</span>
                  {" & "}
                  <span className="text-amber-400">{formation.titre.split("&")[1].trim()}</span>
                </>
              ) : (
                <span className="gradient-text">{formation.titre}</span>
              )}
            </h1>
            {formation.description && (
              <p className="text-white/55 text-lg max-w-xl mx-auto mb-6">{formation.description}</p>
            )}
            <div className="flex flex-wrap justify-center gap-3">
              <Chip icon="fas fa-calendar-days" color="white">
                <strong className="text-white">{effectiveDebut}</strong> → {effectiveFin}
              </Chip>
              <Chip icon="fas fa-tag" color="amber">
                <strong>{effectivePrix.toLocaleString("fr-FR")} FCFA</strong> · Tout compris
              </Chip>
              <Chip icon={selectedSession?.icon ?? "fas fa-location-dot"} color="white">
                {effectiveLieu}
              </Chip>
              {effectiveTerminee && (
                <Chip icon="fas fa-calendar-xmark" color="white">
                  <strong className="text-white">Session terminée</strong>
                </Chip>
              )}
              {!effectiveTerminee && effectivePlaces > 0 && effectivePlaces <= 8 && (
                <Chip icon="fas fa-fire" color="red">
                  Plus que <strong>{effectivePlaces} place{effectivePlaces > 1 ? "s" : ""}</strong>
                </Chip>
              )}
            </div>
          </motion.div>
        </div>
        <div className="h-16 bg-paper" style={{ clipPath: "ellipse(60% 100% at 50% 100%)" }} />
      </section>

      {/* Section : description riche + image */}
      {(formation.about || formation.highlights?.length || formation.heroImage) && (
        <section className="bg-white border-b border-gray-100 py-12 -mt-1">
          <div className="container-custom max-w-5xl">
            <div className="grid md:grid-cols-5 gap-8 items-start">

              {/* Texte + highlights */}
              <div className={`space-y-6 ${formation.heroImage ? "md:col-span-3" : "md:col-span-5"}`}>
                {formation.about && (
                  <p className="text-gray-600 leading-relaxed text-base">{formation.about}</p>
                )}
                {formation.highlights?.length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                      <i className="fas fa-list-check" /> Ce que vous allez maîtriser
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-2.5">
                      {formation.highlights.map((h, i) => (
                        <li key={i} className="flex items-start gap-2.5 bg-gray-50 hover:bg-accent/5 transition-colors rounded-xl p-3">
                          <span className="w-7 h-7 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                            <i className={`${h.icon} text-accent text-xs`} />
                          </span>
                          <span className="text-sm text-gray-700 leading-snug pt-0.5">{h.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
                {formation.audience?.length ? (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
                      <i className="fas fa-users" /> Pour qui ?
                    </p>
                    <ul className="grid sm:grid-cols-2 gap-x-4 gap-y-1.5">
                      {formation.audience.map((a, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                          <i className="fas fa-check text-secondary text-[10px] flex-shrink-0" />
                          {a}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>

              {/* Image (2/5) */}
              {formation.heroImage && (
                <div className="md:col-span-2 order-first md:order-last">
                  <div className="rounded-2xl overflow-hidden shadow-lg ring-1 ring-gray-100">
                    <Image
                      src={formation.heroImage}
                      alt={`Formation ${formation.titre}`}
                      width={560}
                      height={420}
                      className="w-full object-cover"
                      unoptimized
                      priority
                    />
                  </div>
                </div>
              )}

            </div>
          </div>
        </section>
      )}

      {/* Formulaire */}
      <section className="bg-paper pb-20 -mt-1">
        <div className="container-custom max-w-2xl">
          {/* Bouton WhatsApp flottant */}
          <a
            href={waLink(formation.whatsapp)}
            target="_blank"
            rel="noopener noreferrer"
            className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-accent hover:bg-accent-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all hover:scale-110"
            aria-label="Nous contacter sur WhatsApp"
          >
            <i className="fab fa-whatsapp text-2xl" />
          </a>

          {effectiveTerminee && (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 mb-6" role="status">
              <p className="font-syne font-bold text-primary text-lg mb-1">Session terminée — inscriptions closes</p>
              <p className="text-sm text-gray-600 leading-relaxed mb-4">
                Cette session a eu lieu du {effectiveDebut} au {effectiveFin}. Laissez-nous vos coordonnées pour être prévenu(e) de la prochaine.
              </p>
              <div className="flex flex-wrap gap-3">
                <a href={waLink(formation.whatsapp)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent">
                  <i className="fab fa-whatsapp" aria-hidden /> Être prévenu(e) sur WhatsApp
                </a>
                <a href={`/contact?sujet=${encodeURIComponent("Prochaine session : " + formation.titre)}`} className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl border border-gray-300 text-primary text-sm font-semibold hover:border-primary">
                  Écrire via le formulaire de contact
                </a>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} noValidate className={effectiveTerminee ? "hidden" : undefined}>

            {/* Sélecteur de session */}
            {formation.sessions?.length ? (
              <SessionPicker
                sessions={formation.sessions}
                selected={selectedSession}
                onSelect={setSelectedSession}
              />
            ) : null}

            {/* Bloc 1 */}
            <Card num="1" title="Vos informations personnelles">
              <div className="grid sm:grid-cols-2 gap-4">
                <Field label="Prénom" error={errors.prenom?.message} required>
                  <input {...register("prenom")} placeholder="Votre prénom" className={inputCls(!!errors.prenom)} />
                </Field>
                <Field label="Nom" error={errors.nom?.message} required>
                  <input {...register("nom")} placeholder="Votre nom" className={inputCls(!!errors.nom)} />
                </Field>
              </div>
              <Field label="Adresse e-mail" error={errors.email?.message} required hint="Votre billet d'entrée et la confirmation de paiement seront envoyés à cette adresse. Vérifiez qu'elle est correcte et active.">
                <input type="email" {...register("email")} placeholder="votre@email.com" className={inputCls(!!errors.email)} />
              </Field>
              <Field label="Numéro WhatsApp / Téléphone" error={errors.telephone?.message} required hint="Nous vous enverrons les informations pratiques sur ce numéro.">
                <input type="tel" {...register("telephone")} placeholder="+229 01 XX XX XX XX" className={inputCls(!!errors.telephone)} />
              </Field>
              <Field label="Ville de résidence" error={errors.ville?.message} required>
                <select {...register("ville")} className={selectCls(!!errors.ville)}>
                  <option value="">— Sélectionner —</option>
                  {VILLES.map((v) => <option key={v}>{v}</option>)}
                </select>
              </Field>
            </Card>

            {/* Bloc 2 */}
            <Card num="2" title="Votre structure & activité">
              <Field label="Nom de votre structure / entreprise" error={errors.structure?.message} required>
                <input {...register("structure")} placeholder="Cabinet, entreprise, ONG, administration..." className={inputCls(!!errors.structure)} />
              </Field>
              <Field label="Votre poste / fonction" error={errors.poste?.message} required>
                <input {...register("poste")} placeholder="Ex : Directeur, Chef de projet, Consultant..." className={inputCls(!!errors.poste)} />
              </Field>
              <Field label="Secteur d'activité" error={errors.secteur?.message} required>
                <select {...register("secteur")} className={selectCls(!!errors.secteur)}>
                  <option value="">— Sélectionner —</option>
                  {SECTEURS.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
            </Card>

            {/* Bloc 3 */}
            <Card num="3" title="Vos attentes & comment vous nous avez trouvés">
              <Field label="Qu'attendez-vous principalement de cette formation ?" error={errors.attente?.message} required hint="Cela nous permet d'adapter les exercices pratiques à votre réalité.">
                <div className="space-y-2 mt-1">
                  {ATTENTES.map((a) => (
                    <RadioOpt key={a.value} label={a.value} sub={a.sub}
                      checked={watchedAttente === a.value}
                      onChange={() => setValue("attente", a.value, { shouldValidate: true })} />
                  ))}
                </div>
              </Field>
              <Field label="Précisez votre défi ou attente spécifique" hint="Optionnel">
                <textarea {...register("detail")} rows={2} placeholder="Ex : je perds souvent des marchés sur la note technique..." className={inputCls(false) + " resize-y min-h-[72px]"} />
              </Field>
              <Field label="Comment avez-vous connu cette formation ?" error={errors.source?.message} required>
                <div className="space-y-2 mt-1">
                  {SOURCES.map((s) => (
                    <RadioOpt key={s} label={s} checked={watchedSource === s}
                      onChange={() => setValue("source", s, { shouldValidate: true })} />
                  ))}
                </div>
              </Field>
            </Card>

            {/* Bloc 4 */}
            <Card num="4" title="Paiement & confirmation">

              {/* Sélecteur : paiement complet vs acompte */}
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2 flex items-center gap-2">
                  <i className="fas fa-wallet" /> Mode de règlement
                </p>
                <div className="grid sm:grid-cols-2 gap-3 mb-3">
                  {/* Paiement complet */}
                  <button
                    type="button"
                    onClick={() => setTypeInscription("COMPLET")}
                    className={`relative text-left border-2 rounded-xl p-4 transition-all ${
                      typeInscription === "COMPLET"
                        ? "border-accent bg-accent/5"
                        : "border-gray-200 bg-gray-50 hover:border-accent/40"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInscription === "COMPLET" ? "bg-accent text-white" : "bg-gray-200 text-gray-500"}`}>
                        <i className="fas fa-circle-check text-xs" />
                      </span>
                      <span className={`font-bold text-sm ${typeInscription === "COMPLET" ? "text-accent" : "text-primary"}`}>Paiement intégral</span>
                    </div>
                    <p className={`font-syne font-black text-xl ${typeInscription === "COMPLET" ? "text-accent" : "text-primary"}`}>
                      {effectivePrix.toLocaleString("fr-FR")} <span className="text-sm font-normal text-gray-400">FCFA</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Place confirmée immédiatement</p>
                  </button>

                  {/* Acompte */}
                  <button
                    type="button"
                    onClick={() => setTypeInscription("ACOMPTE")}
                    className={`relative text-left border-2 rounded-xl p-4 transition-all ${
                      typeInscription === "ACOMPTE"
                        ? "border-secondary bg-secondary/5"
                        : "border-gray-200 bg-gray-50 hover:border-secondary/40"
                    }`}
                  >
                    <span className="absolute -top-2.5 right-3 bg-secondary text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                      Réserver
                    </span>
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 ${typeInscription === "ACOMPTE" ? "bg-secondary text-white" : "bg-gray-200 text-gray-500"}`}>
                        <i className="fas fa-bookmark text-xs" />
                      </span>
                      <span className={`font-bold text-sm ${typeInscription === "ACOMPTE" ? "text-secondary" : "text-primary"}`}>Réserver ma place</span>
                    </div>
                    <p className={`font-syne font-black text-xl ${typeInscription === "ACOMPTE" ? "text-secondary" : "text-primary"}`}>
                      {ACOMPTE.toLocaleString("fr-FR")} <span className="text-sm font-normal text-gray-400">FCFA</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Acompte non remboursable · solde{" "}
                      <strong>{soldeRestant.toLocaleString("fr-FR")} F</strong> dû le jour J
                    </p>
                  </button>
                </div>

                {/* Récap montant */}
                <div className={`rounded-xl p-4 flex gap-4 mb-1 ${typeInscription === "ACOMPTE" ? "bg-secondary/5 border border-secondary/20" : "bg-gradient-to-r from-accent/10 to-secondary/10 border border-accent/20"}`}>
                  <i className={`fas fa-credit-card text-2xl mt-0.5 ${typeInscription === "ACOMPTE" ? "text-secondary" : "text-accent"}`} />
                  <div>
                    <p className="font-syne font-black text-2xl text-primary">
                      {montantAPayer.toLocaleString("fr-FR")} FCFA
                      <span className="text-sm font-normal text-gray-400 ml-2">
                        {typeInscription === "ACOMPTE" ? "· acompte de réservation" : "· paiement unique"}
                      </span>
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                      Inclus : formation {formation.dureeJours ?? 3} jours, {formation.inclusText ?? "supports PDF, accès outils IA"},{" "}
                      <strong className="text-primary">certificat professionnel Shift Up</strong>.
                    </p>
                  </div>
                </div>
              </div>

              <Field label="Moyen de paiement" error={errors.methodePaiement?.message} required hint="Vous serez redirigé vers FedaPay pour finaliser le paiement en toute sécurité.">
                <select {...register("methodePaiement")} className={selectCls(!!errors.methodePaiement)}>
                  <option value="">— Sélectionner —</option>
                  {(["MTN Mobile Money", "Moov / Flooz", "Wave", "Virement bancaire"] as const).map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </Field>

              {effectivePlaces > 0 && effectivePlaces <= 10 && (
                <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2">
                  <i className="fas fa-fire-flame-curved" />
                  Seulement <strong className="mx-1">{effectivePlaces} place{effectivePlaces > 1 ? "s" : ""}</strong> restante{effectivePlaces > 1 ? "s" : ""}.
                </div>
              )}

              <label className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer mt-1">
                <input type="checkbox" {...register("consent")} className="mt-0.5 accent-accent flex-shrink-0" />
                <p className="text-sm text-amber-900 leading-relaxed">
                  J'accepte que <strong>Shift Up</strong> utilise mes informations pour gérer mon inscription.
                  Je comprends que ma place est {typeInscription === "ACOMPTE" ? "réservée" : "confirmée"} à réception du paiement de{" "}
                  <strong>{montantAPayer.toLocaleString("fr-FR")} FCFA</strong>
                  {typeInscription === "ACOMPTE" && <span className="text-gray-500"> (acompte — solde de {soldeRestant.toLocaleString("fr-FR")} F à régler le jour J)</span>}
                  .<span className="text-red-500 ml-0.5">*</span>
                </p>
              </label>
              <AnimatePresence>
                {errors.consent && (
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-500 mt-1">
                    {errors.consent.message}
                  </motion.p>
                )}
              </AnimatePresence>
            </Card>

            {/* Captcha */}
            <div className="flex justify-center mt-1">
              <HCaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
            </div>

            {/* Submit */}
            <div className="mt-2">
              <button
                type="submit"
                disabled={submitting || effectivePlaces === 0 || effectiveTerminee}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-accent to-primary text-white font-syne font-bold text-lg py-4 px-8 rounded-2xl shadow-glow hover:shadow-card-hover hover:-translate-y-0.5 transition-all disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
              >
                {submitting ? (
                  <><i className="fas fa-spinner fa-spin" /> Redirection vers FedaPay…</>
                ) : effectivePlaces === 0 ? (
                  "Formation complète"
                ) : (
                  typeInscription === "ACOMPTE"
                    ? <><i className="fas fa-bookmark" /> Réserver — {montantAPayer.toLocaleString("fr-FR")} FCFA via FedaPay</>
                    : <><i className="fas fa-shield-check" /> Payer {montantAPayer.toLocaleString("fr-FR")} FCFA via FedaPay</>
                )}
              </button>
              <p className="text-center text-xs text-gray-400 mt-3">
                Paiement sécurisé via FedaPay (MTN MoMo, Moov, Wave) · Billet envoyé immédiatement par email
              </p>
            </div>

          </form>
        </div>
      </section>
    </div>
  );
}

// ─── Session picker ─────────────────────────────────────────────────────────

function SessionPicker({ sessions, selected, onSelect }: {
  sessions: FormationSession[];
  selected: FormationSession | null;
  onSelect: (s: FormationSession) => void;
}) {
  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-4 shadow-card">
      <p className="text-xs font-bold uppercase tracking-widest text-accent mb-3 flex items-center gap-2">
        <i className="fas fa-layer-group" /> Choisissez votre formule
      </p>
      <div className="grid sm:grid-cols-2 gap-3">
        {sessions.map((s) => {
          const active = selected?.formationId === s.formationId;
          return (
            <button
              key={s.formationId}
              type="button"
              onClick={() => onSelect(s)}
              disabled={s.terminee}
              className={`relative text-left border-2 rounded-xl p-4 transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                active ? "border-accent bg-accent/5" : "border-gray-200 bg-gray-50 hover:border-accent/40"
              }`}
            >
              {s.terminee && (
                <span className="absolute -top-2.5 left-3 bg-gray-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">Terminée</span>
              )}
              {!s.terminee && s.badge && (
                <span className="absolute -top-2.5 right-3 bg-accent text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide">
                  {s.badge}
                </span>
              )}
              <div className="flex items-center gap-2 mb-2">
                <span className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? "bg-accent text-white" : "bg-gray-200 text-gray-500"}`}>
                  <i className={`${s.icon} text-xs`} />
                </span>
                <span className={`font-bold text-sm flex-1 ${active ? "text-accent" : "text-primary"}`}>{s.label}</span>
                {active && <i className="fas fa-circle-check text-accent text-sm" />}
              </div>
              <p className="text-xs text-gray-500 mb-0.5">
                <i className="fas fa-calendar-days mr-1.5 text-gray-400" />
                {s.dateDebut} → {s.dateFin}
              </p>
              <p className="text-xs text-gray-500 mb-2">
                <i className="fas fa-location-dot mr-1.5 text-gray-400" />
                {s.lieu}
              </p>
              <p className={`font-syne font-black text-xl ${active ? "text-accent" : "text-primary"}`}>
                {s.prixFCFA.toLocaleString("fr-FR")}
                <span className="text-sm font-normal text-gray-400 ml-1">FCFA</span>
              </p>
              {s.placesRestantes > 0 && s.placesRestantes <= 8 && (
                <p className="text-[11px] text-red-500 mt-1">
                  <i className="fas fa-fire mr-1" />
                  {s.placesRestantes} place{s.placesRestantes > 1 ? "s" : ""} restante{s.placesRestantes > 1 ? "s" : ""}
                </p>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Composants UI ──────────────────────────────────────────────────────────

function Chip({ icon, color, children }: { icon: string; color: "white" | "amber" | "red"; children: React.ReactNode }) {
  const cls = {
    white: "bg-white/8 border-white/10 text-white/80",
    amber: "bg-amber-500/15 border-amber-500/30 text-amber-300",
    red: "bg-red-500/15 border-red-500/30 text-red-300",
  }[color];
  return (
    <span className={`inline-flex items-center gap-2 border rounded-full px-4 py-2 text-sm ${cls}`}>
      <i className={`${icon} text-xs`} />
      {children}
    </span>
  );
}

function Card({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 mb-4 shadow-card space-y-4"
    >
      <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
        <span className="w-7 h-7 bg-accent text-white rounded-lg text-xs font-bold flex items-center justify-center">{num}</span>
        <span className="text-xs font-bold text-accent uppercase tracking-widest">{title}</span>
      </div>
      {children}
    </motion.div>
  );
}

function Field({ label, children, error, required, hint }: {
  label: string; children: React.ReactNode; error?: string; required?: boolean; hint?: string;
}) {
  // Libellé relié au champ (accessibilité) : id ajouté au champ unique, sinon groupe nommé
  const id = useId();
  const champUnique = isValidElement(children) && typeof children.type === "string" && ["input", "select", "textarea"].includes(children.type);
  const champ = champUnique ? cloneElement(children as React.ReactElement<{ id?: string }>, { id }) : children;
  return (
    <div>
      {champUnique ? (
        <label htmlFor={id} className="block text-sm font-semibold text-primary mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </label>
      ) : (
        <p id={`${id}-l`} className="block text-sm font-semibold text-primary mb-1">
          {label}{required && <span className="text-red-500 ml-0.5">*</span>}
        </p>
      )}
      {hint && <p className="text-xs text-gray-500 mb-1.5">{hint}</p>}
      {champUnique ? champ : <div role="group" aria-labelledby={`${id}-l`}>{champ}</div>}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-500 mt-1">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function RadioOpt({ label, sub, checked, onChange }: { label: string; sub?: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      onClick={onChange}
      className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-all ${
        checked ? "border-accent bg-accent/5" : "border-gray-200 bg-gray-50 hover:border-accent/40"
      }`}
    >
      <span className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${checked ? "border-accent" : "border-gray-300"}`}>
        {checked && <span className="w-2 h-2 rounded-full bg-accent" />}
      </span>
      <span>
        <span className="text-sm font-medium text-primary block">{label}</span>
        {sub && <span className="text-xs text-gray-400 mt-0.5 block">{sub}</span>}
      </span>
    </label>
  );
}

const inputCls = (err: boolean) =>
  `w-full font-grotesk text-sm text-primary bg-gray-50 border rounded-xl px-3.5 py-2.5 outline-none transition-all focus:bg-white focus:ring-2 ${
    err ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-accent focus:ring-accent/10"
  }`;

const selectCls = (err: boolean) =>
  `w-full font-grotesk text-sm text-primary bg-gray-50 border rounded-xl px-3.5 py-2.5 outline-none transition-all focus:bg-white focus:ring-2 cursor-pointer appearance-none ${
    err ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-accent focus:ring-accent/10"
  }`;
