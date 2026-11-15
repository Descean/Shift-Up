"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { BandeauTitre, TitrePoints, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";
import { ENTREPRISE } from "@/lib/entreprise";

/**
 * Schéma de validation Zod du formulaire de contact.
 *
 * ─── CONFORMITÉ Code du Numérique béninois (Art. 72) ─────────────────────────
 * Le champ `consentData` est obligatoire :
 *   → L'utilisateur doit explicitement cocher la case pour consentir
 *     au traitement de ses données dans le cadre de sa demande de contact.
 *   → La case n'est pas pré-cochée (refine v === true).
 *   → Le formulaire affiche un lien vers la Politique de Confidentialité.
 *
 * Base légale du traitement des données de contact :
 *   → Consentement (Art. 72 CDN) pour les messages généraux.
 *   → Intérêt légitime (Art. 73 CDN) pour les demandes de devis
 *     (nécessaire à l'exécution d'un pré-contrat).
 */
const schema = z.object({
  name: z.string().min(2, "Nom requis (min 2 caractères)"),
  email: z.string().email("Adresse email invalide"),
  phone: z.string().optional(),
  subject: z.string().min(3, "Objet requis"),
  service: z.string().optional(),
  message: z.string().min(20, "Message trop court (min 20 caractères)"),
  // Consentement explicite requis — case non pré-cochée (Art. 72 CDN)
  consentData: z.boolean().refine((v) => v === true, {
    message: "Vous devez accepter le traitement de vos données pour envoyer ce message.",
  }),
});

type FormData = z.infer<typeof schema>;

const services = [
  "Montage de dossiers d'appel d'offres",
  "Conseil stratégique",
  "Solutions numériques",
  "Formation & coaching",
  "Marketing digital",
  "Juridique & fiscal",
  "Finance & comptabilité",
  "Autre",
];

const CARTE_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ENTREPRISE.siege)}`;

const INFOS = [
  { icone: "lieu", titre: "Adresse", lignes: ["Maison Léopold TCHIBOZO, Tankpè", "Abomey-Calavi, Atlantique, Bénin"], href: CARTE_URL },
  { icone: "telephone", titre: "Téléphone", lignes: [ENTREPRISE.telephone], href: `tel:${ENTREPRISE.telephoneLien}` },
  { icone: "whatsapp", titre: "WhatsApp", lignes: ["Réponse rapide en journée"], href: `https://wa.me/${ENTREPRISE.telephoneLien.replace("+", "")}` },
  { icone: "mail", titre: "E-mail", lignes: [ENTREPRISE.email], href: `mailto:${ENTREPRISE.email}` },
  { icone: "horloge", titre: "Horaires", lignes: ["Du lundi au vendredi", "de 8 h à 18 h"] },
];

const champ = "w-full rounded-xl border border-su-lavande bg-white px-4 py-3 text-[15px] text-su-nuit transition-colors placeholder:text-[#9CA3AF] focus:border-su-bleu focus:outline-none";
const libelle = "mb-1.5 block text-sm font-semibold text-su-nuit";

