"use client";

/**
 * Nouvelle demande de montage, en 3 étapes (maquette) :
 *  1. nature du marché, date limite de dépôt, urgence ;
 *  2. livraison (numérique, ou numérique + impression / reliure / mise sous pli) ;
 *  3. pièces de départ (DAO, bilans, CV…), consigne écrite ou vocale, entreprise — accord de confidentialité.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";
import { televerser } from "@/lib/televerser";
import { NATURES } from "@/lib/tarifs-montage";
import { trouverDomaine, trouverOffre } from "@/lib/catalogue";

type Fichier = { url: string; nom: string; taille: number };
const MAX_FICHIERS = 15;
const champ = "w-full rounded-xl border border-su-lavande bg-su-brume/40 px-4 py-3 text-sm text-su-nuit focus:border-su-bleu focus:outline-none";
const aujourdhui = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

/** Consigne de départ quand on arrive depuis une offre de la page Services (?secteur=…&offre=…&besoin=…). */
function consigneDepuisLien(q: URLSearchParams): string {
  const dom = trouverDomaine(q.get("sector") ?? q.get("secteur") ?? q.get("service"));
  const offre = trouverOffre(dom, q.get("offre") ?? q.get("service"));
  const besoin = (q.get("besoin") ?? "").trim().slice(0, 1500);
  const tete = offre && dom ? `Service souhaité : ${offre.title} (${dom.label}).` : dom ? `Domaine : ${dom.label}.` : "";
  return [tete, besoin].filter(Boolean).join("\n");
}

