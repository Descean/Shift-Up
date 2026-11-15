"use client";

import { usePathname } from "next/navigation";
import { Icone, manrope } from "@/components/home/icones";
import { Points } from "@/components/site/Gabarit";

const TITRES: Record<string, string> = {
  "/connexion": "Bon retour parmi nous.",
  "/inscription": "Ouvrez votre espace.",
};

const ATOUTS = [
  { icone: "dossiers", texte: "Vos demandes, vos devis et l'avancement de chaque dossier." },
  { icone: "finance", texte: "Le paiement par Mobile Money, en quelques secondes." },
  { icone: "telecharger", texte: "Vos livrables et vos attestations, à télécharger à tout moment." },
];

/** Panneau sombre des pages d'authentification (titre adapté à la page). */
export default function PanneauAuth() {
  const titre = TITRES[usePathname()] ?? "Votre espace SHIFT UP.";
  return (
    <div className="relative z-10 flex flex-col gap-9">
      <div className="flex items-end">
        <p className={`${manrope.className} m-0 text-[44px] font-extrabold leading-[1.1] text-white`}>{titre}</p>
        <span className="mb-3"><Points clair /></span>
      </div>
      <ul className="m-0 flex list-none flex-col gap-5 p-0">
        {ATOUTS.map((a) => (
          <li key={a.icone} className="flex items-center gap-4">
            <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-su-bleu text-white"><Icone nom={a.icone} taille={22} /></span>
            <span className="text-[15px] leading-relaxed text-su-lavande">{a.texte}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
