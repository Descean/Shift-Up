import Image from "next/image";
import { manrope } from "./icones";

const SPECIALITES = [
  { titre: "Fiscalité", texte: "Déclarations, choix du régime, préparation aux contrôles : votre entreprise paie le juste impôt, dans les délais, sans pénalité." },
  { titre: "Comptabilité, transport & logistique", texte: "Tenue des comptes, états financiers et suivi de la chaîne d'approvisionnement, de la commande à la livraison." },
  { titre: "Finance & trésorerie", texte: "Plans de financement, prévisions de trésorerie et dossiers bancaires, pour que l'argent soit là au bon moment." },
];


/** Présentation de l'équipe, mise en page « diapositive » (styles mobiles : app/globals.css, classes su-slide-*). */
export default function EquipeSection() {
  return (
    <section className="bg-su-brume py-[100px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="su-slide relative h-[660px] overflow-hidden rounded-[28px] bg-su-nuit shadow-[0_30px_60px_rgba(25,35,56,0.28)]">
          <div className="su-slide-photo absolute inset-0 overflow-hidden bg-su-cadet">
            <Image src="/images/equipe/equipe-salle.jpg" alt="L'équipe SHIFT UP dans sa salle de formation" fill sizes="(max-width: 1023px) 100vw, 1152px"
              className="object-cover" style={{ objectPosition: "center 35%" }} />
            <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(25,35,56,0.55) 0%, rgba(25,35,56,0.15) 55%, rgba(25,35,56,0.30) 100%)" }} />
          </div>
          <span aria-hidden="true" className="su-slide-deco absolute left-[520px] top-[-260px] h-[760px] w-[760px] rounded-full border border-white/40" />
          <span aria-hidden="true" className="su-slide-deco absolute left-[600px] top-[120px] h-[900px] w-[900px] rounded-full border border-white/20" />

          <div className="su-slide-card absolute bottom-[34px] left-[34px] top-[34px] z-[2] w-[41%] rounded-l-[26px] bg-white">
            <svg className="su-slide-wing absolute top-0 block h-full" style={{ left: "calc(100% - 1px)", width: 150 }} aria-hidden="true" viewBox="0 0 220 600" preserveAspectRatio="none">
              <path d="M0 0 H70 C 170 60, 225 190, 205 330 C 190 450, 130 560, 30 600 H0 Z" fill="#FFFFFF" />
            </svg>
            <div className="su-slide-inner relative box-border flex h-full flex-col gap-5" style={{ padding: "58px 24px 40px 58px" }}>
              <div className="flex items-center">
                <h2 className={`su-slide-title ${manrope.className} m-0 text-[46px] font-extrabold leading-none tracking-tight text-su-nuit`}>L&apos;équipe</h2>
                <span aria-hidden="true" className="ml-1.5 flex gap-2">
                  <span className="h-[11px] w-[11px] rounded-full bg-su-bleu" />
                  <span className="h-[11px] w-[11px] rounded-full bg-su-ciel" />
                  <span className="h-[11px] w-[11px] rounded-full bg-su-ciel" />
                </span>
              </div>
              <p className="m-0 text-justify text-[14.5px] leading-[1.65] text-[#4B5563]">
                <strong className="text-su-nuit">SHIFT UP</strong> réunit un promoteur et trois associés techniciens en finance, comptabilité et audit. Chaque dossier est suivi par la compétence qu&apos;il demande, du premier échange à la livraison.
              </p>
              {SPECIALITES.map((s) => (
                <div key={s.titre} className="flex flex-col gap-1.5">
                  <h3 className="m-0 text-xs font-bold uppercase tracking-[0.1em] text-su-bleu">{s.titre}</h3>
                  <p className="m-0 text-justify text-[14.5px] leading-[1.65] text-[#4B5563]">{s.texte}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
