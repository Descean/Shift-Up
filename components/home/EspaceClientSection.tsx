import Link from "next/link";
import { Icone, manrope } from "./icones";

/** Présentation de l'espace client (aperçu illustratif du suivi d'un dossier). */
export default function EspaceClientSection() {
  const etapes = [
    { libelle: "Demande reçue", etat: "fait" },
    { libelle: "Devis validé", etat: "fait" },
    { libelle: "Montage en cours", etat: "encours" },
    { libelle: "Livraison du dossier", etat: "afaire" },
  ] as const;

  return (
    <section className="bg-white py-[110px]">
      <div className="mx-auto grid max-w-[1200px] items-center gap-16 px-6 lg:grid-cols-2">
        <div className="rounded-[20px] bg-su-brume p-6 sm:p-10" aria-hidden="true">
          <div className="flex flex-col gap-[18px] rounded-[14px] border border-su-lavande bg-white p-6 shadow-[0_12px_30px_rgba(30,46,79,0.10)]">
            <div className="flex items-center justify-between gap-3">
              <span className={`${manrope.className} text-base font-bold text-su-nuit`}>Mon espace client</span>
              <span className="rounded-full bg-su-lavande px-2.5 py-1 text-xs font-semibold text-su-bleu">1 dossier en cours</span>
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-xs text-[#4B5563]">Dossier de soumission</span>
              <span className="text-[15px] font-semibold text-[#111827]">Construction d&apos;un bâtiment administratif</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-su-lavande"><div className="h-full w-[62%] rounded-full bg-su-bleu" /></div>
            <div className="flex flex-col gap-2.5 text-sm">
              {etapes.map((e) => (
                <div key={e.libelle} className="flex items-center gap-2.5">
                  {e.etat === "fait" ? (
                    <span className="flex h-[22px] w-[22px] items-center justify-center rounded-full bg-su-bleu text-white"><Icone nom="coche" taille={12} epaisseur={3} /></span>
                  ) : (
                    <span className={`box-border h-[22px] w-[22px] rounded-full border-2 ${e.etat === "encours" ? "border-su-bleu bg-white" : "border-su-clair"}`} />
                  )}
                  <span className={e.etat === "encours" ? "font-semibold text-su-bleu" : e.etat === "fait" ? "text-[#111827]" : "text-[#4B5563]"}>{e.libelle}</span>
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-2.5">
              <span className="rounded-lg bg-su-bleu px-4 py-[11px] text-sm font-semibold text-white">Déposer une pièce</span>
              <span className="rounded-lg border border-su-clair bg-white px-4 py-2.5 text-sm font-semibold text-su-bleu">Messages</span>
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <h2 className={`${manrope.className} m-0 text-[34px] font-extrabold leading-[1.15] tracking-tight text-su-nuit sm:text-[42px]`}>
            Suivez votre dossier, <span className="text-su-bleu">pas à pas.</span>
          </h2>
          <p className="m-0 text-[17px] leading-[1.65] text-[#4B5563]">
            Déposez votre demande, validez le devis, envoyez vos pièces et récupérez vos livrables depuis un seul espace, sans échanges de fichiers dispersés.
          </p>
          <Link href="/inscription" className="self-start rounded-full bg-su-bleu px-[22px] py-3.5 text-[15px] font-semibold text-white transition-colors hover:bg-su-cadet">
            Créer mon espace
          </Link>
        </div>
      </div>
    </section>
  );
}
