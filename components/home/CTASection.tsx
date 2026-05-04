import Link from "next/link";

export default function CTASection() {
  return (
    <section className="bg-primary py-24 relative overflow-hidden">
      {/* Subtle mesh */}
      <div className="absolute inset-0 bg-mesh-gradient opacity-30 pointer-events-none" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/8 rounded-full blur-3xl pointer-events-none" />

      <div className="container-custom relative z-10 text-center">
        {/* Serif headline */}
        <h2
          className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight mb-6 max-w-3xl mx-auto"
          style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
        >
          Prêt à propulser votre entreprise vers{" "}
          <em style={{ color: "#1E9FD4" }}>de nouveaux sommets ?</em>
        </h2>

        <p className="text-white/50 text-lg max-w-xl mx-auto mb-10">
          Rejoignez plus de 120 entreprises qui font confiance à SHIFT UP.
          Premier rendez-vous de diagnostic offert.
        </p>

        {/* CTAs */}
        <div className="flex flex-wrap gap-4 justify-center mb-12">
          <Link
            href="/inscription"
            className="inline-flex items-center gap-2 bg-white text-primary px-8 py-4 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors duration-200 shadow-lg"
          >
            <i className="fas fa-user-plus text-xs" />
            S'inscrire gratuitement
          </Link>
          <Link
            href="/contact"
            className="inline-flex items-center gap-2 border border-white/25 text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-white/8 transition-colors duration-200"
          >
            <i className="fas fa-calendar-alt text-xs" />
            RDV diagnostic gratuit
          </Link>
        </div>

        {/* Reassurance icons */}
        <div className="flex flex-wrap justify-center gap-8">
          {[
            { icon: "fas fa-lock", label: "Données sécurisées" },
            { icon: "fas fa-credit-card", label: "Paiement sécurisé" },
            { icon: "fas fa-headset", label: "Support 7j/7" },
            { icon: "fas fa-undo-alt", label: "Satisfaction garantie" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 text-white/30 text-sm">
              <i className={`${item.icon} text-secondary/70`} />
              {item.label}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
