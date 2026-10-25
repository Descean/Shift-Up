"use client";
/**
 * Montage de dossier : résumé de l'appel d'offres et liste des pièces à fournir.
 *  - <ResumeDossier>   fiche de l'appel d'offres + compte à rebours
 *  - <PiecesClient>    le client dépose ses pièces, signale celles qu'il n'a pas, prévient SHIFT UP
 *  - <PiecesAdmin>     l'équipe valide / fait reprendre, ajoute des pièces, relance le client
 */
import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { televerser } from "@/lib/televerser";
import {
  CATEGORIES_PIECE, MODES_DEPOT, STATUTS_PIECE, bilanPieces, dateLimiteFr, dossierVide, echeance,
  type CategoriePiece, type Dossier, type DossierSaisie, type Piece, type StatutPiece,
} from "@/lib/montage";
import FicheMarche, { ficheComplete } from "@/components/prestations/FicheMarche";

type Reponse = { dossier: Dossier | null; pieces: Piece[]; message?: string };

async function agir(prestationId: string, corps: Record<string, unknown>): Promise<Reponse | null> {
  try {
    const r = await fetch(`/api/prestations/${prestationId}/pieces`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(corps) });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) { toast.error(d.error ?? "Action impossible."); return null; }
    if (d.message) toast.success(d.message);
    return d as Reponse;
  } catch { toast.error("Erreur réseau."); return null; }
}

const STYLE_STATUT: Record<StatutPiece, string> = {
  A_FOURNIR: "bg-gray-100 text-gray-600",
  FOURNI: "bg-blue-50 text-blue-700",
  VALIDE: "bg-green-100 text-green-700",
  A_REPRENDRE: "bg-red-100 text-red-700",
  INDISPONIBLE: "bg-amber-100 text-amber-700",
  NON_REQUIS: "bg-gray-50 text-gray-400",
};
const ICONE_STATUT: Record<StatutPiece, string> = {
  A_FOURNIR: "fa-circle", FOURNI: "fa-hourglass-half", VALIDE: "fa-circle-check", A_REPRENDRE: "fa-rotate-left", INDISPONIBLE: "fa-ban", NON_REQUIS: "fa-minus",
};

export function BadgeStatut({ statut }: { statut: StatutPiece }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold whitespace-nowrap ${STYLE_STATUT[statut]}`}>
      <i className={`fas ${ICONE_STATUT[statut]} text-[9px]`} />{STATUTS_PIECE[statut]}
    </span>
  );
}

export function BadgeEcheance({ dateLimite, compact = false }: { dateLimite: string; compact?: boolean }) {
  const e = echeance(dateLimite);
  const style = e.niveau === "depassee" ? "bg-gray-200 text-gray-600" : e.niveau === "urgent" ? "bg-red-600 text-white" : e.niveau === "proche" ? "bg-amber-100 text-amber-800" : "bg-accent/10 text-accent";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"} ${style}`}>
      <i className="fas fa-hourglass-end text-[9px]" />{e.libelle}
    </span>
  );
}

function grouper(pieces: Piece[]) {
  return CATEGORIES_PIECE.map((c) => ({ categorie: c, items: pieces.filter((p) => p.categorie === c) })).filter((g) => g.items.length > 0);
}

function Avancement({ pieces }: { pieces: Piece[] }) {
  const b = bilanPieces(pieces);
  const pct = b.total ? Math.round((b.recues / b.total) * 100) : 0;
  return (
    <div>
      <div className="flex justify-between text-xs text-gray-500 mb-1">
        <span>{b.recues} / {b.total} pièce(s) reçue(s){b.valides ? ` · ${b.valides} conforme(s)` : ""}</span>
        <span className="font-semibold text-primary">{pct}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-accent to-secondary rounded-full transition-all" style={{ width: `${pct}%` }} /></div>
      {(b.aReprendre > 0 || b.indisponibles > 0) && (
        <p className="text-xs mt-1.5 text-gray-500">
          {b.aReprendre > 0 && <span className="text-red-600 font-medium mr-3">{b.aReprendre} à reprendre</span>}
          {b.indisponibles > 0 && <span className="text-amber-700 font-medium">{b.indisponibles} non disponible(s)</span>}
        </p>
      )}
    </div>
  );
}

