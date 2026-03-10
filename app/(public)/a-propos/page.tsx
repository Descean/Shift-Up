import { motion } from "framer-motion";
import type { Metadata } from "next";
import Button from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "À propos | SHIFT UP",
  description: "Découvrez SHIFT UP, cabinet de conseil stratégique et solutions numériques fondé à Abomey-Calavi, Bénin.",
};

const values = [
  { icon: "fas fa-star", title: "Excellence", description: "Nous visons l'excellence dans chaque mission, chaque livrable, chaque interaction." },
  { icon: "fas fa-lightbulb", title: "Innovation", description: "Nous intégrons les meilleures pratiques mondiales adaptées au contexte africain." },
  { icon: "fas fa-chart-line", title: "Performance", description: "Nos solutions sont orientées résultats mesurables et retour sur investissement." },
  { icon: "fas fa-handshake", title: "Intégrité", description: "Transparence, honnêteté et éthique professionnelle dans toutes nos relations." },
  { icon: "fas fa-users", title: "Collaboration", description: "Nous construisons des partenariats durables fondés sur la confiance mutuelle." },
  { icon: "fas fa-globe-africa", title: "Impact Local", description: "Contribuer au développement économique du Bénin et de l'Afrique de l'Ouest." },
];

const phases = [
  {
    num: "01",
    title: "Écoute & Diagnostic",
    description: "Nous prenons le temps de comprendre votre réalité, vos enjeux et vos objectifs avant toute recommandation.",
    icon: "fas fa-ear-listen",
  },
  {
    num: "02",
    title: "Analyse & Stratégie",
    description: "Analyse approfondie de votre contexte, définition d'une stratégie sur mesure avec des objectifs clairs.",
    icon: "fas fa-magnifying-glass-chart",
  },
  {
    num: "03",
    title: "Déploiement",
    description: "Mise en œuvre rigoureuse avec un suivi rapproché, des jalons définis et une communication transparente.",
    icon: "fas fa-rocket",
  },
  {
    num: "04",
    title: "Mesure & Optimisation",
    description: "Analyse des résultats, ajustements continus et partage des enseignements pour maximiser l'impact.",
    icon: "fas fa-chart-mixed",
  },
];