export default function ContactPage() {
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  // Objet prérempli depuis un lien (?sujet=…), ex. « Prochaine session : … »
  useEffect(() => {
    const sujet = new URLSearchParams(window.location.search).get("sujet");
    if (sujet) setValue("subject", sujet.slice(0, 150));
  }, [setValue]);

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success("Message envoyé ! Nous vous répondons sous 24 heures ouvrées.");
        reset();
      } else {
        throw new Error();
      }
    } catch {
      toast.error("Erreur d'envoi. Réessayez ou contactez-nous directement.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Parlons de" accent="votre projet."
        texte="Une question, un dossier à monter, un devis ? Écrivez-nous : nous répondons sous 24 heures ouvrées. Le premier rendez-vous de diagnostic est offert." />

      <section className="bg-white pb-24 pt-16">
        <div className="mx-auto grid max-w-[1200px] items-start gap-10 px-6 lg:grid-cols-[400px_minmax(0,1fr)]">
          <div className="flex flex-col gap-3.5">
            {INFOS.map((c) => {
              const contenu = (
                <>
                  <span className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-su-brume text-su-bleu"><Icone nom={c.icone} taille={22} /></span>
                  <span className="flex flex-col gap-0.5">
                    <span className={`${titreFont} text-base font-bold text-su-nuit`}>{c.titre}</span>
                    {c.lignes.map((l) => <span key={l} className="text-sm text-[#4B5563]">{l}</span>)}
                  </span>
                </>
              );
              const cls = "flex items-center gap-4 rounded-2xl border border-su-lavande bg-white px-5 py-[18px]";
              return c.href ? (
                <a key={c.titre} href={c.href} target={c.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer"
                  className={`${cls} transition-colors hover:border-su-bleu`}>{contenu}</a>
              ) : <div key={c.titre} className={cls}>{contenu}</div>;
            })}
            <a href={CARTE_URL} target="_blank" rel="noopener noreferrer"
              className="relative flex h-[200px] flex-col justify-end overflow-hidden rounded-2xl bg-su-nuit p-6 text-white">
              <span aria-hidden="true" className="absolute right-[-60px] top-[-80px] h-[240px] w-[240px] rounded-full border-[28px] border-su-cadet" />
              <span aria-hidden="true" className="absolute left-[40%] top-[38%] flex h-11 w-11 items-center justify-center rounded-full bg-su-bleu ring-8 ring-su-bleu/30"><Icone nom="lieu" taille={22} /></span>
              <span className={`${titreFont} relative text-lg font-bold`}>Nous trouver à Tankpè</span>
              <span className="relative flex items-center gap-1.5 text-sm text-su-ciel">Ouvrir dans Google Maps <Icone nom="fleche" taille={16} epaisseur={2} /></span>
            </a>
          </div>

          <div id="formulaire" className="scroll-mt-28 rounded-3xl border border-su-lavande bg-su-brume p-7 sm:p-9">
            <TitrePoints taille="text-[28px]">Envoyez-nous un message</TitrePoints>
            <form onSubmit={handleSubmit(onSubmit)} className="mt-7 flex flex-col gap-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-name" className={libelle}>Nom complet *</label>
                  <input id="f-name" {...register("name")} className={champ} placeholder="Votre nom" />
                  {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name.message}</p>}
                </div>
                <div>
                  <label htmlFor="f-email" className={libelle}>E-mail *</label>
                  <input id="f-email" {...register("email")} type="email" className={champ} placeholder="vous@exemple.com" />
                  {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="f-phone" className={libelle}>Téléphone</label>
                  <input id="f-phone" {...register("phone")} className={champ} placeholder="+229 01 XX XX XX XX" />
                </div>
                <div>
                  <label htmlFor="f-service" className={libelle}>Service concerné</label>
                  <select id="f-service" {...register("service")} className={champ}>
                    <option value="">Sélectionner…</option>
                    {services.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label htmlFor="f-subject" className={libelle}>Objet *</label>
                <input id="f-subject" {...register("subject")} className={champ} placeholder="Sujet de votre message" />
                {errors.subject && <p className="mt-1 text-xs text-red-600">{errors.subject.message}</p>}
              </div>
              <div>
                <label htmlFor="f-message" className={libelle}>Message *</label>
                <textarea id="f-message" {...register("message")} rows={5} className={`${champ} resize-none`} placeholder="Décrivez votre projet ou votre besoin…" />
                {errors.message && <p className="mt-1 text-xs text-red-600">{errors.message.message}</p>}
              </div>

              {/* Consentement explicite, case non pré-cochée (Art. 72 du Code du numérique béninois) */}
              <label className="flex cursor-pointer items-start gap-3">
                <input {...register("consentData")} type="checkbox" defaultChecked={false}
                  className="mt-0.5 h-4 w-4 flex-shrink-0 rounded border-su-clair accent-su-bleu" />
                <span className="text-sm leading-relaxed text-[#4B5563]">
                  J&apos;accepte que SHIFT UP traite mes données personnelles (nom, e-mail, message) pour répondre à ma demande.{" "}
                  <a href="/confidentialite" className="font-semibold text-su-bleu underline">Politique de confidentialité</a>
                </span>
              </label>
              {errors.consentData && <p className="-mt-2 text-xs text-red-600">{errors.consentData.message}</p>}

              <button type="submit" disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-su-bleu px-7 py-4 text-base font-semibold text-white transition-colors hover:bg-su-cadet disabled:opacity-60">
                {loading ? "Envoi en cours…" : <>Envoyer le message <Icone nom="fleche" taille={18} epaisseur={2} /></>}
              </button>
              <p className="m-0 text-center text-xs text-[#6B7280]">
                Vos données sont traitées conformément au Code du numérique béninois (loi n° 2017-20). DPO :{" "}
                <a href="mailto:dpo@shiftup.bj" className="text-su-bleu underline">dpo@shiftup.bj</a>
              </p>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
}
