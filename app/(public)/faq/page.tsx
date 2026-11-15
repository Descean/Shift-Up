"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BandeauTitre, Puce, TitrePoints, titreFont } from "@/components/site/Gabarit";
import { Icone } from "@/components/home/icones";
import { ENTREPRISE } from "@/lib/entreprise";

type FAQ = { id: number; category: string; question: string; answer: string };

const ALL_CATEGORIES = ["Tous", "Services", "Paiement", "Affiliation", "Compte", "Général"];

/** Questions affichées tant qu'aucune question n'est publiée dans l'admin (table FAQ vide). */
const FAQ_DEFAUT: FAQ[] = [
  { id: -1, category: "Services", question: "Combien de temps faut-il pour monter un dossier d'appel d'offres ?", answer: "En général 3 à 7 jours selon le volume du dossier et la date limite de dépôt. Plus vous nous contactez tôt, plus nous avons de temps pour vérifier chaque pièce." },
  { id: -2, category: "Services", question: "Combien coûte un dossier de soumission ?", answer: "La réponse à un appel d'offres démarre à 100 000 XOF. Le prix final dépend du nombre de lots et des pièces à produire ; il figure dans le devis, validé avant tout démarrage." },
  { id: -3, category: "Paiement", question: "Comment se passe le paiement ?", answer: "Par Mobile Money. Un acompte est demandé à la validation du devis ; le reste suit les modalités indiquées dans le devis." },
  { id: -4, category: "Général", question: "Mes documents restent-ils confidentiels ?", answer: "Oui. Les pièces sont déposées dans votre espace client privé, accessible seulement à votre équipe et à la nôtre." },
  { id: -5, category: "Compte", question: "Puis-je suivre l'avancement de mon dossier ?", answer: "Oui, depuis votre espace client : étapes, pièces manquantes, messages et livrables à télécharger." },
  { id: -6, category: "Général", question: "Travaillez-vous en dehors d'Abomey-Calavi ?", answer: "Oui, nous intervenons dans tout le Bénin. La plupart des échanges se font en ligne et par WhatsApp." },
];

function FAQItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className={`overflow-hidden rounded-2xl border bg-white ${isOpen ? "border-su-bleu" : "border-su-lavande"}`}>
      <button onClick={onToggle} aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left">
        <span className={`${titreFont} text-base font-bold text-su-nuit sm:text-[17px]`}>{question}</span>
        <span className={`flex h-8 w-8 flex-none items-center justify-center rounded-full ${isOpen ? "bg-su-bleu text-white" : "bg-su-brume text-su-bleu"}`}>
          <Icone nom={isOpen ? "moins" : "plus"} taille={18} epaisseur={2} />
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }} className="overflow-hidden">
            <p className="m-0 px-6 pb-[22px] text-[15px] leading-[1.65] text-[#4B5563]">{answer}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [openItem, setOpenItem] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((data) => setFaqs(data.faqs?.length ? data.faqs : FAQ_DEFAUT))
      .catch(() => setFaqs(FAQ_DEFAUT))
      .finally(() => setLoading(false));
  }, []);

  const categories = ALL_CATEGORIES.filter((cat) => cat === "Tous" || faqs.some((f) => f.category === cat));
  const filtered = activeCategory === "Tous" ? faqs : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen">
      <BandeauTitre titre="Vos questions," accent="nos réponses."
        texte="Délais, tarifs, paiement, suivi de dossier : l'essentiel est ici. Pour le reste, l'assistant en bas à droite répond à toute heure.">
        <div className="flex flex-wrap gap-2.5">
          {categories.map((cat) => (
            <Puce key={cat} actif={activeCategory === cat} onClick={() => { setActiveCategory(cat); setOpenItem(null); }}>
              {cat === "Tous" ? "Toutes" : cat}
            </Puce>
          ))}
        </div>
      </BandeauTitre>

      <section className="bg-white pb-24 pt-16">
        <div className="mx-auto grid max-w-[1200px] items-start gap-10 px-6 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="flex flex-col gap-3">
            {loading ? (
              <div className="flex justify-center py-16"><span className="h-8 w-8 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" /></div>
            ) : filtered.length === 0 ? (
              <p className="py-10 text-center text-[#4B5563]">Aucune question dans cette catégorie.</p>
            ) : (
              filtered.map((faq, i) => (
                <FAQItem key={faq.id ?? i} question={faq.question} answer={faq.answer}
                  isOpen={openItem === i} onToggle={() => setOpenItem(openItem === i ? null : i)} />
              ))
            )}
          </div>

          <aside className="flex flex-col gap-4 rounded-[20px] bg-su-nuit p-[30px] text-white lg:sticky lg:top-28">
            <TitrePoints taille="text-[22px]" clair>Une autre question ?</TitrePoints>
            <p className="m-0 text-[15px] leading-relaxed text-su-lavande">Écrivez-nous, nous répondons sous 48 heures ouvrées.</p>
            <a href={`mailto:${ENTREPRISE.email}`} className="flex items-center gap-2.5 rounded-xl bg-white px-[18px] py-[13px] text-[15px] font-semibold text-su-nuit">
              <Icone nom="mail" taille={20} />{ENTREPRISE.email}
            </a>
            <a href={`https://wa.me/${ENTREPRISE.telephoneLien.replace("+", "")}`} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2.5 rounded-xl bg-su-bleu px-[18px] py-[13px] text-[15px] font-semibold text-white hover:bg-su-cadet">
              <Icone nom="whatsapp" taille={20} />WhatsApp
            </a>
          </aside>
        </div>
      </section>
    </div>
  );
}
