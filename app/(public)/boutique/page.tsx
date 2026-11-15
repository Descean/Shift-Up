"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BandeauTitre, Puce, TitrePoints, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";

const categories = ["Tous", "Templates", "Guides", "Outils", "Formation"];

const products = [
  {
    id: "1",
    category: "Templates",
    icon: "documents",
    title: "Template Business Plan Pro",
    description: "Modèle complet de business plan en Word + Excel avec tableaux financiers automatisés, projections sur 5 ans et guide de rédaction.",
    price: 15000,
    originalPrice: 25000,
    format: "Word + Excel",
    pages: "45 pages",
    isPopular: true,
    features: [
      "Plan financier automatisé",
      "Projections cash-flow 5 ans",
      "Guide de rédaction inclus",
      "Compatible banques et investisseurs",
    ],
  },
  {
    id: "2",
    category: "Templates",
    icon: "finance",
    title: "Pack Dossier Financement Bancaire",
    description: "Tous les documents nécessaires pour constituer un dossier de demande de crédit bancaire au Bénin et dans la sous-région UEMOA.",
    price: 12000,
    originalPrice: null,
    format: "PDF + Word",
    pages: "30 pages",
    isPopular: false,
    features: [
      "Formulaire de demande de crédit",
      "Modèle de garanties",
      "Check-list documentaire",
      "Lettre de présentation de projet",
    ],
  },
  {
    id: "3",
    category: "Guides",
    icon: "entreprise",
    title: "Guide : Créer son entreprise au Bénin",
    description: "Le guide complet pour créer votre SARL ou SAS au Bénin en 2026 : RCCM, IFU, compte bancaire, et premières obligations fiscales.",
    price: 8000,
    originalPrice: null,
    format: "PDF",
    pages: "60 pages",
    isPopular: false,
    features: [
      "Étapes légales détaillées",
      "Formulaires téléchargeables",
      "Coûts et délais réels",
      "Contacts utiles inclus",
    ],
  },
  {
    id: "4",
    category: "Outils",
    icon: "numerique",
    title: "Tableau de Bord PME – Excel Pro",
    description: "Tableau de bord de gestion PME tout-en-un : suivi CA, charges, BFR, trésorerie, rentabilité — adapté à la réalité africaine.",
    price: 20000,
    originalPrice: 35000,
    format: "Excel",
    pages: "10 onglets",
    isPopular: true,
    features: [
      "Suivi CA et charges mensuel",
      "Indicateurs KPIs automatiques",
      "Graphiques dynamiques",
      "Prévisions de trésorerie",
    ],
  },
  {
    id: "5",
    category: "Guides",
    icon: "marketing",
    title: "Guide Marketing Digital PMEA",
    description: "Stratégies marketing digital éprouvées pour les PME africaines : réseaux sociaux, WhatsApp Business, Google My Business, SEO local.",
    price: 10000,
    originalPrice: null,
    format: "PDF",
    pages: "80 pages",
    isPopular: false,
    features: [
      "Stratégies réseaux sociaux",
      "WhatsApp Business guide",
      "Google My Business optimisation",
      "Modèles de posts inclus",
    ],
  },
  {
    id: "6",
    category: "Formation",
    icon: "formation",
    title: "Mini-Formation : Maîtrisez votre comptabilité",
    description: "4 modules vidéo + PDF pour comprendre les bases comptables de votre entreprise sans être expert-comptable.",
    price: 25000,
    originalPrice: 40000,
    format: "Vidéo + PDF",
    pages: "4 modules",
    isPopular: false,
    features: [
      "4 modules vidéo HD",
      "Exercices pratiques",
      "Attestation numérique",
      "Accès à vie",
    ],
  },
  {
    id: "7",
    category: "Templates",
    icon: "juridique",
    title: "Pack Contrats Commerciaux OHADA",
    description: "10 modèles de contrats conformes au droit OHADA : contrat de prestation, partenariat, NDA, bail commercial, CGV.",
    price: 18000,
    originalPrice: 30000,
    format: "Word",
    pages: "10 contrats",
    isPopular: false,
    features: [
      "10 modèles personnalisables",
      "Conformes droit OHADA",
      "Clauses protectrices",
      "Guide d'utilisation",
    ],
  },
  {
    id: "8",
    category: "Outils",
    icon: "dossiers",
    title: "Simulateur d'Appel d'Offres",
    description: "Outil Excel pour analyser la rentabilité d'un appel d'offres avant de répondre : calcul coûts, marge, probabilité de gain.",
    price: 15000,
    originalPrice: null,
    format: "Excel",
    pages: "5 onglets",
    isPopular: false,
    features: [
      "Calcul coûts direct/indirect",
      "Simulation marge bénéficiaire",
      "Analyse risques",
      "Score de compétitivité",
    ],
  },
];

