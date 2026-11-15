"use client";

/**
 * Demander une prestation sans compte : déposer le dossier, dire ce qu'il faut faire, laisser son
 * adresse. Le devis arrive dans l'espace client ouvert avec cette adresse. Un client connecté est
 * envoyé vers la même demande dans son espace.
 */
import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { BandeauTitre, titreFont } from "@/components/site/Gabarit";
import DemandeExpress from "@/components/prestations/DemandeExpress";

const ETAPES = [
  { icone: "fa-folder-open", titre: "Votre dossier", texte: "Vous déposez les documents et dites ce qu'il faut faire." },
  { icone: "fa-file-invoice", titre: "Le devis", texte: "Nous lisons le dossier et vous envoyons le devis, avec la liste de ce que vous recevrez." },
  { icone: "fa-hand-holding-dollar", titre: "L'acompte de 60 %", texte: "Il ouvre votre espace de suivi et lance le travail." },
  { icone: "fa-list-check", titre: "Le suivi", texte: "Vous lisez chaque livrable dès qu'il est prêt et nous faites vos remarques." },
  { icone: "fa-flag-checkered", titre: "Le solde", texte: "Les 40 % restants à la livraison débloquent le téléchargement." },
];

export default function SouscrirePage() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") router.replace(`/dashboard/client/nouvelle-demande${window.location.search}`);
  }, [status, router]);

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Confiez-nous" accent="votre dossier."
        texte="Déposez vos documents, dites-nous ce qu'il faut faire, par écrit ou en message vocal. Nous vous envoyons le devis." />

      <section className="bg-white pb-24 pt-12">
        <div className="mx-auto grid max-w-[1100px] items-start gap-8 px-5 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div>
            {status === "loading" || status === "authenticated" ? (
              <div className="flex min-h-64 items-center justify-center"><span className="h-8 w-8 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" /></div>
            ) : (
              <DemandeExpress publique />
            )}
          </div>

          <aside className="space-y-4 rounded-2xl border border-su-lavande bg-white p-6">
            <h2 className={`${titreFont} text-lg font-bold text-su-nuit`}>Comment ça se passe</h2>
            <ol className="space-y-4">
              {ETAPES.map((e, i) => (
                <li key={e.titre} className="flex gap-3">
                  <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-su-brume text-xs text-su-bleu"><i className={`fas ${e.icone}`} /></span>
                  <div>
                    <p className="text-sm font-semibold text-su-nuit">{i + 1}. {e.titre}</p>
                    <p className="text-xs text-gray-500">{e.texte}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="border-t border-su-lavande pt-4 text-xs text-gray-500">
              <i className="fas fa-lock mr-1.5 text-su-bleu" />Vos documents restent privés : seuls vous et le chargé de votre dossier y ont accès.
            </p>
          </aside>
        </div>
      </section>
    </div>
  );
}
