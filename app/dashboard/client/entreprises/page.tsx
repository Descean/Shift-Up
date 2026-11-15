"use client";

/**
 * « Mes entreprises » — fiches des entreprises soumissionnaires du client et coffre de leurs pièces
 * (RCCM, IFU, attestations fiscale et CNSS, bilans…). Les pièces valides sont reprises automatiquement
 * à chaque nouveau montage de dossier pour l'entreprise choisie.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { TitrePoints } from "@/components/site/Gabarit";
import { televerser } from "@/lib/televerser";
import { TYPES_PIECE_COFFRE } from "@/lib/montage";
import { etatPiece } from "@/lib/entreprises";

type PieceCoffre = { id: string; type: string; libelle: string; url: string; nomFichier: string; dateDelivrance: string | null; dateExpiration: string | null; createdAt: string };
type Entreprise = {
  id: string; nom: string; formeJuridique: string | null; rccm: string | null; ifu: string | null;
  representant: string | null; telephone: string | null; email: string | null; adresse: string | null; pieces: PieceCoffre[];
};
type Fiche = Omit<Entreprise, "id" | "pieces">;

const FICHE_VIDE: Fiche = { nom: "", formeJuridique: "", rccm: "", ifu: "", representant: "", telephone: "", email: "", adresse: "" };
const CHAMPS: { cle: keyof Fiche; libelle: string; requis?: boolean; place?: string }[] = [
  { cle: "nom", libelle: "Dénomination", requis: true, place: "Ex. MONDA GROUPE SARL" },
  { cle: "formeJuridique", libelle: "Forme juridique", place: "SARL, SA, entreprise individuelle…" },
  { cle: "rccm", libelle: "N° RCCM", place: "RB/COT/…" },
  { cle: "ifu", libelle: "N° IFU" },
  { cle: "representant", libelle: "Représentant légal (signataire)" },
  { cle: "telephone", libelle: "Téléphone" },
  { cle: "email", libelle: "E-mail" },
  { cle: "adresse", libelle: "Adresse du siège" },
];
const TYPES = [...TYPES_PIECE_COFFRE, { id: "AUTRE", libelle: "Autre document", categorie: "Autre" as const }];
const champ = "w-full rounded-xl border border-su-lavande bg-white px-3 py-2.5 text-sm focus:border-su-bleu focus:outline-none";

export default function MesEntreprisesPage() {
  const [entreprises, setEntreprises] = useState<Entreprise[] | null>(null);
  const [disponible, setDisponible] = useState(true);
  const [edition, setEdition] = useState<{ id: string | null; fiche: Fiche } | null>(null);
  const [ouverte, setOuverte] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(async () => {
    const r = await fetch("/api/client/entreprises").catch(() => null);
    const d = r?.ok ? await r.json() : { disponible: false, entreprises: [] };
    setDisponible(d.disponible !== false);
    setEntreprises(d.entreprises ?? []);
  }, []);
  useEffect(() => { void charger(); }, [charger]);

  async function enregistrer() {
    if (!edition) return;
    setEnvoi(true);
    try {
      const r = await fetch(edition.id ? `/api/client/entreprises/${edition.id}` : "/api/client/entreprises", {
        method: edition.id ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(edition.fiche),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Enregistrement impossible."); return; }
      toast.success(edition.id ? "Entreprise mise à jour." : "Entreprise ajoutée : déposez maintenant ses pièces.");
      setEdition(null);
      if (!edition.id && d.entreprise?.id) setOuverte(d.entreprise.id);
      await charger();
    } finally { setEnvoi(false); }
  }

  async function supprimer(e: Entreprise) {
    if (!window.confirm(`Supprimer « ${e.nom} » et son coffre de pièces ? Les dossiers déjà montés gardent leurs pièces.`)) return;
    const r = await fetch(`/api/client/entreprises/${e.id}`, { method: "DELETE" });
    if (!r.ok) { toast.error("Suppression impossible."); return; }
    toast.success("Entreprise supprimée.");
    await charger();
  }

  if (entreprises === null) {
    return <div className="flex h-64 items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" /></div>;
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <TitrePoints as="h1" taille="text-[28px]">Mes entreprises</TitrePoints>
          <p className="mt-1 text-sm text-gray-500">Enregistrez chaque entreprise et ses pièces une fois : elles sont reprises à chaque dossier d&apos;appel d&apos;offres.</p>
        </div>
        {disponible && !edition && (
          <button onClick={() => setEdition({ id: null, fiche: { ...FICHE_VIDE } })}
            className="inline-flex items-center gap-2 self-start rounded-full bg-su-bleu px-5 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet">
            <i className="fas fa-plus" />Ajouter une entreprise
          </button>
        )}
      </div>

      {!disponible && (
        <p className="rounded-2xl border border-su-lavande bg-su-brume p-5 text-sm text-su-nuit">
          Cette fonction est en cours d&apos;activation. Revenez dans quelques instants ; en attendant, vos dossiers se montent comme d&apos;habitude.
        </p>
      )}

      {edition && (
        <div className="space-y-4 rounded-2xl border border-su-lavande bg-white p-5">
          <h2 className="font-syne text-lg font-bold text-su-nuit">{edition.id ? "Modifier l'entreprise" : "Nouvelle entreprise"}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {CHAMPS.map((c) => (
              <div key={c.cle} className={c.cle === "adresse" ? "sm:col-span-2" : ""}>
                <label htmlFor={`e-${c.cle}`} className="mb-1 block text-sm font-medium text-su-nuit">{c.libelle}{c.requis ? " *" : ""}</label>
                <input id={`e-${c.cle}`} value={edition.fiche[c.cle] ?? ""} placeholder={c.place}
                  onChange={(ev) => setEdition({ ...edition, fiche: { ...edition.fiche, [c.cle]: ev.target.value } })} className={champ} />
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEdition(null)} className="rounded-full border border-su-clair px-5 py-2.5 text-sm font-semibold text-su-bleu">Annuler</button>
            <button onClick={enregistrer} disabled={envoi || edition.fiche.nom.trim().length < 2}
              className="rounded-full bg-su-bleu px-5 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet disabled:opacity-50">{envoi ? "Enregistrement…" : "Enregistrer"}</button>
          </div>
        </div>
      )}

      {disponible && entreprises.length === 0 && !edition && (
        <div className="rounded-2xl border border-su-lavande bg-white p-10 text-center">
          <i className="fas fa-building mb-3 block text-3xl text-su-clair" />
          <p className="font-medium text-su-nuit">Aucune entreprise enregistrée</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-gray-500">Ajoutez les entreprises pour lesquelles vous soumissionnez, avec leurs pièces et leurs dates de validité.</p>
        </div>
      )}

      <div className="space-y-4">
        {entreprises.map((e) => {
          const expirees = e.pieces.filter((p) => etatPiece(p).niveau === "expiree").length;
          const bientot = e.pieces.filter((p) => etatPiece(p).niveau === "bientot").length;
          return (
            <div key={e.id} className="overflow-hidden rounded-2xl border border-su-lavande bg-white">
              <button onClick={() => setOuverte(ouverte === e.id ? null : e.id)} aria-expanded={ouverte === e.id}
                className="flex w-full items-center gap-4 p-5 text-left">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-su-nuit text-white"><i className="fas fa-building" /></span>
                <span className="min-w-0 flex-1">
                  <span className="block font-syne font-bold text-su-nuit">{e.nom}</span>
                  <span className="block text-xs text-gray-500">
                    {[e.formeJuridique, e.rccm && `RCCM ${e.rccm}`, e.ifu && `IFU ${e.ifu}`].filter(Boolean).join(" · ") || "Coordonnées à compléter"}
                  </span>
                </span>
                <span className="hidden flex-wrap justify-end gap-1.5 text-xs sm:flex">
                  <span className="rounded-full bg-su-brume px-2.5 py-1 font-semibold text-su-bleu">{e.pieces.length} pièce(s)</span>
                  {bientot > 0 && <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700">{bientot} à renouveler</span>}
                  {expirees > 0 && <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700">{expirees} expirée(s)</span>}
                </span>
                <i className={`fas fa-chevron-${ouverte === e.id ? "up" : "down"} text-xs text-gray-400`} />
              </button>
              {ouverte === e.id && (
                <div className="space-y-5 border-t border-su-lavande p-5">
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setEdition({ id: e.id, fiche: { nom: e.nom, formeJuridique: e.formeJuridique ?? "", rccm: e.rccm ?? "", ifu: e.ifu ?? "", representant: e.representant ?? "", telephone: e.telephone ?? "", email: e.email ?? "", adresse: e.adresse ?? "" } })}
                      className="rounded-full border border-su-clair px-4 py-2 text-xs font-semibold text-su-bleu">Modifier la fiche</button>
                    <Link href={`/dashboard/client/nouvelle-demande?entreprise=${e.id}`} className="rounded-full bg-su-bleu px-4 py-2 text-xs font-semibold text-white">Monter un dossier pour cette entreprise</Link>
                    <button onClick={() => supprimer(e)} className="rounded-full px-4 py-2 text-xs font-semibold text-red-600">Supprimer</button>
                  </div>
                  <Coffre entreprise={e} onMaj={charger} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Coffre({ entreprise, onMaj }: { entreprise: Entreprise; onMaj: () => Promise<void> }) {
  const [type, setType] = useState(TYPES[0].id);
  const [libelle, setLibelle] = useState("");
  const [delivrance, setDelivrance] = useState("");
  const [expiration, setExpiration] = useState("");
  const [envoi, setEnvoi] = useState(false);
  const fichierRef = useRef<HTMLInputElement>(null);

  async function deposer(file: File) {
    const modele = TYPES.find((t) => t.id === type)!;
    const nom = type === "AUTRE" ? libelle.trim() : modele.libelle;
    if (type === "AUTRE" && nom.length < 2) { toast.error("Nommez le document."); return; }
    setEnvoi(true);
    try {
      const f = await televerser(file);
      const r = await fetch(`/api/client/entreprises/${entreprise.id}/pieces`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, libelle: nom, url: f.url, nomFichier: f.name, dateDelivrance: delivrance || null, dateExpiration: expiration || null }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Dépôt impossible."); return; }
      toast.success("Pièce ajoutée au coffre.");
      setLibelle(""); setDelivrance(""); setExpiration("");
      await onMaj();
    } catch (e) { toast.error((e as Error).message || "Dépôt impossible."); }
    finally { setEnvoi(false); if (fichierRef.current) fichierRef.current.value = ""; }
  }

  async function retirer(p: PieceCoffre) {
    if (!window.confirm(`Retirer « ${p.libelle} » du coffre ?`)) return;
    const r = await fetch(`/api/client/entreprises/${entreprise.id}/pieces/${p.id}`, { method: "DELETE" });
    if (!r.ok) { toast.error("Retrait impossible."); return; }
    await onMaj();
  }

  // Dernière version de chaque type d'abord, puis les versions plus anciennes
  const pieces = [...entreprise.pieces].sort((a, b) => a.libelle.localeCompare(b.libelle, "fr") || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  const manquantes = TYPES_PIECE_COFFRE.filter((t) => !entreprise.pieces.some((p) => p.type === t.id));

  return (
    <div className="space-y-4">
      <p className="text-sm font-semibold text-su-nuit">Coffre de pièces</p>
      {pieces.length === 0 ? (
        <p className="text-sm text-gray-500">Aucune pièce pour l&apos;instant.</p>
      ) : (
        <ul className="divide-y divide-su-lavande rounded-xl border border-su-lavande">
          {pieces.map((p) => {
            const e = etatPiece(p);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <i className="fas fa-file-lines text-su-bleu" />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-su-nuit">{p.libelle}</span>
                  <a href={p.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-su-bleu underline">{p.nomFichier}</a>
                </span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${e.niveau === "expiree" ? "bg-red-50 text-red-700" : e.niveau === "bientot" ? "bg-amber-50 text-amber-700" : "bg-su-brume text-su-bleu"}`}>{e.libelle}</span>
                <button onClick={() => retirer(p)} aria-label={`Retirer ${p.libelle}`} className="text-xs text-gray-400 hover:text-red-600"><i className="fas fa-trash" /></button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="space-y-3 rounded-xl bg-su-brume p-4">
        <p className="text-sm font-medium text-su-nuit">Ajouter une pièce</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={`t-${entreprise.id}`} className="mb-1 block text-xs text-gray-600">Type de pièce</label>
            <select id={`t-${entreprise.id}`} value={type} onChange={(e) => setType(e.target.value)} className={champ}>
              {TYPES.map((t) => <option key={t.id} value={t.id}>{t.libelle}</option>)}
            </select>
          </div>
          {type === "AUTRE" && (
            <div className="sm:col-span-2">
              <label htmlFor={`l-${entreprise.id}`} className="mb-1 block text-xs text-gray-600">Nom du document</label>
              <input id={`l-${entreprise.id}`} value={libelle} onChange={(e) => setLibelle(e.target.value)} className={champ} placeholder="Ex. agrément du ministère" />
            </div>
          )}
          <div>
            <label htmlFor={`d-${entreprise.id}`} className="mb-1 block text-xs text-gray-600">Délivrée le (facultatif)</label>
            <input id={`d-${entreprise.id}`} type="date" value={delivrance} onChange={(e) => setDelivrance(e.target.value)} className={champ} />
          </div>
          <div>
            <label htmlFor={`x-${entreprise.id}`} className="mb-1 block text-xs text-gray-600">Valable jusqu&apos;au (si la pièce expire)</label>
            <input id={`x-${entreprise.id}`} type="date" value={expiration} onChange={(e) => setExpiration(e.target.value)} className={champ} />
          </div>
        </div>
        <button onClick={() => fichierRef.current?.click()} disabled={envoi}
          className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-su-clair bg-white px-4 py-3 text-sm text-su-bleu hover:border-su-bleu disabled:opacity-50">
          {envoi ? "Envoi…" : <><i className="fas fa-cloud-arrow-up" />Choisir le fichier (PDF, image)</>}
        </button>
        <input ref={fichierRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx,.zip"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) void deposer(f); }} />
        {manquantes.length > 0 && (
          <p className="text-xs text-gray-500">Pas encore au coffre : {manquantes.slice(0, 6).map((m) => m.libelle.split(" (")[0]).join(" ; ")}{manquantes.length > 6 ? "…" : ""}.</p>
        )}
      </div>
    </div>
  );
}
