"use client";
/**
 * Montage de dossier : suivi du dépôt de l'offre et du résultat (client et administration).
 */
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { televerser } from "@/lib/televerser";
export { BadgeSuivi } from "@/components/prestations/Pieces";
import { RESULTATS, shiftUpDepose, type Depot, type Dossier, type FichierPiece, type Resultat, type StatutResultat } from "@/lib/montage";

const champ = "w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent bg-white";
const etiquette = "block text-[11px] font-medium text-gray-600 mb-1";
const maintenantBenin = () => new Date(Date.now() + 3_600_000).toISOString().slice(0, 16);
const dateHeure = (iso: string) => new Date(iso).toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", dateStyle: "long", timeStyle: "short" });
const montantTexte = (n?: number | null) => (n || n === 0 ? `${Math.round(n).toLocaleString("fr-FR")} F CFA` : null);
const lireMontant = (v: string) => { const n = Number(v.replace(/[\s .]/g, "").replace(",", ".")); return v.trim() && Number.isFinite(n) ? n : null; };

import { STYLE_RESULTAT } from "@/components/prestations/Pieces";

type Reponse = { depot: Depot | null; resultat: Resultat | null; message?: string };

function LienFichier({ f, libelle }: { f?: FichierPiece | null; libelle: string }) {
  if (!f) return null;
  return (
    <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg px-2.5 py-1 text-xs text-gray-700 hover:text-accent max-w-full">
      <i className="fas fa-file text-gray-400" /><span className="truncate max-w-[200px]">{libelle} — {f.nom}</span>
    </a>
  );
}

function ChoixFichier({ valeur, onChange, libelle }: { valeur: FichierPiece | null; onChange: (f: FichierPiece | null) => void; libelle: string }) {
  const ref = useRef<HTMLInputElement>(null);
  const [envoi, setEnvoi] = useState(false);
  async function choisir(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (ref.current) ref.current.value = "";
    if (!file) return;
    setEnvoi(true);
    try { const r = await televerser(file); onChange({ url: r.url, nom: r.name, date: new Date().toISOString() }); }
    catch (err) { toast.error((err as Error).message || "Envoi impossible."); }
    finally { setEnvoi(false); }
  }
  return (
    <div>
      {valeur ? (
        <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-700">
          <i className="fas fa-file text-accent" /><span className="truncate flex-1">{valeur.nom}</span>
          <button onClick={() => onChange(null)} aria-label="Retirer le fichier" className="text-gray-400 hover:text-red-500"><i className="fas fa-xmark" /></button>
        </div>
      ) : (
        <button onClick={() => ref.current?.click()} disabled={envoi} className="w-full border border-dashed border-gray-300 bg-white rounded-lg py-2 text-xs text-gray-500 hover:border-accent hover:text-accent disabled:opacity-50">
          {envoi ? "Envoi…" : <><i className="fas fa-cloud-arrow-up mr-1.5" />{libelle}</>}
        </button>
      )}
      <input ref={ref} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx" onChange={choisir} />
    </div>
  );
}

