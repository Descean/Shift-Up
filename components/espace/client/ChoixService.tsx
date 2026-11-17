"use client";

/** Espace client — nouvelle demande : choisir le service (le montage de dossiers en tête). */
import Link from "next/link";
import { SECTORS } from "@/lib/catalogue";

const MONTAGE = "marches-publics";

export default function ChoixService() {
  const autres = SECTORS.filter((s) => s.id !== MONTAGE);
  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6 border-b border-su-lavande pb-5">
        <h1 className="text-2xl font-bold text-su-nuit">Nouvelle demande</h1>
        <p className="mt-1 text-sm text-gray-500">Choisissez le service : vous recevez le devis ici, puis vous suivez chaque étape jusqu&apos;à la livraison.</p>
      </div>

      <Link href="/dashboard/client/nouvelle-demande?domaine=marches-publics" className="group flex flex-col gap-4 rounded-2xl border-2 border-su-bleu bg-white p-6 shadow-sm transition hover:shadow-md sm:flex-row sm:items-center">
        <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-su-nuit text-xl text-white"><i className="fas fa-folder-open" /></span>
        <span className="flex-1">
          <span className="block text-lg font-bold text-su-nuit">Montage de dossier d&apos;appel d&apos;offres</span>
          <span className="mt-1 block text-sm text-gray-600">Demande de cotation, DRP, appel d&apos;offres, AMI, demande de propositions, marchés des bailleurs : déposez le dossier et la date limite, nous montons et contrôlons votre offre.</span>
        </span>
        <span className="inline-flex items-center gap-2 self-start rounded-xl bg-su-nuit px-5 py-2.5 text-sm font-semibold text-white sm:self-auto">Commencer <i className="fas fa-arrow-right text-xs transition group-hover:translate-x-0.5" /></span>
      </Link>

      <h2 className="mb-3 mt-8 text-sm font-bold text-su-nuit">Nos autres services</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {autres.map((s) => (
          <Link key={s.id} href={`/dashboard/client/nouvelle-demande?domaine=${s.id}`} className="group flex flex-col rounded-2xl border border-su-lavande bg-white p-5 transition hover:border-su-ciel hover:shadow-md">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-su-brume text-su-bleu"><i className={s.icon} /></span>
            <span className="mt-3 font-bold text-su-nuit">{s.label}</span>
            <span className="mt-1 flex-1 text-xs text-gray-500">{s.services.map((o) => o.title).join(" · ")}</span>
            <span className="mt-4 text-xs font-semibold text-su-bleu">Faire une demande <i className="fas fa-arrow-right ml-1 text-[10px] transition group-hover:translate-x-0.5" /></span>
          </Link>
        ))}
      </div>
    </div>
  );
}
