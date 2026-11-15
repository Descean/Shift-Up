import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ENTREPRISE } from "@/lib/entreprise";
import { TitrePoints, titreFont } from "@/components/site/Gabarit";

export const metadata: Metadata = {
  title: "À propos",
  description: "Découvrez SHIFT UP, cabinet de conseil stratégique et solutions numériques fondé à Abomey-Calavi, Bénin.",
};

const values = [
  { title: "Excellence", description: "Nous visons l'excellence dans chaque mission, chaque livrable, chaque interaction." },
  { title: "Innovation", description: "Nous intégrons les meilleures pratiques mondiales adaptées au contexte africain." },
  { title: "Performance", description: "Nos solutions sont orientées résultats mesurables et retour sur investissement." },
  { title: "Intégrité", description: "Transparence, honnêteté et éthique professionnelle dans toutes nos relations." },
  { title: "Collaboration", description: "Nous construisons des partenariats durables fondés sur la confiance mutuelle." },
  { title: "Impact local", description: "Contribuer au développement économique du Bénin et de l'Afrique de l'Ouest." },
];

const phases = [
  { title: "Écoute & diagnostic", description: "Nous prenons le temps de comprendre votre réalité, vos enjeux et vos objectifs avant toute recommandation." },
  { title: "Analyse & stratégie", description: "Analyse approfondie de votre contexte, définition d'une stratégie sur mesure avec des objectifs clairs." },
  { title: "Déploiement", description: "Mise en œuvre rigoureuse avec un suivi rapproché, des jalons définis et une communication transparente." },
  { title: "Mesure & optimisation", description: "Analyse des résultats, ajustements continus et partage des enseignements pour maximiser l'impact." },
];

