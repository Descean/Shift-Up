import Link from "next/link";
import { getChiffresAccueil } from "@/lib/accueil";
import { lireTarifs, NATURES } from "@/lib/reglages";
import { TitrePoints } from "@/components/site/Gabarit";
import { Icone, manrope } from "./icones";

/**
 * Accueil recentré sur le montage de dossiers d'appels d'offres : faire monter son dossier (client)
 * et devenir monteur (indépendant). Tarifs « à partir de » = planchers réglés par la Direction.
 */
const F = (n: number) => `${Math.round(n).toLocaleString("fr-FR")} F`;

const DESCRIPTIONS: Record<string, string> = {
  cotation: "Demandes de cotation et de prix : pièces administratives, offre et bordereau, prêts à déposer.",
  trp: "Demandes de renseignements et de prix : dossier complet, conforme aux exigences de l'acheteur.",
  dao: "Appels d'offres ouverts : analyse du DAO, offre technique et financière, formulaires et contrôle qualité.",
};

const ETAPES = [
  { icone: "documents", titre: "Vous déposez le dossier", texte: "Le DAO ou l'avis, vos pièces disponibles, la date limite. Votre adresse e-mail suffit pour commencer." },
  { icone: "devis", titre: "Vous recevez le devis", texte: "Le dossier est lu, chiffré et vérifié par un monteur : vous savez ce que vous recevrez et à quel prix." },
  { icone: "cadenas", titre: "L'acompte lance le travail", texte: "Mobile Money ou carte bancaire. Votre espace de suivi s'ouvre aussitôt." },
  { icone: "horloge", titre: "Vous suivez chaque étape", texte: "Chaque livrable apparaît dès qu'il est prêt : vous le lisez en aperçu protégé et faites vos remarques." },
  { icone: "coupe", titre: "Le solde débloque vos fichiers", texte: "Word et PDF téléchargeables, prêts à déposer, avec une révision incluse dans les 48 heures." },
];

const GARANTIES = [
  { icone: "fa-shield-halved", titre: "Confidentialité", texte: "Un accord de confidentialité s'applique à chaque dossier. Vos documents ne sont jamais partagés." },
  { icone: "fa-eye", titre: "Aperçu avant paiement", texte: "Vous lisez le travail en filigrane avant de régler le solde." },
  { icone: "fa-hand-holding-dollar", titre: "Paiement en deux temps", texte: "Un acompte pour démarrer, le solde à la livraison. Reçu pour chaque paiement." },
  { icone: "fa-clock-rotate-left", titre: "Rien ne traîne", texte: "Fichiers et échanges effacés 30 jours après la fin de la prestation." },
];