export default function BoutiquePage() {
  const router = useRouter();
  const [filter, setFilter] = useState("Tous");

  const filtered = filter === "Tous" ? products : products.filter((p) => p.category === filter);

  const handleBuy = (product: (typeof products)[0]) => {
    const params = new URLSearchParams({
      type:   "boutique",
      id:     product.id,
      name:   product.title,
      amount: String(product.price),
    });
    router.push(`/paiement?${params.toString()}`);
  };

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Modèles et outils" accent="prêts à l'emploi."
        texte="Business plan, contrats OHADA, tableaux de bord, guides : des ressources conçues pour les entrepreneurs béninois, à télécharger juste après le paiement.">
        <div className="flex flex-wrap gap-2.5">
          {categories.map((c) => <Puce key={c} actif={filter === c} onClick={() => setFilter(c)}>{c === "Tous" ? "Tout voir" : c}</Puce>)}
        </div>
      </BandeauTitre>

      <section className="bg-white pb-24 pt-16">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-12 px-6">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((product) => (
              <div key={product.id}
                className={`relative flex flex-col rounded-2xl bg-white transition-shadow hover:shadow-[0_12px_30px_rgba(30,46,79,0.12)] ${product.isPopular ? "border-2 border-su-bleu" : "border border-su-lavande"}`}>
                {product.isPopular && (
                  <span className="absolute -top-3 left-5 rounded-full bg-su-bleu px-3.5 py-1 text-xs font-bold text-white">Le plus demandé</span>
                )}
                <div className="relative m-4 mb-0 flex h-[110px] items-center justify-center overflow-hidden rounded-xl bg-su-brume text-su-bleu">
                  <span aria-hidden="true" className="absolute right-[-40px] top-[-50px] h-[140px] w-[140px] rounded-full border-[18px] border-su-lavande" />
                  <span className="relative"><Icone nom={product.icon} taille={44} epaisseur={1.6} /></span>
                </div>
                <div className="flex flex-1 flex-col gap-2.5 p-5">
                  <span className="text-xs font-semibold text-su-bleu">{product.category} · {product.format} · {product.pages}</span>
                  <h3 className={`${titreFont} m-0 text-[17px] font-bold leading-snug text-su-nuit`}>{product.title}</h3>
                  <p className="m-0 flex-1 text-[13px] leading-relaxed text-[#4B5563]">{product.description}</p>
                  <ul className="m-0 flex list-none flex-col gap-1.5 p-0">
                    {product.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-[13px] text-[#374151]">
                        <span className="mt-0.5 text-su-bleu"><Icone nom="coche" taille={14} epaisseur={2.2} /></span>{f}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex items-baseline gap-2 border-t border-su-lavande pt-4">
                    <span className={`${titreFont} text-[22px] font-extrabold text-su-nuit`}>{product.price.toLocaleString("fr-FR")} F</span>
                    {product.originalPrice && <span className="text-sm text-[#9CA3AF] line-through">{product.originalPrice.toLocaleString("fr-FR")} F</span>}
                  </div>
                  <button type="button" onClick={() => handleBuy(product)}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-su-bleu py-3 text-sm font-semibold text-white transition-colors hover:bg-su-cadet">
                    Acheter <Icone nom="telecharger" taille={16} epaisseur={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="relative grid items-center gap-6 overflow-hidden rounded-3xl bg-su-nuit p-8 sm:p-12 lg:grid-cols-[minmax(0,1fr)_auto]">
            <span aria-hidden="true" className="absolute right-[-120px] top-[-160px] h-[400px] w-[400px] rounded-full border border-su-ciel/25" />
            <div className="relative flex flex-col gap-3">
              <TitrePoints taille="text-[28px]" clair>Besoin d&apos;un outil sur mesure ?</TitrePoints>
              <p className="m-0 max-w-[560px] text-[15px] leading-relaxed text-su-lavande">Nous créons des modèles et des outils adaptés à votre secteur et à vos procédures.</p>
            </div>
            <Link href="/services/souscrire?service=numerique"
              className="relative inline-flex items-center gap-2 justify-self-start rounded-full bg-white px-6 py-3.5 text-[15px] font-semibold text-su-nuit transition-colors hover:bg-su-lavande">
              Demander un outil <Icone nom="fleche" taille={18} epaisseur={2} />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
