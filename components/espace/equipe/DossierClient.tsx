"use client";

/**
 * Partenaire : ouvrir la demande d'un de ses clients, pour un service de ses compétences.
 * Le client reçoit un lien pour suivre, recevoir le devis et payer.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { televerser } from "@/lib/televerser";
import { NATURES } from "@/lib/tarifs-montage";
import { SECTORS } from "@/lib/catalogue";
import { DOMAINE_MONTAGE, type Competences } from "@/lib/competences";

const champ = "w-full rounded-xl border border-su-lavande bg-su-brume/40 px-4 py-3 text-sm text-su-nuit focus:border-su-bleu focus:outline-none";
const aujourdhui = () => new Date(Date.now() + 3600_000).toISOString().slice(0, 10);

export default function DossierClient({ competences }: { competences: Competences }) {
  const router = useRouter();
  const domaines = competences.domaines.map((id) => SECTORS.find((s) => s.id === id)).filter((s) => s !== undefined);
  const natures = NATURES.filter((n) => competences.natures.includes(n.id));
  const [domaine, setDomaine] = useState(domaines.length === 1 ? domaines[0].id : "");
  const montage = domaine === DOMAINE_MONTAGE;
  const secteur = domaines.find((s) => s.id === domaine);
  const [offre, setOffre] = useState("");
  const [client, setClient] = useState({ email: "", nom: "", telephone: "", entreprise: "" });
  const [nature, setNature] = useState(natures.length === 1 ? natures[0].id : "");
  const [dateLimite, setDateLimite] = useState("");
  const [urgence, setUrgence] = useState<"standard" | "express">("standard");
  const [livraison, setLivraison] = useState<"numerique" | "physique">("numerique");
  const [consigne, setConsigne] = useState("");
  const [fichiers, setFichiers] = useState<{ url: string; nom: string }[]>([]);
  const [envois, setEnvois] = useState(0);
  const [envoi, setEnvoi] = useState(false);
  const [pct, setPct] = useState(30);
  const champFichier = useRef<HTMLInputElement>(null);

  useEffect(() => { fetch("/api/tarifs-montage").then((r) => r.json()).then((t) => setPct(Math.round(t.majorationExpress * 100))).catch(() => {}); }, []);

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

  async function ouvrir() {
    if (!/^\S+@\S+\.\S+$/.test(client.email.trim()) || client.nom.trim().length < 2) { toast.error("Indiquez le nom et l'e-mail du client."); return; }
    if (!domaine) { toast.error("Choisissez le service."); return; }
    if (montage && (!nature || !dateLimite)) { toast.error("Choisissez le type de dossier et la date limite."); return; }
    if (!montage && !offre && consigne.trim().length < 10) { toast.error("Choisissez une offre ou décrivez le besoin du client."); return; }
    setEnvoi(true);
    try {
      const r = await fetch("/api/equipe/dossiers", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client, consigne: consigne.trim(), fichiers,
          ...(montage
            ? { montage: { nature, dateLimite, urgence, livraison } }
            : { service: { domaine, offre: offre || null, echeance: dateLimite || null, urgence } }),
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Ouverture impossible."); return; }
      toast.success("Dossier ouvert : le client a reçu son lien.");
      router.push(`/dashboard/equipe/dossiers/${d.id}`);
    } finally { setEnvoi(false); }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button type="button" onClick={() => router.push("/dashboard/equipe")} aria-label="Retour" className="flex h-9 w-9 items-center justify-center rounded-lg bg-su-lavande/60 text-su-nuit"><i className="fas fa-arrow-left text-sm" /></button>
        <div>
          <h1 className="text-2xl font-bold text-su-nuit">Dossier d&apos;un client</h1>
          <p className="text-sm text-gray-500">Le client reçoit un lien : il suit le dossier, reçoit le devis et paie en ligne.</p>
        </div>
      </div>
      <div className="space-y-6 rounded-2xl border border-su-lavande bg-white p-6 shadow-sm sm:p-8">
        <section className="space-y-3">
          <h2 className="font-bold text-su-nuit">Le client</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <input value={client.nom} onChange={(e) => setClient({ ...client, nom: e.target.value })} placeholder="Nom du client *" className={champ} />
            <input type="email" value={client.email} onChange={(e) => setClient({ ...client, email: e.target.value })} placeholder="E-mail du client *" className={champ} />
            <input type="tel" value={client.telephone} onChange={(e) => setClient({ ...client, telephone: e.target.value })} placeholder="Téléphone" className={champ} />
            <input value={client.entreprise} onChange={(e) => setClient({ ...client, entreprise: e.target.value })} placeholder={montage ? "Entreprise soumissionnaire" : "Entreprise"} className={champ} />
          </div>
        </section>
        <section className="space-y-3 border-t border-su-lavande pt-5">
          <h2 className="font-bold text-su-nuit">Le service</h2>
          {domaines.length > 1 ? (
            <select value={domaine} onChange={(e) => { setDomaine(e.target.value); setOffre(""); }} className={champ} aria-label="Service">
              <option value="">Choisir le service…</option>
              {domaines.map((s) => <option key={s.id} value={s.id}>{s.id === DOMAINE_MONTAGE ? "Montage de dossier d'appel d'offres" : s.label}</option>)}
            </select>
          ) : (
            <p className="rounded-xl bg-su-brume/60 px-4 py-3 text-sm font-semibold text-su-nuit">
              {montage ? "Montage de dossier d'appel d'offres" : secteur?.label}
            </p>
          )}
          {montage && (
            <>
              {natures.length > 1 ? (
                <select value={nature} onChange={(e) => setNature(e.target.value)} className={champ} aria-label="Type de dossier">
                  <option value="">Choisir le type de dossier…</option>
                  {natures.map((n) => <option key={n.id} value={n.id}>{n.label}</option>)}
                </select>
              ) : <p className="text-sm text-gray-600">{natures[0]?.label}</p>}
              <div className="grid gap-3 sm:grid-cols-3">
                <input type="date" min={aujourdhui()} value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} className={champ} aria-label="Date limite de dépôt" />
                <select value={urgence} onChange={(e) => setUrgence(e.target.value as "standard" | "express")} className={champ} aria-label="Urgence">
                  <option value="standard">Standard</option><option value="express">Express (+{pct}%)</option>
                </select>
                <select value={livraison} onChange={(e) => setLivraison(e.target.value as "numerique" | "physique")} className={champ} aria-label="Livraison">
                  <option value="numerique">Numérique uniquement</option><option value="physique">Numérique + physique</option>
                </select>
              </div>
            </>
          )}
          {secteur && !montage && (
            <>
              <select value={offre} onChange={(e) => setOffre(e.target.value)} className={champ} aria-label="Offre">
                <option value="">Autre besoin (à décrire ci-dessous)</option>
                {secteur.services.map((o) => <option key={o.title} value={o.title}>{o.title}{o.price ? ` — ${o.priceLabel ?? "à partir de"} ${o.price}` : ""}</option>)}
              </select>
              <div className="grid gap-3 sm:grid-cols-2">
                <input type="date" min={aujourdhui()} value={dateLimite} onChange={(e) => setDateLimite(e.target.value)} className={champ} aria-label="Pour quand (facultatif)" title="Pour quand (facultatif)" />
                <select value={urgence} onChange={(e) => setUrgence(e.target.value as "standard" | "express")} className={champ} aria-label="Urgence">
                  <option value="standard">Standard</option><option value="express">Express (+{pct}%)</option>
                </select>
              </div>
            </>
          )}
        </section>
        <section className="space-y-3 border-t border-su-lavande pt-5">
          <h2 className="font-bold text-su-nuit">Pièces de départ</h2>
          <button type="button" onClick={() => champFichier.current?.click()} className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-su-clair px-4 py-6 text-center hover:border-su-bleu">
            <i className="fas fa-cloud-arrow-up text-2xl text-gray-400" /><span className="text-sm font-medium text-su-nuit">{montage || !domaine ? "Ajouter le DAO, les bilans, les CV…" : "Ajouter les documents utiles"}</span>
          </button>
          <input ref={champFichier} type="file" multiple className="hidden" onChange={(e) => { void ajouter(e.target.files); e.target.value = ""; }} />
          {(fichiers.length > 0 || envois > 0) && (
            <div className="flex flex-wrap gap-2">
              {fichiers.map((f) => <span key={f.url} className="inline-flex items-center gap-2 rounded-full bg-su-brume px-3 py-1.5 text-xs text-su-nuit"><i className="fas fa-file-lines text-su-bleu" />{f.nom}
                <button type="button" onClick={() => setFichiers((l) => l.filter((x) => x.url !== f.url))} aria-label={`Retirer ${f.nom}`} className="text-gray-400 hover:text-red-600"><i className="fas fa-xmark" /></button></span>)}
              {envois > 0 && <span className="text-xs text-gray-500">Envoi de {envois} fichier(s)…</span>}
            </div>
          )}
          <textarea value={consigne} onChange={(e) => setConsigne(e.target.value)} rows={3} placeholder={montage ? "Ce qu'il faut faire (facultatif)" : "Le besoin du client"} className={`${champ} resize-none`} />
        </section>
        <button type="button" onClick={ouvrir} disabled={envoi || envois > 0} className="w-full rounded-xl bg-su-nuit py-3.5 text-sm font-bold text-white hover:bg-su-cadet disabled:opacity-60">
          {envoi ? "Ouverture…" : "Ouvrir le dossier et prévenir le client"}
        </button>
      </div>
    </div>
  );
}
