"use client";

import Link from "next/link";
import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Puce, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";

type Carte = { code: string; slug: string; titre: string; famille: string; diplome: string; experience: string; dateLimite: string };

const LIBELLES: Record<string, string> = { Ingénieur: "Ingénieurs", Technicien: "Techniciens" };

export default function OffresFiltre({ offres }: { offres: Carte[] }) {
  const [filtre, setFiltre] = useState("tous");
  // Conserve la provenance (?src=affiche…) jusqu'au formulaire de candidature
  const src = (useSearchParams().get("src") ?? "").replace(/[^\w-]/g, "").slice(0, 40);
  const familles = Array.from(new Set(offres.map((o) => o.famille)));
  const FILTRES = [{ id: "tous", label: "Toutes les offres" }, ...familles.map((f) => ({ id: f, label: LIBELLES[f] ?? f }))];
  const liste = filtre === "tous" ? offres : offres.filter((o) => o.famille === filtre);

  return (
    <>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-4">
        <p className="m-0 text-[15px] text-[#4B5563]"><strong className="text-su-nuit">{liste.length} offre{liste.length > 1 ? "s" : ""}</strong> ouverte{liste.length > 1 ? "s" : ""}</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer les postes">
          {FILTRES.map((f) => (
            <Puce key={f.id} actif={filtre === f.id} onClick={() => setFiltre(f.id)}>{f.label}</Puce>
          ))}
        </div>
      </div>

      {liste.map((o) => (
        <Link
          key={o.code}
          href={`/recrutement/${o.slug}${src ? `?src=${src}` : ""}`}
          className="group grid items-center gap-5 rounded-2xl border border-su-lavande bg-white px-[26px] py-6 transition-shadow hover:shadow-[0_12px_30px_rgba(30,46,79,0.12)] sm:grid-cols-[minmax(0,1fr)_auto]"
        >
          <div className="flex flex-col gap-2.5">
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md bg-su-brume px-2.5 py-1 text-xs font-semibold text-su-bleu">{o.code}</span>
              <span className="rounded-md bg-su-brume px-2.5 py-1 text-xs font-semibold text-su-bleu">{o.famille}</span>
            </div>
            <h3 className={`${titreFont} m-0 text-xl font-bold leading-snug text-su-nuit`}>{o.titre}</h3>
            <div className="flex flex-wrap gap-x-[18px] gap-y-1.5 text-[13px] text-[#4B5563]">
              <span>{o.diplome}</span>
              <span className="flex items-center gap-1.5"><span className="text-su-bleu"><Icone nom="horloge" taille={16} /></span>Date limite : {o.dateLimite}</span>
            </div>
          </div>
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-su-clair bg-white px-5 py-3 text-sm font-semibold text-su-bleu transition-colors group-hover:border-su-bleu sm:self-center">
            Voir l&apos;offre <Icone nom="fleche" taille={18} epaisseur={2} />
          </span>
        </Link>
      ))}
    </>
  );
}
