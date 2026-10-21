import Link from "next/link";

const services = [
  {
    num: "01",
    title: "Conseil Stratégique",
    description:
      "Analyse de marché, business plan, stratégie de croissance et restructuration organisationnelle.",
    href: "/services#conseil",
  },
  {
    num: "02",
    title: "Solutions Numériques",
    description:
      "Développement web & mobile, transformation digitale, automatisation des processus.",
    href: "/services#numerique",
  },
  {
    num: "03",
    title: "Formation & Coaching",
    description:
      "Programmes certifiants, coaching dirigeants, ateliers pratiques et e-learning.",
    href: "/services#formation",
  },
  {
    num: "04",
    title: "Montage de Dossiers",
    description:
      "Financement bancaire, appels d'offres, création d'entreprise et subventions.",
    href: "/services#dossiers",
  },
  {
    num: "05",
    title: "Marketing Digital",
    description:
      "Stratégie de contenu, SEO/SEA, gestion des réseaux sociaux et e-réputation.",
    href: "/services#marketing",
  },
  {
    num: "06",
    title: "Juridique & Fiscal",
    description:
      "Création d'entreprise, conformité OHADA, optimisation fiscale et contrats.",
    href: "/services#juridique",
  },
  {
    num: "07",
    title: "Finance & Comptabilité",
    description:
      "Gestion financière, analyse de rentabilité, levées de fonds et audit.",
    href: "/services#finance",
  },
];

export default function ServicesSection() {
  return (
    <section className="bg-paper py-20">
      <div className="container-custom">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <span className="text-accent text-sm font-semibold uppercase tracking-widest block mb-4">
            Nos domaines d'expertise
          </span>
          <h2
            className="text-4xl sm:text-5xl font-bold text-primary leading-tight"
            style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
          >
            Des solutions complètes pour{" "}
            <em style={{ color: "#2D5B78" }}>votre croissance</em>
          </h2>
        </div>

        {/* Grid with gap-px border technique */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-primary/8">
          {services.map((s) => (
            <Link
              key={s.num}
              href={s.href}
              className="group bg-paper hover:bg-accent/[0.04] p-8 flex flex-col gap-4 transition-colors duration-200"
            >
              <span
                className="text-3xl font-bold text-primary/15 group-hover:text-accent/40 transition-colors duration-200"
                style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
              >
                {s.num}
              </span>
              <h3 className="font-syne font-bold text-lg text-primary group-hover:text-accent transition-colors duration-200">
                {s.title}
              </h3>
              <p className="text-primary/65 text-sm leading-relaxed flex-1">
                {s.description}
              </p>
              <span className="inline-flex items-center gap-1.5 text-accent text-xs font-semibold opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all duration-200">
                En savoir plus
                <i className="fas fa-arrow-right" />
              </span>
            </Link>
          ))}

          {/* CTA card — 8th cell */}
          <Link
            href="/services"
            className="group bg-primary hover:bg-primary/90 p-8 flex flex-col justify-between transition-colors duration-200"
          >
            <p
              className="text-white/70 text-2xl font-bold leading-snug"
              style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}
            >
              Voir tous les services & tarifs
            </p>
            <div className="flex items-center gap-2 text-accent-200 text-sm font-semibold mt-6">
              Explorer
              <i className="fas fa-arrow-right text-xs group-hover:translate-x-1 transition-transform duration-200" />
            </div>
          </Link>
        </div>
      </div>
    </section>
  );
}
