"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { HCaptchaField } from "@/components/ui/HCaptchaField";
import { PIECES, DISPONIBILITES, TAILLE_MAX_FICHIER, type TypePiece } from "@/lib/recrutement/offres";

type Fichier = { id: string; type: TypePiece; nom: string; taille: number; path?: string; etat: "envoi" | "ok" | "erreur"; erreur?: string };

type Ticket =
  | { mode: "supabase"; path: string; token: string; supabaseUrl: string; anonKey: string }
  | { mode: "local"; path: string; uploadUrl: string };

const CHAMPS = {
  nom: "", prenoms: "", email: "", telephone: "", ville: "", nationalite: "",
  diplome: "", anneeDiplome: "", anneesExperience: "", nbProjetsSimilaires: "", disponibilite: "Immédiate",
};

function aleatoire(n = 24) {
  const a = new Uint8Array(n / 2);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
}

const mo = (o: number) => (o / 1024 / 1024).toFixed(1).replace(".", ",") + " Mo";

const inputCls =
  "w-full font-normal text-[15px] px-3.5 py-3 min-h-[44px] border border-gray-300 rounded-xl bg-white text-primary placeholder:text-gray-400 focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10";

export default function CandidatureForm({ offre }: { offre: { code: string; slug: string; titre: string } }) {
  const params = useSearchParams();
  const source = (params.get("src") ?? "").replace(/[^\w-]/g, "").slice(0, 40) || null;
  const dossierId = useMemo(() => aleatoire(), []);
  const [v, setV] = useState(CHAMPS);
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [consent, setConsent] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");
  const [reference, setReference] = useState("");

  const set = (k: keyof typeof CHAMPS) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setV((s) => ({ ...s, [k]: e.target.value }));

  const maj = (id: string, patch: Partial<Fichier>) => setFichiers((l) => l.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  async function deposer(type: TypePiece, file: File) {
    const id = aleatoire(8);
    const base: Fichier = { id, type, nom: file.name, taille: file.size, etat: "envoi" };
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) {
      setFichiers((l) => [...l, { ...base, etat: "erreur", erreur: "Ce fichier n'est pas un PDF." }]);
      return;
    }
    if (file.size > TAILLE_MAX_FICHIER) {
      setFichiers((l) => [...l, { ...base, etat: "erreur", erreur: "Plus de 10 Mo : compressez le PDF." }]);
      return;
    }
    const entete = await file.slice(0, 5).text().catch(() => "");
    if (entete !== "%PDF-") {
      setFichiers((l) => [...l, { ...base, etat: "erreur", erreur: "PDF illisible ou endommagé." }]);
      return;
    }
    setFichiers((l) => [...l, base]);
    try {
      const r = await fetch("/api/recrutement/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ offre: offre.code, dossierId, type, nom: file.name, taille: file.size, mime: file.type }),
      });
      const t = await r.json();
      if (!r.ok) throw new Error(t.error || "Dépôt refusé.");
      const ticket = t as Ticket;
      if (ticket.mode === "supabase") {
        const sb = createClient(ticket.supabaseUrl, ticket.anonKey, { auth: { persistSession: false } });
        const { error } = await sb.storage.from("recrutement").uploadToSignedUrl(ticket.path, ticket.token, file, { contentType: "application/pdf" });
        if (error) throw new Error("Le fichier n'a pas pu être envoyé.");
      } else {
        const up = await fetch(ticket.uploadUrl, { method: "PUT", body: file, headers: { "Content-Type": "application/pdf" } });
        if (!up.ok) throw new Error("Le fichier n'a pas pu être envoyé.");
      }
      maj(id, { etat: "ok", path: ticket.path });
    } catch (e) {
      maj(id, { etat: "erreur", erreur: e instanceof Error ? e.message : "Erreur d'envoi." });
    }
  }

  async function soumettre(e: React.FormEvent) {
    e.preventDefault();
    setErreur("");
    if (fichiers.some((f) => f.etat === "envoi")) { setErreur("Patientez : des fichiers sont encore en cours d'envoi."); return; }
    for (const p of PIECES) {
      if (p.obligatoire && !fichiers.some((f) => f.type === p.type && f.etat === "ok")) {
        setErreur(`Chargez la pièce : ${p.label}.`);
        return;
      }
    }
    if (!consent) { setErreur("Cochez la case de consentement pour envoyer votre candidature."); return; }
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captcha) { setErreur("Validez la vérification anti-robot."); return; }

    setEnvoi(true);
    try {
      const r = await fetch("/api/recrutement/candidature", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...v,
          offre: offre.code,
          dossierId,
          source,
          consentement: true,
          captchaToken: captcha,
          fichiers: fichiers.filter((f) => f.etat === "ok").map((f) => ({ type: f.type, path: f.path, nom: f.nom })),
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Envoi impossible.");
      setReference(d.reference);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setErreur(e instanceof Error ? e.message : "Envoi impossible.");
    } finally {
      setEnvoi(false);
    }
  }

  if (reference) {
    return (
      <div className="py-6 space-y-4" role="status">
        <div className="w-12 h-12 rounded-xl bg-primary text-white flex items-center justify-center">
          <i className="fas fa-check" aria-hidden />
        </div>
        <h2 className="text-2xl text-primary">Candidature reçue</h2>
        <p className="text-gray-600 leading-relaxed">
          Votre référence : <strong className="text-primary">{reference}</strong>. Un accusé de réception vient de vous être
          envoyé à <strong className="text-primary">{v.email}</strong>. Conservez cette référence pour tout échange avec SHIFT UP.
        </p>
      </div>
    );
  }

  const champ = (k: keyof typeof CHAMPS, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-primary">
      {label}
      <input className={inputCls} value={v[k]} onChange={set(k)} required {...props} />
    </label>
  );

  return (
    <form onSubmit={soumettre} className="space-y-8" noValidate={false}>
      <div>
        <h2 className="text-2xl text-primary">Postuler : {offre.titre}</h2>
        <p className="text-sm text-gray-500 mt-1">Tous les champs sont obligatoires, sauf mention contraire.</p>
      </div>

      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="font-syne font-semibold text-primary mb-3">Identité</legend>
        {champ("nom", "Nom", { autoComplete: "family-name", maxLength: 80 })}
        {champ("prenoms", "Prénoms", { autoComplete: "given-name", maxLength: 120 })}
        {champ("email", "E-mail", { type: "email", autoComplete: "email", maxLength: 160 })}
        {champ("telephone", "Téléphone", { type: "tel", autoComplete: "tel", placeholder: "+229 01 00 00 00 00", maxLength: 30 })}
        {champ("ville", "Ville de résidence", { autoComplete: "address-level2", maxLength: 80 })}
        {champ("nationalite", "Nationalité", { maxLength: 60 })}
      </fieldset>

      <fieldset className="grid sm:grid-cols-2 gap-4">
        <legend className="font-syne font-semibold text-primary mb-3">Qualification</legend>
        <div className="sm:col-span-2">{champ("diplome", "Diplôme le plus élevé et spécialité", { placeholder: "Ex. Ingénieur de conception en génie civil", maxLength: 160 })}</div>
        {champ("anneeDiplome", "Année d'obtention", { type: "number", inputMode: "numeric", min: 1960, max: new Date().getFullYear() })}
        {champ("anneesExperience", "Années d'expérience dans le métier", { type: "number", inputMode: "numeric", min: 0, max: 60 })}
        {champ("nbProjetsSimilaires", "Nombre de chantiers similaires", { type: "number", inputMode: "numeric", min: 0, max: 200 })}
        <label className="flex flex-col gap-1.5 text-sm font-medium text-primary">
          Disponibilité
          <select className={inputCls} value={v.disponibilite} onChange={set("disponibilite")}>
            {DISPONIBILITES.map((d) => <option key={d}>{d}</option>)}
          </select>
        </label>
      </fieldset>

      <fieldset className="space-y-3">
        <legend className="font-syne font-semibold text-primary mb-1">Pièces — PDF uniquement, 10 Mo maximum par fichier</legend>
        {PIECES.map((p) => {
          const liste = fichiers.filter((f) => f.type === p.type);
          const valides = liste.filter((f) => f.etat !== "erreur").length;
          return (
            <div key={p.type} data-piece={p.type} className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-primary">{p.label}{p.obligatoire ? "" : " (facultatif)"}</p>
                  <p className="text-sm text-gray-500">{p.aide}</p>
                </div>
                {valides < p.max && (
                  <label className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-full border border-primary text-primary text-sm font-semibold cursor-pointer hover:bg-primary hover:text-white transition-colors focus-within:ring-2 focus-within:ring-primary/30">
                    <i className="fas fa-upload text-xs" aria-hidden />
                    {valides ? "Ajouter un fichier" : "Choisir un PDF"}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      multiple={p.max > 1}
                      className="sr-only"
                      onChange={(e) => {
                        const files = Array.from(e.target.files ?? []).slice(0, p.max - valides);
                        files.forEach((f) => deposer(p.type, f));
                        e.target.value = "";
                      }}
                    />
                  </label>
                )}
              </div>
              {liste.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {liste.map((f) => (
                    <li key={f.id} className="flex items-center gap-3 text-sm bg-white border border-gray-200 rounded-lg px-3 py-2">
                      <i className={`fas ${f.etat === "envoi" ? "fa-spinner fa-spin text-gray-400" : f.etat === "ok" ? "fa-file-pdf text-primary" : "fa-triangle-exclamation text-red-600"}`} aria-hidden />
                      <span className="truncate flex-1 text-primary">{f.nom}</span>
                      <span className={f.etat === "erreur" ? "text-red-600" : "text-gray-500"}>
                        {f.etat === "envoi" ? "Envoi…" : f.etat === "erreur" ? f.erreur : mo(f.taille)}
                      </span>
                      {f.etat !== "envoi" && (
                        <button type="button" onClick={() => setFichiers((l) => l.filter((x) => x.id !== f.id))} className="text-gray-500 hover:text-primary px-2 min-h-[32px]" aria-label={`Retirer ${f.nom}`}>
                          <i className="fas fa-xmark" aria-hidden />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </fieldset>

      <label className="flex gap-3 items-start text-sm text-gray-600 leading-relaxed">
        <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 w-5 h-5 accent-primary flex-shrink-0" />
        <span>
          J&apos;accepte que SHIFT UP traite mes données et les transmette à l&apos;entreprise cliente pour ce recrutement.
          Elles sont conservées 24 mois au plus (<a href="/confidentialite" className="text-accent underline">politique de confidentialité</a>).
        </span>
      </label>

      <HCaptchaField onVerify={setCaptcha} />

      {erreur && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-xl px-4 py-3" role="alert">{erreur}</p>}

      <button
        type="submit"
        disabled={envoi}
        className="w-full sm:w-auto min-h-[48px] px-8 rounded-full bg-primary text-white font-semibold hover:bg-accent transition-colors disabled:opacity-60"
      >
        {envoi ? "Envoi en cours…" : "Envoyer ma candidature"}
      </button>
    </form>
  );
}
