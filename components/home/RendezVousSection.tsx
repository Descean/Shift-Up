"use client";

import Link from "next/link";
import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { ENTREPRISE } from "@/lib/entreprise";
import { Icone, SERVICES, manrope } from "./icones";

const champ = "rounded-lg border border-[#3A5486] bg-su-nuit px-3.5 py-3 text-[15px] text-white placeholder:text-su-clair outline-none focus:border-su-ciel";

/** Bloc de prise de rendez-vous : envoie vers /api/contact (même circuit que la page Contact). */
export default function RendezVousSection() {
  const [envoi, setEnvoi] = useState(false);

  async function envoyer(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const d = new FormData(form);
    const message = String(d.get("message") || "").trim();
    if (message.length < 20) {
      toast.error("Décrivez votre besoin en quelques lignes (20 caractères minimum).");
      return;
    }
    if (!d.get("consentement")) {
      toast.error("Merci d'accepter le traitement de vos données pour envoyer la demande.");
      return;
    }
    setEnvoi(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(d.get("nom") || "").trim(),
          phone: String(d.get("telephone") || "").trim() || undefined,
          email: String(d.get("email") || "").trim(),
          service: String(d.get("service") || ""),
          subject: "Demande de rendez-vous (accueil)",
          message,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Demande envoyée. Nous revenons vers vous sous 48 h ouvrées.");
      form.reset();
    } catch {
      toast.error("L'envoi a échoué. Réessayez ou appelez-nous directement.");
    } finally {
      setEnvoi(false);
    }
  }

  return (
    <section id="rendez-vous" className="scroll-mt-24 bg-white py-[110px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="grid gap-10 rounded-3xl bg-su-cadet p-5 sm:p-7 lg:grid-cols-2">
          <div className="flex flex-col justify-between gap-8 rounded-[18px] bg-su-nuit p-8 sm:p-9">
            <p className={`${manrope.className} m-0 text-[26px] font-extrabold leading-[1.25] text-white sm:text-[30px]`}>
              Diagnostic gratuit et devis gratuit, réponse sous 48 h ouvrées.
            </p>
            <div className="flex flex-col gap-3.5 text-[15px] text-su-brume">
              <a href={`tel:${ENTREPRISE.telephoneLien}`} className="flex items-center gap-3 hover:text-white"><span className="text-su-clair"><Icone nom="telephone" taille={20} /></span>{ENTREPRISE.telephone}</a>
              <a href={`mailto:${ENTREPRISE.email}`} className="flex items-center gap-3 hover:text-white"><span className="text-su-clair"><Icone nom="mail" taille={20} /></span>{ENTREPRISE.email}</a>
              <span className="flex items-center gap-3"><span className="text-su-clair"><Icone nom="lieu" taille={20} /></span>Abomey-Calavi, Atlantique, Bénin</span>
            </div>
          </div>

          <form onSubmit={envoyer} className="flex flex-col gap-4 px-2 py-3">
            <h2 className={`${manrope.className} m-0 text-[28px] font-extrabold leading-[1.2] text-white sm:text-[32px]`}>Parlez-nous de votre projet.</h2>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-su-lavande">Nom complet</span>
                <input name="nom" required minLength={2} autoComplete="name" placeholder="Votre nom" className={champ} /></label>
              <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-su-lavande">Téléphone</span>
                <input name="telephone" type="tel" autoComplete="tel" placeholder="01 00 00 00 00" className={champ} /></label>
            </div>
            <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-su-lavande">E-mail</span>
              <input name="email" type="email" required autoComplete="email" placeholder="vous@entreprise.bj" className={champ} /></label>
            <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-su-lavande">Service souhaité</span>
              <select name="service" defaultValue="Montage de dossiers" className={champ}>
                {SERVICES.map((s) => <option key={s.titre}>{s.titre}</option>)}
                <option>Autre</option>
              </select></label>
            <label className="flex flex-col gap-1.5"><span className="text-sm font-medium text-su-lavande">Message</span>
              <textarea name="message" rows={4} required placeholder="Votre besoin en quelques lignes" className={champ} /></label>
            <label className="flex items-start gap-2.5 text-[13px] leading-snug text-su-lavande">
              <input type="checkbox" name="consentement" className="mt-0.5 h-4 w-4 flex-none accent-[#8FB3E2]" />
              <span>J&apos;accepte que SHIFT UP traite ces informations pour répondre à ma demande (<Link href="/confidentialite" className="underline hover:text-white">politique de confidentialité</Link>).</span>
            </label>
            <button type="submit" disabled={envoi}
              className="self-start rounded-full bg-white px-[26px] py-3.5 text-[15px] font-semibold text-su-bleu transition-opacity disabled:opacity-60">
              {envoi ? "Envoi…" : "Envoyer ma demande"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
