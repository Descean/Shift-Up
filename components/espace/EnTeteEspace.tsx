"use client";

/** Barre du haut des espaces client / monteur / Direction (maquette « plateforme de montage »). */
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import Cloche from "@/components/dashboard/Cloche";

type Lien = { href: string; label: string; icone?: string; exact?: boolean };

const PLUS_CLIENT: Lien[] = [
  { href: "/dashboard/client/entreprises", label: "Mes entreprises", icone: "fa-building" },
  { href: "/dashboard/client/veille", label: "Veille des marchés", icone: "fa-binoculars" },
  { href: "/dashboard/client/messages", label: "Messagerie", icone: "fa-envelope" },
  { href: "/dashboard/client/affiliation", label: "Parrainage", icone: "fa-gift" },
  { href: "/dashboard/profil", label: "Mon profil", icone: "fa-user" },
  { href: "/dashboard/securite", label: "Sécurité", icone: "fa-shield-halved" },
];

export default function EnTeteEspace({ role, nom }: { role: string; nom: string }) {
  const chemin = usePathname() ?? "";
  const client = role === "CLIENT";
  const direction = role === "ADMIN" || role === "DEVELOPER";
  const [plus, setPlus] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fermer = (e: MouseEvent) => { if (menu.current && !menu.current.contains(e.target as Node)) setPlus(false); };
    document.addEventListener("mousedown", fermer);
    return () => document.removeEventListener("mousedown", fermer);
  }, []);

  const liens: Lien[] = client
    ? [{ href: "/dashboard/client", label: "Mes Dossiers", exact: true }, { href: "/dashboard/client/factures", label: "Factures" }]
    : [
        { href: "/dashboard/equipe", label: "Dossiers (Kanban)", exact: true },
        ...(!direction ? [{ href: "/dashboard/equipe/gains", label: "Mes gains", icone: "fa-wallet" }] : []),
        ...(direction ? [{ href: "/dashboard/equipe/direction", label: "Direction", icone: "fa-gear" }, { href: "/dashboard/admin", label: "Back-office", icone: "fa-table-columns" }] : []),
      ];
  const actif = (l: Lien) => (l.exact ? chemin === l.href || (l.href === "/dashboard/client" && chemin.startsWith("/dashboard/client/prestations")) || (l.href === "/dashboard/equipe" && (chemin.startsWith("/dashboard/equipe/dossiers") || chemin.startsWith("/dashboard/equipe/nouveau"))) : chemin.startsWith(l.href));
  const libelleRole = client ? "Espace client" : direction ? "Super administrateur" : "Équipe montage";

  return (
    <header className="sticky top-0 z-40 border-b border-su-lavande bg-white">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center gap-4 px-4 lg:px-8">
        <Link href={client ? "/dashboard/client" : "/dashboard/equipe"} className="flex flex-shrink-0 items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-su-nuit text-white"><i className="fas fa-layer-group text-sm" /></span>
          <span className="text-lg font-bold tracking-tight text-su-nuit">SHIFT UP</span>
        </Link>

        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm md:flex">
          {liens.map((l) => (
            <Link key={l.href} href={l.href} className={actif(l) ? "font-bold text-su-nuit" : "text-gray-600 hover:text-su-nuit"}>
              {l.icone && <i className={`fas ${l.icone} mr-1.5 text-xs`} />}{l.label}
            </Link>
          ))}
          {client && (
            <div ref={menu} className="relative">
              <button type="button" onClick={() => setPlus((v) => !v)} className="text-gray-600 hover:text-su-nuit">Plus <i className="fas fa-chevron-down ml-1 text-[10px]" /></button>
              {plus && (
                <div className="absolute left-1/2 top-8 w-56 -translate-x-1/2 rounded-xl border border-su-lavande bg-white py-2 shadow-lg">
                  {PLUS_CLIENT.map((l) => (
                    <Link key={l.href} href={l.href} onClick={() => setPlus(false)} className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-su-brume">
                      <i className={`fas ${l.icone} w-4 text-center text-su-bleu`} />{l.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          {client && (
            <Link href="/dashboard/client/nouvelle-demande" className="hidden rounded-lg border border-su-lavande bg-su-brume px-3 py-1.5 text-xs font-semibold text-su-nuit hover:border-su-bleu sm:inline-flex">
              + Nouvelle Demande
            </Link>
          )}
          {client && <Cloche />}
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-sm font-bold text-su-nuit">{nom}</p>
            <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">{libelleRole}</p>
          </div>
          <button type="button" onClick={() => signOut({ callbackUrl: "/" })} title="Se déconnecter" aria-label="Se déconnecter"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-su-brume text-gray-500 hover:text-su-nuit">
            <i className="fas fa-arrow-right-from-bracket text-xs" />
          </button>
        </div>
      </div>

      {/* Téléphone : onglets sous la barre */}
      <nav className="flex gap-5 overflow-x-auto border-t border-su-lavande px-4 py-2.5 text-sm md:hidden">
        {liens.map((l) => (
          <Link key={l.href} href={l.href} className={`whitespace-nowrap ${actif(l) ? "font-bold text-su-nuit" : "text-gray-600"}`}>{l.label}</Link>
        ))}
        {client && (
          <>
            <Link href="/dashboard/client/nouvelle-demande" className="whitespace-nowrap font-semibold text-su-bleu">+ Nouvelle demande</Link>
            {PLUS_CLIENT.slice(0, 3).map((l) => <Link key={l.href} href={l.href} className="whitespace-nowrap text-gray-600">{l.label}</Link>)}
            <Link href="/dashboard/profil" className="whitespace-nowrap text-gray-600">Profil</Link>
          </>
        )}
      </nav>
    </header>
  );
}
