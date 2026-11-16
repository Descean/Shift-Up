"use client";

/** « Mes Dossiers » : un dossier par carte, anciens et nouveaux (maquette, espace client). */
import { useEffect, useState } from "react";
import Link from "next/link";
import { BadgeEtat, CompteRebours } from "@/components/espace/elements";
import type { EtatDossier } from "@/lib/dossier";

type Carte = { id: string; reference: string; titre: string; etat: EtatDossier; dateLimite: string | null; urgence: string; revision: boolean };

export default function MesDossiers() {
  const [dossiers, setDossiers] = useState<Carte[] | null>(null);

  useEffect(() => {
    const charger = () => fetch("/api/client/dossiers").then((r) => r.json()).then((d) => setDossiers(d.dossiers ?? [])).catch(() => setDossiers([]));
    charger();
    const t = setInterval(charger, 30_000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 flex flex-col gap-4 border-b border-su-lavande pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-su-nuit">Mes Dossiers</h1>
          <p className="mt-1 text-sm text-gray-500">Suivez l&apos;avancement de vos montages en cours.</p>
        </div>
        <Link href="/dashboard/client/nouvelle-demande" className="inline-flex items-center justify-center gap-2 rounded-xl bg-su-nuit px-5 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet">
          <i className="fas fa-plus" />Nouvelle demande
        </Link>
      </div>

      {dossiers === null ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <div key={i} className="h-40 animate-pulse rounded-2xl bg-white" />)}</div>
      ) : dossiers.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-su-clair bg-white p-10 text-center">
          <i className="fas fa-folder-open text-3xl text-su-ciel" />
          <p className="mt-3 font-semibold text-su-nuit">Aucun dossier pour l&apos;instant</p>
          <p className="mt-1 text-sm text-gray-500">Envoyez votre premier dossier : nous l&apos;étudions et vous envoyons le devis ici.</p>
          <Link href="/dashboard/client/nouvelle-demande" className="mt-5 inline-flex rounded-xl bg-su-nuit px-5 py-2.5 text-sm font-semibold text-white">Nouvelle demande</Link>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {dossiers.map((d) => (
            <Link key={d.id} href={`/dashboard/client/prestations?id=${d.id}`} className="group flex flex-col rounded-2xl border border-su-lavande bg-white p-5 shadow-sm transition hover:border-su-ciel hover:shadow-md">
              <div className="flex items-start justify-between gap-2">
                <BadgeEtat etat={d.etat} petit />
                <span className="font-mono text-[11px] text-gray-400">{d.reference}</span>
              </div>
              <p className="mt-3 font-bold text-su-nuit">{d.titre}</p>
              <p className="mt-1 text-xs text-gray-500">Clôture : <CompteRebours dateLimite={d.dateLimite} /></p>
              {d.urgence === "express" && <p className="mt-1 text-[11px] font-semibold text-orange-600"><i className="fas fa-bolt mr-1" />Express</p>}
              <div className="mt-auto flex items-center justify-between border-t border-su-lavande pt-3 text-xs text-gray-500">
                <span className="mt-3 inline-block">Voir suivi détaillé</span>
                <i className="fas fa-arrow-right mt-3 text-su-bleu transition group-hover:translate-x-0.5" />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
