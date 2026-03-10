"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Button from "@/components/ui/Button";

const services = [
  {
    icon: "fas fa-chess",
    color: "from-blue-500 to-accent",
    title: "Conseil Stratégique",
    description:
      "Analyse de marché, business plan, stratégie de croissance, restructuration organisationnelle.",
    features: ["Diagnostic stratégique", "Business plan", "Plan de croissance", "RSE & gouvernance"],
    href: "/services#conseil",
  },
  {
    icon: "fas fa-laptop-code",
    color: "from-accent to-purple-500",
    title: "Solutions Numériques",
    description:
      "Développement web/mobile, transformation digitale, automatisation des processus, IA sur mesure.",
    features: ["Sites & applis web", "Applications mobiles", "Automatisation", "Intégration IA"],
    href: "/services#numerique",
  },
  {
    icon: "fas fa-graduation-cap",
    color: "from-secondary to-green-400",
    title: "Formation & Coaching",
    description:
      "Programmes de formation professionnelle, coaching individuel et collectif, ateliers pratiques.",
    features: ["Formations certifiantes", "Coaching dirigeants", "E-learning", "Ateliers pratiques"],
    href: "/services#formation",
  },
  {
    icon: "fas fa-bullhorn",
    color: "from-orange-400 to-accent",
    title: "Marketing Digital",
    description:
      "Stratégie de contenu, SEO/SEA, gestion des réseaux sociaux, e-réputation, campagnes publicité.",
    features: ["Stratégie contenu", "SEO & publicité", "Social media", "Email marketing"],
    href: "/services#marketing",
    isPopular: true,
  },
  {
    icon: "fas fa-scale-balanced",
    color: "from-purple-500 to-pink-500",
    title: "Juridique & Fiscal",
    description:
      "Création d'entreprise, conformité légale, optimisation fiscale, contrats et litiges.",
    features: ["Création SARL/SA", "Optimisation fiscale", "Contrats", "Conformité OHADA"],
    href: "/services#juridique",
  },
  {
    icon: "fas fa-chart-bar",
    color: "from-yellow-500 to-orange-400",
    title: "Finance & Comptabilité",
    description:
      "Gestion financière, analyse de rentabilité, levées de fonds, tableau de bord financier.",
    features: ["Plan financier", "Levée de fonds", "Comptabilité", "Audit financier"],
    href: "/services#finance",
  },
];

export default function ServicesSection() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-3xl mx-auto mb-14"
        >
          <span className="inline-flex items-center gap-2 bg-accent/10 text-accent px-4 py-2 rounded-full text-sm font-medium mb-4">
            <i className="fas fa-grid-2" />
            Nos domaines d'expertise
          </span>
          <h2 className="font-syne font-black text-3xl sm:text-4xl lg:text-5xl text-primary mb-4">
            Des solutions complètes pour{" "}
            <span className="gradient-text">votre croissance</span>
          </h2>
          <p className="text-gray-500 text-lg">
            6 domaines d'expertise couvrant tous les besoins stratégiques et numériques de votre entreprise.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-10">
          {services.map((service, i) => (
            <motion.div
              key={service.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
            >
              <Link
                href={service.href}
                className="block service-card group h-full relative overflow-hidden"
              >
                {service.isPopular && (
                  <div className="absolute top-4 right-4 bg-gradient-to-r from-accent to-secondary text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Populaire
                  </div>
                )}

                <div
                  className={`w-14 h-14 bg-gradient-to-br ${service.color} rounded-2xl flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 transition-transform duration-300`}
                >
                  <i className={`${service.icon} text-white text-2xl`} />
                </div>

                <h3 className="font-syne font-bold text-xl text-primary mb-3 group-hover:text-accent transition-colors">
                  {service.title}
                </h3>
                <p className="text-gray-500 text-sm leading-relaxed mb-4">{service.description}</p>

                <ul className="space-y-2 mb-5">
                  {service.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm text-gray-600">
                      <i className="fas fa-check text-secondary text-xs" />
                      {f}
                    </li>
                  ))}
                </ul>

                <span className="inline-flex items-center gap-1 text-accent text-sm font-semibold group-hover:gap-2 transition-all">
                  En savoir plus
                  <i className="fas fa-arrow-right text-xs" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>

        <div className="text-center">
          <Button href="/services" variant="outline" size="lg">
            Voir tous nos services & tarifs
            <i className="fas fa-arrow-right" />
          </Button>
        </div>
      </div>
    </section>
  );
}
