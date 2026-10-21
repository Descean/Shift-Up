"use client";

import Link from "next/link";
import { useState } from "react";

type Carte = { code: string; slug: string; titre: string; famille: string; diplome: string; experience: string };

const FILTRES = [
  { id: "tous", label: "Tous" },
  { id: "Ingénieur", label: "Ingénieurs" },
  { id: "Technicien", label: "Techniciens" },
];

export default function OffresFiltre({ offres }: { offres: Carte[] }) {
  const [filtre, setFiltre] = useState("tous");
  const liste = filtre === "tous" ? offres : offres.filter((o) => o.famille === filtre);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <h2 className="text-2xl sm:text-3xl text-primary">Postes à pourvoir</h2>
        <div className="flex gap-2" role="group" aria-label="Filtrer les postes">
          {FILTRES.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltre(f.id)}
              aria-pressed={filtre === f.id}
              className={`min-h-[44px] px-4 rounded-full text-sm font-medium border transition-colors ${
                filtre === f.id
                  ? "bg-primary text-white border-primary"
                  : "bg-white text-primary border-gray-300 hover:border-primary"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {liste.map((o) => (
          <Link
            key={o.code}
            href={`/recrutement/${o.slug}`}
            className="group bg-white border border-gray-200 rounded-2xl p-6 flex flex-col gap-4 hover:border-primary hover:shadow-card-hover transition-all"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="font-syne font-semibold text-xs tracking-wider text-accent bg-accent-50 px-2.5 py-1 rounded-md">{o.code}</span>
              <span className="text-xs text-gray-500">{o.famille}</span>
            </div>
            <h3 className="text-xl text-primary leading-snug">{o.titre}</h3>
            <div className="text-sm text-gray-600 space-y-1.5">
              <p>{o.diplome}</p>
              <p>{o.experience.replace(" d'expérience professionnelle", "").replace(" après le diplôme", "")}</p>
            </div>
            <span className="mt-auto text-sm font-semibold text-accent group-hover:text-primary">Voir le poste et postuler →</span>
          </Link>
        ))}
      </div>
    </>
  );
}
