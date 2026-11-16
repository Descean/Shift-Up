"use client";

/** Fiche d'un dossier côté client (maquette) : devis et acompte, suivi d'avancement, aperçu, solde, téléchargement, discussion. */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Carte, EnTeteFiche, FilDiscussion, ModalePaiement, dateFr, fcfa } from "@/components/espace/elements";
import Visionneuse from "@/components/prestations/Visionneuse";
import { libelleLivraison, type EtatDossier, type InfosDossier } from "@/lib/dossier";
import { televerser } from "@/lib/televerser";

type Livrable = { id: string; titre: string; type: string; url: string | null; observation: string | null; vu: boolean };
type Etape = { id: string; titre: string; statut: string; livrables: Livrable[] };
type Dossier = {
  id: string; reference: string; titre: string; etat: EtatDossier; statut: string; infos: InfosDossier; revisionOuverte: boolean;
  montant: number; paye: number; acompte: number; resteAPayer: number; solde: boolean;
  devis: { lignes: { label: string; amount: number }[]; total: number; acompte: number; resume: string | null; livrables: { titre: string; description?: string }[]; pointsAttention: string[] } | null;
  etapes: Etape[]; autresLivrables: Livrable[];
};

export default function FicheDossier({ id }: { id: string }) {
  const router = useRouter();
  const [d, setD] = useState<Dossier | null>(null);
  const [introuvable, setIntrouvable] = useState(false);
  const [paiement, setPaiement] = useState<null | { montant: number; libelle: string }>(null);
  const [apercu, setApercu] = useState<Etape | null>(null);
  const [lecture, setLecture] = useState<Livrable | null>(null);
  const [signal, setSignal] = useState(0);
  const [detail, setDetail] = useState(false);
  const piece = useRef<HTMLInputElement>(null);

  const charger = useCallback(async () => {
    const r = await fetch(`/api/client/dossiers/${id}`).catch(() => null);
    if (!r?.ok) { setIntrouvable(true); return; }
    setD((await r.json()).dossier);
  }, [id]);

  useEffect(() => {
    void charger();
    const t = setInterval(() => void charger(), 20_000);
    return () => clearInterval(t);
  }, [charger]);

  if (introuvable) return <p className="py-16 text-center text-gray-500">Dossier introuvable.</p>;
  if (!d) return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl bg-white" />;

  async function decision(action: "modifier_devis", commentaire: string) {
    const r = await fetch(`/api/prestations/${id}/decision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, commentaire }) });
    const x = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error(x.error ?? "Envoi impossible."); return; }
    toast.success("Demande envoyée : le devis va être revu."); void charger(); setSignal((s) => s + 1);
  }

  async function transmettre(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    const t = toast.loading("Envoi du document…");
    try {
      const pieces = [];
      for (const f of Array.from(fichiers).slice(0, 5)) { const r = await televerser(f); pieces.push({ url: r.url, nom: f.name }); }
      const r = await fetch(`/api/prestations/${id}/messages`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ pieces }) });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error);
      toast.success("Document transmis au monteur.", { id: t }); setSignal((s) => s + 1);
    } catch (e) { toast.error((e as Error).message || "Envoi impossible.", { id: t }); }
  }

  async function revision() {
    const texte = window.prompt("Que faut-il revoir ? (révision incluse, 48 h après le solde)");
    if (!texte?.trim()) return;
    const r = await fetch(`/api/client/dossiers/${id}/revision`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ texte }) });
    const x = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error(x.error ?? "Envoi impossible."); return; }
    toast.success("Révision demandée : le monteur s'en occupe."); void charger(); setSignal((s) => s + 1);
  }

  const suivi = d.etapes.length > 0 && ["production", "pause", "termine", "solde"].includes(d.etat);
  const tousLivrables = [...d.etapes.flatMap((e) => e.livrables), ...d.autresLivrables];

  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-su-lavande bg-su-brume/30">
        <div className="p-4 pb-0 sm:p-6 sm:pb-0">
          <EnTeteFiche retour={() => router.push("/dashboard/client")} etat={d.etat} titre={d.titre}
            sousTitre={`${d.reference} • ${libelleLivraison(d.infos.livraison)}${d.infos.urgence === "express" ? " • Express" : ""}`} dateLimite={d.infos.dateLimite} />
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {d.etat === "a_chiffrer" && (
              <Carte className="py-10 text-center">
                <i className="fas fa-magnifying-glass-chart text-3xl text-su-bleu" />
                <p className="mt-3 font-semibold text-su-nuit">Analyse du dossier en cours…</p>
                <p className="mt-1 text-sm text-gray-500">Notre équipe étudie vos documents. Vous recevrez un devis ici sous peu.</p>
              </Carte>
            )}

            {d.etat === "attente_acompte" && d.devis && (
              <Carte>
                <div className="rounded-xl border border-su-lavande bg-su-brume/60 p-5 text-center">
                  <p className="text-xs font-bold uppercase tracking-wide text-su-bleu">Devis validé</p>
                  <p className="mt-1 text-3xl font-extrabold text-su-nuit">{fcfa(d.devis.total)}</p>
                  <p className="mt-2 text-xs text-gray-500">Ce tarif inclut l&apos;analyse, le montage complet et le contrôle qualité.</p>
                </div>
                {(d.devis.lignes.length > 1 || d.devis.livrables.length > 0 || d.devis.resume) && (
                  <button type="button" onClick={() => setDetail(!detail)} className="mt-3 w-full text-center text-xs font-semibold text-su-bleu">
                    {detail ? "Masquer le détail" : "Voir le détail du devis"} <i className={`fas fa-chevron-${detail ? "up" : "down"} ml-1 text-[10px]`} />
                  </button>
                )}
                {detail && (
                  <div className="mt-3 space-y-3 text-sm">
                    {d.devis.resume && <p className="text-gray-600">{d.devis.resume}</p>}
                    <ul className="divide-y divide-su-lavande rounded-xl border border-su-lavande">
                      {d.devis.lignes.map((l, i) => <li key={i} className="flex justify-between gap-3 px-3 py-2"><span className="text-gray-600">{l.label}</span><span className="whitespace-nowrap font-semibold text-su-nuit">{fcfa(l.amount)}</span></li>)}
                    </ul>
                    {d.devis.livrables.length > 0 && (
                      <div><p className="mb-1 text-xs font-bold text-su-nuit">Ce que vous recevrez</p>
                        <ul className="space-y-1">{d.devis.livrables.map((l, i) => <li key={i} className="text-xs text-gray-600"><i className="fas fa-check mr-1.5 text-emerald-600" />{l.titre}</li>)}</ul></div>
                    )}
                  </div>
                )}
                <button type="button" onClick={() => setPaiement({ montant: Math.min(d.acompte, d.resteAPayer), libelle: "Acompte pour démarrer le montage" })}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-su-nuit py-4 text-base font-bold text-white shadow-lg hover:bg-su-cadet">
                  <i className="fas fa-lock" />Payer l&apos;acompte ({fcfa(Math.min(d.acompte, d.resteAPayer))}) pour démarrer
                </button>
                <button type="button" onClick={() => { const c = window.prompt("Qu'aimeriez-vous changer dans ce devis ?"); if (c?.trim()) void decision("modifier_devis", c.trim()); }}
                  className="mt-2 w-full py-2 text-xs font-medium text-gray-500 hover:text-su-nuit">Demander une modification du devis</button>
              </Carte>
            )}

            {suivi && (
              <Carte titre="Suivi d'avancement">
                <ol className="relative space-y-5">
                  {d.etapes.map((e, i) => {
                    const fait = e.statut === "DONE", enCours = e.statut === "IN_PROGRESS";
                    return (
                      <li key={e.id} className="relative flex items-start gap-3">
                        {i < d.etapes.length - 1 && <span className="absolute left-3 top-7 h-[calc(100%+4px)] w-px bg-su-lavande" />}
                        <span className={`relative z-10 mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${fait ? "bg-emerald-100 text-emerald-600" : enCours ? "bg-su-brume text-su-bleu" : "bg-gray-100 text-gray-300"}`}>
                          <i className={`fas ${fait ? "fa-check text-[10px]" : enCours ? "fa-spinner fa-spin text-[10px]" : "fa-circle text-[6px]"}`} />
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className={`text-sm font-bold ${fait ? "text-su-nuit" : "text-gray-600"}`}>{e.titre}</p>
                          <p className="text-xs text-gray-400">{fait ? "Étape validée par le monteur" : enCours ? "En cours de traitement…" : "En attente"}</p>
                        </div>
                        {e.livrables.length > 0 && d.etat !== "solde" && (
                          <button type="button" onClick={() => setApercu(e)} className="rounded-lg border border-su-lavande bg-white px-3 py-1.5 text-xs font-medium text-gray-600 shadow-sm hover:text-su-bleu">
                            <i className="far fa-eye mr-1" />Aperçu
                          </button>
                        )}
                      </li>
                    );
                  })}
                </ol>
              </Carte>
            )}

            {d.etat === "pause" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-red-700"><i className="fas fa-triangle-exclamation mr-2" />Action requise de votre part</p>
                  <p className="mt-1 text-xs text-red-700/80">{d.infos.pause?.motif ?? "Une pièce est manquante."} Consultez la discussion à droite.</p>
                </div>
                <input ref={piece} type="file" multiple className="hidden" onChange={(e) => { void transmettre(e.target.files); e.target.value = ""; }} />
                <button type="button" onClick={() => piece.current?.click()} className="rounded-xl bg-red-600 px-5 py-3 text-sm font-bold text-white hover:bg-red-700">Transmettre le document</button>
              </div>
            )}

            {d.etat === "termine" && (
              <div className="rounded-2xl border-2 border-su-ciel bg-su-brume/70 p-6 text-center">
                <span className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-white text-su-bleu shadow-sm"><i className="fas fa-box-open" /></span>
                <p className="mt-3 text-lg font-bold text-su-nuit">Montage 100% terminé !</p>
                <p className="mt-1 text-sm text-gray-600">Vérifiez l&apos;aperçu, puis réglez le solde pour télécharger vos fichiers Word et PDF déverrouillés.</p>
                <button type="button" onClick={() => setPaiement({ montant: d.resteAPayer, libelle: "Solde du montage" })}
                  className="mt-4 w-full rounded-xl bg-su-nuit py-3.5 text-sm font-bold text-white hover:bg-su-cadet">
                  Payer le solde ({fcfa(d.resteAPayer)}) <i className="fas fa-lock-open ml-1 text-emerald-400" />
                </button>
              </div>
            )}

            {d.etat === "solde" && (
              <div className="space-y-3 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-bold text-emerald-800"><i className="fas fa-circle-check mr-2" />Dossier soldé et déverrouillé</p>
                  <span className="rounded-full border border-emerald-300 bg-white px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">1 Révision incluse (48h)</span>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {tousLivrables.filter((l) => l.url).map((l, i) => (
                    <a key={l.id} href={l.url!} target="_blank" rel="noreferrer"
                      className={`flex items-center justify-center gap-2 truncate rounded-xl px-4 py-3 text-sm font-semibold ${i % 2 ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-emerald-200 bg-white text-su-nuit hover:border-emerald-400"}`}>
                      <i className={`fas ${/pdf/i.test(l.titre + l.type) ? "fa-file-pdf" : "fa-file-word"}`} /><span className="truncate">{l.titre}</span>
                    </a>
                  ))}
                  {tousLivrables.every((l) => !l.url) && <p className="text-xs text-emerald-800">Vos fichiers apparaîtront ici.</p>}
                </div>
                {d.revisionOuverte && (
                  <button type="button" onClick={revision} className="w-full rounded-xl border border-emerald-300 bg-white py-2.5 text-sm font-semibold text-emerald-800 hover:bg-emerald-100">
                    Demander la révision incluse
                  </button>
                )}
                {d.infos.revision && (
                  <p className="text-xs text-emerald-800">
                    Révision demandée le {dateFr(d.infos.revision.demandeeLe)} — {d.infos.revision.faiteLe ? `faite le ${dateFr(d.infos.revision.faiteLe)}` : "en cours"}.
                  </p>
                )}
              </div>
            )}

            {d.etat === "annule" && <Carte className="text-center text-sm text-gray-500">Ce dossier a été annulé.</Carte>}
          </div>

          <FilDiscussion prestationId={d.id} pieceJointe signal={signal} />
        </div>
      </div>

      {paiement && <ModalePaiement prestationId={d.id} montant={paiement.montant} libelle={paiement.libelle} onFermer={() => setPaiement(null)} />}

      {apercu && !lecture && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-su-nuit/60 p-4" onClick={() => setApercu(null)}>
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-bold text-su-nuit"><i className="far fa-eye mr-2 text-su-bleu" />Aperçu avant paiement — {apercu.titre}</h3>
              <button type="button" onClick={() => setApercu(null)} className="rounded-lg bg-su-brume px-3 py-1 text-xs font-semibold text-gray-600">Fermer</button>
            </div>
            <ul className="space-y-3">
              {apercu.livrables.map((l) => <ApercuLivrable key={l.id} l={l} prestationId={d.id} onLire={() => setLecture(l)} />)}
            </ul>
            <p className="mt-4 rounded-xl bg-su-brume p-3 text-xs text-gray-600"><i className="fas fa-lock mr-1.5 text-su-bleu" />Version sécurisée en lecture seule. Réglez le solde pour débloquer les fichiers originaux Word, Excel et PDF.</p>
          </div>
        </div>
      )}
      {lecture && <Visionneuse livrableId={lecture.id} titre={lecture.titre} lienTelechargement={lecture.url} onFermer={() => setLecture(null)} />}
    </div>
  );
}

