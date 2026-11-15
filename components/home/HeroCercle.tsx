import Link from "next/link";
import type { CSSProperties } from "react";
import { getChiffresAccueil } from "@/lib/accueil";
import { Icone, SERVICES, manrope } from "./icones";

/**
 * Haut de l'accueil : titre, appels à l'action, chiffres clés et anneau animé des 7 services
 * (seules les icônes tournent ; survol = pause + nom du service ; chaque icône mène à la présentation
 * du service). Styles de l'anneau : app/globals.css.
 */
export default async function HeroCercle() {
  const chiffres = await getChiffresAccueil();
  const stats = [
    { icone: "documents", valeur: chiffres.dossiersMontes, libelle: "dossiers montés" },
    { icone: "entreprise", valeur: chiffres.entreprisesAccompagnees, libelle: "entreprises accompagnées" },
    { icone: "coupe", valeur: chiffres.dossiersGagnes, libelle: "dossiers gagnés" },
  ];

  return (
    <section className="su-hero relative overflow-hidden bg-su-brume pt-36 pb-28">
      <div className="su-ringwrap">
        <nav className="su-ring" aria-label="Nos services">
          {SERVICES.map((s, i) => (
            <div key={s.titre} className="su-orb" style={{ "--a": `${(360 / SERVICES.length) * i}deg` } as CSSProperties}>
              <Link href={s.href} className="su-ic" title={s.titre} aria-label={s.titre}>
                <Icone nom={s.icone} taille={36} epaisseur={1.6} />
              </Link>
            </div>
          ))}
        </nav>
      </div>

      <div className="relative z-[1] mx-auto grid max-w-[1200px] items-center gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <div className="flex max-w-[640px] flex-col gap-6">
          <h1 className={`${manrope.className} m-0 text-[40px] font-extrabold leading-[1.08] tracking-tight text-su-nuit sm:text-[52px]`}>
            Transformez votre vision
            <br />
            <span className="text-su-bleu">en succès réel.</span>
          </h1>
          <p className="m-0 max-w-[520px] text-lg leading-relaxed text-[#4B5563]">
            Conseil stratégique, solutions numériques et montage de dossiers pour les entreprises et les entrepreneurs, partout au Bénin.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="#rendez-vous" className="rounded-full bg-su-bleu px-6 py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-su-cadet">
              Demander un rendez-vous
            </Link>
            <Link href="#services" className="rounded-full border border-su-clair bg-white px-6 py-[14px] text-[15px] font-semibold text-su-bleu transition-colors hover:border-su-bleu">
              Découvrir nos services
            </Link>
          </div>
          <div className="mt-3 flex max-w-[320px] flex-col gap-2.5 self-start rounded-[14px] border border-su-lavande bg-white px-[18px] py-4 shadow-[0_12px_30px_rgba(30,46,79,0.12)]">
            <span className={`${manrope.className} text-base font-bold text-su-nuit`}>Montage de dossiers</span>
            <span className="text-sm leading-normal text-[#374151]">Appels d&apos;offres, financement bancaire, subventions : un dossier complet, prêt à déposer.</span>
            <div className="flex flex-wrap gap-1.5">
              {["Analyse du DAO", "Montage", "Dépôt"].map((t) => (
                <span key={t} className="rounded-md border border-su-lavande bg-su-brume px-2.5 py-1 text-xs font-medium text-su-bleu">{t}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-row flex-wrap gap-7 lg:flex-col">
          {stats.map((s) => (
            <div key={s.libelle} className="flex items-center gap-3.5">
              <span className="flex h-[52px] w-[52px] flex-none items-center justify-center rounded-[14px] border border-su-lavande bg-white text-su-bleu shadow-[0_6px_16px_rgba(30,46,79,0.10)]">
                <Icone nom={s.icone} taille={26} epaisseur={1.7} />
              </span>
              <div className="flex flex-col gap-1">
                <span className={`${manrope.className} text-[38px] font-extrabold leading-none text-su-bleu tabular-nums`}>{s.valeur}</span>
                <span className="text-[13px] text-[#4B5563]">{s.libelle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
