import Link from "next/link";

export default function Hero() {
  return (
    <section className="bg-paper min-h-screen flex items-center relative overflow-hidden">
      {/* Subtle grid texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            "linear-gradient(#0A2533 1px, transparent 1px), linear-gradient(90deg, #0A2533 1px, transparent 1px)",
          backgroundSize: "80px 80px",
        }}
      />

      {/* Subtle accent glow top-right */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />

      <div className="container-custom relative z-10 pt-32 pb-20 w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Serif headline */}
          <h1
            className="text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold leading-[1.05] text-primary mb-8"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Transformez votre{" "}
            <em
              className="not-italic"
              style={{ color: "#2D5B78", fontStyle: "italic" }}
            >
              vision
            </em>{" "}
            en succès réel
          </h1>

          {/* Subtitle */}
          <p className="text-primary/65 text-lg sm:text-xl leading-relaxed mb-10 max-w-2xl mx-auto font-grotesk">
            SHIFT UP accompagne entreprises et entrepreneurs dans leur
            transformation stratégique et digitale. Conseil expert, solutions
            sur mesure, résultats mesurables.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4 justify-center mb-16">
            <Link
              href="/services"
              className="inline-flex items-center gap-2 bg-accent text-white px-8 py-4 rounded-full text-sm font-semibold hover:bg-accent/90 transition-colors duration-200 shadow-glow"
            >
              Découvrir nos services
              <i className="fas fa-arrow-right text-xs" />
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 border border-primary/20 text-primary px-8 py-4 rounded-full text-sm font-semibold hover:bg-primary hover:text-white transition-colors duration-200"
            >
              <i className="fas fa-calendar-alt text-xs" />
              Prendre RDV
            </Link>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-primary/65">
            {[
              { icon: "fas fa-shield-check", label: "RCCM Officiel" },
              { icon: "fas fa-star", label: "4.9 / 5 satisfaction" },
              { icon: "fas fa-bolt", label: "Résultats rapides" },
            ].map((b) => (
              <div key={b.label} className="flex items-center gap-2">
                <i className={`${b.icon} text-accent/70`} />
                <span>{b.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-paper to-transparent pointer-events-none" />
    </section>
  );
}
