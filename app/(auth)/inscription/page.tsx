"use client";

/**
 * Inscription : deux profils seulement. Le client entre avec son e-mail (compte créé à la volée) ;
 * le monteur dépose une demande de compte, activée par la Direction.
 */
import Link from "next/link";
import { TitrePoints } from "@/components/site/Gabarit";

export default function Inscription() {
  const suite = typeof window !== "undefined" ? window.location.search : "";
  const choix = [
    { href: `/connexion${suite}`, icone: "fa-user", titre: "Espace client", texte: "Une demande à confier (dossier d'appel d'offres ou autre service) : recevez le devis et suivez chaque étape. Votre adresse e-mail suffit." },
    { href: "/travailler-avec-nous", icone: "fa-handshake", titre: "Travailler avec nous", texte: "Monteur de dossiers ou professionnel de nos domaines : traitez vos clients sur la plateforme et recevez votre part." },
  ];
  return (
    <div>
      <TitrePoints as="h1" taille="text-[30px]">Créer mon compte</TitrePoints>
      <p className="mb-8 mt-3 text-[15px] text-[#4B5563]">Vous êtes…</p>
      <div className="space-y-4">
        {choix.map((c) => (
          <Link key={c.href} href={c.href} className="group flex gap-4 rounded-2xl border border-su-lavande p-5 transition hover:border-su-bleu hover:bg-su-brume/40">
            <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-su-nuit text-white"><i className={`fas ${c.icone}`} /></span>
            <span>
              <span className="block font-bold text-su-nuit">{c.titre} <i className="fas fa-arrow-right ml-1 text-xs text-su-bleu transition group-hover:translate-x-0.5" /></span>
              <span className="mt-1 block text-sm text-gray-600">{c.texte}</span>
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-8 text-center text-sm text-[#6B7280]">Déjà un compte ? <Link href="/connexion" className="font-semibold text-su-bleu underline">Me connecter</Link></p>
    </div>
  );
}
