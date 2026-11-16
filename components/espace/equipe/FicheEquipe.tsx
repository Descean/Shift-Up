"use client";

/**
 * Fiche d'un dossier pour l'équipe (maquette, espace monteur) : établir le devis (pré-rempli par la lecture
 * du dossier, contrôle du tarif plancher), checklist de montage avec dépôt des livrables, pause « pièce
 * manquante », révision après solde, paiement hors ligne (Direction), discussion avec le client.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Carte, EnTeteFiche, FilDiscussion, dateFr, fcfa } from "@/components/espace/elements";
import { libelleLivraison, type EtatDossier, type InfosDossier } from "@/lib/dossier";
import { libelleNature } from "@/lib/tarifs-montage";
import { televerser } from "@/lib/televerser";

type Livrable = { id: string; titre: string; type: string; url: string | null; observation: string | null; vu: boolean };
type Etape = { id: string; titre: string; statut: string; livrables: Livrable[] };
type Proposition = { items?: { label: string; amount: number }[]; total?: number; deposit?: number; resume?: string; livrables?: { titre: string }[]; pointsAttention?: string[]; etapes?: { titre: string }[]; auto?: boolean };
type Dossier = {
  id: string; reference: string; titre: string; etat: EtatDossier; statut: string; infos: InfosDossier; consigne: string | null; entreprise: string | null;
  client: { nom: string | null; email: string | null } | null; charge: { id: string; nom: string | null } | null;
  montant: number; paye: number; acompte: number; resteAPayer: number;
  devis: { total: number; acompte: number } | null;
  etapes: Etape[]; autresLivrables: Livrable[]; fichiersDepart: string[];
  analyse: { statut: string | null; raison: string | null; proposition: Proposition | null } | null;
  transcription: string | null; plancher: number | null;
};

const ETAPES_DEFAUT = ["Pièces Administratives", "Offre Technique & BPU", "Contrôle Qualité"];
const nomFichier = (u: string) => decodeURIComponent(u.split("?")[0].split("/").pop() ?? "fichier").replace(/^[a-f0-9]{8,}-/, "");

export default function FicheEquipe({ id }: { id: string }) {
  const router = useRouter();
  const [d, setD] = useState<Dossier | null>(null);
  const [direction, setDirection] = useState(false);
  const [introuvable, setIntrouvable] = useState(false);
  const [signal, setSignal] = useState(0);
  const [refaireDevis, setRefaireDevis] = useState(false);

  const charger = useCallback(async () => {
    const r = await fetch(`/api/equipe/dossiers/${id}`).catch(() => null);
    if (!r?.ok) { setIntrouvable(true); return; }
    const x = await r.json();
    setD(x.dossier); setDirection(!!x.direction);
  }, [id]);

  useEffect(() => {
    void Promise.resolve().then(charger);
    const t = setInterval(() => void charger(), 20_000);
    return () => clearInterval(t);
  }, [charger]);

  if (introuvable) return <p className="py-16 text-center text-gray-500">Dossier introuvable.</p>;
  if (!d) return <div className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl bg-white" />;

  const apres = () => { void charger(); setSignal((s) => s + 1); };
  const post = async (chemin: string, corps: unknown) => {
    const r = await fetch(chemin, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const x = await r.json().catch(() => ({}));
    return { ok: r.ok, statut: r.status, x };
  };

  const enProduction = ["production", "pause"].includes(d.etat) || (d.etat === "solde" && d.infos.revision && !d.infos.revision.faiteLe);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="overflow-hidden rounded-2xl border border-su-lavande bg-su-brume/30">
        <div className="p-4 pb-0 sm:p-6 sm:pb-0">
          <EnTeteFiche retour={() => router.push("/dashboard/equipe")} etat={d.etat} titre={d.titre}
            sousTitre={`${d.reference}${d.infos.nature ? ` • ${libelleLivraison(d.infos.livraison)}` : ""}${d.infos.urgence === "express" ? " • Express" : ""}`} dateLimite={d.infos.dateLimite} etiquette={d.infos.nature ? "Clôture du marché" : "Échéance souhaitée"}
            extra={<p className="mt-1 text-xs text-gray-500"><i className="far fa-user mr-1" />{d.client?.nom} · {d.client?.email}{d.entreprise ? ` · ${d.entreprise}` : ""}{d.charge ? ` · chargé : ${d.charge.nom}` : ""}</p>} />
        </div>

        <div className="grid gap-6 p-4 sm:p-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <div className="space-y-5">
            {(d.etat === "a_chiffrer" || refaireDevis) && <EtablirDevis d={d} direction={direction} onEnvoye={() => { setRefaireDevis(false); apres(); }} post={post} />}

            {d.etat === "attente_acompte" && !refaireDevis && (
              <Carte className="py-8 text-center">
                <i className="fas fa-hourglass-half text-3xl text-amber-500" />
                <p className="mt-3 font-semibold text-su-nuit">Devis envoyé avec succès.</p>
                <p className="mt-1 text-sm text-gray-500">En attente du paiement de l&apos;acompte ({fcfa(d.devis?.acompte ?? d.acompte)}) par le client pour démarrer le montage.</p>
                <p className="mt-1 text-xs text-gray-400">Total du devis : {fcfa(d.montant)}</p>
                <button type="button" onClick={() => setRefaireDevis(true)} className="mt-4 text-xs font-semibold text-su-bleu underline">Modifier le devis</button>
              </Carte>
            )}

            {(enProduction || d.etat === "termine" || d.etat === "solde") && d.etapes.length > 0 && (
              <Checklist d={d} actif={!!enProduction && d.etat !== "pause"} post={post} apres={apres} />
            )}

            {d.etat === "production" && (
              <button type="button" onClick={async () => {
                const motif = window.prompt("Quelle pièce manque-t-il ? (le client est alerté)");
                if (motif === null) return;
                const r = await post(`/api/equipe/dossiers/${d.id}/pause`, { pause: true, motif: motif.trim() || undefined });
                if (!r.ok) toast.error(r.x.error ?? "Impossible."); else { toast.success("Dossier mis en pause : le client est alerté."); apres(); }
              }} className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-white py-3 text-sm font-bold text-red-600 shadow-sm hover:bg-red-50">
                <i className="fas fa-hand" />Signaler une pièce manquante (Mettre en pause)
              </button>
            )}

            {d.etat === "pause" && (
              <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm font-medium text-red-800"><i className="fas fa-triangle-exclamation mr-2" />Dossier en pause (attente client) : {d.infos.pause?.motif}</p>
                <button type="button" onClick={async () => {
                  const r = await post(`/api/equipe/dossiers/${d.id}/pause`, { pause: false });
                  if (!r.ok) toast.error(r.x.error ?? "Impossible."); else { toast.success("Le montage reprend."); apres(); }
                }} className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-700">Reprendre le montage</button>
              </div>
            )}

            {d.infos.revision && !d.infos.revision.faiteLe && (
              <div className="rounded-2xl border border-purple-200 bg-purple-50 p-4">
                <p className="text-sm font-bold text-purple-800"><i className="fas fa-rotate mr-2" />Révision demandée le {dateFr(d.infos.revision.demandeeLe)}</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-purple-900">{d.infos.revision.texte}</p>
                <button type="button" onClick={async () => {
                  const r = await post(`/api/equipe/dossiers/${d.id}/revision`, {});
                  if (!r.ok) toast.error(r.x.error ?? "Impossible."); else { toast.success("Révision livrée."); apres(); }
                }} className="mt-3 rounded-lg bg-purple-700 px-4 py-2 text-xs font-bold text-white">Révision livrée</button>
              </div>
            )}

            {direction && (d.etat === "attente_acompte" || d.etat === "termine") && <PaiementHorsLigne d={d} apres={apres} />}

            <Carte titre="Pièces de départ" sousTitre="Documents et consigne du client">
              {d.fichiersDepart.length === 0 && !d.consigne && <p className="text-sm text-gray-400">Aucune pièce.</p>}
              <ul className="space-y-1.5">
                {d.fichiersDepart.map((u) => (
                  <li key={u}><a href={u} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-su-bleu hover:underline"><i className={`fas ${/\.(webm|m4a|mp3|ogg)/i.test(u) ? "fa-microphone" : "fa-file-lines"}`} />{nomFichier(u)}</a></li>
                ))}
              </ul>
              {d.consigne && <p className="mt-3 whitespace-pre-wrap rounded-xl bg-su-brume p-3 text-sm text-gray-700">{d.consigne}</p>}
              {d.transcription && <p className="mt-2 rounded-xl bg-su-brume p-3 text-xs italic text-gray-600"><i className="fas fa-microphone mr-1" />{d.transcription}</p>}
            </Carte>
          </div>

          <FilDiscussion prestationId={d.id} pieceJointe signal={signal} />
        </div>
      </div>
    </div>
  );
}

type Post = (chemin: string, corps: unknown) => Promise<{ ok: boolean; statut: number; x: { error?: string; plancher?: number } }>;

function EtablirDevis({ d, direction, onEnvoye, post }: { d: Dossier; direction: boolean; onEnvoye: () => void; post: Post }) {
  const prop = d.analyse?.proposition ?? null;
  const [total, setTotal] = useState(String(d.devis?.total ?? prop?.total ?? ""));
  const [acompte, setAcompte] = useState(String(d.devis?.acompte ?? prop?.deposit ?? ""));
  const [etapes, setEtapes] = useState((prop?.etapes?.length ? prop.etapes.map((e) => e.titre) : ETAPES_DEFAUT).join("\n"));
  const [envoi, setEnvoi] = useState(false);
  const [lecture, setLecture] = useState(false);
  const nature = libelleNature(d.infos.nature) ?? "ce dossier";
  const t = Number(total), a = Number(acompte);
  const sous = d.plancher !== null && t > 0 && t < d.plancher;

  async function envoyer(confirmerSousPlancher = false) {
    if (!t || !a) { toast.error("Indiquez le montant total et l'acompte."); return; }
    if (a > t) { toast.error("L'acompte ne peut pas dépasser le total."); return; }
    const liste = etapes.split("\n").map((x) => x.trim()).filter(Boolean);
    if (!liste.length) { toast.error("Indiquez au moins une étape."); return; }
    setEnvoi(true);
    try {
      const r = await post(`/api/equipe/dossiers/${d.id}/devis`, { total: Math.round(t), acompte: Math.round(a), etapes: liste, confirmerSousPlancher });
      if (r.statut === 409 && r.x.error === "sous_plancher") {
        if (window.confirm(`Attention ! Le tarif minimum défini par la Direction pour ce type est de ${(r.x.plancher ?? 0).toLocaleString("fr-FR")} F. Voulez-vous vraiment facturer moins ?`)) await envoyer(true);
        return;
      }
      if (!r.ok) { toast.error(r.x.error ?? "Envoi impossible."); return; }
      toast.success("Devis envoyé au client."); onEnvoye();
    } finally { setEnvoi(false); }
  }

  const statut = d.analyse?.statut;
  return (
    <Carte titre="Établir le devis de montage">
      {d.plancher !== null && (
        <div className="mb-4 flex gap-3 rounded-xl border border-blue-100 bg-blue-50 p-3">
          <i className="fas fa-circle-info mt-0.5 text-blue-500" />
          <div><p className="text-xs font-bold text-blue-800">Règle de tarification (Direction)</p>
            <p className="text-xs text-blue-700">Le tarif minimum paramétré pour ce type de dossier ({nature}) est de <strong>{fcfa(d.plancher)}</strong>.</p></div>
        </div>
      )}

      <div className="mb-4 rounded-xl border border-su-lavande bg-su-brume/40 p-3 text-xs">
        <div className="flex items-center justify-between gap-2">
          <p className="font-bold text-su-nuit"><i className="fas fa-wand-magic-sparkles mr-1.5 text-su-bleu" />Lecture du dossier</p>
          <span className="text-gray-500">
            {statut === "ok" ? "Proposition prête" : statut === "en_cours" || statut === "en_attente" ? "En cours…" : statut === "echec" ? "Échec" : "Proposition selon la grille"}
          </span>
        </div>
        {prop?.resume && <p className="mt-2 text-gray-700">{prop.resume}</p>}
        {prop?.items && prop.items.length > 0 && (
          <ul className="mt-2 space-y-0.5">{prop.items.map((l, i) => <li key={i} className="flex justify-between gap-3 text-gray-600"><span>{l.label}</span><span className="whitespace-nowrap">{Math.round(l.amount).toLocaleString("fr-FR")} F</span></li>)}</ul>
        )}
        {prop?.pointsAttention && prop.pointsAttention.length > 0 && (
          <div className="mt-2"><p className="font-semibold text-orange-700">Points d&apos;attention</p><ul className="list-disc pl-4 text-gray-600">{prop.pointsAttention.map((p, i) => <li key={i}>{p}</li>)}</ul></div>
        )}
        {statut === "echec" && d.analyse?.raison && <p className="mt-2 text-red-600">{d.analyse.raison}</p>}
        <button type="button" disabled={lecture} onClick={async () => {
          setLecture(true);
          const r = await post(`/api/admin/prestations/${d.id}/analyse`, {});
          setLecture(false);
          if (!r.ok) toast.error(r.x.error ?? "Lecture impossible."); else toast.success("Lecture relancée : la proposition se met à jour dans un instant.");
        }} className="mt-2 font-semibold text-su-bleu underline disabled:opacity-50">{lecture ? "Lecture…" : "Relancer la lecture automatique"}</button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="q-total" className="mb-1 block text-xs font-semibold text-gray-600">Montant Total Facturé (FCFA)</label>
          <input id="q-total" inputMode="numeric" value={total} onChange={(e) => { setTotal(e.target.value.replace(/\D/g, "")); }} placeholder={`Ex : ${d.plancher ?? 30000}`}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:outline-none ${sous ? "border-orange-300 bg-orange-50" : "border-su-lavande focus:border-su-bleu"}`} />
          {sous && <p className="mt-1 text-[11px] text-orange-700">Sous le tarif minimum{direction ? " : confirmation demandée à l'envoi" : " : envoi refusé"}.</p>}
        </div>
        <div>
          <label htmlFor="q-acompte" className="mb-1 block text-xs font-semibold text-gray-600">Acompte demandé (FCFA)</label>
          <input id="q-acompte" inputMode="numeric" value={acompte} onChange={(e) => setAcompte(e.target.value.replace(/\D/g, ""))} placeholder="Ex : 12000"
            className="w-full rounded-xl border border-su-lavande px-3 py-2.5 text-sm focus:border-su-bleu focus:outline-none" />
          {t > 0 && <button type="button" onClick={() => setAcompte(String(Math.ceil((t * 0.6) / 5000) * 5000))} className="mt-1 text-[11px] text-su-bleu underline">60 % du total</button>}
        </div>
      </div>
      <div className="mt-4">
        <label htmlFor="q-etapes" className="mb-1 block text-xs font-semibold text-gray-600">Étapes du montage (une par ligne)</label>
        <textarea id="q-etapes" value={etapes} onChange={(e) => setEtapes(e.target.value)} rows={4} className="w-full rounded-xl border border-su-lavande px-3 py-2.5 text-sm focus:border-su-bleu focus:outline-none" />
      </div>
      <button type="button" onClick={() => void envoyer()} disabled={envoi} className="mt-4 w-full rounded-xl bg-su-nuit py-3.5 text-sm font-bold text-white hover:bg-su-cadet disabled:opacity-60">
        {envoi ? "Envoi…" : "Générer le devis et l'envoyer au client"}
      </button>
    </Carte>
  );
}

function Checklist({ d, actif, post, apres }: { d: Dossier; actif: boolean; post: Post; apres: () => void }) {
  const [occupe, setOccupe] = useState<string | null>(null);
  const champ = useRef<HTMLInputElement>(null);
  const cible = useRef<string | null>(null);

  async function changer(etapeId: string, statut: "IN_PROGRESS" | "DONE") {
    setOccupe(etapeId);
    const r = await post(`/api/equipe/dossiers/${d.id}/etape`, { etapeId, statut });
    setOccupe(null);
    if (!r.ok) { toast.error(r.x.error ?? "Impossible."); return; }
    if ((r.x as { termine?: boolean }).termine) toast.success("Toutes les étapes sont faites : le client est invité à vérifier et à régler le solde.");
    apres();
  }

  async function deposer(fichiers: FileList | null) {
    const phaseId = cible.current;
    if (!fichiers?.length || !phaseId) return;
    const t = toast.loading("Dépôt du livrable…");
    try {
      for (const f of Array.from(fichiers)) {
        const up = await televerser(f);
        const ext = (f.name.split(".").pop() ?? "").toUpperCase();
        const r = await post(`/api/admin/prestations/${d.id}/livrable`, { title: f.name.replace(/\.[^.]+$/, ""), type: ext === "PDF" ? "PDF" : ["ZIP", "RAR"].includes(ext) ? "ARCHIVE" : "DOCUMENT", url: up.url, isAvailable: true, phaseId });
        if (!r.ok) throw new Error(r.x.error ?? "Dépôt impossible.");
      }
      toast.success("Livrable déposé : le client peut le lire (sans téléchargement avant le solde).", { id: t });
      apres();
    } catch (e) { toast.error((e as Error).message || "Dépôt impossible.", { id: t }); }
  }

  return (
    <Carte titre="Checklist de Montage" sousTitre="Validez chaque étape rigoureusement.">
      <input ref={champ} type="file" multiple className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.zip,.jpg,.jpeg,.png" onChange={(e) => { void deposer(e.target.files); e.target.value = ""; }} />
      <ul className="divide-y divide-su-lavande">
        {d.etapes.map((e) => {
          const fait = e.statut === "DONE";
          return (
            <li key={e.id} className="py-3">
              <div className="flex items-center justify-between gap-3">
                <span className={`text-sm font-medium ${fait ? "text-gray-400 line-through" : "text-su-nuit"}`}>{e.titre}</span>
                {fait ? (
                  <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-bold text-emerald-600"><i className="fas fa-check mr-1" />Fait</span>
                ) : actif && e.statut === "IN_PROGRESS" ? (
                  <button type="button" disabled={occupe === e.id} onClick={() => void changer(e.id, "DONE")} className="rounded-lg bg-su-bleu px-3 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-su-cadet disabled:opacity-50">Marquer terminé</button>
                ) : actif ? (
                  <button type="button" disabled={occupe === e.id} onClick={() => void changer(e.id, "IN_PROGRESS")} className="rounded-lg border border-su-lavande bg-su-brume px-3 py-1.5 text-xs font-medium text-su-nuit hover:bg-su-lavande disabled:opacity-50">Démarrer</button>
                ) : null}
              </div>
              {(e.livrables.length > 0 || actif) && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {e.livrables.map((l) => (
                    <a key={l.id} href={l.url ?? "#"} target="_blank" rel="noreferrer" title={l.observation ? `Observation du client : ${l.observation}` : l.vu ? "Lu par le client" : "Pas encore lu"}
                      className="inline-flex max-w-full items-center gap-1.5 rounded-full border border-su-lavande bg-white px-2.5 py-1 text-[11px] text-su-nuit hover:border-su-bleu">
                      <i className={`fas fa-file-lines ${l.vu ? "text-emerald-600" : "text-su-bleu"}`} /><span className="truncate">{l.titre}</span>
                      {l.observation && <i className="fas fa-comment-dots text-orange-500" />}
                    </a>
                  ))}
                  <button type="button" onClick={() => { cible.current = e.id; champ.current?.click(); }} className="text-[11px] font-semibold text-su-bleu hover:underline">
                    <i className="fas fa-upload mr-1" />Déposer un livrable
                  </button>
                </div>
              )}
              {e.livrables.filter((l) => l.observation).map((l) => (
                <p key={l.id} className="mt-1.5 rounded-lg bg-orange-50 px-2.5 py-1.5 text-[11px] text-orange-800"><strong>{l.titre} :</strong> {l.observation}</p>
              ))}
            </li>
          );
        })}
      </ul>
    </Carte>
  );
}

function PaiementHorsLigne({ d, apres }: { d: Dossier; apres: () => void }) {
  const du = d.etat === "attente_acompte" ? Math.min(d.devis?.acompte ?? d.acompte, d.resteAPayer) : d.resteAPayer;
  const [ouvert, setOuvert] = useState(false);
  const [montant, setMontant] = useState(String(du));
  const [moyen, setMoyen] = useState("MOBILE_MONEY");
  const [reference, setReference] = useState("");
  const [envoi, setEnvoi] = useState(false);
  if (!ouvert) return <button type="button" onClick={() => setOuvert(true)} className="w-full rounded-xl border border-su-lavande bg-white py-2.5 text-xs font-semibold text-su-bleu hover:border-su-bleu"><i className="fas fa-cash-register mr-1.5" />Enregistrer un paiement reçu hors ligne</button>;
  return (
    <Carte titre="Paiement reçu hors ligne" sousTitre={`Reste dû : ${fcfa(d.resteAPayer)}`}>
      <div className="grid gap-3 sm:grid-cols-3">
        <input inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value.replace(/\D/g, ""))} className="rounded-xl border border-su-lavande px-3 py-2 text-sm" aria-label="Montant" />
        <select value={moyen} onChange={(e) => setMoyen(e.target.value)} className="rounded-xl border border-su-lavande px-3 py-2 text-sm" aria-label="Moyen">
          <option value="MOBILE_MONEY">Mobile Money</option><option value="ESPECES">Espèces</option><option value="BANK_TRANSFER">Virement</option><option value="CHEQUE">Chèque</option>
        </select>
        <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="Référence (facultatif)" className="rounded-xl border border-su-lavande px-3 py-2 text-sm" />
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" disabled={envoi} onClick={async () => {
          setEnvoi(true);
          const r = await fetch(`/api/admin/prestations/${d.id}/paiement`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ montant: Number(montant), moyen, reference: reference || null }) });
          setEnvoi(false);
          const x = await r.json().catch(() => ({}));
          if (!r.ok) { toast.error(x.error ?? "Enregistrement impossible."); return; }
          toast.success("Paiement enregistré."); setOuvert(false); apres();
        }} className="rounded-xl bg-su-nuit px-4 py-2 text-xs font-bold text-white disabled:opacity-50">Enregistrer</button>
        <button type="button" onClick={() => setOuvert(false)} className="px-3 text-xs text-gray-500">Annuler</button>
      </div>
    </Carte>
  );
}