export default async function AccueilMontage() {
  const [chiffres, tarifs] = await Promise.all([getChiffresAccueil(), lireTarifs()]);
  const stats = [
    { icone: "documents", valeur: chiffres.dossiersMontes, libelle: "dossiers montés" },
    { icone: "entreprise", valeur: chiffres.entreprisesAccompagnees, libelle: "entreprises accompagnées" },
    { icone: "coupe", valeur: chiffres.dossiersGagnes, libelle: "dossiers gagnés" },
  ];

  return (
    <>
      <section className="relative overflow-hidden bg-su-brume pb-24 pt-36">
        <span aria-hidden="true" className="absolute -right-40 -top-40 h-[520px] w-[520px] rounded-full border border-su-clair/60" />
        <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 lg:grid-cols-[minmax(0,1fr)_400px]">
          <div className="flex flex-col gap-6">
            <h1 className={`${manrope.className} m-0 text-[40px] font-extrabold leading-[1.08] tracking-tight text-su-nuit sm:text-[54px]`}>
              Votre dossier d&apos;appel d&apos;offres,
              <br /><span className="text-su-bleu">monté et prêt à déposer.</span>
            </h1>
            <p className="m-0 max-w-[560px] text-lg leading-relaxed text-[#4B5563]">
              Déposez le DAO et vos pièces : nous chiffrons, montons et contrôlons votre offre. Vous suivez tout depuis votre espace et ne payez le solde qu&apos;après avoir vu le travail.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/services/souscrire" className="inline-flex items-center gap-2 rounded-full bg-su-nuit px-7 py-[15px] text-[15px] font-semibold text-white transition-colors hover:bg-su-cadet">
                Déposer mon dossier <Icone nom="fleche" taille={18} epaisseur={2} />
              </Link>
              <Link href="/devenir-monteur" className="rounded-full border border-su-clair bg-white px-6 py-[14px] text-[15px] font-semibold text-su-bleu transition-colors hover:border-su-bleu">
                Je monte des dossiers
              </Link>
            </div>
            <div className="mt-2 flex flex-wrap gap-8">
              {stats.map((s) => (
                <div key={s.libelle} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-su-lavande bg-white text-su-bleu"><Icone nom={s.icone} taille={22} epaisseur={1.7} /></span>
                  <span><span className={`${manrope.className} block text-[30px] font-extrabold leading-none text-su-bleu tabular-nums`}>{s.valeur}</span><span className="text-[13px] text-[#4B5563]">{s.libelle}</span></span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-su-lavande bg-white p-6 shadow-[0_20px_50px_rgba(30,46,79,0.14)]">
            <p className="font-bold text-su-nuit">Nouvelle demande de montage</p>
            <div className="mt-4 space-y-3 text-sm">
              {[["Nature du marché", "Dossier d'Appel d'Offres (DAO)"], ["Date limite de dépôt", "Dans 12 jours"], ["Livraison", "Numérique + physique"]].map(([k, v]) => (
                <div key={k} className="rounded-xl border border-su-lavande bg-su-brume/50 px-4 py-2.5"><span className="block text-[11px] text-gray-500">{k}</span><span className="font-semibold text-su-nuit">{v}</span></div>
              ))}
              <div className="flex items-center gap-2 rounded-xl border-2 border-dashed border-su-clair px-4 py-3 text-gray-500"><i className="fas fa-cloud-arrow-up text-su-bleu" />DAO.pdf · Bilans 2024.pdf · CV.docx</div>
            </div>
            <Link href="/services/souscrire" className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"><i className="fas fa-check" />Lancer l&apos;analyse</Link>
          </div>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <TitrePoints>Le montage qu&apos;il vous faut</TitrePoints>
          <p className="mt-3 max-w-2xl text-[#4B5563]">Un prix fixé selon le volume du dossier, connu avant de commencer.</p>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {NATURES.map((n) => (
              <div key={n.id} className="flex flex-col rounded-2xl border border-su-lavande p-6">
                <p className="text-lg font-bold text-su-nuit">{n.label}</p>
                <p className="mt-2 flex-1 text-sm text-gray-600">{DESCRIPTIONS[n.id]}</p>
                <p className="mt-5 text-sm text-gray-500">À partir de <span className={`${manrope.className} text-2xl font-extrabold text-su-bleu`}>{F(tarifs.planchers[n.id])}</span></p>
                <Link href={`/services/souscrire?nature=${n.id}`} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-su-bleu hover:underline">Déposer ce dossier <i className="fas fa-arrow-right text-xs" /></Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-sm text-gray-500">Traitement express : +{Math.round(tarifs.majorationExpress * 100)} %. Impression, reliure et mise sous pli cacheté : +{F(tarifs.livraisonPhysique)}.</p>
        </div>
      </section>

      <section className="bg-su-brume py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <TitrePoints>Comment ça se passe</TitrePoints>
          <ol className="mt-10 grid gap-5 md:grid-cols-5">
            {ETAPES.map((e, i) => (
              <li key={e.titre} className="rounded-2xl border border-su-lavande bg-white p-5">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-su-nuit text-white"><Icone nom={e.icone} taille={20} epaisseur={1.8} /></span>
                <p className="mt-4 font-bold text-su-nuit">{i + 1}. {e.titre}</p>
                <p className="mt-1.5 text-sm text-gray-600">{e.texte}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-white py-24">
        <div className="mx-auto max-w-[1200px] px-6">
          <TitrePoints>Vos documents entre de bonnes mains</TitrePoints>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {GARANTIES.map((g) => (
              <div key={g.titre}>
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-su-brume text-su-bleu"><i className={`fas ${g.icone}`} /></span>
                <p className="mt-4 font-bold text-su-nuit">{g.titre}</p>
                <p className="mt-1.5 text-sm text-gray-600">{g.texte}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-su-nuit py-20 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <TitrePoints clair>Vous montez des dossiers ?</TitrePoints>
            <p className="mt-4 text-su-clair">
              Ouvrez votre compte monteur : vos clients déposent leur dossier par votre lien, reçoivent le devis et paient en ligne. Vous vous concentrez sur le montage et recevez {Math.round((1 - tarifs.commissionMonteurs) * 100)} % de chaque paiement.
            </p>
          </div>
          <Link href="/devenir-monteur" className="inline-flex items-center justify-center gap-2 self-start rounded-full bg-white px-7 py-4 text-[15px] font-semibold text-su-nuit hover:bg-su-brume lg:self-auto">
            Devenir monteur <i className="fas fa-arrow-right text-xs" />
          </Link>
        </div>
      </section>
    </>
  );
}
