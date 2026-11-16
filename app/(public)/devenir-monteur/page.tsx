"use client";

/** Devenir monteur : présentation et candidature (compte activé par la Direction). */
import { useEffect, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { BandeauTitre, titreFont } from "@/components/site/Gabarit";
import { HCaptchaField } from "@/components/ui/HCaptchaField";
import { NATURES } from "@/lib/tarifs-montage";

const champ = "w-full rounded-xl border border-su-lavande px-4 py-3 text-sm text-su-nuit focus:border-su-bleu focus:outline-none";

export default function DevenirMonteur() {
  const [f, setF] = useState({ nom: "", email: "", telephone: "", ville: "", experience: "", presentation: "" });
  const [specialites, setSpecialites] = useState<string[]>([]);
  const [captcha, setCaptcha] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState(false);
  const [part, setPart] = useState(85);

  useEffect(() => { fetch("/api/tarifs-montage").then((r) => r.json()).then((t) => setPart(Math.round((1 - (t.commissionMonteurs ?? 0.15)) * 100))).catch(() => {}); }, []);

  async function envoyer(e: React.FormEvent) {
    e.preventDefault();
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captcha) { toast.error("Cochez la case anti-robot."); return; }
    setEnvoi(true);
    try {
      const r = await fetch("/api/monteurs/inscription", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...f, specialites, captchaToken: captcha }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Envoi impossible."); return; }
      setEnvoye(true); window.scrollTo({ top: 0, behavior: "smooth" });
    } finally { setEnvoi(false); }
  }

  const POINTS = [
    { icone: "fa-link", titre: "Votre lien, vos clients", texte: "Partagez votre lien ou ouvrez vous-même le dossier de votre client : il vous est confié d'office." },
    { icone: "fa-file-invoice", titre: "Le devis prêt en quelques minutes", texte: "Le dossier est lu automatiquement ; vous ajustez la proposition et l'envoyez au client." },
    { icone: "fa-shield-halved", titre: "Votre travail protégé", texte: "Le client lit vos livrables en aperçu filigrané et ne télécharge qu'après avoir soldé." },
    { icone: "fa-wallet", titre: `${part} % pour vous`, texte: "Le client paie en ligne (acompte puis solde) ; vous demandez votre versement par Mobile Money." },
  ];

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Vous montez des dossiers ?" accent="Faites-les passer par SHIFT UP."
        texte="Vos clients déposent leur dossier, reçoivent le devis, paient en ligne et suivent chaque étape. Vous vous concentrez sur le montage, nous encaissons pour vous." />
      <section className="bg-white pb-24 pt-12">
        <div className="mx-auto grid max-w-[1100px] items-start gap-10 px-5 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="space-y-6">
            <h2 className={`${titreFont} text-2xl font-bold text-su-nuit`}>Comment ça marche</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {POINTS.map((p) => (
                <div key={p.titre} className="rounded-2xl border border-su-lavande p-5">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-su-brume text-su-bleu"><i className={`fas ${p.icone}`} /></span>
                  <p className="mt-3 font-bold text-su-nuit">{p.titre}</p>
                  <p className="mt-1 text-sm text-gray-600">{p.texte}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600">Chaque compte est vérifié par notre équipe avant activation. Vous gardez la relation avec vos clients ; SHIFT UP fournit l&apos;outil, l&apos;encaissement et la sécurité des documents.</p>
          </div>

          <div className="rounded-2xl border border-su-lavande bg-white p-6 shadow-sm">
            {envoye ? (
              <div className="py-6 text-center">
                <i className="fas fa-circle-check text-4xl text-emerald-600" />
                <p className="mt-3 text-lg font-bold text-su-nuit">Demande envoyée</p>
                <p className="mt-1 text-sm text-gray-600">Nous étudions votre profil. Vous recevrez un e-mail avec votre lien de connexion dès que votre compte sera activé.</p>
                <Link href="/" className="mt-5 inline-flex rounded-xl bg-su-nuit px-5 py-2.5 text-sm font-semibold text-white">Retour à l&apos;accueil</Link>
              </div>
            ) : (
              <form onSubmit={envoyer} className="space-y-3">
                <h2 className="text-lg font-bold text-su-nuit">Ouvrir mon compte monteur</h2>
                <input required value={f.nom} onChange={(e) => setF({ ...f, nom: e.target.value })} placeholder="Nom complet *" className={champ} />
                <input required type="email" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} placeholder="Adresse e-mail *" className={champ} />
                <input required type="tel" value={f.telephone} onChange={(e) => setF({ ...f, telephone: e.target.value })} placeholder="Téléphone (WhatsApp) *" className={champ} />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input value={f.ville} onChange={(e) => setF({ ...f, ville: e.target.value })} placeholder="Ville" className={champ} />
                  <select value={f.experience} onChange={(e) => setF({ ...f, experience: e.target.value })} className={champ} aria-label="Expérience">
                    <option value="">Expérience…</option><option>Moins d&apos;1 an</option><option>1 à 3 ans</option><option>3 à 5 ans</option><option>Plus de 5 ans</option>
                  </select>
                </div>
                <fieldset>
                  <legend className="mb-1.5 text-xs font-semibold text-gray-600">Dossiers que vous montez</legend>
                  <div className="flex flex-wrap gap-2">
                    {NATURES.map((n) => {
                      const on = specialites.includes(n.id);
                      return <button key={n.id} type="button" onClick={() => setSpecialites(on ? specialites.filter((x) => x !== n.id) : [...specialites, n.id])}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${on ? "border-su-bleu bg-su-brume text-su-nuit" : "border-su-lavande text-gray-600"}`}>{on && <i className="fas fa-check mr-1" />}{n.label}</button>;
                    })}
                  </div>
                </fieldset>
                <textarea value={f.presentation} onChange={(e) => setF({ ...f, presentation: e.target.value })} rows={3} placeholder="Présentez-vous en quelques lignes (références, marchés déjà montés…)" className={`${champ} resize-none`} />
                <div className="flex justify-center"><HCaptchaField onVerify={setCaptcha} onExpire={() => setCaptcha("")} /></div>
                <button type="submit" disabled={envoi} className="w-full rounded-xl bg-su-nuit py-3.5 text-sm font-bold text-white hover:bg-su-cadet disabled:opacity-60">{envoi ? "Envoi…" : "Envoyer ma demande"}</button>
                <p className="text-center text-xs text-gray-500">Déjà monteur ? <Link href="/connexion" className="font-semibold text-su-bleu underline">Accéder à mon espace</Link></p>
              </form>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
