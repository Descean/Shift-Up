import Image from "next/image";
import Link from "next/link";
import { Icone, manrope } from "./icones";

const SPECIALITES = [
  { titre: "Fiscalité", texte: "Déclarations, choix du régime, préparation aux contrôles : votre entreprise paie le juste impôt, dans les délais, sans pénalité." },
  { titre: "Comptabilité, transport & logistique", texte: "Tenue des comptes, états financiers et suivi de la chaîne d'approvisionnement, de la commande à la livraison." },
  { titre: "Finance & trésorerie", texte: "Plans de financement, prévisions de trésorerie et dossiers bancaires, pour que l'argent soit là au bon moment." },
];

const RESEAUX = [
  { icone: "facebook", href: "https://www.facebook.com/profile.php?id=61580406154960", label: "Facebook" },
  { icone: "instagram", href: "https://www.instagram.com/shiftup.bj?igsh=MW96Njgwd2g1dmRlYg==", label: "Instagram" },
  { icone: "linkedin", href: "https://www.linkedin.com/company/cshift-up/", label: "LinkedIn" },
];

/** Présentation de l'équipe, mise en page « diapositive » (styles mobiles : app/globals.css, classes su-slide-*). */
export default function EquipeSection() {
  return (
    <section className="bg-su-brume py-[100px]">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="su-slide relative h-[660px] overflow-hidden rounded-[28px] bg-su-nuit shadow-[0_30px_60px_rgba(25,35,56,0.28)]">
          <span aria-hidden="true" className="absolute right-[-150px] top-[-210px] h-[420px] w-[420px] rounded-full bg-su-ciel" />
          <div className="su-slide-photo absolute bottom-0 right-0 top-0 w-[54%] overflow-hidden bg-su-cadet" style={{ clipPath: "inset(0 0 0 0 round 0 210px 0 0)" }}>
            <Image src="/images/equipe/equipe-shiftup.jpg" alt="L'équipe SHIFT UP dans sa salle de formation" fill sizes="(max-width: 1023px) 100vw, 650px"
              className="object-cover" style={{ objectPosition: "center 28%" }} />
            <span aria-hidden="true" className="absolute inset-0" style={{ background: "linear-gradient(90deg, rgba(25,35,56,0.35) 0%, rgba(25,35,56,0.05) 45%, rgba(25,35,56,0.45) 100%)" }} />
          </div>
          <span aria-hidden="true" className="su-slide-deco absolute left-[520px] top-[-260px] h-[760px] w-[760px] rounded-full border border-white/40" />
          <span aria-hidden="true" className="su-slide-deco absolute left-[600px] top-[120px] h-[900px] w-[900px] rounded-full border border-white/20" />

          <div className="su-slide-card absolute bottom-[34px] left-[34px] top-[34px] z-[2] w-[41%] rounded-l-[26px] bg-white">
            <svg className="su-slide-wing absolute top-0 block h-full" style={{ left: "calc(100% - 1px)", width: 150 }} aria-hidden="true" viewBox="0 0 220 600" preserveAspectRatio="none">
              <path d="M0 0 H70 C 170 60, 225 190, 205 330 C 190 450, 130 560, 30 600 H0 Z" fill="#FFFFFF" />
            </svg>
            <span aria-hidden="true" className="absolute left-[-32px] top-[54px] flex h-16 w-16 items-center justify-center rounded-full bg-su-nuit">
              <svg width="26" height="26" viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z" fill="#FFFFFF" /></svg>
            </span>
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

          <div className="su-slide-rail absolute bottom-[120px] right-[26px] top-9 z-[3] flex flex-col items-center justify-between">
            <span className="text-xs font-bold tracking-[0.14em] text-su-nuit" style={{ writingMode: "vertical-rl" }}>{"/// 05"}</span>
            <div className="flex flex-col items-center gap-2.5">
              <span className="rotate-180 text-[13px] font-semibold tracking-wide text-white" style={{ writingMode: "vertical-rl" }}>/shiftup.bj</span>
              {RESEAUX.map((r) => (
                <a key={r.label} href={r.href} target="_blank" rel="noopener noreferrer" aria-label={r.label}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-su-nuit">
                  <Icone nom={r.icone} taille={15} epaisseur={2} />
                </a>
              ))}
            </div>
          </div>
          <span className="su-slide-sign absolute bottom-[34px] right-[118px] z-[3] text-sm font-semibold tracking-wider text-white">
            <span className="text-su-ciel">{"///"}</span> shiftup.bj
          </span>
          <Link href="/a-propos" aria-label="Voir la page À propos"
            className="su-slide-more absolute bottom-0 right-0 z-[3] flex h-[92px] w-[92px] items-center justify-center rounded-tl-[28px] bg-su-lavande/85 text-su-nuit">
            <Icone nom="agrandir" taille={34} epaisseur={2} />
          </Link>
        </div>
      </div>
    </section>
  );
}
