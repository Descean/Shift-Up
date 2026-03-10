"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const testimonials = [
  {
    name: "Kossi Adigbli",
    role: "Directeur Général",
    company: "TechBenin SARL",
    initials: "KA",
    color: "from-blue-500 to-accent",
    rating: 5,
    service: "Solutions Numériques",
    content:
      "SHIFT UP a transformé notre présence digitale en 3 mois. Leur approche structurée, leur expertise technique et leur suivi personnalisé ont dépassé toutes nos attentes. Je recommande vivement !",
  },
  {
    name: "Amina Soumaïla",
    role: "Entrepreneur",
    company: "AgroTech Bénin",
    initials: "AS",
    color: "from-secondary to-green-400",
    rating: 5,
    service: "Conseil Stratégique",
    content:
      "Grâce au business plan réalisé par SHIFT UP, j'ai pu lever 50M FCFA auprès d'investisseurs. Leur expertise en stratégie est remarquable et leur accompagnement très professionnel.",
  },
  {
    name: "Pierre Dossa",
    role: "PDG",
    company: "Groupe Dossa International",
    initials: "PD",
    color: "from-purple-500 to-accent",
    rating: 5,
    service: "Formation & Marketing",
    content:
      "Les formations délivrées par SHIFT UP ont renforcé les compétences de toute notre équipe. La qualité pédagogique et la praticité des contenus sont excellentes.",
  },
  {
    name: "Marie-Claire Adjovi",
    role: "DRH",
    company: "Palmci Bénin",
    initials: "MA",
    color: "from-orange-400 to-yellow-400",
    rating: 5,
    service: "Juridique & Fiscal",
    content:
      "SHIFT UP nous a accompagnés dans notre restructuration légale et fiscale. Compétents, réactifs et de confiance. Un partenaire stratégique indispensable pour notre entreprise.",
  },
];

export default function TestimonialsSection() {
  const [active, setActive] = useState(0);

  return (
    <section className="section-padding bg-white">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <span className="inline-flex items-center gap-2 bg-secondary/10 text-secondary px-4 py-2 rounded-full text-sm font-medium mb-4">
            <i className="fas fa-quote-left" />
            Témoignages clients
          </span>
          <h2 className="font-syne font-black text-3xl sm:text-4xl text-primary mb-4">
            Ils nous font <span className="gradient-text">confiance</span>
          </h2>
          <p className="text-gray-500">Des résultats concrets pour des clients satisfaits</p>
        </motion.div>

        <div className="grid lg:grid-cols-5 gap-8 items-start">
          {/* Selector */}
          <div className="lg:col-span-2 space-y-3">
            {testimonials.map((t, i) => (
              <motion.button
                key={i}
                whileHover={{ x: 4 }}
                onClick={() => setActive(i)}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl text-left transition-all duration-300 ${
                  active === i
                    ? "bg-primary shadow-lg"
                    : "bg-gray-50 hover:bg-gray-100"
                }`}
              >
                <div
                  className={`w-12 h-12 bg-gradient-to-br ${t.color} rounded-xl flex items-center justify-center flex-shrink-0 text-white font-bold`}
                >
                  {t.initials}
                </div>
                <div>
                  <p className={`font-semibold text-sm ${active === i ? "text-white" : "text-primary"}`}>
                    {t.name}
                  </p>
                  <p className={`text-xs ${active === i ? "text-white/60" : "text-gray-400"}`}>
                    {t.role} — {t.company}
                  </p>
                </div>
              </motion.button>
            ))}
          </div>

          {/* Active testimonial */}
          <div className="lg:col-span-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={active}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.4 }}
                className="bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-8 relative overflow-hidden"
              >
                {/* Background quote */}
                <div className="absolute top-4 right-6 text-white/5 text-9xl font-serif leading-none">"</div>

                {/* Rating */}
                <div className="flex gap-1 mb-6">
                  {Array.from({ length: testimonials[active].rating }).map((_, i) => (
                    <i key={i} className="fas fa-star text-secondary text-sm" />
                  ))}
                </div>

                {/* Quote */}
                <blockquote className="text-white/90 text-lg leading-relaxed mb-8 italic relative z-10">
                  "{testimonials[active].content}"
                </blockquote>

                {/* Author */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div
                      className={`w-14 h-14 bg-gradient-to-br ${testimonials[active].color} rounded-2xl flex items-center justify-center text-white font-bold text-lg shadow-glow`}
                    >
                      {testimonials[active].initials}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{testimonials[active].name}</p>
                      <p className="text-white/50 text-sm">{testimonials[active].role}</p>
                      <p className="text-accent text-sm font-medium">{testimonials[active].company}</p>
                    </div>
                  </div>
                  <span className="bg-accent/20 text-accent px-3 py-1.5 rounded-full text-xs font-semibold">
                    {testimonials[active].service}
                  </span>
                </div>

                {/* Navigation dots */}
                <div className="flex gap-2 mt-6">
                  {testimonials.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActive(i)}
                      className={`h-1.5 rounded-full transition-all duration-300 ${
                        active === i ? "bg-accent w-6" : "bg-white/20 w-1.5"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  );
}
