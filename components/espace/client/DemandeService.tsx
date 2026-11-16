"use client";

/**
 * Espace client — demande d'un service autre que le montage, sur le même modèle en 3 étapes :
 *  1. l'offre du domaine (ou un besoin à préciser) ; 2. l'échéance souhaitée et l'urgence ;
 *  3. les documents utiles et la description du besoin (écrite ou vocale) — confidentialité.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { televerser } from "@/lib/televerser";
import { trouverDomaine, trouverOffre } from "@/lib/catalogue";

const champ = "w-full rounded-xl border border-su-lavande bg-su-brume/40 px-4 py-3 text-sm text-su-nuit focus:border-su-bleu focus:outline-none";
const aujourdhui = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

export default function DemandeService({ domaineId }: { domaineId: string }) {
  const router = useRouter();
  const domaine = trouverDomaine(domaineId);
  const [etape, setEtape] = useState(1);
  const [offre, setOffre] = useState<string>("");
  const [echeance, setEcheance] = useState("");
  const [urgence, setUrgence] = useState<"standard" | "express">("standard");
  const [consigne, setConsigne] = useState("");
  const [fichiers, setFichiers] = useState<{ url: string; nom: string }[]>([]);
  const [envois, setEnvois] = useState(0);
  const [vocal, setVocal] = useState<{ url: string; duree: number } | null>(null);
  const [enregistre, setEnregistre] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [pct, setPct] = useState(30);
  const champFichier = useRef<HTMLInputElement>(null);
  const enregistreur = useRef<MediaRecorder | null>(null);
  const debut = useRef(0);

  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    const o = trouverOffre(domaine, q.get("offre"));
    if (o) setOffre(o.title);
    const besoin = q.get("besoin");
    if (besoin) setConsigne(besoin.slice(0, 1500));
    fetch("/api/tarifs-montage").then((r) => r.json()).then((t) => setPct(Math.round(t.majorationExpress * 100))).catch(() => {});
    return () => enregistreur.current?.stream.getTracks().forEach((t) => t.stop());
  }, [domaine]);

  if (!domaine) return <p className="py-16 text-center text-gray-500">Service introuvable.</p>;

  async function ajouter(liste: FileList | null) {
    if (!liste) return;
    const nouveaux = Array.from(liste).slice(0, 15 - fichiers.length);
    setEnvois((n) => n + nouveaux.length);
    await Promise.all(nouveaux.map(async (f) => {
      try { const r = await televerser(f); setFichiers((l) => [...l, { url: r.url, nom: f.name }]); }
      catch (e) { toast.error(`${f.name} : ${(e as Error).message || "envoi impossible"}`); }
      finally { setEnvois((n) => n - 1); }
    }));
  }

  async function vocalBascule() {
    if (enregistre) { enregistreur.current?.stop(); return; }
    try {
      const flux = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(flux);
      const morceaux: Blob[] = [];
      mr.ondataavailable = (e) => { if (e.data.size) morceaux.push(e.data); };
      mr.onstop = async () => {
        flux.getTracks().forEach((t) => t.stop()); setEnregistre(false);
        const blob = new Blob(morceaux, { type: mr.mimeType || "audio/webm" });
        try { const r = await televerser(new File([blob], `besoin-vocal.${(mr.mimeType || "").includes("mp4") ? "m4a" : "webm"}`, { type: blob.type })); setVocal({ url: r.url, duree: Math.round((Date.now() - debut.current) / 1000) }); }
        catch { toast.error("Le message vocal n'a pas pu être envoyé."); }
      };
      enregistreur.current = mr; debut.current = Date.now(); mr.start(); setEnregistre(true);
      setTimeout(() => { if (mr.state === "recording") mr.stop(); }, 300_000);
    } catch { toast.error("Micro inaccessible : écrivez votre besoin."); }
  }

  async function envoyer() {
    if (!offre && consigne.trim().length < 10 && !vocal) { toast.error("Décrivez votre besoin en quelques mots."); return; }
    setEnvoi(true);
    try {
      const r = await fetch("/api/prestations/express", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          consigne: consigne.trim() || `Demande : ${offre}`, fichiers, vocal: vocal?.url ?? null,
          service: { domaine: domaine!.id, offre: offre || null, echeance: echeance || null, urgence },
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Envoi impossible."); return; }
      toast.success("Demande envoyée : votre devis arrive ici.");
      router.push(`/dashboard/client/prestations?id=${d.id}`);
    } finally { setEnvoi(false); }
  }

  return (
    <div className="mx-auto max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => (etape > 1 ? setEtape(etape - 1) : router.push("/dashboard/client/nouvelle-demande"))} aria-label="Retour"
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-su-lavande/60 text-su-nuit"><i className="fas fa-arrow-left text-sm" /></button>
        <div>
          <h1 className="text-2xl font-bold text-su-nuit">Nouvelle demande</h1>
          <p className="text-sm text-gray-500">{domaine.label}</p>
        </div>
      </div>
      <div className="rounded-2xl border border-su-lavande bg-white p-6 shadow-sm sm:p-8">
        {etape === 1 && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-su-nuit">1. Le service</h2>
            <div className="space-y-2">
              {[...domaine.services.map((o) => ({ titre: o.title, texte: o.description, prix: o.price ? `${o.priceLabel ?? "À partir de"} ${o.price}` : null, delai: o.duration ?? null })),
                { titre: "", texte: "Votre besoin n'est pas dans la liste : décrivez-le à l'étape 3.", prix: null, delai: null }].map((o) => (
                <label key={o.titre || "autre"} className={`flex cursor-pointer gap-3 rounded-xl border p-4 transition ${offre === o.titre ? "border-su-bleu bg-su-brume/60" : "border-su-lavande hover:border-su-clair"}`}>
                  <input type="radio" name="offre" checked={offre === o.titre} onChange={() => setOffre(o.titre)} className="mt-1 accent-[#31487A]" />
                  <span className="flex-1">
                    <span className="block text-sm font-semibold text-su-nuit">{o.titre || "Autre besoin"}</span>
                    <span className="block text-xs text-gray-500">{o.texte}</span>
                    {(o.prix || o.delai) && <span className="mt-1 block text-xs font-semibold text-su-bleu">{[o.prix, o.delai].filter(Boolean).join(" · ")}</span>}
                  </span>
                </label>
              ))}
            </div>
            <div className="flex justify-end pt-2"><button type="button" onClick={() => setEtape(2)} className="rounded-xl bg-su-nuit px-6 py-2.5 text-sm font-semibold text-white">Suivant</button></div>
          </div>
        )}
        {etape === 2 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-su-nuit">2. Échéance</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="s-echeance" className="mb-1.5 block text-xs font-semibold text-gray-600">Pour quand ? <span className="font-normal text-gray-400">(facultatif)</span></label>
                <input id="s-echeance" type="date" min={aujourdhui()} value={echeance} onChange={(e) => setEcheance(e.target.value)} className={champ} />
              </div>
              <div>
                <label htmlFor="s-urgence" className="mb-1.5 block text-xs font-semibold text-gray-600">Urgence</label>
                <select id="s-urgence" value={urgence} onChange={(e) => setUrgence(e.target.value as "standard" | "express")} className={champ}>
                  <option value="standard">Standard</option><option value="express">Express (+{pct}%)</option>
                </select>
              </div>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setEtape(1)} className="text-sm font-medium text-gray-500">Retour</button>
              <button type="button" onClick={() => setEtape(3)} className="rounded-xl bg-su-nuit px-6 py-2.5 text-sm font-semibold text-white">Suivant</button>
            </div>
          </div>
        )}
        {etape === 3 && (
          <div className="space-y-5">
            <h2 className="text-lg font-bold text-su-nuit">3. Votre besoin</h2>
            <textarea value={consigne} onChange={(e) => setConsigne(e.target.value)} rows={4} maxLength={3000} placeholder="Décrivez ce que vous attendez : contexte, objectifs, contraintes…" className={`${champ} resize-none`} />
            <div className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={vocalBascule} disabled={!!vocal && !enregistre} className={`inline-flex items-center gap-2 rounded-full px-3.5 py-2 text-xs font-semibold disabled:opacity-50 ${enregistre ? "animate-pulse bg-red-600 text-white" : "border border-su-clair text-su-bleu"}`}>
                <i className={`fas ${enregistre ? "fa-stop" : "fa-microphone"}`} />{enregistre ? "Arrêter" : "Message vocal"}
              </button>
              {vocal && <span className="inline-flex items-center gap-2 rounded-full bg-su-brume px-3 py-1.5 text-xs text-su-nuit"><i className="fas fa-circle-check text-su-bleu" />Vocal prêt<button type="button" onClick={() => setVocal(null)} aria-label="Supprimer le message vocal" className="text-gray-400"><i className="fas fa-xmark" /></button></span>}
            </div>
            <button type="button" onClick={() => champFichier.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-su-clair px-4 py-6 text-center hover:border-su-bleu">
              <i className="fas fa-cloud-arrow-up text-2xl text-gray-400" /><span className="text-sm font-medium text-su-nuit">Ajouter des documents utiles (facultatif)</span>
            </button>
            <input ref={champFichier} type="file" multiple className="hidden" onChange={(e) => { void ajouter(e.target.files); e.target.value = ""; }} />
            {(fichiers.length > 0 || envois > 0) && (
              <div className="flex flex-wrap gap-2">
                {fichiers.map((f) => <span key={f.url} className="inline-flex items-center gap-2 rounded-full bg-su-brume px-3 py-1.5 text-xs"><i className="fas fa-file-lines text-su-bleu" />{f.nom}<button type="button" onClick={() => setFichiers((l) => l.filter((x) => x.url !== f.url))} aria-label={`Retirer ${f.nom}`} className="text-gray-400"><i className="fas fa-xmark" /></button></span>)}
                {envois > 0 && <span className="text-xs text-gray-500">Envoi de {envois} fichier(s)…</span>}
              </div>
            )}
            <div className="flex gap-3 rounded-xl border border-su-lavande bg-su-brume/50 p-3 text-xs text-gray-600">
              <i className="fas fa-shield-halved mt-0.5 text-gray-400" />
              <p>En validant, un <strong className="text-su-nuit">Accord de Confidentialité (NDA)</strong> est automatiquement activé. Vos documents sont strictement protégés et ne seront jamais partagés.</p>
            </div>
            <div className="flex items-center justify-between pt-2">
              <button type="button" onClick={() => setEtape(2)} className="text-sm font-medium text-gray-500">Retour</button>
              <button type="button" onClick={envoyer} disabled={envoi || envois > 0 || enregistre} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                <i className="fas fa-check" />{envoi ? "Envoi…" : "Envoyer ma demande"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