function ApercuLivrable({ l, prestationId, onLire }: { l: Livrable; prestationId: string; onLire: () => void }) {
  const [obs, setObs] = useState("");
  const [envoye, setEnvoye] = useState(!!l.observation);
  async function envoyer() {
    if (!obs.trim()) return;
    const r = await fetch(`/api/prestations/${prestationId}/observation`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ livrableId: l.id, observation: obs.trim() }) });
    if (!r.ok) { toast.error("Envoi impossible."); return; }
    toast.success("Observation transmise au monteur."); setEnvoye(true); setObs("");
  }
  return (
    <li className="rounded-xl border border-su-lavande p-3">
      <div className="flex items-center gap-3">
        <i className="fas fa-file-lines text-su-bleu" />
        <span className="min-w-0 flex-1 truncate text-sm font-semibold text-su-nuit">{l.titre}</span>
        <button type="button" onClick={onLire} className="rounded-lg bg-su-nuit px-3 py-1.5 text-xs font-semibold text-white">Lire</button>
      </div>
      {envoye ? (
        <p className="mt-2 text-xs text-emerald-700"><i className="fas fa-check mr-1" />Observation transmise{l.observation ? ` : « ${l.observation} »` : "."}</p>
      ) : (
        <div className="mt-2 flex gap-2">
          <input value={obs} onChange={(e) => setObs(e.target.value)} placeholder="Une remarque sur ce document ?" className="min-w-0 flex-1 rounded-lg border border-su-lavande px-3 py-2 text-xs focus:border-su-bleu focus:outline-none" />
          <button type="button" onClick={envoyer} disabled={!obs.trim()} className="rounded-lg border border-su-lavande px-3 text-xs font-semibold text-su-bleu disabled:opacity-40">Envoyer</button>
        </div>
      )}
    </li>
  );
}
