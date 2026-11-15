"use client";

/**
 * Demande en une fois : déposer le dossier et dire ce qu'il faut faire (par écrit ou en message vocal).
 * Utilisé dans l'espace client et sur la page publique /services/souscrire (sans compte : nom, e-mail,
 * anti-robot, et dépôt des fichiers dans un dossier provisoire).
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { televerser } from "@/lib/televerser";
import { HCaptchaField } from "@/components/ui/HCaptchaField";
import { trouverDomaine, trouverOffre } from "@/lib/catalogue";

type Fichier = { url: string; nom: string; taille: number };
const MAX_FICHIERS = 15;
const champ = "w-full rounded-xl border border-su-lavande px-4 py-3 text-sm focus:border-su-bleu focus:outline-none";

/** Consigne de départ quand on arrive depuis une offre de la page Services (?sector=…&service=…). */
export function consigneDepuisLien(q: URLSearchParams): string {
  const dom = trouverDomaine(q.get("sector") ?? q.get("secteur") ?? q.get("service"));
  const offre = trouverOffre(dom, q.get("offre") ?? q.get("service"));
  const besoin = (q.get("besoin") ?? "").trim().slice(0, 1500);
  const tete = offre && dom ? `Service souhaité : ${offre.title} (${dom.label}).` : dom ? `Domaine : ${dom.label}.` : "";
  return [tete, besoin].filter(Boolean).join("\n") + (tete || besoin ? "\n" : "");
}

