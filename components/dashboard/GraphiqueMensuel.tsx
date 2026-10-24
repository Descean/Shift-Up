"use client";

/**
 * Graphique mensuel alimenté par /api/admin/stats?annee=… (paiements réels des prestations
 * et des formations). Choix de l'année : de la première activité enregistrée à l'année en cours.
 */
import { useState } from "react";

export type Mensuel = { annee: number; annees: number[]; mois: { mois: number; prestations: number; formations: number; nouveauxClients: number }[] };

const MOIS = ["Janv.", "Févr.", "Mars", "Avr.", "Mai", "Juin", "Juil.", "Août", "Sept.", "Oct.", "Nov.", "Déc."];
const f = (n: number) => n.toLocaleString("fr-FR").replace(/ | /g, " ");

export default function GraphiqueMensuel({ initial, titre = "Chiffre d'affaires mensuel" }: { initial?: Mensuel | null; titre?: string }) {
  const [donnees, setDonnees] = useState<Mensuel | null>(initial ?? null);
  const [annee, setAnnee] = useState<number>(initial?.annee ?? new Date().getFullYear());
  const [charge, setCharge] = useState(false);

  async function changer(a: number) {
    setAnnee(a); setCharge(true);
    const r = await fetch(`/api/admin/stats?annee=${a}`).catch(() => null);
    if (r?.ok) setDonnees((await r.json()).mensuel);
    setCharge(false);
  }

  const mois = donnees?.mois ?? [];
  const max = Math.max(1, ...mois.map((m) => m.prestations + m.formations));
  const total = mois.reduce((s, m) => s + m.prestations + m.formations, 0);
  const annees = donnees?.annees?.length ? donnees.annees : [annee];

  return (
    <div className="bg-white rounded-2xl shadow-card p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <div>
          <h2 className="font-syne font-bold text-lg text-primary">{titre}</h2>
          <p className="text-gray-500 text-sm">Total {annee} : <strong className="text-primary">{f(total)} FCFA</strong> encaissés</p>
        </div>
        <select value={annee} onChange={(e) => changer(Number(e.target.value))} aria-label="Année"
          className="border border-gray-200 rounded-xl px-3 min-h-[40px] text-sm text-primary bg-white focus:outline-none">
          {annees.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
      </div>
      {!donnees ? (
        <div className="h-44 bg-gray-50 rounded-xl animate-pulse" />
      ) : (
        <>
          <div className={`flex items-end gap-1.5 sm:gap-2 h-44 ${charge ? "opacity-50" : ""}`}>
            {mois.map((m) => {
              const tot = m.prestations + m.formations;
              return (
                <div key={m.mois} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group" title={`${MOIS[m.mois]} : ${f(tot)} FCFA (prestations ${f(m.prestations)} · formations ${f(m.formations)}) · ${m.nouveauxClients} nouveau(x) client(s)`}>
                  <div className="w-full flex flex-col justify-end" style={{ height: `${(tot / max) * 100}%`, minHeight: tot > 0 ? 3 : 0 }}>
                    <div className="w-full bg-accent-300 rounded-t-md" style={{ height: tot ? `${(m.formations / tot) * 100}%` : 0 }} />
                    <div className={`w-full bg-primary ${m.formations ? "" : "rounded-t-md"}`} style={{ height: tot ? `${(m.prestations / tot) * 100}%` : 0 }} />
                  </div>
                  <span className="text-[10px] text-gray-500">{MOIS[m.mois].slice(0, 3)}</span>
                </div>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mt-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-primary rounded-sm" />Prestations</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 bg-accent-300 rounded-sm" />Formations</span>
            {total === 0 && <span>Aucun encaissement enregistré en {annee}.</span>}
          </div>
        </>
      )}
    </div>
  );
}

/** Évolution d'un mois sur l'autre ; null si le mois précédent est à zéro. */
export function evolution(actuel: number, precedent: number): { texte: string; positif: boolean } | null {
  if (!precedent) return null;
  const pct = Math.round(((actuel - precedent) / precedent) * 100);
  return { texte: `${pct >= 0 ? "+" : ""}${pct} %`, positif: pct >= 0 };
}
