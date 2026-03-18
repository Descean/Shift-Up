"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FAQ = { id: number; category: string; question: string; answer: string };

const ALL_CATEGORIES = ["Tous", "Services", "Paiement", "Affiliation", "Compte", "Général"];

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
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Tous");
  const [openItem, setOpenItem] = useState<number | null>(0);

  useEffect(() => {
    fetch("/api/faq")
      .then((r) => r.json())
      .then((data) => setFaqs(data.faqs ?? []))
      .finally(() => setLoading(false));
  }, []);

  const categories = ALL_CATEGORIES.filter(
    (cat) => cat === "Tous" || faqs.some((f) => f.category === cat)
  );

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
          {loading ? (
            <div className="flex justify-center py-16">
              <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
          <div className="space-y-3">
            {filtered.length === 0 && (
              <p className="text-center text-gray-400 py-10">Aucune question dans cette catégorie.</p>
            )}
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
          )}

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
