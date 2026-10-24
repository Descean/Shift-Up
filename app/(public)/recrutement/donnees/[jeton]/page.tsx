/**
 * /recrutement/donnees/<jeton> — Page personnelle du candidat non retenu :
 * il confirme ou refuse la conservation de son dossier. Le lien du courriel ne déclenche
 * rien tout seul (les messageries ouvrent parfois les liens) : le choix se valide par un bouton.
 */
import type { Metadata } from "next";
import Link from "next/link";
import prisma from "@/lib/prisma";
import { DUREE_CONSERVATION_MOIS } from "@/lib/recrutement/motifs";
import ChoixDonnees from "./ChoixDonnees";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Votre dossier de candidature", robots: { index: false, follow: false } };

const dateFr = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Porto-Novo" });

export default async function DonneesPage({ params, searchParams }: {
  params: Promise<{ jeton: string }>;
  searchParams: Promise<{ choix?: string }>;
}) {
  const { jeton } = await params;
  const { choix } = await searchParams;
  const c = /^[A-Za-z0-9_-]{20,64}$/.test(jeton)
    ? await prisma.candidature.findUnique({
        where: { jetonDonnees: jeton },
        select: { reference: true, offreTitre: true, prenoms: true, conservation: true, conservationJusquau: true, donneesSupprimeesLe: true },
      })
    : null;

  return (
    <div className="min-h-screen">
      <section className="bg-primary pt-28 pb-12">
        <div className="container-custom">
          <p className="text-white/70 text-sm mb-2">Recrutement SHIFT UP</p>
          <h1 className="font-syne font-black text-3xl sm:text-4xl text-white">Votre dossier de candidature</h1>
        </div>
      </section>
      <section className="section-padding bg-paper">
        <div className="container-custom max-w-2xl">
          {!c ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8">
              <h2 className="text-xl text-primary mb-3">Lien invalide</h2>
              <p className="text-gray-600 leading-relaxed">Ce lien ne correspond à aucun dossier. Vérifiez que vous avez copié l&apos;adresse complète depuis notre courriel, ou écrivez à <a className="text-accent underline" href="mailto:contact@shiftup.bj">contact@shiftup.bj</a>.</p>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-sm text-gray-500">Réf. {c.reference}</p>
                <h2 className="text-xl text-primary mt-1">{c.donneesSupprimeesLe ? "Candidature" : `Bonjour ${c.prenoms},`}</h2>
                <p className="text-gray-600 leading-relaxed mt-2">Candidature au poste de <strong className="text-primary">{c.offreTitre}</strong>.</p>
              </div>
              <ChoixDonnees
                jeton={jeton}
                etatInitial={c.donneesSupprimeesLe ? "SUPPRIMEES" : c.conservation === "ACCEPTEE" ? "ACCEPTEE" : "EN_ATTENTE"}
                jusquau={c.conservationJusquau ? dateFr(c.conservationJusquau) : null}
                suggestion={choix === "oui" || choix === "non" ? choix : null}
                dureeMois={DUREE_CONSERVATION_MOIS}
              />
              <p className="text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-4">
                Conformément au Code du numérique du Bénin, vous pouvez à tout moment demander l&apos;accès, la rectification ou la suppression de vos données en écrivant à <a className="text-accent underline" href="mailto:contact@shiftup.bj">contact@shiftup.bj</a>. Voir notre <Link href="/confidentialite" className="text-accent underline">politique de confidentialité</Link>.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