export default function AProposPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
                <i className="fas fa-building" />
                Notre histoire
              </span>
              <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-6 leading-tight">
                Transforming Business,{" "}
                <span className="gradient-text">Shaping Future</span>
              </h1>
              <p className="text-white/70 text-lg leading-relaxed mb-8">
                SHIFT UP est né d'une conviction : les entreprises béninoises et africaines méritent
                un accompagnement de classe mondiale. Fondé par Jean-Eudes MÈTOGBÉ GNANCADJA, notre
                cabinet combine expertise stratégique et maîtrise des technologies pour propulser
                votre croissance.
              </p>
              <div className="flex flex-wrap gap-4">
                <Button href="/services" variant="gradient" size="md">
                  Nos services
                  <i className="fas fa-arrow-right" />
                </Button>
                <Button href="/contact" variant="outline" size="md" className="border-white/30 text-white hover:bg-white hover:text-primary">
                  Nous contacter
                </Button>
              </div>
            </div>

            {/* Info card */}
            <div className="glass-card p-8 rounded-3xl">
              <h3 className="font-syne font-bold text-white text-xl mb-6">Informations légales</h3>
              <div className="space-y-4">
                {[
                  { icon: "fas fa-building-columns", label: "Raison sociale", value: "SHIFT UP" },
                  { icon: "fas fa-user-tie", label: "Dirigeant", value: "Jean-Eudes MÈTOGBÉ GNANCADJA" },
                  { icon: "fas fa-id-card", label: "RCCM", value: "RB/ABC/25 A 124734" },
                  { icon: "fas fa-receipt", label: "IFU", value: "0202113434116" },
                  { icon: "fas fa-map-marker-alt", label: "Siège social", value: "Abomey-Calavi, Atlantique, Bénin" },
                  { icon: "fas fa-calendar", label: "Immatriculation", value: "30 mai 2025" },
                ].map((item) => (
                  <div key={item.label} className="flex items-start gap-4">
                    <div className="w-9 h-9 bg-accent/15 rounded-lg flex items-center justify-center flex-shrink-0">
                      <i className={`${item.icon} text-accent text-sm`} />
                    </div>
                    <div>
                      <p className="text-white/40 text-xs">{item.label}</p>
                      <p className="text-white text-sm font-medium">{item.value}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Vision & Mission */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-8">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-5">
                <i className="fas fa-eye text-accent text-xl" />
              </div>
              <h3 className="font-syne font-bold text-2xl text-white mb-4">Notre Vision</h3>
              <p className="text-white/70 leading-relaxed">
                Devenir le cabinet de référence en Afrique de l'Ouest pour l'accompagnement des
                entreprises dans leur transformation stratégique et digitale, contribuant ainsi à
                l'émergence économique du Bénin.
              </p>
            </div>
            <div className="bg-gradient-to-br from-accent/10 to-secondary/5 rounded-3xl p-8 border border-accent/20">
              <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center mb-5">
                <i className="fas fa-bullseye text-accent text-xl" />
              </div>
              <h3 className="font-syne font-bold text-2xl text-primary mb-4">Notre Mission</h3>
              <p className="text-gray-600 leading-relaxed">
                Fournir des services de conseil et solutions numériques d'excellence, accessibles
                aux entreprises de toutes tailles, avec un focus sur la création de valeur mesurable
                et durable pour nos clients.
              </p>
            </div>
          </div>

          {/* Values */}
          <div className="text-center mb-10">
            <h2 className="font-syne font-black text-3xl sm:text-4xl text-primary mb-4">
              Nos <span className="gradient-text">valeurs fondatrices</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {values.map((v, i) => (
              <div key={v.title} className="flex gap-4 p-6 bg-gray-50 rounded-2xl hover:bg-white hover:shadow-card transition-all duration-300">
                <div className="w-12 h-12 bg-gradient-to-br from-accent to-secondary rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className={`${v.icon} text-white`} />
                </div>
                <div>
                  <h4 className="font-syne font-bold text-primary mb-1">{v.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{v.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Methodology */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-syne font-black text-3xl sm:text-4xl text-primary mb-4">
              Notre <span className="gradient-text">méthodologie en 4 phases</span>
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto">
              Une approche structurée, éprouvée et centrée sur vos résultats.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {phases.map((phase, i) => (
              <div key={phase.num} className="relative">
                {i < phases.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-full w-full h-px bg-gradient-to-r from-accent/40 to-transparent z-10" />
                )}
                <div className="bg-white rounded-2xl p-6 shadow-card text-center">
                  <div className="font-syne font-black text-5xl text-accent/10 mb-3">{phase.num}</div>
                  <div className="w-14 h-14 bg-gradient-to-br from-accent to-secondary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-glow">
                    <i className={`${phase.icon} text-white text-xl`} />
                  </div>
                  <h4 className="font-syne font-bold text-primary text-lg mb-3">{phase.title}</h4>
                  <p className="text-gray-500 text-sm leading-relaxed">{phase.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="text-center mb-12">
            <h2 className="font-syne font-black text-3xl sm:text-4xl text-primary mb-4">
              L'équipe <span className="gradient-text">SHIFT UP</span>
            </h2>
          </div>
          <div className="max-w-sm mx-auto">
            <div className="bg-gradient-to-br from-primary to-primary/90 rounded-3xl p-8 text-center">
              <div className="w-24 h-24 bg-gradient-to-br from-accent to-secondary rounded-3xl flex items-center justify-center mx-auto mb-5 shadow-glow text-white font-syne font-black text-3xl">
                JE
              </div>
              <h3 className="font-syne font-bold text-2xl text-white mb-1">Jean-Eudes MÈTOGBÉ GNANCADJA</h3>
              <p className="text-accent mb-4">Fondateur & Directeur Général</p>
              <p className="text-white/60 text-sm leading-relaxed mb-6">
                Entrepreneur passionné et expert en conseil stratégique, Jean-Eudes a fondé SHIFT UP
                avec l'ambition de transformer le paysage entrepreneurial béninois.
              </p>
              <div className="flex justify-center gap-3">
                <a href="#" className="w-9 h-9 bg-white/10 hover:bg-accent rounded-lg flex items-center justify-center transition-all">
                  <i className="fab fa-linkedin-in text-white text-sm" />
                </a>
                <a href="mailto:shiftup.eudes@gmail.com" className="w-9 h-9 bg-white/10 hover:bg-accent rounded-lg flex items-center justify-center transition-all">
                  <i className="fas fa-envelope text-white text-sm" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
