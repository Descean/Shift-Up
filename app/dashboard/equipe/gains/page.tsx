"use client";

/** Monteur indépendant : lien à partager, part des paiements encaissés, demandes de versement Mobile Money. */
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { dateFr } from "@/components/espace/elements";

type Donnees = {
  independant: boolean; lien: string | null; commission: number; minimum: number;
  solde: { gagne: number; verse: number; disponible: number };
  gains: { id: string; date: string; dossier: string; brut: number; commission: number; net: number }[];
  versements: { id: string; date: string; montant: number; statut: string; numero: string; operateur: string; note: string | null }[];
};
const F = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} F`;
const STATUTS: Record<string, string> = { PENDING: "En attente", PROCESSING: "En cours", PAID: "Versé", REJECTED: "Refusé" };

export default function Gains() {
  const [d, setD] = useState<Donnees | null>(null);
  const [montant, setMontant] = useState("");
  const [operateur, setOperateur] = useState("MTN_MOMO");
  const [numero, setNumero] = useState("");
  const [envoi, setEnvoi] = useState(false);

  const charger = useCallback(() => fetch("/api/equipe/gains").then((r) => r.json()).then(setD).catch(() => {}), []);
  useEffect(() => { void charger(); }, [charger]);

  async function demander() {
    setEnvoi(true);
    try {
      const r = await fetch("/api/equipe/gains", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ montant: Number(montant), operateur, numero }) });
      const x = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(x.error ?? "Demande impossible."); return; }
      toast.success("Demande envoyée : la Direction effectue le versement."); setMontant(""); void charger();
    } finally { setEnvoi(false); }
  }

  if (!d) return <div className="mx-auto h-80 max-w-5xl animate-pulse rounded-2xl bg-white" />;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="border-b border-su-lavande pb-5">
        <h1 className="text-2xl font-bold text-su-nuit">Mes gains</h1>
        <p className="mt-1 text-sm text-gray-500">
          {d.independant ? `Vous recevez ${Math.round((1 - d.commission) * 100)} % de chaque paiement de vos clients ; SHIFT UP garde ${Math.round(d.commission * 100)} %.` : "Vous êtes monteur de l'équipe SHIFT UP : les paiements de vos dossiers ne donnent pas lieu à versement."}
        </p>
      </div>

      {d.independant && d.lien && (
        <div className="rounded-2xl border border-su-lavande bg-white p-5 shadow-sm">
          <p className="font-bold text-su-nuit"><i className="fas fa-link mr-2 text-su-bleu" />Votre lien à partager avec vos clients</p>
          <p className="mt-1 text-xs text-gray-500">Un client qui dépose son dossier par ce lien vous est confié d&apos;office. Vous pouvez aussi ouvrir son dossier vous-même (« Dossier d&apos;un client »).</p>
          <div className="mt-3 flex gap-2">
            <input readOnly value={d.lien} className="min-w-0 flex-1 rounded-xl border border-su-lavande bg-su-brume/40 px-3 py-2.5 text-sm text-su-nuit" aria-label="Votre lien" />
            <button type="button" onClick={() => { void navigator.clipboard.writeText(d.lien!); toast.success("Lien copié."); }} className="rounded-xl bg-su-nuit px-4 text-sm font-semibold text-white">Copier</button>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[["Total gagné", d.solde.gagne], ["Déjà versé ou demandé", d.solde.verse], ["Disponible", d.solde.disponible]].map(([l, v]) => (
          <div key={l as string} className="rounded-2xl border border-su-lavande bg-white p-5 shadow-sm"><p className="text-sm text-gray-500">{l}</p><p className="mt-1 text-2xl font-extrabold text-su-nuit">{F(v as number)}</p></div>
        ))}
      </div>

      {d.independant && (
        <div className="rounded-2xl border border-su-lavande bg-white p-5 shadow-sm">
          <p className="font-bold text-su-nuit">Demander un versement</p>
          <p className="mt-0.5 text-xs text-gray-500">Minimum {F(d.minimum)} · versé par Mobile Money sur le numéro indiqué.</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-[1fr_1fr_1fr_auto]">
            <input inputMode="numeric" value={montant} onChange={(e) => setMontant(e.target.value.replace(/\D/g, ""))} placeholder={`Montant (max ${Math.round(d.solde.disponible).toLocaleString("fr-FR")})`} className="rounded-xl border border-su-lavande px-3 py-2.5 text-sm" />
            <select value={operateur} onChange={(e) => setOperateur(e.target.value)} className="rounded-xl border border-su-lavande px-3 py-2.5 text-sm" aria-label="Opérateur">
              <option value="MTN_MOMO">MTN MoMo</option><option value="MOOV_MONEY">Moov Money</option><option value="CELTIIS">Celtiis Cash</option>
            </select>
            <input type="tel" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="01 XX XX XX XX" className="rounded-xl border border-su-lavande px-3 py-2.5 text-sm" />
            <button type="button" onClick={demander} disabled={envoi || !montant || !numero} className="rounded-xl bg-su-nuit px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">Demander</button>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-su-lavande bg-white shadow-sm">
          <p className="border-b border-su-lavande px-5 py-3 font-bold text-su-nuit">Paiements encaissés</p>
          <ul className="divide-y divide-su-lavande text-sm">
            {d.gains.length === 0 && <li className="px-5 py-6 text-center text-gray-400">Aucun paiement pour l&apos;instant.</li>}
            {d.gains.map((g) => (
              <li key={g.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span><span className="font-mono text-xs text-gray-500">{g.dossier}</span><span className="block text-xs text-gray-400">{dateFr(g.date)} · payé {F(g.brut)}</span></span>
                <span className="font-bold text-emerald-700">+ {F(g.net)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-su-lavande bg-white shadow-sm">
          <p className="border-b border-su-lavande px-5 py-3 font-bold text-su-nuit">Versements</p>
          <ul className="divide-y divide-su-lavande text-sm">
            {d.versements.length === 0 && <li className="px-5 py-6 text-center text-gray-400">Aucun versement demandé.</li>}
            {d.versements.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 px-5 py-3">
                <span><span className="font-semibold text-su-nuit">{F(v.montant)}</span><span className="block text-xs text-gray-400">{dateFr(v.date)} · {v.numero}{v.note ? ` · ${v.note}` : ""}</span></span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${v.statut === "PAID" ? "bg-emerald-50 text-emerald-700" : v.statut === "REJECTED" ? "bg-red-50 text-red-700" : "bg-amber-50 text-amber-700"}`}>{STATUTS[v.statut] ?? v.statut}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