function Fichiers({ piece, onRetirer }: { piece: Piece; onRetirer?: (url: string) => void }) {
  if (!piece.fichiers?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {piece.fichiers.map((f) => (
        <span key={f.url} className="inline-flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-lg pl-2.5 pr-1.5 py-1 text-xs text-gray-700 max-w-full">
          <a href={f.url} target="_blank" rel="noopener noreferrer" className="truncate max-w-[180px] hover:text-accent" title={f.nom}>
            <i className="fas fa-file mr-1 text-gray-400" />{f.nom}
          </a>
          {onRetirer && (
            <button onClick={() => onRetirer(f.url)} aria-label={`Retirer ${f.nom}`} className="text-gray-400 hover:text-red-500 px-1"><i className="fas fa-xmark" /></button>
          )}
        </span>
      ))}
    </div>
  );
}

// ─── Résumé de l'appel d'offres ──────────────────────────────────────────────
export function ResumeDossier({ dossier }: { dossier: Dossier }) {
  const lignes: [string, string | null | undefined][] = [
    ["Avis", dossier.referenceAvis],
    ["Autorité contractante", dossier.autorite],
    ["Type", dossier.typeMarche + (dossier.procedure ? ` — ${dossier.procedure}` : "")],
    ["Lot(s)", dossier.lots],
    ["Financement", dossier.financement],
    ["Soumissionnaire", dossier.soumissionnaire + (dossier.groupement ? ` (groupement${dossier.membresGroupement ? ` : ${dossier.membresGroupement}` : ""})` : "")],
    ["Dépôt", MODES_DEPOT[dossier.modeDepot] + (dossier.lieuDepot ? ` — ${dossier.lieuDepot}` : "")],
  ];
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Appel d&apos;offres</p>
          <p className="text-sm font-semibold text-primary">{dossier.intitule}</p>
        </div>
        <BadgeEcheance dateLimite={dossier.dateLimite} />
      </div>
      <div className="px-4 py-3 space-y-1.5 text-xs">
        <p className="text-primary"><i className="fas fa-calendar-day mr-1.5 text-accent" />Date limite : <strong>{dateLimiteFr(dossier.dateLimite)}</strong></p>
        {lignes.filter(([, v]) => v).map(([k, v]) => (
          <p key={k} className="text-gray-600"><span className="text-gray-400">{k} : </span>{v}</p>
        ))}
        <p className="text-gray-600"><span className="text-gray-400">Attendu : </span>{dossier.prestations.join(", ")}</p>
      </div>
    </div>
  );
}

