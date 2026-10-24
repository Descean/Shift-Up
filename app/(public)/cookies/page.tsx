import type { Metadata } from "next";
import Link from "next/link";
import BoutonCookies from "./BoutonCookies";

export const metadata: Metadata = {
  title: "Politique cookies",
  description: "Cookies utilisés sur shiftup.bj, leur finalité, leur durée et la façon de modifier vos choix.",
};

const lignes = [
  { nom: "next-auth.session-token", type: "Essentiel", role: "Maintient votre connexion à votre espace.", duree: "Session (30 jours max.)" },
  { nom: "next-auth.csrf-token", type: "Essentiel", role: "Protège les formulaires contre les requêtes frauduleuses.", duree: "Session" },
  { nom: "shiftup-cookie-consent (stockage local)", type: "Essentiel", role: "Mémorise vos choix sur les cookies.", duree: "13 mois" },
  { nom: "_ga, _ga_*", type: "Mesure d'audience", role: "Google Analytics 4 : statistiques de visite anonymisées. Déposé seulement avec votre accord.", duree: "13 mois" },
  { nom: "hCaptcha", type: "Sécurité", role: "Vérifie qu'un formulaire est envoyé par une personne et non un robot.", duree: "Session" },
];

export default function CookiesPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-primary pt-28 pb-12">
        <div className="container-custom">
          <h1 className="font-syne font-black text-3xl sm:text-4xl text-white mb-3">Politique cookies</h1>
          <p className="text-white/75 max-w-2xl">Les cookies non essentiels ne sont déposés qu&apos;avec votre accord, conformément à l&apos;article 72 du Code du numérique du Bénin.</p>
        </div>
      </section>
      <section className="section-padding bg-paper">
        <div className="container-custom max-w-4xl space-y-8">
          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg text-primary mb-1">Vos choix</h2>
              <p className="text-sm text-gray-600">Vous pouvez accepter, refuser ou personnaliser les cookies à tout moment.</p>
            </div>
            <BoutonCookies />
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-gray-500 border-b border-gray-200">
                  <th className="px-4 py-3 font-medium">Cookie</th>
                  <th className="px-4 py-3 font-medium">Catégorie</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Durée</th>
                </tr>
              </thead>
              <tbody>
                {lignes.map((l) => (
                  <tr key={l.nom} className="border-b border-gray-100 last:border-0 align-top">
                    <td className="px-4 py-3 font-mono text-xs text-primary">{l.nom}</td>
                    <td className="px-4 py-3 text-primary font-medium whitespace-nowrap">{l.type}</td>
                    <td className="px-4 py-3 text-gray-600">{l.role}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{l.duree}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 space-y-3 text-gray-600 leading-relaxed">
            <h2 className="text-lg text-primary">Supprimer les cookies depuis votre navigateur</h2>
            <p>Tous les navigateurs permettent de supprimer ou de bloquer les cookies (menu Paramètres → Confidentialité). Bloquer les cookies essentiels empêche la connexion à votre espace.</p>
            <p>Pour en savoir plus sur vos données, consultez notre <Link href="/confidentialite" className="text-accent underline">politique de confidentialité</Link> ou écrivez à <a href="mailto:contact@shiftup.bj" className="text-accent underline">contact@shiftup.bj</a>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}
