"use client";

/**
 * Nouvelle demande, en une fois : déposer le dossier et dire ce qu'il faut faire (par écrit ou en
 * message vocal). Le dossier est lu automatiquement et le devis arrive dans l'espace en quelques minutes.
 */
import { TitrePoints } from "@/components/site/Gabarit";
import DemandeExpress from "@/components/prestations/DemandeExpress";

export default function NouvelleDemandeExpress() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <TitrePoints as="h1" taille="text-[28px]">Nouvelle demande</TitrePoints>
        <p className="mt-1 text-sm text-gray-500">Envoyez votre dossier et dites-nous ce qu&apos;il faut faire. Nous le lisons et vous envoyons le devis, avec la liste de ce que vous recevrez.</p>
      </div>
      <DemandeExpress />
    </div>
  );
}