// ─── Espace client ────────────────────────────────────────────────────────────
export function PiecesClient({ prestationId, pieces: depart, close = false, onMaj }: { prestationId: string; pieces: Piece[]; close?: boolean; onMaj?: () => void }) {
  const [pieces, setPieces] = useState<Piece[]>(depart);
  const [envoi, setEnvoi] = useState<string | null>(null);
  const [indispo, setIndispo] = useState<string | null>(null);
  const [motif, setMotif] = useState("");
  const [autre, setAutre] = useState(false);
  const [libelleAutre, setLibelleAutre] = useState("");
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cible = useRef<string | null>(null);

  async function appliquer(corps: Record<string, unknown>) {
    setOccupe(true);
    const r = await agir(prestationId, corps);
    setOccupe(false);
    if (r) { setPieces(r.pieces); onMaj?.(); }
    return r;
  }

  function choisirFichier(pieceId: string) {
    cible.current = pieceId;
    fileRef.current?.click();
  }

  async function surFichier(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    const pieceId = cible.current;
    if (fileRef.current) fileRef.current.value = "";
    if (!file || !pieceId) return;
    setEnvoi(pieceId);
    try {
      const f = await televerser(file);
      if (pieceId === "__autre") {
        if (await appliquer({ action: "ajouter_autre", libelle: libelleAutre.trim(), fichier: { url: f.url, nom: f.name } })) { setAutre(false); setLibelleAutre(""); toast.success("Document ajouté."); }
      } else if (await appliquer({ action: "deposer", pieceId, fichier: { url: f.url, nom: f.name } })) {
        toast.success("Pièce déposée.");
      }
    } catch (err) { toast.error((err as Error).message || "Envoi impossible."); }
    finally { setEnvoi(null); }
  }

  const b = bilanPieces(pieces);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide"><i className="fas fa-folder-open mr-1.5" />Pièces à fournir</p>
        {b.attendues > 0 && !close && <span className="text-[11px] font-bold text-accent">{b.attendues} en attente</span>}
      </div>
      <Avancement pieces={pieces} />
      {!close && <p className="text-xs text-gray-500">Déposez chaque document dans sa ligne (PDF, photo ou Word, 50 Mo maximum). Vous n&apos;avez pas une pièce ? Dites-le : nous vous indiquerons comment l&apos;obtenir ou la remplacer.</p>}

      <input ref={fileRef} type="file" className="hidden" accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.webp,.zip" onChange={surFichier} />

      {grouper(pieces).map((g) => (
        <div key={g.categorie}>
          <p className="text-[11px] font-semibold text-accent uppercase tracking-wide mb-1.5">{g.categorie}</p>
          <ul className="space-y-2">
            {g.items.map((p) => {
              const modifiable = !close && p.statut !== "NON_REQUIS";
              return (
                <li key={p.id} className={`border rounded-xl p-3 ${p.statut === "A_REPRENDRE" ? "border-red-200 bg-red-50/40" : p.statut === "VALIDE" ? "border-green-100" : "border-gray-100"}`}>
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm ${p.statut === "NON_REQUIS" ? "text-gray-400 line-through" : "text-primary"}`}>{p.libelle}</p>
                    <BadgeStatut statut={p.statut} />
                  </div>
                  {p.commentaireAdmin && <p className="text-xs text-red-700 mt-1"><i className="fas fa-comment-dots mr-1" />SHIFT UP : {p.commentaireAdmin}</p>}
                  {p.statut === "INDISPONIBLE" && p.commentaireClient && <p className="text-xs text-amber-700 mt-1">Votre réponse : {p.commentaireClient}</p>}
                  <Fichiers piece={p} onRetirer={modifiable && p.statut !== "VALIDE" ? (url) => appliquer({ action: "retirer", pieceId: p.id, url }) : undefined} />
                  {modifiable && p.statut !== "VALIDE" && indispo !== p.id && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      <button onClick={() => choisirFichier(p.id)} disabled={occupe || envoi !== null}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-primary rounded-lg px-3 py-1.5 hover:opacity-90 disabled:opacity-50">
                        {envoi === p.id ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />Envoi…</> : <><i className="fas fa-cloud-arrow-up" />{p.fichiers.length ? "Ajouter un fichier" : "Déposer"}</>}
                      </button>
                      {p.statut !== "INDISPONIBLE" && p.fichiers.length === 0 && (
                        <button onClick={() => { setIndispo(p.id); setMotif(""); }} className="text-xs text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
                          Je n&apos;ai pas cette pièce
                        </button>
                      )}
                    </div>
                  )}
                  {indispo === p.id && (
                    <div className="mt-2 space-y-2">
                      <textarea rows={2} value={motif} onChange={(e) => setMotif(e.target.value)} placeholder="Pourquoi ? (en cours de demande, expirée, jamais obtenue…)"
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none" />
                      <div className="flex gap-2">
                        <button onClick={() => setIndispo(null)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600">Annuler</button>
                        <button disabled={occupe || motif.trim().length < 2} onClick={async () => { if (await appliquer({ action: "indisponible", pieceId: p.id, commentaire: motif })) setIndispo(null); }}
                          className="flex-1 bg-gray-700 text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50">Envoyer</button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      ))}

      {!close && (
        <div className="space-y-3">
          {autre ? (
            <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
              <input value={libelleAutre} onChange={(e) => setLibelleAutre(e.target.value)} placeholder="Nom du document (ex : additif n°1, attestation de visite de site)"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent" />
              <div className="flex gap-2">
                <button onClick={() => setAutre(false)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600">Annuler</button>
                <button disabled={libelleAutre.trim().length < 2 || envoi !== null} onClick={() => choisirFichier("__autre")}
                  className="flex-1 bg-primary text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50">
                  {envoi === "__autre" ? "Envoi…" : "Choisir le fichier"}
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setAutre(true)} className="w-full border-2 border-dashed border-gray-200 rounded-xl py-2.5 text-xs text-gray-500 hover:border-accent hover:text-accent">
              <i className="fas fa-plus mr-1.5" />Ajouter un autre document
            </button>
          )}

          <div className="bg-accent/5 rounded-xl p-3 space-y-2">
            <p className="text-xs text-gray-600">Vous avez déposé ce que vous aviez ? Prévenez-nous pour que nous vérifions vos pièces.</p>
            <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message pour l'équipe (facultatif)"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none bg-white" />
            <button disabled={occupe} onClick={async () => { if (await appliquer({ action: "notifier", message: message || null })) setMessage(""); }}
              className="w-full bg-gradient-to-r from-accent to-secondary text-white rounded-lg py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50">
              <i className="fas fa-paper-plane mr-1.5" />Prévenir SHIFT UP
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Administration ───────────────────────────────────────────────────────────
export function PiecesAdmin({ prestationId, dossier: dossierDepart, pieces: depart, onMaj }: { prestationId: string; dossier: Dossier | null; pieces: Piece[]; onMaj?: () => void }) {
  const [dossier, setDossier] = useState<Dossier | null>(dossierDepart);
  const [pieces, setPieces] = useState<Piece[]>(depart);
  const [edition, setEdition] = useState(false);
  const [fiche, setFiche] = useState<DossierSaisie>(dossierDepart ?? dossierVide());
  const [commentaires, setCommentaires] = useState<Record<string, string>>({});
  const [reprise, setReprise] = useState<string | null>(null);
  const [nouvelle, setNouvelle] = useState({ libelle: "", categorie: "Administratif" as CategoriePiece });
  const [message, setMessage] = useState("");
  const [occupe, setOccupe] = useState(false);

  async function appliquer(corps: Record<string, unknown>) {
    setOccupe(true);
    const r = await agir(prestationId, corps);
    setOccupe(false);
    if (r) { setPieces(r.pieces); setDossier(r.dossier); onMaj?.(); }
    return r;
  }

  if (!dossier || edition) {
    return (
      <div className="space-y-4">
        <p className="text-sm font-semibold text-primary">{dossier ? "Corriger la fiche de l'appel d'offres" : "Fiche de l'appel d'offres"}</p>
        {!dossier && <p className="text-xs text-gray-500">Cette demande n&apos;a pas de fiche. Renseignez-la pour créer la liste des pièces à fournir.</p>}
        <FicheMarche valeur={fiche} onChange={setFiche} prefixe={`adm-${prestationId}`} />
        <div className="flex gap-2">
          {dossier && <button onClick={() => setEdition(false)} className="flex-1 border border-gray-200 rounded-xl py-2 text-xs text-gray-600">Annuler</button>}
          <button disabled={occupe || !ficheComplete(fiche)} onClick={async () => { if (await appliquer({ action: "dossier", dossier: fiche })) { setEdition(false); toast.success("Fiche enregistrée."); } }}
            className="flex-1 bg-primary text-white rounded-xl py-2 text-xs font-semibold disabled:opacity-50">Enregistrer</button>
        </div>
      </div>
    );
  }

  const b = bilanPieces(pieces);
  return (
    <div className="space-y-4">
      <ResumeDossier dossier={dossier} />
      <button onClick={() => { setFiche(dossier); setEdition(true); }} className="text-xs text-accent hover:underline"><i className="fas fa-pen mr-1" />Corriger la fiche</button>

      <Avancement pieces={pieces} />

      {grouper(pieces).map((g) => (
        <div key={g.categorie}>
          <p className="text-[11px] font-semibold text-accent uppercase tracking-wide mb-1.5">{g.categorie}</p>
          <ul className="space-y-2">
            {g.items.map((p) => (
              <li key={p.id} className="border border-gray-100 rounded-xl p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm ${p.statut === "NON_REQUIS" ? "text-gray-400 line-through" : "text-primary"}`}>{p.libelle}</p>
                  <BadgeStatut statut={p.statut} />
                </div>
                {p.commentaireClient && <p className="text-xs text-amber-700 mt-1"><i className="fas fa-user mr-1" />Client : {p.commentaireClient}</p>}
                {p.commentaireAdmin && <p className="text-xs text-red-700 mt-1"><i className="fas fa-comment-dots mr-1" />{p.commentaireAdmin}</p>}
                <Fichiers piece={p} />
                {reprise === p.id ? (
                  <div className="mt-2 space-y-2">
                    <textarea rows={2} value={commentaires[p.id] ?? ""} onChange={(e) => setCommentaires({ ...commentaires, [p.id]: e.target.value })} placeholder="Ce qui ne va pas (expirée, illisible, mauvais document…)"
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none" />
                    <div className="flex gap-2">
                      <button onClick={() => setReprise(null)} className="flex-1 border border-gray-200 rounded-lg py-1.5 text-xs text-gray-600">Annuler</button>
                      <button disabled={occupe || !(commentaires[p.id] ?? "").trim()} onClick={async () => { if (await appliquer({ action: "statut", pieceId: p.id, statut: "A_REPRENDRE", commentaire: commentaires[p.id] })) setReprise(null); }}
                        className="flex-1 bg-red-600 text-white rounded-lg py-1.5 text-xs font-semibold disabled:opacity-50">Faire reprendre</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {p.statut !== "VALIDE" && (
                      <button disabled={occupe} onClick={() => appliquer({ action: "statut", pieceId: p.id, statut: "VALIDE" })} className="text-[11px] font-semibold text-green-700 border border-green-200 rounded-lg px-2.5 py-1 hover:bg-green-50">
                        <i className="fas fa-check mr-1" />Conforme
                      </button>
                    )}
                    {p.statut !== "A_REPRENDRE" && (
                      <button disabled={occupe} onClick={() => setReprise(p.id)} className="text-[11px] font-semibold text-red-700 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50">
                        <i className="fas fa-rotate-left mr-1" />À reprendre
                      </button>
                    )}
                    {p.statut !== "NON_REQUIS" ? (
                      <button disabled={occupe} onClick={() => appliquer({ action: "statut", pieceId: p.id, statut: "NON_REQUIS" })} className="text-[11px] text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">Non requis</button>
                    ) : (
                      <button disabled={occupe} onClick={() => appliquer({ action: "statut", pieceId: p.id, statut: "A_FOURNIR" })} className="text-[11px] text-gray-500 border border-gray-200 rounded-lg px-2.5 py-1 hover:bg-gray-50">Rétablir</button>
                    )}
                    <button disabled={occupe} onClick={() => { if (window.confirm(`Supprimer « ${p.libelle} » de la liste ?`)) appliquer({ action: "supprimer", pieceId: p.id }); }}
                      className="text-[11px] text-gray-400 hover:text-red-600 px-2 py-1" aria-label={`Supprimer ${p.libelle}`}><i className="fas fa-trash" /></button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div className="border border-dashed border-gray-200 rounded-xl p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-600">Ajouter une pièce demandée par le DAO</p>
        <input value={nouvelle.libelle} onChange={(e) => setNouvelle({ ...nouvelle, libelle: e.target.value })} placeholder="Ex : Attestation de visite de site"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent" />
        <div className="flex gap-2">
          <select value={nouvelle.categorie} onChange={(e) => setNouvelle({ ...nouvelle, categorie: e.target.value as CategoriePiece })} className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs bg-white">
            {CATEGORIES_PIECE.map((c) => <option key={c}>{c}</option>)}
          </select>
          <button disabled={occupe || nouvelle.libelle.trim().length < 2} onClick={async () => { if (await appliquer({ action: "ajouter", ...nouvelle })) setNouvelle({ ...nouvelle, libelle: "" }); }}
            className="bg-primary text-white rounded-lg px-4 py-1.5 text-xs font-semibold disabled:opacity-50">Ajouter</button>
        </div>
      </div>

      <div className="bg-accent/5 rounded-xl p-3 space-y-2">
        <p className="text-xs text-gray-600">Envoyer au client la liste de ce qui manque ({b.attendues} pièce(s) en attente{b.aReprendre ? `, dont ${b.aReprendre} à reprendre` : ""}).</p>
        <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Message au client (facultatif)"
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-accent resize-none bg-white" />
        <button disabled={occupe} onClick={async () => { if (await appliquer({ action: "notifier_client", message: message || null })) setMessage(""); }}
          className="w-full bg-primary text-white rounded-lg py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50">
          <i className="fas fa-envelope mr-1.5" />Relancer le client par e-mail
        </button>
      </div>
    </div>
  );
}
