import type { Metadata } from "next";
import Link from "next/link";
import { OFFRES, CONTEXTE_RECRUTEMENT, offreOuverte, formatDateLimite } from "@/lib/recrutement/offres";
import OffresFiltre from "./OffresFiltre";

export const metadata: Metadata = {
  title: "Recrutement — Offres d'emploi BTP",
  description: CONTEXTE_RECRUTEMENT,
  openGraph: {
    title: "Offres d'emploi BTP et travaux publics — SHIFT UP",
    description: CONTEXTE_RECRUTEMENT,
  },
};

export const revalidate = 3600;

export default function RecrutementPage() {
  const ouvertes = OFFRES.filter((o) => offreOuverte(o));
  const dateLimite = ouvertes[0]?.dateLimite;

  return (
    <div className="min-h-screen">
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10 max-w-4xl">
          <span className="inline-flex items-center gap-2 bg-white/10 text-accent-200 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <i className="fas fa-user-tie" aria-hidden />
            Cabinet de recrutement
          </span>
          <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-5 leading-tight">
            Offres d&apos;emploi <span className="gradient-text">BTP et travaux publics</span>
          </h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-2xl">{CONTEXTE_RECRUTEMENT}</p>
          {ouvertes.length > 0 && (
            <div className="flex flex-wrap gap-3 mt-8 text-sm text-white">
              <span className="border border-white/20 bg-white/5 rounded-full px-4 py-2">
                {ouvertes.length} poste{ouvertes.length > 1 ? "s" : ""} ouvert{ouvertes.length > 1 ? "s" : ""}
              </span>
              {dateLimite && (
                <span className="border border-white/20 bg-white/5 rounded-full px-4 py-2">
                  Date limite : {formatDateLimite(dateLimite)}
                </span>
              )}
              <span className="border border-white/20 bg-white/5 rounded-full px-4 py-2">Dossiers examinés au fil de l&apos;eau</span>
            </div>
          )}
        </div>
      </section>

      <section className="section-padding bg-paper">
        <div className="container-custom">
          {ouvertes.length === 0 ? (
            <div className="bg-white border border-gray-200 rounded-2xl p-10 text-center max-w-xl mx-auto">
              <h2 className="text-xl text-primary mb-2">Aucune offre ouverte pour le moment</h2>
              <p className="text-gray-500">Revenez prochainement ou écrivez-nous à contact@shiftup.bj.</p>
            </div>
          ) : (
            <OffresFiltre
              offres={ouvertes.map((o) => ({ code: o.code, slug: o.slug, titre: o.titre, famille: o.famille, diplome: o.diplome, experience: o.experience }))}
            />
          )}

          <div className="mt-12 bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div>
              <h2 className="text-lg text-primary mb-2">Comment postuler</h2>
              <p className="text-gray-600 leading-relaxed">
                Choisissez le poste, remplissez le formulaire et chargez séparément, en PDF lisible : CV, diplôme,
                attestations de travail et, le cas échéant, autres pièces. Un accusé de réception avec votre
                référence vous est envoyé par e-mail. Aucun dossier papier ni envoi par e-mail n&apos;est accepté.
              </p>
            </div>
            <Link href="/contact" className="text-accent font-semibold hover:underline whitespace-nowrap">
              Une question ? Contactez-nous →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
