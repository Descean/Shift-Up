"use client";

import { useCallback, useEffect, useState } from "react";

type Statut = "NOUVELLE" | "EN_REVUE" | "PRESELECTIONNEE" | "RETENUE" | "NON_RETENUE";
type Piece = { type: string; path: string; nom: string; taille: number };
interface Candidature {
  id: string; reference: string; offreCode: string; offreTitre: string;
  nom: string; prenoms: string; email: string; telephone: string; ville: string; nationalite: string;
  diplome: string; anneeDiplome: number; anneesExperience: number; nbProjetsSimilaires: number;
  disponibilite: string; source: string | null; fichiers: Piece[]; statut: Statut; noteInterne: string | null; createdAt: string;
}

const STATUTS: Record<Statut, { label: string; cls: string }> = {
  NOUVELLE: { label: "Nouvelle", cls: "bg-accent-50 text-accent-700 border-accent-100" },
  EN_REVUE: { label: "En revue", cls: "bg-gray-100 text-gray-700 border-gray-200" },
  PRESELECTIONNEE: { label: "Présélectionnée", cls: "bg-primary text-white border-primary" },
  RETENUE: { label: "Retenue", cls: "bg-green-50 text-green-800 border-green-200" },
  NON_RETENUE: { label: "Non retenue", cls: "bg-white text-gray-500 border-gray-200" },
};

const LIB_PIECE: Record<string, string> = { CV: "CV", DIPLOME: "Diplôme", ATTESTATIONS: "Attestation", AUTRES: "Autre pièce" };

export default function RecrutementAdminPage() {
  const [liste, setListe] = useState<Candidature[]>([]);
  const [offres, setOffres] = useState<{ code: string; titre: string; total: number }[]>([]);
  const [compteurs, setCompteurs] = useState<Partial<Record<Statut, number>>>({});
  const [offre, setOffre] = useState("");
  const [statut, setStatut] = useState("");
  const [q, setQ] = useState("");
  const [charge, setCharge] = useState(true);
  const [ouvert, setOuvert] = useState<Candidature | null>(null);
  const [note, setNote] = useState("");

  const params = useCallback(() => {
    const p = new URLSearchParams();
    if (offre) p.set("offre", offre);
    if (statut) p.set("statut", statut);
    if (q.trim()) p.set("q", q.trim());
    return p.toString();
  }, [offre, statut, q]);

  const charger = useCallback(async () => {
    setCharge(true);
    const r = await fetch(`/api/admin/recrutement?${params()}`);
    if (r.ok) {
      const d = await r.json();
      setListe(d.candidatures);
      setOffres(d.offres);
      setCompteurs(d.statuts);
    }
    setCharge(false);
  }, [params]);

  useEffect(() => {
    const t = setTimeout(charger, 250);
    return () => clearTimeout(t);
  }, [charger]);

  async function maj(id: string, data: { statut?: Statut; noteInterne?: string }) {
    const r = await fetch("/api/admin/recrutement", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...data }) });
    if (r.ok) {
      const { candidature } = await r.json();
      setListe((l) => l.map((c) => (c.id === id ? candidature : c)));
      setOuvert((o) => (o?.id === id ? candidature : o));
    }
  }

  const total = Object.values(compteurs).reduce((s, n) => s + (n ?? 0), 0);

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

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: "Candidatures", value: total },
          { label: "Nouvelles", value: compteurs.NOUVELLE ?? 0 },
          { label: "Présélectionnées", value: compteurs.PRESELECTIONNEE ?? 0 },
          { label: "Retenues", value: compteurs.RETENUE ?? 0 },
        ].map((s) => (
          <div key={s.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="font-syne font-black text-2xl text-primary">{s.value}</p>
            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
          </div>
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
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher : nom, e-mail, référence, diplôme…" className="flex-1 min-w-[220px] min-h-[44px] px-3 rounded-xl border border-gray-300 text-sm text-primary" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
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
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Chargement…</td></tr>
            )}
            {!charge && liste.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-10 text-center text-gray-500">Aucune candidature pour ces critères.</td></tr>
            )}
            {liste.map((c) => (
              <tr key={c.id} onClick={() => { setOuvert(c); setNote(c.noteInterne ?? ""); }} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer">
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{new Date(c.createdAt).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-3"><span className="font-syne font-semibold text-xs text-accent bg-accent-50 px-2 py-0.5 rounded">{c.offreCode}</span></td>
                <td className="px-4 py-3">
                  <p className="font-semibold text-primary">{c.nom} {c.prenoms}</p>
                  <p className="text-xs text-gray-500">{c.reference}</p>
                </td>
                <td className="px-4 py-3 text-gray-600 max-w-[260px] truncate">{c.diplome} ({c.anneeDiplome})</td>
                <td className="px-4 py-3 text-right text-primary font-semibold">{c.anneesExperience} ans</td>
                <td className="px-4 py-3 text-right text-primary">{c.nbProjetsSimilaires}</td>
                <td className="px-4 py-3"><span className={`text-xs font-semibold border px-2.5 py-1 rounded-full whitespace-nowrap ${STATUTS[c.statut].cls}`}>{STATUTS[c.statut].label}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {ouvert && (
        <div className="fixed inset-0 z-50 flex justify-end bg-primary/40" onClick={() => setOuvert(null)}>
          <aside className="w-full max-w-lg h-full bg-white overflow-y-auto p-6 space-y-6" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="Détail de la candidature">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500">{ouvert.reference} · {ouvert.offreTitre}</p>
                <h2 className="text-xl text-primary mt-1">{ouvert.nom} {ouvert.prenoms}</h2>
              </div>
              <button onClick={() => setOuvert(null)} className="w-10 h-10 rounded-xl hover:bg-gray-100 text-gray-500" aria-label="Fermer"><i className="fas fa-xmark" aria-hidden /></button>
            </div>

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

            <div>
              <h3 className="font-syne font-semibold text-primary mb-2">Note interne</h3>
              <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} className="w-full p-3 rounded-xl border border-gray-300 text-sm text-primary" placeholder="Appréciation, points à vérifier…" />
              <button onClick={() => maj(ouvert.id, { noteInterne: note })} className="mt-2 min-h-[40px] px-4 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-accent">Enregistrer la note</button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}
