/**
 * Éléments communs des pages publiques (refonte) : bandeau de titre, titre à trois points, puces de filtre.
 * Palette su-* (tailwind.config.ts) ; police des titres : Manrope.
 */
import type { ReactNode } from "react";
import { manrope } from "@/components/home/icones";

export const titreFont = manrope.className;

export function Points({ clair = false }: { clair?: boolean }) {
  return (
    <span aria-hidden="true" className="ml-1.5 flex flex-none gap-[7px] self-center">
      <span className={`h-2.5 w-2.5 rounded-full ${clair ? "bg-su-ciel" : "bg-su-bleu"}`} />
      <span className="h-2.5 w-2.5 rounded-full bg-su-ciel" />
      <span className="h-2.5 w-2.5 rounded-full bg-su-ciel" />
    </span>
  );
}

export function TitrePoints({ children, taille = "text-[30px] sm:text-[36px]", clair = false, as: Tag = "h2" }:
  { children: ReactNode; taille?: string; clair?: boolean; as?: "h1" | "h2" | "h3" }) {
  return (
    <div className="flex items-center">
      <Tag className={`${manrope.className} m-0 font-extrabold leading-[1.15] ${taille} ${clair ? "text-white" : "text-su-nuit"}`}>{children}</Tag>
      <Points clair={clair} />
    </div>
  );
}

export function BandeauTitre({ titre, accent, texte, children }: { titre: string; accent: string; texte: ReactNode; children?: ReactNode }) {
  return (
    <section className="relative overflow-hidden bg-su-brume pb-16 pt-32 sm:pt-36">
      <span aria-hidden="true" className="absolute right-[-180px] top-[-260px] h-[520px] w-[520px] rounded-full border-[56px] border-su-lavande" />
      <span aria-hidden="true" className="absolute right-[140px] top-[120px] hidden h-[300px] w-[300px] rounded-full border border-su-clair lg:block" />
      <div className="relative mx-auto flex max-w-[1200px] flex-col gap-[18px] px-6">
        <h1 className={`${manrope.className} m-0 max-w-[760px] text-[38px] font-extrabold leading-[1.08] tracking-tight text-su-nuit sm:text-[52px]`}>
          {titre} <span className="text-su-bleu">{accent}</span>
        </h1>
        <div className="m-0 max-w-[620px] text-lg leading-relaxed text-[#4B5563]">{texte}</div>
        {children}
      </div>
    </section>
  );
}

export function Puce({ actif, children, onClick }: { actif?: boolean; children: ReactNode; onClick?: () => void }) {
  const cls = `rounded-full px-4 py-[9px] text-sm font-semibold transition-colors ${actif ? "bg-su-bleu text-white" : "border border-su-clair bg-white text-su-bleu hover:border-su-bleu"}`;
  return onClick ? <button type="button" onClick={onClick} className={cls}>{children}</button> : <span className={cls}>{children}</span>;
}
