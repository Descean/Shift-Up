import Link from "next/link";
import { Icone, SERVICES, manrope } from "./icones";

const ENGAGEMENTS = [
  { icone: "devis", titre: "Devis préalable", texte: "Périmètre, délai et prix écrits et validés avant tout démarrage." },
  { icone: "personne", titre: "Interlocuteur unique", texte: "La même personne suit votre dossier du premier échange à la livraison." },
  { icone: "cadenas", titre: "Confidentialité", texte: "Vos documents restent dans un espace privé, réservé à votre équipe et à la nôtre." },
  { icone: "horloge", titre: "Réponse sous 48 h", texte: "Un devis ou une réponse sous 48 heures ouvrées, paiement par Mobile Money." },
];

export function EngagementsSection() {
  return (
    <section className="bg-su-brume py-[100px]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6">
        <h2 className={`${manrope.className} m-0 max-w-[680px] text-[32px] font-extrabold leading-[1.2] text-su-nuit sm:text-[38px]`}>
          Une entreprise jeune, des règles de travail simples et tenues.
        </h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {ENGAGEMENTS.map((e) => (
            <div key={e.titre} className="flex flex-col gap-3 rounded-[14px] border border-su-lavande bg-white p-[26px]">
              <span className="flex h-11 w-11 items-center justify-center rounded-[10px] bg-su-brume text-su-bleu"><Icone nom={e.icone} /></span>
              <h3 className={`${manrope.className} m-0 text-[17px] font-bold text-su-nuit`}>{e.titre}</h3>
              <p className="m-0 text-sm leading-relaxed text-[#4B5563]">{e.texte}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function DomainesSection() {
  return (
    <section id="services" className="scroll-mt-24 bg-white py-[110px]">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className={`${manrope.className} m-0 max-w-[640px] text-[32px] font-extrabold leading-[1.2] text-su-nuit sm:text-[38px]`}>
            Des solutions complètes pour votre croissance.
          </h2>
          <Link href="/services" className="border-b-2 border-su-clair pb-0.5 text-[15px] font-semibold text-su-bleu">
            Voir tous les services et tarifs →
          </Link>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SERVICES.map((s) => (
            <Link key={s.titre} href={s.href}
              className={`flex flex-col gap-3 rounded-[14px] border border-su-lavande p-[26px] transition-shadow hover:shadow-[0_12px_30px_rgba(30,46,79,0.12)] ${s.icone === "dossiers" ? "bg-su-brume" : "bg-white"}`}>
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-su-bleu text-white"><Icone nom={s.icone} /></span>
              <h3 className={`${manrope.className} m-0 text-[17px] font-bold text-su-nuit`}>{s.titre}</h3>
              <p className="m-0 text-sm leading-relaxed text-[#4B5563]">{s.texte}</p>
            </Link>
          ))}
          <Link href="#rendez-vous" className="flex flex-col justify-between gap-3 rounded-[14px] bg-su-bleu p-[26px] transition-colors hover:bg-su-cadet">
            <span className={`${manrope.className} text-[19px] font-bold leading-[1.35] text-white`}>Un besoin qui ne rentre dans aucune case ?</span>
            <span className="text-sm font-semibold text-su-lavande">Parlons-en →</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
