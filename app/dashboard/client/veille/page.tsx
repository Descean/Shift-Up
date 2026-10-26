"use client";
/**
 * Espace client — Veille des appels d'offres : critères, état de l'abonnement, avis signalés.
 */
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { DEPARTEMENTS, SECTEURS_VEILLE, TYPES_VEILLE } from "@/lib/veille/criteres";
import NotificationsWhatsApp from "@/components/notifications/NotificationsWhatsApp";

type Abonnement = { id: string; statut: string; actifJusquau: string | null; secteurs: string[]; motsCles: string[]; exclusions: string[]; typesMarche: string[]; zones: string[] };
type Avis = { id: string; source: string; reference: string; objet: string; autorite: string | null; typeMarche: string | null; financement: string | null; dateLimite: string | null; lien: string | null; details: { avisPdf?: string | null } | null; signaleLe: string };

const SOURCES: Record<string, string> = {
  SIGMAP: "Portail des marchés publics", BANQUE_MONDIALE: "Banque mondiale", UNGM: "Nations unies", PNUD: "PNUD", UNFPA: "UNFPA Bénin",
  ENABEL: "Enabel", GIZ: "GIZ", SBEE: "SBEE", BOAD: "BOAD", GOUV_BJ: "gouv.bj", ABE: "ABE", MANUEL: "SHIFT UP",
};
const STATUTS: Record<string, [string, string]> = {
  EN_ATTENTE: ["Demande en cours de traitement", "bg-amber-100 text-amber-800"],
  ACTIF: ["Veille active", "bg-green-100 text-green-700"],
  SUSPENDU: ["Veille suspendue", "bg-gray-200 text-gray-600"],
  EXPIRE: ["Abonnement arrivé à échéance", "bg-red-100 text-red-700"],
};
const dateFr = (d: string | null, heure = true) => d ? new Date(d).toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", day: "numeric", month: "short", year: "numeric", ...(heure ? { hour: "2-digit", minute: "2-digit" } : {}) }) : "—";
const jours = (d: string | null) => d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86_400_000) : null;
const liste = (t: string) => [...new Set(t.split(/[,;\n]/).map((x) => x.trim()).filter((x) => x.length >= 3))];

