"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { MOTIFS_NON_RETENU, LIBELLES_CONSERVATION, DELAI_REPONSE_JOURS, DUREE_CONSERVATION_MOIS, libelleMotif } from "@/lib/recrutement/motifs";

type Statut = "NOUVELLE" | "EN_REVUE" | "PRESELECTIONNEE" | "RETENUE" | "NON_RETENUE";
type Conservation = "EN_ATTENTE" | "ACCEPTEE" | "REFUSEE" | "EXPIREE";
type Piece = { type: string; path: string; nom: string; taille: number };
interface Candidature {
  id: string; reference: string; offreCode: string; offreTitre: string;
  nom: string; prenoms: string; email: string; telephone: string; ville: string; nationalite: string;
  diplome: string; anneeDiplome: number; anneesExperience: number; nbProjetsSimilaires: number;
  disponibilite: string; source: string | null; fichiers: Piece[]; statut: Statut; noteInterne: string | null; createdAt: string;
  motifsNonRetenu: string[]; commentaireNonRetenu: string | null; notifieLe: string | null; relanceLe: string | null;
  conservation: Conservation | null; conservationLe: string | null; conservationJusquau: string | null; donneesSupprimeesLe: string | null;
}

const STATUTS: Record<Statut, { label: string; cls: string }> = {
  NOUVELLE: { label: "Nouvelle", cls: "bg-accent-50 text-accent-700 border-accent-100" },
  EN_REVUE: { label: "En revue", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  PRESELECTIONNEE: { label: "Présélectionnée", cls: "bg-primary text-white border-primary" },
  RETENUE: { label: "Retenue", cls: "bg-green-50 text-green-800 border-green-200" },
  NON_RETENUE: { label: "Non retenue", cls: "bg-white text-gray-500 border-gray-200" },
};
const CONS_CLS: Record<Conservation, string> = {
  EN_ATTENTE: "bg-amber-50 text-amber-800 border-amber-200",
  ACCEPTEE: "bg-green-50 text-green-800 border-green-200",
  REFUSEE: "bg-gray-100 text-gray-600 border-gray-200",
  EXPIREE: "bg-gray-100 text-gray-600 border-gray-200",
};

const LIB_PIECE: Record<string, string> = { CV: "CV", DIPLOME: "Diplôme", ATTESTATIONS: "Attestation", AUTRES: "Autre pièce" };
const jour = (s: string | null) => (s ? new Date(s).toLocaleDateString("fr-FR") : "—");

function BadgeDonnees({ c }: { c: Candidature }) {
  if (c.donneesSupprimeesLe) return <span className="text-[11px] font-semibold border px-2 py-0.5 rounded-full whitespace-nowrap bg-gray-100 text-gray-600 border-gray-200">Données supprimées</span>;
  if (!c.conservation) {
    if (c.statut === "NON_RETENUE") return <span className="text-[11px] font-semibold border px-2 py-0.5 rounded-full whitespace-nowrap bg-white text-amber-800 border-amber-300">À notifier</span>;
    return null;
  }
  return <span className={`text-[11px] font-semibold border px-2 py-0.5 rounded-full whitespace-nowrap ${CONS_CLS[c.conservation]}`}>{c.conservation === "ACCEPTEE" ? "Vivier" : LIBELLES_CONSERVATION[c.conservation]}</span>;
}

/** Choix des motifs + message, partagé par la fiche et l'envoi groupé. */
function FormulaireNonRetenu({ nb, onEnvoyer, envoi, initial }: {
  nb: number; envoi: boolean; initial?: { motifs: string[]; commentaire: string | null };
  onEnvoyer: (motifs: string[], commentaire: string) => void;
}) {
  const [motifs, setMotifs] = useState<string[]>(initial?.motifs ?? []);
  const [commentaire, setCommentaire] = useState(initial?.commentaire ?? "");
  const bascule = (code: string) => setMotifs((m) => (m.includes(code) ? m.filter((x) => x !== code) : [...m, code]));
  return (
    <div className="space-y-3">
      <fieldset className="space-y-2">
        <legend className="text-sm font-semibold text-primary mb-1">Motifs communiqués au candidat</legend>
        {MOTIFS_NON_RETENU.map((m) => (
          <label key={m.code} className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer rounded-lg px-2 py-1.5 hover:bg-gray-50">
            <input type="checkbox" checked={motifs.includes(m.code)} onChange={() => bascule(m.code)} className="mt-1 w-4 h-4 accent-[#0A2533]" />
            <span>{m.label}</span>
          </label>
        ))}
      </fieldset>
      <div>
        <label htmlFor="commentaire-nr" className="text-sm font-semibold text-primary">Message personnel (facultatif)</label>
        <textarea id="commentaire-nr" value={commentaire} onChange={(e) => setCommentaire(e.target.value)} rows={3} maxLength={1500}
          className="mt-1 w-full p-3 rounded-xl border border-gray-300 text-sm text-primary" placeholder="Ex. : votre expérience en ouvrages d'art pourra intéresser un prochain projet." />
      </div>
      <p className="text-xs text-gray-500 leading-relaxed">
        Le courriel donne au candidat deux choix : garder son dossier {DUREE_CONSERVATION_MOIS} mois (vivier) ou le supprimer.
        Sans réponse sous {DELAI_REPONSE_JOURS} jours (relance à mi-parcours), ses pièces et coordonnées sont supprimées automatiquement.
      </p>
      <button disabled={envoi || motifs.length === 0} onClick={() => onEnvoyer(motifs, commentaire)}
        className="min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent disabled:opacity-50">
        {envoi ? "Envoi…" : nb > 1 ? `Notifier les ${nb} candidats` : "Envoyer la notification"}
      </button>
    </div>
  );
}

export default function RecrutementAdminPage() {
  const [liste, setListe] = useState<Candidature[]>([]);
  const [offres, setOffres] = useState<{ code: string; titre: string; total: number }[]>([]);
  const [compteurs, setCompteurs] = useState<Partial<Record<Statut, number>>>({});
  const [vivier, setVivier] = useState(0);
  const [aNotifier, setANotifier] = useState(0);
  const [offre, setOffre] = useState("");
  const [statut, setStatut] = useState("");
  const [donnees, setDonnees] = useState("");
  const [q, setQ] = useState("");
  const [charge, setCharge] = useState(true);
  const [ouvert, setOuvert] = useState<Candidature | null>(null);
  const [note, setNote] = useState("");
  const [selection, setSelection] = useState<Set<string>>(new Set());
  const [groupe, setGroupe] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; texte: string } | null>(null);

  const params = useCallback(() => {
    const p = new URLSearchParams();
    if (offre) p.set("offre", offre);
    if (statut) p.set("statut", statut);
    if (donnees) p.set("donnees", donnees);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [offre, statut, donnees, q]);

  const charger = useCallback(async () => {
    setCharge(true);
    const r = await fetch(`/api/admin/recrutement?${params()}`);
    if (r.ok) {
      const d = await r.json();
      setListe(d.candidatures);
      setOffres(d.offres);
      setCompteurs(d.statuts);
      setVivier(d.vivier ?? 0);
      setANotifier(d.aNotifier ?? 0);
    }
    setCharge(false);
  }, [params]);

  useEffect(() => {
    const t = setTimeout(charger, 250);
    return () => clearTimeout(t);
  }, [charger]);

  const remplacer = (maj: Candidature[]) => {
    const m = new Map(maj.map((c) => [c.id, c]));
    setListe((l) => l.map((c) => m.get(c.id) ?? c));
    setOuvert((o) => (o && m.get(o.id)) || o);
  };

  async function maj(id: string, data: { statut?: Statut; noteInterne?: string }) {
    const r = await fetch("/api/admin/recrutement", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    if (r.ok) remplacer([(await r.json()).candidature]);
  }

  async function notifier(ids: string[], motifs: string[], commentaire: string) {
    setEnvoi(true); setMessage(null);
    const r = await fetch("/api/admin/recrutement/notifier", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids, motifs, commentaire }) });
    const d = await r.json().catch(() => ({}));
    setEnvoi(false);
    if (!r.ok) { setMessage({ ok: false, texte: d.error ?? "Envoi impossible." }); return; }
    remplacer(d.candidatures);
    const echecs = (d.resultats as { reference: string; ok: boolean; raison?: string }[]).filter((x) => !x.ok);
    setMessage({ ok: echecs.length === 0, texte: `${d.envoyes} courriel(s) envoyé(s).${echecs.length ? " Non envoyés : " + echecs.map((e) => `${e.reference} (${e.raison})`).join(", ") + "." : ""}` });
    setSelection(new Set()); setGroupe(false);
    charger();
  }

  async function supprimer(c: Candidature) {
    if (!confirm(`Supprimer définitivement les pièces et les coordonnées de ${c.nom} ${c.prenoms} ? Cette action est irréversible.`)) return;
    const r = await fetch(`/api/admin/recrutement?id=${encodeURIComponent(c.id)}`, { method: "DELETE" });
    if (r.ok) { remplacer([(await r.json()).candidature]); charger(); }
  }

  const total = Object.values(compteurs).reduce((s, n) => s + (n ?? 0), 0);
  const selectionnables = useMemo(() => liste.filter((c) => !c.donneesSupprimeesLe && c.statut !== "RETENUE" && c.conservation !== "ACCEPTEE" && c.conservation !== "REFUSEE"), [liste]);
  const toutCoche = selectionnables.length > 0 && selectionnables.every((c) => selection.has(c.id));
  const cocher = (id: string) => setSelection((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="font-syne font-black text-2xl text-primary mb-1">Recrutement — Candidatures</h1>
          <p className="text-sm text-gray-500">Dossiers déposés sur shiftup.bj/recrutement</p>
        </div>
        <a href={`/api/admin/recrutement/export?${params()}`} className="inline-flex items-center gap-2 min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent transition-colors">
          <i className="fas fa-file-csv" aria-hidden /> Exporter (Excel / CSV)
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        {[
          { label: "Candidatures", value: total, action: () => { setStatut(""); setDonnees(""); } },
          { label: "Nouvelles", value: compteurs.NOUVELLE ?? 0, action: () => { setStatut("NOUVELLE"); setDonnees(""); } },
          { label: "Retenues", value: compteurs.RETENUE ?? 0, action: () => { setStatut("RETENUE"); setDonnees(""); } },
          { label: "Non retenues à notifier", value: aNotifier, action: () => { setStatut(""); setDonnees("a_notifier"); } },
          { label: "Vivier (accord de conservation)", value: vivier, action: () => { setStatut(""); setDonnees("vivier"); } },
        ].map((s) => (
          <button key={s.label} onClick={s.action} className="text-left bg-white rounded-2xl border border-gray-200 p-4 hover:border-primary transition-colors">
            <p className="font-syne font-black text-2xl text-primary">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-4 flex flex-wrap gap-3">
        <select value={offre} onChange={(e) => setOffre(e.target.value)} className="min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-primary bg-white" aria-label="Poste">
          <option value="">Tous les postes</option>
          {offres.map((o) => <option key={o.code} value={o.code}>{o.code} — {o.titre} ({o.total})</option>)}
        </select>
        <select value={statut} onChange={(e) => setStatut(e.target.value)} className="min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-primary bg-white" aria-label="Statut">
          <option value="">Tous les statuts</option>
          {Object.entries(STATUTS).map(([k, s]) => <option key={k} value={k}>{s.label}</option>)}
        </select>
        <select value={donnees} onChange={(e) => setDonnees(e.target.value)} className="min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-primary bg-white" aria-label="Données">
          <option value="">Toutes les données</option>
          <option value="a_notifier">Non retenus à notifier</option>
          <option value="attente">Réponse attendue</option>
          <option value="vivier">Vivier (accord)</option>
          <option value="supprimees">Données supprimées</option>
        </select>
        <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Rechercher" placeholder="Rechercher : nom, e-mail, référence, diplôme…" className="flex-1 min-w-[220px] min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-primary" />
      </div>

      {message && (
        <div className={`mb-4 rounded-xl border px-4 py-3 text-sm ${message.ok ? "bg-green-50 border-green-200 text-green-900" : "bg-amber-50 border-amber-200 text-amber-900"}`} role="status">
          {message.texte}
        </div>
      )}

      {selection.size > 0 && (
        <div className="mb-4 rounded-2xl border border-primary bg-white p-4 flex flex-wrap items-center gap-3">
          <p className="text-sm text-primary font-semibold flex-1">{selection.size} candidature(s) sélectionnée(s)</p>
          <button onClick={() => setGroupe(true)} className="min-h-[44px] px-5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent">
            <i className="fas fa-envelope mr-2" aria-hidden />Notifier la non-sélection
          </button>
          <button onClick={() => setSelection(new Set())} className="min-h-[44px] px-4 rounded-xl border border-gray-300 text-sm text-primary">Annuler</button>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
              <th className="pl-4 py-3 w-8">
                <input type="checkbox" aria-label="Tout sélectionner" checked={toutCoche} disabled={!selectionnables.length}
                  onChange={() => setSelection(toutCoche ? new Set() : new Set(selectionnables.map((c) => c.id)))} className="w-4 h-4 accent-[#0A2533]" />
              </th>
              <th className="px-4 py-3 font-medium">Date</th>
              <th className="px-4 py-3 font-medium">Poste</th>
              <th className="px-4 py-3 font-medium">Candidat</th>
              <th className="px-4 py-3 font-medium">Diplôme</th>
              <th className="px-4 py-3 font-medium text-right">Exp.</th>
              <th className="px-4 py-3 font-medium text-right">Projets</th>
              <th className="px-4 py-3 font-medium">Statut</th>
            </tr>
          </thead>
          <tbody>
            {charge && liste.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Chargement…</td></tr>
            )}
            {!charge && liste.length === 0 && (
              <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-500">Aucune candidature pour ces critères.</td></tr>
            )}
            {liste.map((c) => {
              const peut = selectionnables.some((x) => x.id === c.id);
              return (
                <tr key={c.id} onClick={() => { setOuvert(c); setNote(c.noteInterne ?? ""); }} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                  <td className="pl-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" aria-label={`Sélectionner ${c.reference}`} disabled={!peut} checked={selection.has(c.id)} onChange={() => cocher(c.id)} className="w-4 h-4 accent-[#0A2533] disabled:opacity-30" />
                  </td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                  <td className="px-4 py-3"><span className="font-syne font-semibold text-xs text-accent bg-accent-50 px-2 py-0.5 rounded">{c.offreCode}</span></td>
                  <td className="px-4 py-3">
                    <p className="font-semibold text-primary">{c.nom} {c.prenoms !== "—" ? c.prenoms : ""}</p>
                    <p className="text-xs text-gray-500">{c.reference}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[260px] truncate">{c.diplome} ({c.anneeDiplome})</td>
                  <td className="px-4 py-3 text-right text-primary font-semibold">{c.anneesExperience} ans</td>
                  <td className="px-4 py-3 text-right text-primary">{c.nbProjetsSimilaires}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col items-start gap-1">
                      <span className={`text-xs font-semibold border px-2.5 py-1 rounded-full whitespace-nowrap ${STATUTS[c.statut].cls}`}>{STATUTS[c.statut].label}</span>
                      <BadgeDonnees c={c} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {groupe && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/40 p-4" onClick={() => setGroupe(false)}>
          <div className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl p-6 space-y-4" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Notifier la non-sélection">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg text-primary">Notifier {selection.size} candidat(s) non retenu(s)</h2>
              <button onClick={() => setGroupe(false)} className="w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-500" aria-label="Fermer"><i className="fas fa-xmark" aria-hidden /></button>
            </div>
            <p className="text-sm text-gray-600">Les mêmes motifs seront envoyés à chaque candidat sélectionné, qui passera en « Non retenue ».</p>
            <FormulaireNonRetenu nb={selection.size} envoi={envoi} onEnvoyer={(m, t) => notifier([...selection], m, t)} />
          </div>
        </div>
      )}

      {ouvert && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/40" onClick={() => setOuvert(null)}>
          <aside className="w-full max-w-lg h-full bg-white overflow-y-auto p-6 space-y-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Détail de la candidature">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">{ouvert.reference} · {ouvert.offreTitre}</p>
                <h2 className="text-xl text-primary mt-1">{ouvert.nom} {ouvert.prenoms !== "—" ? ouvert.prenoms : ""}</h2>
              </div>
              <button onClick={() => setOuvert(null)} className="w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-500" aria-label="Fermer"><i className="fas fa-xmark" aria-hidden /></button>
            </div>

            {ouvert.donneesSupprimeesLe ? (
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Pièces et coordonnées supprimées le {jour(ouvert.donneesSupprimeesLe)}
                {ouvert.conservation === "EXPIREE" ? " (sans réponse du candidat dans le délai)." : ouvert.conservation === "ACCEPTEE" ? " (fin de la durée de conservation)." : " (à la demande du candidat)."}
                {ouvert.motifsNonRetenu.length > 0 && <span className="block mt-2">Motifs envoyés : {ouvert.motifsNonRetenu.map(libelleMotif).join(" ")}</span>}
              </div>
            ) : (
              <>
                <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                  {[
                    ["E-mail", <a key="m" href={`mailto:${ouvert.email}`} className="text-accent underline">{ouvert.email}</a>],
                    ["Téléphone", <a key="t" href={`tel:${ouvert.telephone.replace(/\s/g, "")}`} className="text-accent underline">{ouvert.telephone}</a>],
                    ["Ville", `${ouvert.ville} · ${ouvert.nationalite}`],
                    ["Diplôme", `${ouvert.diplome} (${ouvert.anneeDiplome})`],
                    ["Expérience", `${ouvert.anneesExperience} ans`],
                    ["Projets similaires", ouvert.nbProjetsSimilaires],
                    ["Disponibilité", ouvert.disponibilite],
                    ["Source", ouvert.source ?? "—"],
                    ["Déposée le", new Date(ouvert.createdAt).toLocaleString("fr-FR")],
                  ].map(([k, v]) => (
                    <div key={String(k)} className="contents">
                      <dt className="text-gray-500">{k}</dt>
                      <dd className="text-primary font-medium break-words">{v}</dd>
                    </div>
                  ))}
                </dl>

                <div>
                  <h3 className="font-syne font-semibold text-primary mb-2">Pièces</h3>
                  <ul className="space-y-2">
                    {ouvert.fichiers.map((f, i) => (
                      <li key={i} className="flex items-center gap-3 border border-gray-200 rounded-xl px-3 py-2 text-sm">
                        <i className="fas fa-file-pdf text-primary" aria-hidden />
                        <span className="flex-1 min-w-0">
                          <span className="block font-medium text-primary">{LIB_PIECE[f.type] ?? f.type}</span>
                          <span className="block text-xs text-gray-500 truncate">{f.nom} · {(f.taille / 1024 / 1024).toFixed(1)} Mo</span>
                        </span>
                        <a href={`/api/admin/recrutement/fichier?id=${ouvert.id}&i=${i}`} target="_blank" rel="noopener" className="text-accent text-xs font-semibold px-2 py-2">Ouvrir</a>
                        <a href={`/api/admin/recrutement/fichier?id=${ouvert.id}&i=${i}&dl=1`} className="text-accent text-xs font-semibold px-2 py-2">Télécharger</a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h3 className="font-syne font-semibold text-primary mb-2">Statut</h3>
                  <div className="flex flex-wrap gap-2">
                    {(Object.keys(STATUTS) as Statut[]).map((s) => (
                      <button key={s} onClick={() => maj(ouvert.id, { statut: s })}
                        className={`min-h-[40px] px-3 rounded-full text-xs font-semibold border transition-colors ${ouvert.statut === s ? STATUTS[s].cls : "bg-white text-gray-600 border-gray-300 hover:border-primary"}`}>
                        {STATUTS[s].label}
                      </button>
                    ))}
                  </div>
                </div>

                {ouvert.statut !== "RETENUE" && (
                  <div className="border-t border-gray-100 pt-5">
                    <h3 className="font-syne font-semibold text-primary mb-2">Non-sélection et données</h3>
                    {ouvert.notifieLe && (
                      <div className="rounded-xl border border-gray-200 p-4 text-sm space-y-1 mb-4">
                        <p className="text-primary"><span className="text-gray-500">Notifié le</span> {jour(ouvert.notifieLe)}{ouvert.relanceLe ? ` · relancé le ${jour(ouvert.relanceLe)}` : ""}</p>
                        <p className="text-primary"><span className="text-gray-500">Réponse :</span> {ouvert.conservation ? LIBELLES_CONSERVATION[ouvert.conservation] : "—"}
                          {ouvert.conservation === "EN_ATTENTE" && ` (suppression le ${jour(ouvert.conservationJusquau)} sans réponse)`}
                          {ouvert.conservation === "ACCEPTEE" && ` le ${jour(ouvert.conservationLe)}, conservé jusqu'au ${jour(ouvert.conservationJusquau)}`}
                        </p>
                        <ul className="list-disc pl-5 text-gray-600 pt-1">{ouvert.motifsNonRetenu.map((m) => <li key={m}>{libelleMotif(m)}</li>)}</ul>
                      </div>
                    )}
                    {ouvert.conservation !== "ACCEPTEE" && ouvert.conservation !== "REFUSEE" && (
                      <FormulaireNonRetenu key={ouvert.id} nb={1} envoi={envoi}
                        initial={ouvert.notifieLe ? { motifs: ouvert.motifsNonRetenu, commentaire: ouvert.commentaireNonRetenu } : undefined}
                        onEnvoyer={(m, t) => notifier([ouvert.id], m, t)} />
                    )}
                    {ouvert.conservation === "EN_ATTENTE" && <p className="text-xs text-gray-500 mt-2">Un nouvel envoi repousse la date limite de réponse de {DELAI_REPONSE_JOURS} jours.</p>}
                  </div>
                )}

                <div>
                  <h3 className="font-syne font-semibold text-primary mb-2">Note interne</h3>
                  <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} aria-label="Note interne" className="w-full p-3 rounded-xl border border-gray-300 text-sm text-primary" placeholder="Appréciation, points à vérifier…" />
                  <button onClick={() => maj(ouvert.id, { noteInterne: note })} className="mt-2 min-h-[40px] px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent">Enregistrer la note</button>
                </div>

                <div className="border-t border-gray-100 pt-5">
                  <button onClick={() => supprimer(ouvert)} className="min-h-[40px] px-4 rounded-xl border border-red-200 text-red-700 text-sm font-semibold hover:bg-red-50">
                    Supprimer les données du candidat
                  </button>
                  <p className="text-xs text-gray-500 mt-1">À utiliser si le candidat le demande par courriel ou par téléphone.</p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