export default function SuiviDossier({ prestationId, dossier, depot: depotDepart, resultat: resultatDepart, admin = false, close = false, onMaj }: {
  prestationId: string; dossier: Dossier; depot: Depot | null; resultat: Resultat | null; admin?: boolean; close?: boolean; onMaj?: () => void;
}) {
  const [depot, setDepot] = useState(depotDepart);
  const [resultat, setResultat] = useState(resultatDepart);
  const [formDepot, setFormDepot] = useState(false);
  const [formResultat, setFormResultat] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [d, setD] = useState({ deposeLe: maintenantBenin(), numero: "", commentaire: "", recepisse: null as FichierPiece | null });
  const [r, setR] = useState({
    statut: (resultatDepart?.statut && resultatDepart.statut !== "EN_ATTENTE" ? resultatDepart.statut : "ATTRIBUE") as StatutResultat,
    date: resultatDepart?.date ?? "", montantOffre: resultatDepart?.montantOffre?.toString() ?? "", rang: resultatDepart?.rang?.toString() ?? "",
    attributaire: resultatDepart?.attributaire ?? "", montantAttribue: resultatDepart?.montantAttribue?.toString() ?? "",
    motif: resultatDepart?.motif ?? "", commentaire: "", document: null as FichierPiece | null,
  });

  async function agir(corps: Record<string, unknown>) {
    setOccupe(true);
    try {
      const res = await fetch(`/api/prestations/${prestationId}/suivi`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
      const x = (await res.json().catch(() => ({}))) as Reponse & { error?: string };
      if (!res.ok) { toast.error(x.error ?? "Action impossible."); return false; }
      setDepot(x.depot); setResultat(x.resultat);
      if (x.message) toast.success(x.message);
      onMaj?.();
      return true;
    } catch { toast.error("Erreur réseau."); return false; }
    finally { setOccupe(false); }
  }

  const parShiftUp = shiftUpDepose(dossier);
  const vous = (par: string) => (par === "SHIFT_UP" ? "SHIFT UP" : admin ? "le client" : "vous");

  return (
    <div className="border border-gray-100 rounded-2xl p-4 space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide"><i className="fas fa-box-archive mr-1.5" />Dépôt et résultat</p>

      {/* ── Dépôt ── */}
      {depot ? (
        <div className="bg-green-50 border border-green-100 rounded-xl p-3 space-y-1.5">
          <p className="text-sm font-semibold text-green-800"><i className="fas fa-circle-check mr-1.5" />Offre déposée le {dateHeure(depot.deposeLe)}</p>
          <p className="text-xs text-green-700">Déposée par {vous(depot.par)}{depot.numero ? ` — récépissé n° ${depot.numero}` : ""}</p>
          {depot.commentaire && <p className="text-xs text-gray-600">{depot.commentaire}</p>}
          <LienFichier f={depot.recepisse} libelle="Récépissé" />
          {admin && (
            <button disabled={occupe} onClick={() => { if (window.confirm("Retirer l'enregistrement du dépôt ?")) agir({ action: "annuler_depot" }); }} className="block text-[11px] text-gray-500 hover:text-red-600 mt-1">
              Retirer ce dépôt
            </button>
          )}
        </div>
      ) : !formDepot ? (
        <div className="space-y-2">
          <p className="text-xs text-gray-600">
            {parShiftUp
              ? (admin ? "SHIFT UP dépose l'offre : enregistrez le dépôt et joignez le récépissé." : "SHIFT UP déposera votre offre avant la date limite. Le récépissé apparaîtra ici.")
              : (admin ? "Le client dépose lui-même son offre." : "Vous déposez vous-même l'offre : après le dépôt, enregistrez-le ici avec la photo du récépissé.")}
          </p>
          {!close && (admin || !parShiftUp) && (
            <button onClick={() => setFormDepot(true)} className="w-full bg-primary text-white rounded-lg py-2 text-xs font-semibold hover:opacity-90">
              <i className="fas fa-stamp mr-1.5" />Enregistrer le dépôt
            </button>
          )}
          {!close && !admin && parShiftUp && (
            <button onClick={() => setFormDepot(true)} className="text-[11px] text-gray-500 hover:text-accent">Vous l&apos;avez déposée vous-même ?</button>
          )}
        </div>
      ) : (
        <div className="bg-gray-50 rounded-xl p-3 space-y-2">
          <div className="grid sm:grid-cols-2 gap-2">
            <div><label className={etiquette} htmlFor={`dep-date-${prestationId}`}>Date et heure du dépôt</label>
              <input id={`dep-date-${prestationId}`} type="datetime-local" value={d.deposeLe} max={maintenantBenin()} onChange={(e) => setD({ ...d, deposeLe: e.target.value })} className={champ} /></div>
            <div><label className={etiquette} htmlFor={`dep-num-${prestationId}`}>N° du récépissé</label>
              <input id={`dep-num-${prestationId}`} value={d.numero} onChange={(e) => setD({ ...d, numero: e.target.value })} className={champ} placeholder="Facultatif" /></div>
          </div>
          <ChoixFichier valeur={d.recepisse} onChange={(f) => setD({ ...d, recepisse: f })} libelle="Joindre le récépissé (photo ou PDF)" />
          <textarea rows={2} value={d.commentaire} onChange={(e) => setD({ ...d, commentaire: e.target.value })} placeholder="Commentaire (facultatif)" className={`${champ} resize-none`} />
          <div className="flex gap-2">
            <button onClick={() => setFormDepot(false)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600 bg-white">Annuler</button>
            <button disabled={occupe || !d.deposeLe} onClick={async () => { if (await agir({ action: "depot", ...d, numero: d.numero || null, commentaire: d.commentaire || null })) setFormDepot(false); }}
              className="flex-1 bg-primary text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50">Enregistrer</button>
          </div>
        </div>
      )}

      {/* ── Résultat ── */}
      {(depot || resultat) && (
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs font-semibold text-primary">Résultat</p>
            <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold ${STYLE_RESULTAT[resultat?.statut ?? "EN_ATTENTE"]}`}>{RESULTATS[resultat?.statut ?? "EN_ATTENTE"]}</span>
          </div>
          {resultat && resultat.statut !== "EN_ATTENTE" && !formResultat && (
            <div className="text-xs text-gray-600 space-y-1">
              {resultat.date && <p><span className="text-gray-400">Date : </span>{new Date(`${resultat.date}T12:00:00+01:00`).toLocaleDateString("fr-FR")}</p>}
              {montantTexte(resultat.montantOffre) && <p><span className="text-gray-400">Montant de l&apos;offre : </span>{montantTexte(resultat.montantOffre)}</p>}
              {resultat.rang && <p><span className="text-gray-400">Rang : </span>{resultat.rang}</p>}
              {resultat.attributaire && <p><span className="text-gray-400">Attributaire : </span>{resultat.attributaire}</p>}
              {montantTexte(resultat.montantAttribue) && <p><span className="text-gray-400">Montant attribué : </span>{montantTexte(resultat.montantAttribue)}</p>}
              {resultat.motif && <p><span className="text-gray-400">Motif communiqué : </span>{resultat.motif}</p>}
              {resultat.commentaire && <p>{resultat.commentaire}</p>}
              <LienFichier f={resultat.document} libelle="Document" />
              <p className="text-[11px] text-gray-400">Enregistré par {vous(resultat.enregistrePar)} le {dateHeure(resultat.enregistreLe)}</p>
            </div>
          )}
          {!formResultat ? (
            <button onClick={() => setFormResultat(true)} className="w-full border border-gray-200 rounded-lg py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50">
              <i className="fas fa-flag-checkered mr-1.5" />{resultat && resultat.statut !== "EN_ATTENTE" ? "Modifier le résultat" : admin ? "Enregistrer le résultat" : "J'ai reçu le résultat"}
            </button>
          ) : (
            <div className="bg-gray-50 rounded-xl p-3 space-y-2">
              <div className="grid sm:grid-cols-2 gap-2">
                <div><label className={etiquette} htmlFor={`res-st-${prestationId}`}>Résultat</label>
                  <select id={`res-st-${prestationId}`} value={r.statut} onChange={(e) => setR({ ...r, statut: e.target.value as StatutResultat })} className={champ}>
                    {Object.entries(RESULTATS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select></div>
                <div><label className={etiquette} htmlFor={`res-dt-${prestationId}`}>Date de la notification</label>
                  <input id={`res-dt-${prestationId}`} type="date" value={r.date} onChange={(e) => setR({ ...r, date: e.target.value })} className={champ} /></div>
                <div><label className={etiquette} htmlFor={`res-mo-${prestationId}`}>Montant lu de votre offre (F CFA)</label>
                  <input id={`res-mo-${prestationId}`} inputMode="numeric" value={r.montantOffre} onChange={(e) => setR({ ...r, montantOffre: e.target.value })} className={champ} /></div>
                <div><label className={etiquette} htmlFor={`res-rg-${prestationId}`}>Rang obtenu</label>
                  <input id={`res-rg-${prestationId}`} inputMode="numeric" value={r.rang} onChange={(e) => setR({ ...r, rang: e.target.value })} className={champ} /></div>
                {r.statut !== "ATTRIBUE" && (
                  <div><label className={etiquette} htmlFor={`res-at-${prestationId}`}>Attributaire</label>
                    <input id={`res-at-${prestationId}`} value={r.attributaire} onChange={(e) => setR({ ...r, attributaire: e.target.value })} className={champ} placeholder="Entreprise retenue" /></div>
                )}
                <div><label className={etiquette} htmlFor={`res-ma-${prestationId}`}>Montant attribué (F CFA)</label>
                  <input id={`res-ma-${prestationId}`} inputMode="numeric" value={r.montantAttribue} onChange={(e) => setR({ ...r, montantAttribue: e.target.value })} className={champ} /></div>
              </div>
              {r.statut === "NON_RETENU" && (
                <textarea rows={2} value={r.motif} onChange={(e) => setR({ ...r, motif: e.target.value })} placeholder="Motif de rejet communiqué" className={`${champ} resize-none`} />
              )}
              <ChoixFichier valeur={r.document} onChange={(f) => setR({ ...r, document: f })} libelle="Joindre la lettre, le PV ou la publication" />
              <textarea rows={2} value={r.commentaire} onChange={(e) => setR({ ...r, commentaire: e.target.value })} placeholder="Commentaire (facultatif)" className={`${champ} resize-none`} />
              <div className="flex gap-2">
                <button onClick={() => setFormResultat(false)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600 bg-white">Annuler</button>
                <button disabled={occupe} onClick={async () => {
                  const rang = r.rang.trim() ? Number.parseInt(r.rang, 10) : null;
                  if (r.rang.trim() && !(rang && rang > 0)) { toast.error("Rang invalide."); return; }
                  const ok = await agir({
                    action: "resultat", statut: r.statut, date: r.date || null, montantOffre: lireMontant(r.montantOffre), montantAttribue: lireMontant(r.montantAttribue), rang,
                    attributaire: r.statut === "ATTRIBUE" ? null : r.attributaire || null, motif: r.statut === "NON_RETENU" ? r.motif || null : null,
                    document: r.document, commentaire: r.commentaire || null,
                  });
                  if (ok) setFormResultat(false);
                }} className="flex-1 bg-primary text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50">Enregistrer</button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

