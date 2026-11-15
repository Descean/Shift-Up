"use client";

/**
 * Nouvelle demande, en une fois : déposer le dossier et dire ce qu'il faut faire (par écrit ou en
 * message vocal). Le dossier est lu automatiquement et le devis arrive dans l'espace en quelques minutes.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { TitrePoints } from "@/components/site/Gabarit";
import { televerser } from "@/lib/televerser";

type Fichier = { url: string; nom: string; taille: number };
const MAX_FICHIERS = 15;

export default function NouvelleDemandeExpress() {
  const router = useRouter();
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [envoiFichiers, setEnvoiFichiers] = useState(0);
  const [consigne, setConsigne] = useState("");
  const [vocal, setVocal] = useState<{ url: string; duree: number } | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [entreprises, setEntreprises] = useState<{ id: string; nom: string }[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const [survol, setSurvol] = useState(false);
  const champFichier = useRef<HTMLInputElement>(null);
  const enregistreur = useRef<MediaRecorder | null>(null);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondesRef = useRef(0);

  useEffect(() => {
    // Liens existants (veille des marchés, page Services) : la fiche détaillée sait les pré-remplir
    const q = new URLSearchParams(window.location.search);
    if (q.has("avis") || q.has("sector") || q.has("service")) { router.replace(`/dashboard/client/nouvelle-demande/formulaire${window.location.search}`); return; }
    fetch("/api/client/entreprises").then((r) => r.json()).then((d) => {
      const liste: { id: string; nom: string }[] = d.entreprises ?? [];
      setEntreprises(liste);
      const voulue = new URLSearchParams(window.location.search).get("entreprise");
      if (voulue && liste.some((x) => x.id === voulue)) setEntrepriseId(voulue);
    }).catch(() => {});
    return () => { if (minuterie.current) clearInterval(minuterie.current); enregistreur.current?.stream.getTracks().forEach((t) => t.stop()); };
  }, [router]);

  async function ajouter(liste: FileList | File[]) {
    const nouveaux = Array.from(liste).slice(0, MAX_FICHIERS - fichiers.length);
    if (!nouveaux.length) { toast.error(`${MAX_FICHIERS} fichiers au maximum.`); return; }
    setEnvoiFichiers((n) => n + nouveaux.length);
    await Promise.all(nouveaux.map(async (f) => {
      try {
        const r = await televerser(f);
        setFichiers((l) => [...l, { url: r.url, nom: f.name, taille: f.size }]);
      } catch (e) {
        toast.error(`${f.name} : ${(e as Error).message || "envoi impossible"}`);
      } finally {
        setEnvoiFichiers((n) => n - 1);
      }
    }));
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
          const r = await televerser(new File([blob], `consigne-vocale.${ext}`, { type: blob.type }));
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
    setEnvoi(true);
    try {
      const r = await fetch("/api/prestations/express", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ consigne: consigne.trim(), fichiers: fichiers.map(({ url, nom }) => ({ url, nom })), vocal: vocal?.url ?? null, entrepriseId: entrepriseId || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Envoi impossible."); return; }
      toast.success(d.analyse ? "Demande envoyée : nous lisons votre dossier." : "Demande envoyée.");
      router.push(`/dashboard/client/prestations?id=${d.id}`);
    } finally { setEnvoi(false); }
  }

  const occupe = envoi || envoiFichiers > 0 || enregistre;
  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <TitrePoints as="h1" taille="text-[28px]">Nouvelle demande</TitrePoints>
        <p className="mt-1 text-sm text-gray-500">Envoyez votre dossier et dites-nous ce qu&apos;il faut faire. Nous le lisons et vous envoyons le devis, avec la liste de ce que vous recevrez.</p>
      </div>

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
                <span className="text-xs text-gray-500">{(f.taille / 1_048_576).toFixed(1)} Mo</span>
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

      <button onClick={envoyer} disabled={occupe}
        className="flex w-full items-center justify-center gap-2 rounded-full bg-su-bleu py-4 text-base font-semibold text-white transition-colors hover:bg-su-cadet disabled:opacity-60">
        {envoi ? "Envoi…" : <>Envoyer ma demande <i className="fas fa-arrow-right" /></>}
      </button>
      <p className="text-center text-xs text-gray-500">
        Vous préférez tout détailler vous-même ? <Link href="/dashboard/client/nouvelle-demande/formulaire" className="font-semibold text-su-bleu underline">Remplir le formulaire détaillé</Link>
      </p>
    </div>
  );
}