const chiffres = [
  { valeur: String(ENTREPRISE.anneeCreation), libelle: "année de création" },
  { valeur: "11", libelle: "domaines d'intervention" },
  { valeur: "4", libelle: "associés" },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen">
      <section className="bg-su-brume pb-16 pt-32 sm:pt-36">
        <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 lg:grid-cols-2">
          <div className="flex flex-col gap-5">
            <h1 className={`${titreFont} m-0 text-[38px] font-extrabold leading-[1.08] tracking-tight text-su-nuit sm:text-[52px]`}>
              Transforming Business, <span className="text-su-bleu">Shaping Future.</span>
            </h1>
            <p className="m-0 text-lg leading-relaxed text-[#4B5563]">
              SHIFT UP est un cabinet de conseil stratégique et de solutions numériques fondé à Abomey-Calavi, au Bénin. Nous accompagnons les entreprises et les entrepreneurs, de l&apos;idée au dossier déposé.
            </p>
            <div className="flex flex-wrap gap-7 pt-1.5">
              {chiffres.map((c, i) => (
                <div key={c.libelle} className={`flex flex-col gap-0.5 ${i > 0 ? "border-l border-su-clair pl-7" : ""}`}>
                  <span className={`${titreFont} text-[32px] font-extrabold text-su-bleu`}>{c.valeur}</span>
                  <span className="text-[13px] text-[#4B5563]">{c.libelle}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="relative h-[320px] overflow-hidden rounded-[26px] sm:h-[420px]">
            <Image src="/images/equipe/equipe-salle.jpg" alt="L'équipe SHIFT UP dans sa salle de formation" fill priority
              sizes="(max-width: 1023px) 100vw, 580px" className="object-cover" style={{ objectPosition: "center 35%" }} />
            <span aria-hidden="true" className="absolute left-[-200px] top-[60px] h-[520px] w-[520px] rounded-full border border-white/50" />
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-6 md:grid-cols-2">
          <div className="flex flex-col gap-3.5 rounded-[20px] bg-su-nuit p-9 text-white">
            <TitrePoints taille="text-[30px]" clair>Notre vision</TitrePoints>
            <p className="m-0 text-base leading-[1.7] text-su-lavande">
              Devenir le cabinet de référence en Afrique de l&apos;Ouest pour l&apos;accompagnement des entreprises dans leur transformation stratégique et digitale, et contribuer ainsi à l&apos;émergence économique du Bénin.
            </p>
          </div>
          <div className="flex flex-col gap-3.5 rounded-[20px] border border-su-lavande bg-su-brume p-9">
            <TitrePoints taille="text-[30px]">Notre mission</TitrePoints>
            <p className="m-0 text-base leading-[1.7] text-[#374151]">
              Fournir des services de conseil et des solutions numériques d&apos;excellence, accessibles aux entreprises de toutes tailles, avec un objectif : créer une valeur mesurable et durable pour nos clients.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-su-brume py-24">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-10 px-6">
          <TitrePoints>Nos valeurs fondatrices</TitrePoints>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {values.map((v, i) => (
              <div key={v.title} className="flex flex-col gap-2.5 rounded-2xl border border-su-lavande bg-white p-[26px]">
                <span className={`${titreFont} text-[15px] font-extrabold text-su-ciel`}>0{i + 1}</span>
                <h3 className={`${titreFont} m-0 text-[19px] font-bold text-su-nuit`}>{v.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-[#4B5563]">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-su-nuit py-24">
        <span aria-hidden="true" className="absolute right-[-220px] top-[-300px] h-[640px] w-[640px] rounded-full border border-su-ciel/25" />
        <div className="relative mx-auto flex max-w-[1200px] flex-col gap-11 px-6">
          <TitrePoints clair>Notre méthode en quatre temps</TitrePoints>
          <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-4">
            {phases.map((p, i) => (
              <div key={p.title} className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <span className={`${titreFont} flex h-[46px] w-[46px] flex-none items-center justify-center rounded-full border-2 border-su-bleu text-base font-extrabold ${i === 0 ? "bg-su-bleu text-white" : "bg-white text-su-bleu"}`}>{i + 1}</span>
                  {i < phases.length - 1 && <span aria-hidden="true" className="hidden h-0.5 flex-1 bg-su-lavande/60 lg:block" />}
                </div>
                <h3 className={`${titreFont} m-0 text-lg font-bold text-white`}>{p.title}</h3>
                <p className="m-0 text-sm leading-relaxed text-su-lavande">{p.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto grid max-w-[1200px] items-center gap-14 px-6 lg:grid-cols-[380px_minmax(0,1fr)]">
          <div className="relative flex h-[360px] items-center justify-center overflow-hidden rounded-3xl bg-su-nuit lg:h-[440px]">
            <span aria-hidden="true" className="absolute left-[-160px] top-[-120px] h-[420px] w-[420px] rounded-full bg-su-cadet" />
            <span aria-hidden="true" className="absolute bottom-[-140px] right-[-140px] h-[320px] w-[320px] rounded-full border border-su-ciel/30" />
            <Image src="/assets/logo-icon.png" alt="" width={150} height={150} className="relative brightness-0 invert" />
          </div>
          <div className="flex flex-col gap-[18px]">
            <TitrePoints>Le fondateur</TitrePoints>
            <p className="m-0 text-[15px] font-semibold text-su-bleu">Directeur général &amp; fondateur</p>
            <p className="m-0 text-[17px] leading-[1.7] text-[#374151]">
              Entrepreneur et spécialiste du conseil stratégique, il a fondé SHIFT UP avec une ambition : changer la façon dont les entreprises béninoises se structurent, répondent aux marchés et grandissent. Il s&apos;entoure de trois associés techniciens en fiscalité, en comptabilité et logistique, et en finance.
            </p>
            <div className="flex flex-col gap-2 rounded-2xl bg-su-brume px-6 py-[22px] text-sm text-[#374151]">
              <span><strong className="text-su-nuit">Dénomination :</strong> {ENTREPRISE.nom}, {ENTREPRISE.forme.toLowerCase()}</span>
              <span><strong className="text-su-nuit">RCCM :</strong> {ENTREPRISE.rccm} · <strong className="text-su-nuit">IFU :</strong> {ENTREPRISE.ifu}</span>
              <span><strong className="text-su-nuit">Immatriculation :</strong> 30 mai 2025</span>
              <span><strong className="text-su-nuit">Siège :</strong> Abomey-Calavi, Atlantique, Bénin</span>
            </div>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/services" className="rounded-full bg-su-bleu px-[22px] py-[13px] text-[15px] font-semibold text-white transition-colors hover:bg-su-cadet">Nos services</Link>
              <Link href="/contact" className="rounded-full border border-su-clair bg-white px-[22px] py-[13px] text-[15px] font-semibold text-su-bleu transition-colors hover:border-su-bleu">Nous contacter</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
