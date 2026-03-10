"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Metadata } from "next";

const categories = ["Tous", "Services", "Paiement", "Affiliation", "Compte", "Général"];

const faqs = [
  {
    category: "Services",
    question: "Quels types d'entreprises accompagnez-vous ?",
    answer:
      "SHIFT UP accompagne tout type de structure : TPE, PME, startups, grandes entreprises, ONG, et entrepreneurs individuels. Nos solutions sont adaptables à toutes les tailles et tous les secteurs d'activité.",
  },
  {
    category: "Services",
    question: "Comment se déroule une première consultation ?",
    answer:
      "Votre premier RDV de diagnostic est offert. Lors de cette session (60-90 min), nous écoutons vos besoins, analysons votre situation et vous proposons des pistes de solutions. Aucun engagement requis.",
  },
  {
    category: "Paiement",
    question: "Quels sont les modes de paiement acceptés ?",
    answer:
      "Nous acceptons : MTN Mobile Money, Moov Money (via FedaPay), ainsi que les cartes bancaires Visa/Mastercard (via Stripe) pour les paiements internationaux.",
  },
  {
    category: "Paiement",
    question: "Quel est le système d'acompte ?",
    answer:
      "Un acompte de 40% est requis à la souscription pour démarrer la mission. Le solde de 60% est réglé à la livraison finale du service. Une facture officielle (avec IFU et RCCM) est émise automatiquement.",
  },
  {
    category: "Paiement",
    question: "Puis-je obtenir une facture officielle ?",
    answer:
      "Oui. Chaque transaction génère automatiquement une facture PDF officielle incluant notre IFU (0202113434116) et RCCM (RB/ABC/25 A 124734), conforme aux exigences fiscales béninoises.",
  },
  {
    category: "Affiliation",
    question: "Comment fonctionne le programme d'affiliation ?",
    answer:
      "Chaque client inscrit reçoit un code d'affiliation unique. Lorsqu'un nouveau client s'inscrit avec votre code, vous gagnez une commission sur ses achats. Les gains sont versés annuellement le 25 décembre.",
  },
  {
    category: "Affiliation",
    question: "Quels sont les avantages du système d'étoiles ?",
    answer:
      "Il y a 5 niveaux (Bronze → Argent → Or → Platine → Diamant) avec des avantages cumulatifs : réductions sur les services, accès prioritaire, contenus exclusifs et bonus de fidélité.",
  },
  {
    category: "Compte",
    question: "Quels profils d'utilisateurs existent sur la plateforme ?",
    answer:
      "Quatre profils : Client (accès aux prestations et suivi), Apporteur d'affaires (IFU requis, commissions), Étudiant (ressources éducatives, micro-tâches rémunérées), et Admin (équipe SHIFT UP).",
  },
  {
    category: "Compte",
    question: "Mon dashboard s'adapte-t-il à mon type de prestation ?",
    answer:
      "Oui ! Grâce à l'intelligence artificielle (API Claude), votre espace client génère dynamiquement les phases et étapes de votre prestation en cours, avec un graphique de progression en temps réel.",
  },
  {
    category: "Général",
    question: "SHIFT UP opère-t-il en dehors du Bénin ?",
    answer:
      "Notre siège est à Abomey-Calavi, mais nous accompagnons des clients dans toute l'Afrique de l'Ouest. Les prestations de conseil et numériques peuvent être réalisées à distance.",
  },
  {
    category: "Général",
    question: "Les données clients sont-elles sécurisées ?",
    answer:
      "Absolument. Nous utilisons le chiffrement AES-256, des connexions HTTPS, des tokens JWT sécurisés, et des sauvegardes quotidiennes. Nous sommes conformes au RGPD et aux recommandations CNIL.",
  },
];

function FAQItem({ question, answer, isOpen, onToggle }: {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between gap-4 p-6 text-left hover:bg-gray-50 transition-colors"
      >
        <span className="font-semibold text-primary text-sm sm:text-base">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 45 : 0 }}
          transition={{ duration: 0.2 }}
          className="w-8 h-8 bg-accent/10 rounded-lg flex items-center justify-center flex-shrink-0"
        >
          <i className="fas fa-plus text-accent text-sm" />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 text-gray-500 text-sm leading-relaxed border-t border-gray-100 pt-4">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function FAQPage() {
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [openItem, setOpenItem] = useState<number | null>(0);

  const filtered = activeCategory === "Tous"
    ? faqs
    : faqs.filter((f) => f.category === activeCategory);

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10 text-center max-w-2xl mx-auto">
          <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
            <i className="fas fa-circle-question" />
            Foire aux questions
          </span>
          <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4">
            Toutes vos <span className="gradient-text">réponses ici</span>
          </h1>
          <p className="text-white/60 text-xl">
            Vous ne trouvez pas votre réponse ? Notre chatbot IA est disponible 24/7 en bas à droite.
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-custom max-w-3xl">
          {/* Category filter */}
          <div className="flex gap-2 flex-wrap mb-8">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setOpenItem(null); }}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${
                  activeCategory === cat
                    ? "bg-primary text-white shadow-md"
                    : "bg-white text-gray-500 hover:text-primary border border-gray-100"
                }`}
              >
                {cat}
                <span className="ml-2 text-xs opacity-60">
                  ({cat === "Tous" ? faqs.length : faqs.filter((f) => f.category === cat).length})
                </span>
              </button>
            ))}
          </div>

          {/* FAQ list */}
          <div className="space-y-3">
            {filtered.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <FAQItem
                  question={faq.question}
                  answer={faq.answer}
                  isOpen={openItem === i}
                  onToggle={() => setOpenItem(openItem === i ? null : i)}
                />
              </motion.div>
            ))}
          </div>

          {/* Still have questions */}
          <div className="mt-12 bg-primary rounded-3xl p-8 text-center">
            <i className="fas fa-comment-dots text-accent text-3xl mb-4 block" />
            <h3 className="font-syne font-bold text-xl text-white mb-2">
              Vous avez d'autres questions ?
            </h3>
            <p className="text-white/50 mb-6 text-sm">
              Notre chatbot IA répond instantanément, ou contactez-nous directement.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a
                href="mailto:shiftup.eudes@gmail.com"
                className="flex items-center gap-2 bg-accent hover:bg-accent/90 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <i className="fas fa-envelope" />
                Email direct
              </a>
              <a
                href="https://wa.me/22901950350999"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
              >
                <i className="fab fa-whatsapp" />
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
