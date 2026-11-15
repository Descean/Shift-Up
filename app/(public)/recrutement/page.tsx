import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { OFFRES, CONTEXTE_RECRUTEMENT, offreOuverte, formatDateLimite } from "@/lib/recrutement/offres";
import { ENTREPRISE } from "@/lib/entreprise";
import { BandeauTitre, TitrePoints, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";
import OffresFiltre from "./OffresFiltre";

export const metadata: Metadata = {
  title: "Recrutement — Offres d'emploi",
  description: CONTEXTE_RECRUTEMENT,
  openGraph: {
    title: "Offres d'emploi — SHIFT UP, cabinet de recrutement",
    description: CONTEXTE_RECRUTEMENT,
  },
};

export const revalidate = 3600;

const ETAPES = [
  { titre: "Choisissez le poste", texte: "Lisez le profil recherché et la liste des pièces demandées." },
  { titre: "Postulez en ligne", texte: "Remplissez le formulaire de l'offre. Aucun dossier papier ni envoi par e-mail ou par WhatsApp n'est accepté." },
  { titre: "Chargez vos pièces", texte: "En PDF lisible : CV, pièce d'identité valide, diplôme, attestations de travail et, le cas échéant, portfolio." },
  { titre: "Suivez votre dossier", texte: "Un accusé de réception avec votre référence vous est envoyé par e-mail." },
];

export default function RecrutementPage() {
  const ouvertes = OFFRES.filter((o) => offreOuverte(o));
  const contextes = Array.from(new Set(ouvertes.map((o) => o.contexte ?? CONTEXTE_RECRUTEMENT)));

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Offres d'emploi" accent="et missions d'experts."
        texte={(contextes.length ? contextes : [CONTEXTE_RECRUTEMENT]).map((c) => <p key={c} className="m-0 mb-2 last:mb-0">{c}</p>)} />

      <section className="bg-white pb-24 pt-16">
        <div className="mx-auto grid max-w-[1200px] items-start gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <div className="flex flex-col gap-4">
            {ouvertes.length === 0 ? (
              <div className="rounded-2xl border border-su-lavande bg-su-brume p-10 text-center">
                <h2 className={`${titreFont} m-0 mb-2 text-xl font-bold text-su-nuit`}>Aucune offre ouverte pour le moment</h2>
                <p className="m-0 text-[#4B5563]">Revenez prochainement ou écrivez-nous à {ENTREPRISE.email}.</p>
              </div>
            ) : (
              <Suspense fallback={null}>
                <OffresFiltre
                  offres={ouvertes.map((o) => ({ code: o.code, slug: o.slug, titre: o.titre, famille: o.famille, diplome: o.diplome, experience: o.experience, dateLimite: formatDateLimite(o.dateLimite) }))}
                />
              </Suspense>
            )}
            <div className="flex items-center gap-3.5 rounded-2xl bg-su-brume px-6 py-5 text-sm text-[#374151]">
              <span className="text-su-bleu"><Icone nom="telephone" taille={22} /></span>
              <span>Une question sur une offre ? Écrivez-nous sur WhatsApp au {ENTREPRISE.telephone}, ou passez par la <Link href="/contact" className="font-semibold text-su-bleu underline">page Contact</Link>.</span>
            </div>
          </div>

          <aside className="flex flex-col gap-6 rounded-[20px] bg-su-nuit p-8 lg:sticky lg:top-28">
            <TitrePoints taille="text-[26px]" clair>Comment postuler</TitrePoints>
            {ETAPES.map((e, i) => (
              <div key={e.titre} className="flex items-start gap-4">
                <span className={`${titreFont} flex h-10 w-10 flex-none items-center justify-center rounded-full bg-su-bleu font-extrabold text-white`}>{i + 1}</span>
                <div className="flex flex-col gap-1">
                  <h3 className={`${titreFont} m-0 text-[17px] font-bold text-white`}>{e.titre}</h3>
                  <p className="m-0 text-sm leading-relaxed text-su-lavande">{e.texte}</p>
                </div>
              </div>
            ))}
          </aside>
        </div>
      </section>
    </div>
  );
}
