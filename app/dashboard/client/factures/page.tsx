"use client";

/** « Mes Factures » : historique des paiements et reçus imprimables (maquette, espace client). */
import { useEffect, useState } from "react";
import Link from "next/link";
import { dateFr, fcfa } from "@/components/espace/elements";

type Facture = { id: string; numero: string; date: string; montant: number; dossierId: string; dossier: string; titre: string; type: string; reference: string };

export default function FacturesPage() {
  const [factures, setFactures] = useState<Facture[] | null>(null);
  const [payePar, setPayePar] = useState("");
  const [recu, setRecu] = useState<Facture | null>(null);

  useEffect(() => {
    fetch("/api/client/factures").then((r) => r.json()).then((d) => { setFactures(d.factures ?? []); setPayePar(d.payePar ?? ""); }).catch(() => setFactures([]));
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 border-b border-su-lavande pb-5">
        <h1 className="text-2xl font-bold text-su-nuit">Mes Factures</h1>
        <p className="mt-1 text-sm text-gray-500">Retrouvez l&apos;historique de vos paiements et reçus.</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-su-lavande bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-su-brume/50 text-left text-[11px] font-semibold uppercase tracking-wide text-gray-500">
              <tr><th className="px-5 py-3">N° Facture</th><th className="px-5 py-3">Date</th><th className="px-5 py-3">Dossier lié</th><th className="px-5 py-3 text-right">Montant</th><th className="px-5 py-3 text-center">Reçu</th></tr>
            </thead>
            <tbody className="divide-y divide-su-lavande">
              {factures === null && <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Chargement…</td></tr>}
              {factures?.length === 0 && <tr><td colSpan={5} className="px-5 py-8 text-center text-gray-400">Aucun paiement pour l&apos;instant.</td></tr>}
              {factures?.map((f) => (
                <tr key={f.id}>
                  <td className="px-5 py-4 font-mono text-xs text-gray-700">{f.numero}</td>
                  <td className="px-5 py-4 text-gray-500">{dateFr(f.date)}</td>
                  <td className="px-5 py-4"><Link href={`/dashboard/client/prestations?id=${f.dossierId}`} className="text-su-nuit hover:underline">{f.dossier}</Link> <span className="text-xs text-gray-400">· {f.type}</span></td>
                  <td className="px-5 py-4 text-right font-bold text-su-nuit">{Math.round(f.montant).toLocaleString("fr-FR")} F</td>
                  <td className="px-5 py-4 text-center">
                    <button type="button" onClick={() => setRecu(f)} aria-label={`Reçu ${f.numero}`} className="h-8 w-8 rounded-lg border border-su-lavande text-gray-500 hover:text-su-bleu"><i className="fas fa-print text-xs" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {recu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-su-nuit/60 p-4 print:static print:bg-white print:p-0" onClick={() => setRecu(null)}>
          <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl print:shadow-none" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-su-lavande bg-su-brume/50 px-5 py-3 print:hidden">
              <p className="text-sm font-bold text-su-nuit"><i className="fas fa-receipt mr-2 text-su-bleu" />Reçu de Paiement</p>
              <div className="flex gap-2">
                <button type="button" onClick={() => window.print()} className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-gray-600 border border-su-lavande">Imprimer</button>
                <a href={`/api/payments/invoice?paymentId=${recu.id}`} target="_blank" rel="noreferrer" className="rounded-lg bg-white px-3 py-1 text-xs font-semibold text-gray-600 border border-su-lavande">PDF</a>
                <button type="button" onClick={() => setRecu(null)} className="rounded-lg bg-su-lavande px-3 py-1 text-xs font-semibold text-gray-700">Fermer</button>
              </div>
            </div>
            <div className="p-8">
              <div className="flex items-start justify-between border-b border-su-lavande pb-5">
                <div><p className="text-xl font-extrabold text-su-nuit">SHIFT UP</p><p className="text-xs text-gray-500">Service de Montage d&apos;Appels d&apos;Offres</p></div>
                <div className="text-right"><p className="text-lg font-extrabold tracking-widest text-gray-300">FACTURE</p><p className="text-xs font-bold text-su-nuit">N° {recu.numero}</p><p className="text-[11px] text-gray-400">{dateFr(recu.date)}</p></div>
              </div>
              <p className="mt-5 text-[10px] font-semibold uppercase text-gray-400">Payé par :</p>
              <p className="font-bold text-su-nuit">{payePar}</p>
              <table className="mt-6 w-full text-sm">
                <thead><tr className="border-b-2 border-su-nuit text-left text-[10px] uppercase text-gray-500"><th className="pb-2">Description</th><th className="pb-2 text-right">Montant</th></tr></thead>
                <tbody><tr><td className="py-3"><p className="font-semibold text-su-nuit">Prestation Montage (Réf. {recu.dossier})</p><p className="text-xs text-gray-400">{recu.titre} · Paiement : {recu.type}</p></td><td className="py-3 text-right text-su-nuit">{fcfa(recu.montant)}</td></tr></tbody>
              </table>
              <div className="mt-6 flex justify-end">
                <div className="flex items-center gap-6 rounded-xl bg-emerald-50 px-5 py-3"><span className="text-sm font-bold text-emerald-800">TOTAL PAYÉ</span><span className="text-lg font-extrabold text-emerald-800">{fcfa(recu.montant)}</span></div>
              </div>
              <p className="mt-6 text-center text-[10px] text-gray-400">Référence de transaction : {recu.reference}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