export default function DemandeMontage() {
  const router = useRouter();
  const [etape, setEtape] = useState(1);
  const [nature, setNature] = useState("");
  const [dateLimite, setDateLimite] = useState("");
  const [urgence, setUrgence] = useState<"standard" | "express">("standard");
  const [livraison, setLivraison] = useState<"numerique" | "physique">("numerique");
  const [fichiers, setFichiers] = useState<Fichier[]>([]);
  const [envoiFichiers, setEnvoiFichiers] = useState(0);
  const [consigne, setConsigne] = useState("");
  const [vocal, setVocal] = useState<{ url: string; duree: number } | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [secondes, setSecondes] = useState(0);
  const [entreprises, setEntreprises] = useState<{ id: string; nom: string }[]>([]);
  const [entrepriseId, setEntrepriseId] = useState("");
  const [tarifs, setTarifs] = useState({ majorationExpress: 0.3, livraisonPhysique: 0 });
  const [envoi, setEnvoi] = useState(false);
  const [survol, setSurvol] = useState(false);
  const champFichier = useRef<HTMLInputElement>(null);
  const enregistreur = useRef<MediaRecorder | null>(null);
  const minuterie = useRef<ReturnType<typeof setInterval> | null>(null);
  const secondesRef = useRef(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (q.has("avis")) { router.replace(`/dashboard/client/nouvelle-demande/formulaire${window.location.search}`); return; }
    const n = q.get("nature");
    if (n && NATURES.some((x) => x.id === n)) setNature(n);
    const depart = consigneDepuisLien(q);
    if (depart) setConsigne(depart + "\n");
    fetch("/api/tarifs-montage").then((r) => r.json()).then(setTarifs).catch(() => {});
    fetch("/api/client/entreprises").then((r) => r.json()).then((d) => {
      const liste: { id: string; nom: string }[] = d.entreprises ?? [];
      setEntreprises(liste);
      const voulue = q.get("entreprise");
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

  function suivant1() {
    if (!nature) { toast.error("Choisissez le type de dossier."); return; }
    if (!dateLimite) { toast.error("Indiquez la date limite de dépôt."); return; }
    if (dateLimite < aujourdhui()) { toast.error("La date limite est déjà passée."); return; }
    setEtape(2);
  }

  async function lancer() {
    if (!fichiers.length && !vocal && consigne.trim().length < 10) { toast.error("Ajoutez le DAO ou les pièces de départ."); return; }
    setEnvoi(true);
    try {
      const r = await fetch("/api/prestations/express", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consigne: consigne.trim(), fichiers: fichiers.map(({ url, nom }) => ({ url, nom })), vocal: vocal?.url ?? null,
          entrepriseId: entrepriseId || null, montage: { nature, dateLimite, urgence, livraison },
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Envoi impossible."); return; }
      toast.success("Demande envoyée : l'analyse de votre dossier commence.");
      router.push(`/dashboard/client/prestations?id=${d.id}`);
    } finally { setEnvoi(false); }
  }

  const mmss = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
  const pct = Math.round(tarifs.majorationExpress * 100);
  const occupe = envoi || envoiFichiers > 0 || enregistre;

  const radio = (id: "numerique" | "physique", titre: string, texte: string) => (
    <label className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${livraison === id ? "border-su-bleu bg-su-brume/60" : "border-su-lavande hover:border-su-clair"}`}>
      <input type="radio" name="livraison" checked={livraison === id} onChange={() => setLivraison(id)} className="mt-1 accent-[#31487A]" />
      <span><span className="block text-sm font-semibold text-su-nuit">{titre}</span><span className="block text-xs text-gray-500">{texte}</span></span>
    </label>
  );

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => (etape > 1 ? setEtape(etape - 1) : router.push("/dashboard/client"))} aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-su-lavande/60 text-su-nuit hover:bg-su-lavande"><i className="fas fa-arrow-left text-sm" /></button>
        <h1 className="text-2xl font-bold text-su-nuit">Nouvelle demande de montage</h1>
      </div>

      <div className="rounded-2xl border border-su-lavande bg-white p-6 shadow-sm sm:p-8">
        {etape === 1 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-su-nuit">1. Nature du marché</h2>
            <select value={nature} onChange={(e) => setNature(e.target.value)} className={champ} aria-label="Type de dossier">
              <option value="">Choisir le type de dossier…</option>
              {NATURES.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
            </select>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="d-limite" className="mb-1.5 block text-xs font-semibold text-gray-600">Date limite de dépôt <span className="text-red-500">*</span></label>
                <input id="d-limite" type="date" min={aujourdhui()} value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} className={champ} />
              </div>
              <div>
                <label htmlFor="d-urgence" className="mb-1.5 block text-xs font-semibold text-gray-600">Urgence</label>
                <select id="d-urgence" value={urgence} onChange={(e) => setUrgence(e.target.value as "standard" | "express")} className={champ}>
                  <option value="standard">Standard</option>
                  <option value="express">Express (+{pct}%)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end pt-2">
              <button type="button" onClick={suivant1} className="rounded-xl bg-su-nuit px-6 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet">Suivant</button>
            </div>
          </div>
        )}

        {etape === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-su-nuit">2. Livraison et Options</h2>
            <div className="space-y-3">
              {radio("numerique", "Numérique Uniquement", "Fichiers Word/PDF débloqués à la fin.")}
              {radio("physique", "Numérique + Physique (Impression)", `Impression, reliure et mise sous pli cacheté (+ ${tarifs.livraisonPhysique ? `${tarifs.livraisonPhysique.toLocaleString("fr-FR")} FCFA` : "frais"}).`)}
            </div>
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setEtape(1)} className="text-sm font-medium text-gray-500 hover:text-su-nuit">Retour</button>
              <button type="button" onClick={() => setEtape(3)} className="rounded-xl bg-su-nuit px-6 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet">Suivant</button>
            </div>
          </div>
        )}

        {etape === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-su-nuit">3. Pièces de départ</h2>
            <button type="button" onClick={() => champFichier.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setSurvol(true); }} onDragLeave={() => setSurvol(false)}
              onDrop={(e) => { e.preventDefault(); setSurvol(false); void ajouter(e.dataTransfer.files); }}
              className={`flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors ${survol || fichiers.length ? "border-su-bleu bg-su-brume/50" : "border-su-clair hover:border-su-bleu"}`}>
              <i className="fas fa-cloud-arrow-up text-2xl text-gray-400" />
              <span className="text-sm font-medium text-su-nuit">Cliquez pour ajouter le DAO, vos Bilans, CV…</span>
              <span className="text-[11px] text-gray-400">PDF, Word, Excel, images, ZIP — 50 Mo par fichier</span>
            </button>
            <input ref={champFichier} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
              onChange={(e) => { if (e.target.files) void ajouter(e.target.files); e.target.value = ""; }} />
            {(fichiers.length > 0 || envoiFichiers > 0) && (
              <div className="flex flex-wrap gap-2">
                {fichiers.map((f) => (
                  <span key={f.url} className="inline-flex max-w-full items-center gap-2 rounded-full border border-su-clair bg-su-brume px-3 py-1.5 text-xs font-medium text-su-nuit">
                    <i className="fas fa-file-lines text-su-bleu" /><span className="truncate">{f.nom}</span>
                    <button type="button" onClick={() => setFichiers((l) => l.filter((x) => x.url !== f.url))} aria-label={`Retirer ${f.nom}`} className="text-gray-400 hover:text-red-600"><i className="fas fa-xmark" /></button>
                  </span>
                ))}
                {envoiFichiers > 0 && <span className="inline-flex items-center gap-2 px-2 py-1.5 text-xs text-gray-500"><span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" />Envoi de {envoiFichiers} fichier(s)…</span>}
              </div>
            )}

            <div>
              <label htmlFor="d-consigne" className="mb-1.5 block text-xs font-semibold text-gray-600">Ce qu&apos;il faut faire <span className="font-normal text-gray-400">(facultatif)</span></label>
              <textarea id="d-consigne" value={consigne} onChange={(e) => setConsigne(e.target.value)} rows={3} maxLength={3000}
                placeholder="Ex. : Offre pour le lot 2. Il nous manque l'attestation CNSS." className={`${champ} resize-none`} />
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <button type="button" onClick={basculerVocal} disabled={!!vocal && !enregistre}
                  className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold transition-colors disabled:opacity-50 ${enregistre ? "animate-pulse bg-red-600 text-white" : "border border-su-clair text-su-bleu hover:border-su-bleu"}`}>
                  <i className={`fas ${enregistre ? "fa-stop" : "fa-microphone"}`} />{enregistre ? `Arrêter (${mmss(secondes)})` : "Message vocal"}
                </button>
                {vocal && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-su-brume px-3 py-1.5 text-xs text-su-nuit">
                    <i className="fas fa-circle-check text-su-bleu" />Vocal de {mmss(vocal.duree)}
                    <button type="button" onClick={() => setVocal(null)} aria-label="Supprimer le message vocal" className="text-gray-400 hover:text-red-600"><i className="fas fa-xmark" /></button>
                  </span>
                )}
              </div>
            </div>

            {entreprises.length > 0 && (
              <div>
                <label htmlFor="d-entreprise" className="mb-1.5 block text-xs font-semibold text-gray-600">Entreprise soumissionnaire</label>
                <select id="d-entreprise" value={entrepriseId} onChange={(e) => setEntrepriseId(e.target.value)} className={champ}>
                  <option value="">Je préciserai plus tard</option>
                  {entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
                </select>
              </div>
            )}

            <div className="flex gap-3 rounded-xl border border-su-lavande bg-su-brume/50 p-3 text-xs text-gray-600">
              <i className="fas fa-shield-halved mt-0.5 text-gray-400" />
              <p>En validant, un <strong className="text-su-nuit">Accord de Confidentialité (NDA)</strong> est automatiquement activé. Vos documents commerciaux sont strictement protégés et ne seront jamais partagés.</p>
            </div>

            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setEtape(2)} className="text-sm font-medium text-gray-500 hover:text-su-nuit">Retour</button>
              <button type="button" onClick={lancer} disabled={occupe} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-60">
                <i className="fas fa-check" />{envoi ? "Envoi…" : "Lancer l'analyse"}
              </button>
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-gray-400">
        Autre besoin qu&apos;un dossier de marché ? <Link href="/dashboard/client/nouvelle-demande/formulaire" className="font-semibold text-su-bleu underline">Formulaire détaillé</Link>
      </p>
    </div>
  );
}