export default function VeillePage() {
  const [charge, setCharge] = useState(false);
  const [indispo, setIndispo] = useState(false);
  const [abonnement, setAbonnement] = useState<Abonnement | null>(null);
  const [avis, setAvis] = useState<Avis[]>([]);
  const [edition, setEdition] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const [c, setC] = useState({ secteurs: [] as string[], motsCles: "", exclusions: "", typesMarche: [] as string[], zones: [] as string[] });

  function remplir(a: Abonnement | null) {
    if (a) setC({ secteurs: a.secteurs, motsCles: a.motsCles.join(", "), exclusions: a.exclusions.join(", "), typesMarche: a.typesMarche, zones: a.zones });
  }
  function charger() {
    return fetch("/api/veille").then(async (r) => {
      const d = await r.json().catch(() => ({}));
      if (d.indisponible) { setIndispo(true); return; }
      setAbonnement(d.abonnement ?? null); setAvis(d.avis ?? []); remplir(d.abonnement ?? null);
      if (!d.abonnement) setEdition(true);
    }).finally(() => setCharge(true));
  }
  useEffect(() => { charger(); }, []);

  const basculer = (k: "secteurs" | "typesMarche" | "zones", v: string) => setC({ ...c, [k]: c[k].includes(v) ? c[k].filter((x) => x !== v) : [...c[k], v] });

  async function enregistrer() {
    setOccupe(true);
    try {
      const r = await fetch("/api/veille", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ secteurs: c.secteurs, motsCles: liste(c.motsCles), exclusions: liste(c.exclusions), typesMarche: c.typesMarche, zones: c.zones }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Enregistrement impossible."); return; }
      toast.success(d.message); setEdition(false); await charger();
    } catch { toast.error("Erreur réseau."); }
    finally { setOccupe(false); }
  }

  const ouverts = useMemo(() => avis.filter((a) => (jours(a.dateLimite) ?? 1) >= 0).sort((x, y) => (x.dateLimite ?? "").localeCompare(y.dateLimite ?? "")), [avis]);
  const statut = abonnement ? STATUTS[abonnement.statut] ?? [abonnement.statut, "bg-gray-100 text-gray-600"] : null;
  const valide = c.secteurs.length > 0 || liste(c.motsCles).length > 0;

  if (!charge) return <div className="flex items-center justify-center h-64"><span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" /></div>;
  if (indispo) return <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-card p-8 text-center text-gray-500">La veille des appels d&apos;offres ouvre très bientôt.</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="font-syne font-black text-2xl text-primary">Veille des appels d&apos;offres</h1>
        <p className="text-gray-500 text-sm mt-0.5">Recevez chaque matin les avis publiés au Bénin qui correspondent à vos activités, et confiez-nous le montage en un clic.</p>
      </div>

      {abonnement && statut && (
        <div className="bg-white rounded-2xl shadow-card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-bold ${statut[1]}`}>{statut[0]}</span>
            <p className="text-xs text-gray-500 mt-2">
              {abonnement.statut === "ACTIF" && abonnement.actifJusquau && <>Active jusqu&apos;au <strong>{dateFr(abonnement.actifJusquau, false)}</strong>. </>}
              {abonnement.statut === "EN_ATTENTE" && <>SHIFT UP vous envoie le devis de l&apos;abonnement dans <Link href="/dashboard/client/prestations" className="text-accent hover:underline">Mes prestations</Link>. La veille démarre dès l&apos;activation. </>}
              {abonnement.statut === "EXPIRE" && <>Enregistrez vos critères pour demander le renouvellement. </>}
              Sources : portail national des marchés publics, gouv.bj, SBEE, ABE, Banque mondiale, Nations unies, Enabel, GIZ, BOAD et avis relevés par l&apos;équipe.
            </p>
          </div>
          {!edition && <button onClick={() => setEdition(true)} className="border border-gray-200 rounded-xl px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex-shrink-0"><i className="fas fa-sliders mr-1.5" />Modifier mes critères</button>}
        </div>
      )}

      {edition && (
        <div className="bg-white rounded-2xl shadow-card p-6 space-y-5">
          <p className="font-syne font-bold text-primary">{abonnement ? "Mes critères" : "Choisissez ce que vous voulez recevoir"}</p>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Secteurs d&apos;activité</legend>
            <div className="grid sm:grid-cols-2 gap-2">
              {Object.keys(SECTEURS_VEILLE).map((s) => (
                <label key={s} className={`flex items-center gap-2 text-sm rounded-xl border px-3 py-2 cursor-pointer ${c.secteurs.includes(s) ? "border-accent bg-accent/5 text-primary" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>
                  <input type="checkbox" checked={c.secteurs.includes(s)} onChange={() => basculer("secteurs", s)} className="w-4 h-4 flex-shrink-0 accent-[#0A2533]" />{s}
                </label>
              ))}
            </div>
          </fieldset>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="v-mots" className="block text-sm font-medium text-gray-700 mb-1.5">Mots-clés précis <span className="text-gray-400 font-normal">(séparés par des virgules)</span></label>
              <textarea id="v-mots" rows={3} value={c.motsCles} onChange={(e) => setC({ ...c, motsCles: e.target.value })} placeholder="Ex : tables-bancs, climatiseurs, pistes rurales"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
            </div>
            <div>
              <label htmlFor="v-excl" className="block text-sm font-medium text-gray-700 mb-1.5">À exclure <span className="text-gray-400 font-normal">(facultatif)</span></label>
              <textarea id="v-excl" rows={3} value={c.exclusions} onChange={(e) => setC({ ...c, exclusions: e.target.value })} placeholder="Ex : recrutement d'un consultant individuel"
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-accent resize-none" />
            </div>
          </div>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Types de marché <span className="text-gray-400 font-normal">(aucun = tous)</span></legend>
            <div className="flex flex-wrap gap-2">
              {TYPES_VEILLE.map((t) => (
                <button key={t} type="button" onClick={() => basculer("typesMarche", t)} aria-pressed={c.typesMarche.includes(t)}
                  className={`text-xs rounded-full border px-3 py-1.5 ${c.typesMarche.includes(t) ? "border-accent bg-accent text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{t}</button>
              ))}
            </div>
          </fieldset>
          <fieldset>
            <legend className="text-sm font-medium text-gray-700 mb-2">Départements <span className="text-gray-400 font-normal">(aucun = tout le Bénin ; l&apos;avis doit citer le département ou une de ses communes)</span></legend>
            <div className="flex flex-wrap gap-2">
              {DEPARTEMENTS.map((z) => (
                <button key={z} type="button" onClick={() => basculer("zones", z)} aria-pressed={c.zones.includes(z)}
                  className={`text-xs rounded-full border px-3 py-1.5 ${c.zones.includes(z) ? "border-accent bg-accent text-white" : "border-gray-200 text-gray-600 hover:border-gray-300"}`}>{z}</button>
              ))}
            </div>
          </fieldset>
          <div className="flex gap-2">
            {abonnement && <button onClick={() => { setEdition(false); remplir(abonnement); }} className="flex-1 border border-gray-200 rounded-xl py-2.5 text-sm text-gray-600">Annuler</button>}
            <button disabled={occupe || !valide} onClick={enregistrer} className="flex-1 bg-gradient-to-r from-accent to-secondary text-white rounded-xl py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50">
              {abonnement && abonnement.statut !== "EXPIRE" ? "Enregistrer mes critères" : "Demander mon abonnement"}
            </button>
          </div>
          {!valide && <p className="text-xs text-gray-400">Choisissez au moins un secteur ou un mot-clé.</p>}
        </div>
      )}

      <NotificationsWhatsApp />

      {abonnement && (
        <section className="space-y-3">
          <h2 className="font-syne font-bold text-primary text-sm">Avis qui vous correspondent ({ouverts.length} ouvert{ouverts.length > 1 ? "s" : ""})</h2>
          {ouverts.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-card p-8 text-center text-gray-400 text-sm">
              {abonnement.statut === "ACTIF" ? "Aucun avis pour l'instant : vous serez prévenu par courriel dès qu'un avis correspond à vos critères." : "Les avis apparaîtront ici dès que votre veille sera active."}
            </div>
          ) : ouverts.map((a) => {
            const j = jours(a.dateLimite);
            return (
              <article key={a.id} className="bg-white rounded-2xl shadow-card p-5 space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold text-primary leading-snug line-clamp-3" title={a.objet}>{a.objet}</p>
                  {j !== null && <span className={`flex-shrink-0 text-[11px] font-bold rounded-full px-2.5 py-1 ${j <= 3 ? "bg-red-600 text-white" : j <= 7 ? "bg-amber-100 text-amber-800" : "bg-accent/10 text-accent"}`}>{j <= 0 ? "Aujourd'hui" : `J-${j}`}</span>}
                </div>
                <p className="text-xs text-gray-500">{a.reference}{a.autorite ? ` — ${a.autorite}` : ""}{a.typeMarche ? ` · ${a.typeMarche}` : ""}</p>
                <p className="text-xs text-gray-500">Date limite : <strong className="text-primary">{a.dateLimite ? dateFr(a.dateLimite) : "voir l'avis"}</strong> · {["SIGMAP", "SBEE", "GOUV_BJ", "ABE", "MANUEL"].includes(a.source) ? `${SOURCES[a.source] ?? a.source}${a.financement ? ` · ${a.financement}` : ""}` : (a.financement ?? SOURCES[a.source] ?? a.source)}</p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <Link href={`/dashboard/client/nouvelle-demande?avis=${a.id}`} className="bg-primary text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:opacity-90"><i className="fas fa-folder-plus mr-1.5" />Monter ce dossier</Link>
                  {a.lien && <a href={a.lien} target="_blank" rel="noopener noreferrer" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"><i className="fas fa-arrow-up-right-from-square mr-1.5" />Voir l&apos;avis</a>}
                  {a.details?.avisPdf && <a href={a.details.avisPdf} target="_blank" rel="noopener noreferrer" className="border border-gray-200 rounded-lg px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-50"><i className="fas fa-file-pdf mr-1.5" />Avis en PDF</a>}
                </div>
              </article>
            );
          })}
        </section>
      )}
    </div>
  );
}