export default function DemandeExpress({ publique = false }: { publique?: boolean }) {
  const router = useRouter();
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [envoiFichiers, setEnvoiFichiers] = useState(0);
  const [consigne, setConsigne] = useState("");
  const [vocal, setVocal] = useState<{ url: string; duree: number } | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [entreprises, setEntreprises] = useState<{ id: string; nom: string }[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [moi, setMoi] = useState({ nom: "", email: "", telephone: "", entreprise: "" });
  const [captcha, setCaptcha] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [survol, setSurvol] = useState(false);
  const [envoye, setEnvoye] = useState<null | { reference: string; compteExistant: boolean; analyse: boolean }>(null);
  const champFichier = useRef<HTMLInputElement>(null);
  const enregistreur = useRef<MediaRecorder | null>(null);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondesRef = useRef(0);
  const jeton = useRef<string | null>(null);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    // Avis repéré par la veille des marchés : la fiche détaillée sait le pré-remplir
    if (!publique && q.has("avis")) { router.replace(`/dashboard/client/nouvelle-demande/formulaire${window.location.search}`); return; }
    const depart = consigneDepuisLien(q);
    if (depart) setConsigne(depart);
    if (!publique) {
      fetch("/api/client/entreprises").then((r) => r.json()).then((d) => {
        const liste: { id: string; nom: string }[] = d.entreprises ?? [];
        setEntreprises(liste);
        const voulue = q.get("entreprise");
        if (voulue && liste.some((x) => x.id === voulue)) setEntrepriseId(voulue);
      }).catch(() => {});
    }
    return () => { if (minuterie.current) clearInterval(minuterie.current); enregistreur.current?.stream.getTracks().forEach((t) => t.stop()); };
  }, [router, publique]);

  /** Envoi d'un fichier ; sans compte, le premier dépôt fixe le jeton du dossier provisoire. */
  async function deposer(f: File) {
    if (!publique) return televerser(f);
    const r = await televerser(f, { jeton: jeton.current });
    if (r.jeton) jeton.current = r.jeton;
    return r;
  }

  async function ajouter(liste: FileList | File[]) {
    const nouveaux = Array.from(liste).slice(0, MAX_FICHIERS - fichiers.length);
    if (!nouveaux.length) { toast.error(`${MAX_FICHIERS} fichiers au maximum.`); return; }
    setEnvoiFichiers((n) => n + nouveaux.length);
    const un = async (f: File) => {
      try {
        const r = await deposer(f);
        setFichiers((l) => [...l, { url: r.url, nom: f.name, taille: f.size }]);
      } catch (e) {
        toast.error(`${f.name} : ${(e as Error).message || "envoi impossible"}`);
      } finally {
        setEnvoiFichiers((n) => n - 1);
      }
    };
    // Sans compte : le premier fichier part seul (il fixe le jeton), les autres ensuite en parallèle
    if (publique && !jeton.current) { await un(nouveaux[0]); await Promise.all(nouveaux.slice(1).map(un)); }
    else await Promise.all(nouveaux.map(un));
  }

  async function basculerVocal() {
    if (enregistre) { enregistreur.current?.stop(); return; }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(flux);
      const morceaux: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data); };
      mr.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop());
        if (minuterie.current) clearInterval(minuterie.current);
        setEnregistre(false);
        const duree = secondesRef.current;
        const blob = new Blob(morceaux, { type: mr.mimeType || "audio/webm" });
        const ext = (mr.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
        try {
          const r = await deposer(new File([blob], `consigne-vocale.${ext}`, { type: blob.type }));
          setVocal({ url: r.url, duree });
        } catch { toast.error("Le message vocal n'a pas pu être envoyé."); }
      };
      enregistreur.current = mr;
      mr.start();
      setSecondes(0); secondesRef.current = 0;
      minuterie.current = setInterval(() => { secondesRef.current += 1; setSecondes(secondesRef.current); if (secondesRef.current >= 300) mr.stop(); }, 1000);
      setEnregistre(true);
    } catch {
      toast.error("Micro inaccessible : autorisez-le dans votre navigateur, ou écrivez votre consigne.");
    }
  }

  async function envoyer() {
    if (!fichiers.length && !vocal && consigne.trim().length < 10) {
      toast.error("Déposez votre dossier ou dites-nous en quelques mots ce qu'il faut faire.");
      return;
    }
    if (publique) {
      if (moi.nom.trim().length < 2 || !/^\S+@\S+\.\S+$/.test(moi.email.trim())) { toast.error("Indiquez votre nom et votre adresse e-mail."); return; }
      if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captcha) { toast.error("Cochez la case anti-robot."); return; }
    }
    setEnvoi(true);
    try {
      const commun = { consigne: consigne.trim(), fichiers: fichiers.map(({ url, nom }) => ({ url, nom })), vocal: vocal?.url ?? null };
      const r = publique
        ? await fetch("/api/prestations/publique/express", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...commun, name: moi.nom.trim(), email: moi.email.trim(), phone: moi.telephone.trim() || null, company: moi.entreprise.trim() || null, jeton: jeton.current, captchaToken: captcha }),
          })
        : await fetch("/api/prestations/express", {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ ...commun, entrepriseId: entrepriseId || null }),
          });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Envoi impossible."); return; }
      if (publique) { setEnvoye({ reference: d.reference, compteExistant: Boolean(d.compteExistant), analyse: Boolean(d.analyse) }); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
      toast.success(d.analyse ? "Demande envoyée : nous lisons votre dossier." : "Demande envoyée.");
      router.push(`/dashboard/client/prestations?id=${d.id}`);
    } finally { setEnvoi(false); }
  }

  const occupe = envoi || envoiFichiers > 0 || enregistre;
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  if (envoye) {
    return (
      <div className="space-y-4 rounded-2xl border border-su-lavande bg-white p-8 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-su-brume"><i className="fas fa-check text-2xl text-su-bleu" /></div>
        <h2 className="font-syne text-2xl font-bold text-su-nuit">Demande envoyée</h2>
        <p className="text-sm text-gray-600">Référence : <strong className="text-su-nuit">{envoye.reference}</strong></p>
        <p className="mx-auto max-w-md text-sm text-gray-600">
          {envoye.analyse ? "Nous lisons votre dossier : le devis, avec la liste de ce que vous recevrez, arrive dans quelques minutes." : "Nous étudions votre dossier : vous recevrez le devis dès qu'il sera prêt."}
        </p>
        <p className="mx-auto max-w-md text-sm text-gray-600">
          {envoye.compteExistant
            ? "La demande a été ajoutée à votre espace client : connectez-vous pour voir le devis."
            : "Un courriel vient de vous être envoyé : cliquez sur le lien pour choisir votre mot de passe. Votre devis vous attend dans votre espace."}
        </p>
        <Link href={envoye.compteExistant ? "/connexion?callbackUrl=/dashboard/client/prestations" : "/"} className="inline-flex items-center gap-2 rounded-full bg-su-bleu px-6 py-3 text-sm font-semibold text-white hover:bg-su-cadet">
          {envoye.compteExistant ? "Me connecter" : "Retour à l'accueil"}
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Le dossier */}
      <section className="space-y-3 rounded-2xl border border-su-lavande bg-white p-5">
        <h2 className="font-syne text-base font-bold text-su-nuit"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-su-bleu text-xs text-white">1</span>Votre dossier</h2>
        <button type="button" onClick={() => champFichier.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)}
          onDrop={(e) => { e.preventDefault(); setSurvol(false); void ajouter(e.dataTransfer.files); }}
          className={`flex w-full flex-col items-center gap-2 rounded-2xl border-2 border-dashed px-4 py-8 text-center transition-colors ${survol ? "border-su-bleu bg-su-brume" : "border-su-clair hover:border-su-bleu"}`}>
          <i className="fas fa-cloud-arrow-up text-3xl text-su-bleu" />
          <span className="text-sm font-semibold text-su-nuit">Touchez ici pour choisir vos fichiers</span>
          <span className="text-xs text-gray-500">Dossier d&apos;appel d&apos;offres, avis, photos de documents… PDF, Word, images (50 Mo par fichier)</span>
        </button>
        <input ref={champFichier} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
          onChange={(e) => { if (e.target.files) void ajouter(e.target.files); e.target.value = ""; }} />
        {(fichiers.length > 0 || envoiFichiers > 0) && (
          <ul className="space-y-1.5">
            {fichiers.map((f) => (
              <li key={f.url} className="flex items-center gap-2 rounded-xl bg-su-brume px-3 py-2 text-sm">
                <i className="fas fa-file-lines text-su-bleu" />
                <span className="min-w-0 flex-1 truncate text-su-nuit">{f.nom}</span>
                <span className="text-xs text-gray-500">{f.taille < 1_048_576 ? `${Math.max(1, Math.round(f.taille / 1024))} Ko` : `${(f.taille / 1_048_576).toFixed(1)} Mo`}</span>
                <button onClick={() => setFichiers((l) => l.filter((x) => x.url !== f.url))} aria-label={`Retirer ${f.nom}`} className="px-1 text-gray-400 hover:text-red-600"><i className="fas fa-xmark" /></button>
              </li>
            ))}
            {envoiFichiers > 0 && <li className="flex items-center gap-2 px-3 py-2 text-xs text-gray-500"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" />Envoi de {envoiFichiers} fichier(s)…</li>}
          </ul>
        )}
      </section>

      {/* 2. La consigne */}
      <section className="space-y-3 rounded-2xl border border-su-lavande bg-white p-5">
        <h2 className="font-syne text-base font-bold text-su-nuit"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-su-bleu text-xs text-white">2</span>Ce que nous devons faire</h2>
        <textarea value={consigne} onChange={(e) => setConsigne(e.target.value)} rows={4} maxLength={3000}
          placeholder="Ex. : Montez notre offre pour le lot 2. Nous avons déjà le RCCM et l'IFU, il manque l'attestation CNSS."
          className="w-full resize-none rounded-xl border border-su-lavande px-4 py-3 text-sm focus:border-su-bleu focus:outline-none" />
        <div className="flex flex-wrap items-center gap-3">
          <button type="button" onClick={basculerVocal} disabled={!!vocal && !enregistre}
            className={`inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${enregistre ? "animate-pulse bg-red-600 text-white" : "border border-su-clair text-su-bleu hover:border-su-bleu"}`}>
            <i className={`fas ${enregistre ? "fa-stop" : "fa-microphone"}`} />
            {enregistre ? `Arrêter (${mmss(secondes)})` : "Préférez parler ? Enregistrez un message vocal"}
          </button>
          {vocal && (
            <span className="inline-flex items-center gap-2 rounded-full bg-su-brume px-3 py-2 text-xs text-su-nuit">
              <i className="fas fa-circle-check text-su-bleu" />Message vocal de {mmss(vocal.duree)} prêt
              <button onClick={() => setVocal(null)} aria-label="Supprimer le message vocal" className="text-gray-400 hover:text-red-600"><i className="fas fa-xmark" /></button>
            </span>
          )}
        </div>
      </section>

      {/* 3. L'entreprise (facultatif) */}
      {entreprises.length > 0 && (
        <section className="space-y-2 rounded-2xl border border-su-lavande bg-white p-5">
          <label htmlFor="x-entreprise" className="block font-syne text-base font-bold text-su-nuit">Pour quelle entreprise ? <span className="text-xs font-normal text-gray-500">(facultatif)</span></label>
          <select id="x-entreprise" value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)}
            className="w-full rounded-xl border border-su-lavande bg-white px-3 py-2.5 text-sm focus:border-su-bleu focus:outline-none">
            <option value="">Je préciserai plus tard</option>
            {entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
          </select>
          <p className="text-xs text-gray-500">Les pièces encore valides de son coffre seront reprises automatiquement.</p>
        </section>
      )}

      {/* Vos coordonnées (sans compte) */}
      {publique && (
        <section className="space-y-3 rounded-2xl border border-su-lavande bg-white p-5">
          <h2 className="font-syne text-base font-bold text-su-nuit"><span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-su-bleu text-xs text-white">3</span>Où vous envoyer le devis</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label htmlFor="x-nom" className="mb-1 block text-sm font-medium text-su-nuit">Nom complet <span className="text-red-500">*</span></label>
              <input id="x-nom" value={moi.nom} onChange={(e) => setMoi({ ...moi, nom: e.target.value })} autoComplete="name" className={champ} />
            </div>
            <div>
              <label htmlFor="x-email" className="mb-1 block text-sm font-medium text-su-nuit">Adresse e-mail <span className="text-red-500">*</span></label>
              <input id="x-email" type="email" value={moi.email} onChange={(e) => setMoi({ ...moi, email: e.target.value })} autoComplete="email" className={champ} />
            </div>
            <div>
              <label htmlFor="x-tel" className="mb-1 block text-sm font-medium text-su-nuit">Téléphone (WhatsApp)</label>
              <input id="x-tel" type="tel" value={moi.telephone} onChange={(e) => setMoi({ ...moi, telephone: e.target.value })} autoComplete="tel" placeholder="+229 01 …" className={champ} />
            </div>
            <div>
              <label htmlFor="x-ent" className="mb-1 block text-sm font-medium text-su-nuit">Entreprise</label>
              <input id="x-ent" value={moi.entreprise} onChange={(e) => setMoi({ ...moi, entreprise: e.target.value })} autoComplete="organization" className={champ} />
            </div>
          </div>
          <p className="text-xs text-gray-500">Votre espace client est ouvert avec cette adresse : vous y suivrez le devis, le paiement et les livrables.</p>
          <HCaptchaField onVerify={setCaptcha} />
        </section>
      )}

      <button onClick={envoyer} disabled={occupe}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-su-bleu py-4 text-base font-semibold text-white transition-colors hover:bg-su-cadet disabled:opacity-60">
        {envoi ? "Envoi…" : <>Envoyer ma demande <i className="fas fa-arrow-right" /></>}
      </button>
      {publique ? (
        <p className="text-center text-xs text-gray-500">
          Déjà client ? <Link href="/connexion?callbackUrl=/dashboard/client/nouvelle-demande" className="font-semibold text-su-bleu underline">Connectez-vous</Link> pour envoyer la demande depuis votre espace.
        </p>
      ) : (
        <p className="text-center text-xs text-gray-500">
          Vous préférez tout détailler vous-même ? <Link href="/dashboard/client/nouvelle-demande/formulaire" className="font-semibold text-su-bleu underline">Remplir le formulaire détaillé</Link>
        </p>
      )}
    </div>
  );
}
