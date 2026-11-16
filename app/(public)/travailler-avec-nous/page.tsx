"use client";

/**
 * Travailler avec nous : monteurs de dossiers et autres compétences des services SHIFT UP.
 * Candidature d'un compte partenaire (activé par la Direction) ; lien vers les offres d'emploi.
 */
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BandeauTitre, titreFont } from "@/components/site/Gabarit";
import { HCaptchaField } from "@/components/ui/HCaptchaField";
import { NATURES } from "@/lib/tarifs-montage";
import { SECTORS } from "@/lib/catalogue";

const champ = "w-full rounded-xl border border-su-lavande px-4 py-3 text-sm text-su-nuit focus:border-su-bleu focus:outline-none";
const MONTAGE = "marches-publics";
// Le montage de dossiers d'abord : c'est l'activité centrale
const DOMAINES = [...SECTORS].sort((a, b) => (a.id === MONTAGE ? -1 : b.id === MONTAGE ? 1 : 0));

export default function TravaillerAvecNous() {
  const [f, setF] = useState({ nom: "", email: "", telephone: "", ville: "", experience: "", presentation: "" });
  const [domaines, setDomaines] = useState<string[]>([]);
  const [natures, setNatures] = useState<string[]>([]);
  const [captcha, setCaptcha] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [part, setPart] = useState(85);

  useEffect(() => {
    fetch("/api/tarifs-montage").then((r) => r.json()).then((t) => setPart(Math.round((1 - (t.commissionMonteurs ?? 0.15)) * 100))).catch(() => {});
    const d = new URLSearchParams(window.location.search).get("domaine");
    if (d && SECTORS.some((s) => s.id === d)) setDomaines([d]);
  }, []);

  const basculer = (id: string) => setDomaines((l) => (l.includes(id) ? l.filter((x) => x !== id) : [...l, id]));

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (!domaines.length) { toast.error("Choisissez au moins un domaine de compétence."); return; }
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captcha) { toast.error("Cochez la case anti-robot."); return; }
    setEnvoi(true);
    try {
      const r = await fetch("/api/monteurs/inscription", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...f, specialites: [...domaines, ...(domaines.includes(MONTAGE) ? natures : [])], captchaToken: captcha }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Envoi impossible."); return; }
      setEnvoye(true); window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setEnvoi(false); }
  }

  const POINTS = [
    { icone: "fa-link", titre: "Vos clients, votre lien", texte: "Partagez votre lien ou ouvrez vous-même la demande de votre client : elle vous est confiée d'office." },
    { icone: "fa-file-invoice", titre: "Le devis en quelques minutes", texte: "La demande est lue et chiffrée automatiquement ; vous ajustez et l'envoyez au client." },
    { icone: "fa-shield-halved", titre: "Votre travail protégé", texte: "Le client voit vos livrables en aperçu filigrané et ne télécharge qu'après avoir soldé." },
    { icone: "fa-wallet", titre: `${part} % pour vous`, texte: "Le client paie en ligne, acompte puis solde ; vous demandez votre versement par Mobile Money." },
  ];

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Travailler" accent="avec nous."
        texte="Monteur de dossiers d'appels d'offres, juriste, comptable, graphiste, développeur, ingénieur… Mettez votre savoir-faire au service des clients SHIFT UP, ou faites passer vos propres clients par la plateforme." />

      <section className="bg-white pb-24 pt-12">
        <div className="mx-auto grid max-w-[1150px] items-start gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_440px]">
          <div className="space-y-8">
            <div>
              <h2 className={`${titreFont} text-2xl font-bold text-su-nuit`}>Comment ça marche</h2>
              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                {POINTS.map((p) => (
                  <div key={p.titre} className="rounded-2xl border border-su-lavande p-5">
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-su-brume text-su-bleu"><i className={`fas ${p.icone}`} /></span>
                    <p className="mt-3 font-bold text-su-nuit">{p.titre}</p>
                    <p className="mt-1 text-sm text-gray-600">{p.texte}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h2 className={`${titreFont} text-2xl font-bold text-su-nuit`}>Les compétences que nous recherchons</h2>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {DOMAINES.map((s) => {
                  const on = domaines.includes(s.id);
                  return (
                    <button key={s.id} type="button" onClick={() => basculer(s.id)}
                      className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-su-bleu bg-su-brume" : "border-su-lavande hover:border-su-clair"}`}>
                      <span className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${on ? "bg-su-nuit text-white" : "bg-su-brume text-su-bleu"}`}><i className={on ? "fas fa-check" : s.icon} /></span>
                      <span>
                        <span className="block text-sm font-bold text-su-nuit">{s.id === MONTAGE ? "Montage de dossiers d'appels d'offres" : s.label}</span>
                        <span className="mt-0.5 block text-xs text-gray-500">{s.services.slice(0, 3).map((o) => o.title).join(" · ")}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-su-lavande bg-su-brume/50 p-5 text-sm text-gray-700">
              <p className="font-bold text-su-nuit">Vous cherchez plutôt un emploi ou un stage ?</p>
              <p className="mt-1">Nos postes ouverts sont publiés sur la page Recrutement.</p>
              <Link href="/recrutement" className="mt-3 inline-flex items-center gap-2 font-semibold text-su-bleu hover:underline">Voir les offres d&apos;emploi <i className="fas fa-arrow-right text-xs" /></Link>
            </div>
          </div>

          <div className="rounded-2xl border border-su-lavande bg-white p-6 shadow-sm lg:sticky lg:top-28">
            {envoye ? (
              <div className="py-6 text-center">
                <i className="fas fa-circle-check text-4xl text-emerald-600" />
                <p className="mt-3 text-lg font-bold text-su-nuit">Demande envoyée</p>
                <p className="mt-1 text-sm text-gray-600">Nous étudions votre profil. Vous recevrez un e-mail avec votre lien de connexion dès que votre compte sera activé.</p>
                <Link href="/" className="mt-5 inline-flex rounded-xl bg-su-nuit px-5 py-2.5 text-sm font-semibold text-white">Retour à l&apos;accueil</Link>
              </div>
            ) : (
              <form onSubmit={envoyer} className="space-y-3">
                <h2 className="text-lg font-bold text-su-nuit">Devenir partenaire</h2>
                <p className="text-xs text-gray-500">{domaines.length ? `Compétences choisies : ${domaines.map((d) => d === MONTAGE ? "Montage de dossiers" : SECTORS.find((s) => s.id === d)?.label).join(", ")}` : "Choisissez vos compétences dans la liste."}</p>
                <input required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Nom complet *" className={champ} />
                <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Adresse e-mail *" className={champ} />
                <input required type="tel" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} placeholder="Téléphone (WhatsApp) *" className={champ} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={f.ville} onChange={(e) => setF({ ...f, ville: e.target.value })} placeholder="Ville" className={champ} />
                  <select value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} className={champ} aria-label="Expérience">
                    <option value="">Expérience…</option><option>Moins d&apos;1 an</option><option>1 à 3 ans</option><option>3 à 5 ans</option><option>Plus de 5 ans</option>
                  </select>
                </div>
                {domaines.includes(MONTAGE) && (
                  <fieldset>
                    <legend className="mb-1.5 text-xs font-semibold text-gray-600">Dossiers que vous montez</legend>
                    <div className="flex flex-wrap gap-2">
                      {NATURES.map((n) => {
                        const on = natures.includes(n.id);
                        return <button key={n.id} type="button" onClick={() => setNatures(on ? natures.filter((x) => x !== n.id) : [...natures, n.id])}
                          className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-su-bleu bg-su-brume text-su-nuit" : "border-su-lavande text-gray-600"}`}>{on && <i className="fas fa-check mr-1" />}{n.label}</button>;
                      })}
                    </div>
                  </fieldset>
                )}
                <textarea value={f.presentation} onChange={(e) => setF({ ...f, presentation: e.target.value })} rows={3} placeholder="Présentez-vous en quelques lignes (références, réalisations…)" className={`${champ} resize-none`} />
                <div className="flex justify-center"><HCaptchaField onVerify={setCaptcha} onExpire={() => setCaptcha("")} /></div>
                <button type="submit" disabled={envoi} className="w-full rounded-xl bg-su-nuit py-3.5 text-sm font-bold text-white hover:bg-su-cadet disabled:opacity-60">{envoi ? "Envoi…" : "Envoyer ma demande"}</button>
                <p className="text-center text-xs text-gray-500">Déjà partenaire ? <Link href="/connexion" className="font-semibold text-su-bleu underline">Accéder à mon espace</Link></p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
