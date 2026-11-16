"use client";
/**
 * Administration — Résultats des dossiers déposés.
 * Chaque offre déposée pour un client est suivie par Tendo pendant son délai de validité :
 * dès qu'un PV d'attribution la concerne, le résultat est enregistré ici automatiquement.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

type Resultat = "EN_ATTENTE" | "GAGNE" | "NON_RETENU" | "A_VERIFIER";
type Soumission = {
  id: string; entrepriseNom: string; entrepriseSigle: string | null; reference: string | null; autorite: string; objet: string;
  lots: string | null; dateDepot: string; validiteJours: number; montantOffre: number | null; resultat: Resultat;
  attributaire: string | null; montantAttribue: number | null; preuveUrl: string | null; detecteParTendo: boolean;
  resultatAt: string | null; derniereVerification: string | null; note: string | null;
};
type Donnees = {
  indisponible?: boolean; error?: string; soumissions: Soumission[];
  entreprises: { id: string; nom: string }[];
  prestations: { id: string; customService: string | null; company: string | null; service: { title: string } | null; client: { name: string | null } }[];
};

const LIB: Record<Resultat, string> = { EN_ATTENTE: "En attente", GAGNE: "Gagné", NON_RETENU: "Non retenu", A_VERIFIER: "À vérifier" };
const COULEUR: Record<Resultat, string> = {
  EN_ATTENTE: "bg-su-brume text-su-bleu", GAGNE: "bg-green-100 text-green-800", NON_RETENU: "bg-gray-200 text-gray-700", A_VERIFIER: "bg-amber-100 text-amber-800",
};
const champ = "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-su-bleu bg-white";
const dateFr = (d: string | null) => (d ? new Date(d).toLocaleDateString("fr-FR", { timeZone: "Africa/Porto-Novo" }) : "—");
const fcfa = (n: number | null) => (n ? `${Math.round(n).toLocaleString("fr-FR")} FCFA` : "—");
const finSuivi = (s: Soumission) => new Date(new Date(s.dateDepot).getTime() + (s.validiteJours + 15) * 86_400_000).toISOString();
const vide = { entrepriseNom: "", entrepriseSigle: "", entrepriseId: "", prestationId: "", reference: "", autorite: "", objet: "", lots: "", dateDepot: new Date().toISOString().slice(0, 10), validiteJours: "90", montantOffre: "", note: "" };

export default function AdminSoumissionsPage() {
  const [d, setD] = useState<Donnees | null>(null);
  const [filtre, setFiltre] = useState<Resultat | "TOUS">("TOUS");
  const [ajout, setAjout] = useState(false);
  const [nv, setNv] = useState(vide);
  const [edition, setEdition] = useState<string | null>(null);
  const [res, setRes] = useState({ resultat: "GAGNE" as Resultat, attributaire: "", montantAttribue: "", preuveUrl: "" });
  const [occupe, setOccupe] = useState(false);

  const charger = useCallback(() => {
    fetch("/api/admin/soumissions").then((r) => r.json()).then(setD).catch(() => toast.error("Chargement impossible."));
  }, []);
  useEffect(() => { charger(); }, [charger]);

  const compte = useMemo(() => {
    const c: Record<string, number> = { TOUS: 0, EN_ATTENTE: 0, GAGNE: 0, NON_RETENU: 0, A_VERIFIER: 0 };
    d?.soumissions?.forEach((s) => { c.TOUS++; c[s.resultat]++; });
    return c;
  }, [d]);
  const liste = (d?.soumissions ?? []).filter((s) => filtre === "TOUS" || s.resultat === filtre);

  async function envoyer(url: string, methode: string, corps?: unknown) {
    setOccupe(true);
    try {
      const r = await fetch(url, { method: methode, headers: { "Content-Type": "application/json" }, body: corps ? JSON.stringify(corps) : undefined });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(x.error ?? "Action impossible."); return false; }
      toast.success(x.message ?? "C'est fait.");
      charger();
      return true;
    } finally { setOccupe(false); }
  }

  async function creer(e: React.FormEvent) {
    e.preventDefault();
    const ok = await envoyer("/api/admin/soumissions", "POST", { ...nv, montantOffre: nv.montantOffre ? Number(nv.montantOffre) : null });
    if (ok) { setNv(vide); setAjout(false); }
  }

  function choisirEntreprise(id: string) {
    const e = d?.entreprises.find((x) => x.id === id);
    setNv((v) => ({ ...v, entrepriseId: id, entrepriseNom: e ? e.nom : v.entrepriseNom }));
  }

  async function enregistrerResultat(id: string) {
    const ok = await envoyer(`/api/admin/soumissions/${id}`, "PATCH", {
      resultat: res.resultat, attributaire: res.attributaire, preuveUrl: res.preuveUrl,
      montantAttribue: res.montantAttribue ? Number(res.montantAttribue) : null,
    });
    if (ok) setEdition(null);
  }

  if (d?.indisponible) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold text-su-nuit mb-3">Résultats des dossiers</h1>
        <p className="text-sm text-gray-600 bg-amber-50 border border-amber-200 rounded-xl p-4">{d.error}</p>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-su-nuit">Résultats des dossiers</h1>
          <p className="text-sm text-gray-500 mt-1 max-w-2xl">
            Enregistrez chaque offre déposée. Tendo cherche son résultat chaque jour pendant la validité de l&apos;offre ; un dossier gagné s&apos;ajoute aussitôt aux chiffres publiés.
          </p>
        </div>
        <button type="button" onClick={() => setAjout((v) => !v)} className="bg-su-bleu hover:bg-su-cadet text-white text-sm font-semibold px-5 py-2.5 rounded-lg">
          {ajout ? "Fermer" : "Enregistrer une offre déposée"}
        </button>
      </div>

      {ajout && (
        <form onSubmit={creer} className="bg-white border border-gray-200 rounded-2xl p-5 grid gap-4 md:grid-cols-2">
          <label className="text-xs font-medium text-gray-600 space-y-1">Entreprise du client (fiche existante)
            <select className={champ} value={nv.entrepriseId} onChange={(e) => choisirEntreprise(e.target.value)}>
              <option value="">— Aucune / saisie libre —</option>
              {d?.entreprises.map((e) => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Prestation liée (facultatif)
            <select className={champ} value={nv.prestationId} onChange={(e) => setNv({ ...nv, prestationId: e.target.value })}>
              <option value="">— Aucune —</option>
              {d?.prestations.map((p) => <option key={p.id} value={p.id}>{p.company || p.client.name || "Client"} · {p.service?.title || p.customService || "Dossier"}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Raison sociale exacte (telle que sur l&apos;offre) *
            <input required className={champ} value={nv.entrepriseNom} onChange={(e) => setNv({ ...nv, entrepriseNom: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Sigle
            <input className={champ} value={nv.entrepriseSigle} onChange={(e) => setNv({ ...nv, entrepriseSigle: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Référence du marché
            <input className={champ} placeholder="ex. F_DAF_122310" value={nv.reference} onChange={(e) => setNv({ ...nv, reference: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Autorité contractante *
            <input required className={champ} value={nv.autorite} onChange={(e) => setNv({ ...nv, autorite: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1 md:col-span-2">Objet du marché *
            <textarea required rows={2} className={champ} value={nv.objet} onChange={(e) => setNv({ ...nv, objet: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Lot(s)
            <input className={champ} value={nv.lots} onChange={(e) => setNv({ ...nv, lots: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Montant de l&apos;offre (FCFA)
            <input type="number" min="0" className={champ} value={nv.montantOffre} onChange={(e) => setNv({ ...nv, montantOffre: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Date de dépôt *
            <input required type="date" className={champ} value={nv.dateDepot} onChange={(e) => setNv({ ...nv, dateDepot: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1">Délai de validité de l&apos;offre (jours) *
            <input required type="number" min="15" max="365" className={champ} value={nv.validiteJours} onChange={(e) => setNv({ ...nv, validiteJours: e.target.value })} />
          </label>
          <label className="text-xs font-medium text-gray-600 space-y-1 md:col-span-2">Note interne
            <input className={champ} value={nv.note} onChange={(e) => setNv({ ...nv, note: e.target.value })} />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button disabled={occupe} className="bg-su-nuit hover:bg-su-cadet disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg">Enregistrer</button>
          </div>
        </form>
      )}

      <div className="flex flex-wrap gap-2">
        {(["TOUS", "EN_ATTENTE", "A_VERIFIER", "GAGNE", "NON_RETENU"] as const).map((f) => (
          <button key={f} type="button" onClick={() => setFiltre(f)}
            className={`text-sm px-4 py-2 rounded-full border ${filtre === f ? "bg-su-nuit text-white border-su-nuit" : "bg-white text-gray-700 border-gray-200 hover:border-su-bleu"}`}>
            {f === "TOUS" ? "Toutes" : LIB[f]} ({compte[f] ?? 0})
          </button>
        ))}
      </div>

      {!d ? <p className="text-sm text-gray-500">Chargement…</p> : liste.length === 0 ? (
        <p className="text-sm text-gray-500 bg-white border border-gray-200 rounded-2xl p-6">Aucune offre dans cette catégorie.</p>
      ) : (
        <div className="space-y-3">
          {liste.map((s) => (
            <div key={s.id} className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${COULEUR[s.resultat]}`}>{LIB[s.resultat]}</span>
                    {s.detecteParTendo && <span className="text-xs text-su-bleu">détecté par Tendo</span>}
                    {s.reference && <span className="text-xs text-gray-500">{s.reference}</span>}
                  </div>
                  <p className="font-semibold text-su-nuit mt-2">{s.objet}</p>
                  <p className="text-sm text-gray-600 mt-1">{s.autorite}{s.lots ? ` · ${s.lots}` : ""}</p>
                  <p className="text-sm text-gray-600">Soumissionnaire : <strong>{s.entrepriseNom}</strong>{s.entrepriseSigle ? ` (${s.entrepriseSigle})` : ""} · offre {fcfa(s.montantOffre)}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Déposé le {dateFr(s.dateDepot)} · validité {s.validiteJours} j · suivi jusqu&apos;au {dateFr(finSuivi(s))}
                    {s.derniereVerification ? ` · dernière recherche ${dateFr(s.derniereVerification)}` : ""}
                  </p>
                  {(s.resultat === "GAGNE" || s.resultat === "NON_RETENU") && (
                    <p className="text-sm mt-2">
                      Attributaire : <strong>{s.attributaire ?? "—"}</strong> · {fcfa(s.montantAttribue)}
                      {s.preuveUrl && <> · <a href={s.preuveUrl} target="_blank" rel="noreferrer" className="text-su-bleu underline">PV</a></>}
                    </p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => { setEdition(edition === s.id ? null : s.id); setRes({ resultat: s.resultat === "EN_ATTENTE" || s.resultat === "A_VERIFIER" ? "GAGNE" : s.resultat, attributaire: s.attributaire ?? s.entrepriseNom, montantAttribue: s.montantAttribue ? String(s.montantAttribue) : "", preuveUrl: s.preuveUrl ?? "" }); }}
                    className="text-sm px-4 py-2 rounded-lg border border-su-bleu text-su-bleu hover:bg-su-brume">Résultat</button>
                  <button type="button" aria-label="Supprimer" onClick={() => { if (confirm("Supprimer cette offre ?")) envoyer(`/api/admin/soumissions/${s.id}`, "DELETE"); }}
                    className="text-sm px-3 py-2 rounded-lg border border-gray-200 text-gray-500 hover:text-red-600"><i className="fas fa-trash" /></button>
                </div>
              </div>
              {edition === s.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 grid gap-3 md:grid-cols-4">
                  <select className={champ} value={res.resultat} onChange={(e) => setRes({ ...res, resultat: e.target.value as Resultat })}>
                    {(Object.keys(LIB) as Resultat[]).map((r) => <option key={r} value={r}>{LIB[r]}</option>)}
                  </select>
                  <input className={champ} placeholder="Attributaire" value={res.attributaire} onChange={(e) => setRes({ ...res, attributaire: e.target.value })} />
                  <input type="number" min="0" className={champ} placeholder="Montant attribué (FCFA)" value={res.montantAttribue} onChange={(e) => setRes({ ...res, montantAttribue: e.target.value })} />
                  <input className={champ} placeholder="Lien du PV" value={res.preuveUrl} onChange={(e) => setRes({ ...res, preuveUrl: e.target.value })} />
                  <div className="md:col-span-4 flex justify-end">
                    <button type="button" disabled={occupe} onClick={() => enregistrerResultat(s.id)} className="bg-su-nuit hover:bg-su-cadet disabled:opacity-60 text-white text-sm font-semibold px-6 py-2.5 rounded-lg">Enregistrer le résultat</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
