"use client";

import { motion } from "framer-motion";
import Button from "@/components/ui/Button";

export default function CTASection() {
  return (
    <section className="section-padding bg-gray-50">
      <div className="container-custom">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative bg-primary rounded-3xl overflow-hidden p-8 sm:p-12 lg:p-16 text-center"
        >
          {/* BG elements */}
          <div className="absolute inset-0 bg-mesh-gradient opacity-40" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-72 h-72 bg-secondary/10 rounded-full blur-3xl" />

          <div className="relative z-10">
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-accent/20 border border-accent/30 text-accent px-5 py-2 rounded-full text-sm font-medium mb-6"
            >
              <i className="fas fa-rocket" />
              Commencez votre transformation dès aujourd'hui
            </motion.div>

            <h2 className="font-syne font-black text-3xl sm:text-4xl lg:text-5xl text-white mb-5 max-w-3xl mx-auto leading-tight">
              Prêt à propulser votre entreprise vers{" "}
              <span className="gradient-text">de nouveaux sommets ?</span>
            </h2>
            <p className="text-white/60 text-lg max-w-2xl mx-auto mb-10">
              Rejoignez plus de 120 entreprises et entrepreneurs qui font confiance à SHIFT UP pour leur
              croissance. Premier RDV de diagnostic offert.
            </p>

            <div className="flex flex-wrap gap-4 justify-center mb-10">
              <Button href="/inscription" variant="gradient" size="xl">
                <i className="fas fa-user-plus" />
                S'inscrire gratuitement
              </Button>
              <Button href="/contact" variant="white" size="xl">
                <i className="fas fa-calendar-alt" />
                RDV diagnostic gratuit
              </Button>
            </div>

            {/* Trust elements */}
            <div className="flex flex-wrap justify-center gap-8">
              {[
                { icon: "fas fa-lock", label: "Données sécurisées" },
                { icon: "fas fa-credit-card", label: "Paiement sécurisé" },
                { icon: "fas fa-headset", label: "Support 7j/7" },
                { icon: "fas fa-undo-alt", label: "Satisfaction garantie" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-white/40">
                  <i className={`${item.icon} text-secondary`} />
                  <span className="text-sm">{item.label}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
