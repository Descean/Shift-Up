const testimonials = [
  {
    name: "Kossi Adigbli",
    role: "Directeur Général — TechBenin SARL",
    content:
      "SHIFT UP a transformé notre présence digitale en 3 mois. Leur approche structurée, leur expertise technique et leur suivi personnalisé ont dépassé toutes nos attentes.",
  },
  {
    name: "Amina Soumaïla",
    role: "Entrepreneur — AgroTech Bénin",
    content:
      "Grâce au business plan réalisé par SHIFT UP, j'ai pu lever 50M FCFA auprès d'investisseurs. Leur expertise en stratégie est remarquable.",
  },
  {
    name: "Pierre Dossa",
    role: "PDG — Groupe Dossa International",
    content:
      "Les formations délivrées par SHIFT UP ont renforcé les compétences de toute notre équipe. La qualité pédagogique et la praticité des contenus sont excellentes.",
  },
];

const legalInfo = [
  { label: "Dénomination", value: "SHIFT UP" },
  { label: "Forme juridique", value: "SARL" },
  { label: "RCCM", value: "RB/ABC/24 B 3021" },
  { label: "IFU", value: "3202412001792" },
  { label: "Siège social", value: "Abomey-Calavi, Bénin" },
  { label: "Téléphone", value: "+229 01 95 03 50 99" },
  { label: "Email", value: "contact@shiftup.bj" },
];

export default function TestimonialsSection() {
  const featured = testimonials[0];

  return (
    <section className="bg-white border-y border-primary/10 py-20">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          {/* Left — featured testimonial + list */}
          <div>
            <span className="text-accent text-sm font-semibold uppercase tracking-widest block mb-8">
              Ils nous font confiance
            </span>

            {/* Featured blockquote */}
            <blockquote className="mb-8">
              <p
                className="text-3xl sm:text-4xl font-bold text-primary leading-snug mb-6"
                style={{
                  fontFamily: "var(--font-cormorant), Georgia, serif",
                  fontStyle: "italic",
                }}
              >
                &ldquo;{featured.content}&rdquo;
              </p>
              <footer>
                <div className="flex items-center gap-1 mb-1">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <i key={i} className="fas fa-star text-secondary text-xs" />
                  ))}
                </div>
                <cite className="not-italic text-sm text-primary/65 font-medium">
                  {featured.name} — {featured.role}
                </cite>
              </footer>
            </blockquote>

            {/* Mini testimonials list */}
            <div className="space-y-4 border-t border-primary/10 pt-8">
              {testimonials.slice(1).map((t) => (
                <div
                  key={t.name}
                  className="flex gap-4 items-start pb-4 border-b border-primary/5 last:border-0"
                >
                  <div className="w-8 h-8 bg-accent/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-accent text-xs font-bold">
                      {t.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <p className="text-primary/70 text-sm italic leading-relaxed">
                      &ldquo;{t.content.slice(0, 90)}…&rdquo;
                    </p>
                    <p className="text-primary/65 text-xs mt-1">{t.name} — {t.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right — legal & company info */}
          <div className="lg:pt-12">
            <div className="bg-paper border border-primary/8 rounded-2xl p-8">
              <p className="text-xs font-semibold text-primary/30 uppercase tracking-widest mb-6">
                Informations légales
              </p>
              <table className="w-full text-sm">
                <tbody>
                  {legalInfo.map((row) => (
                    <tr
                      key={row.label}
                      className="border-b border-primary/6 last:border-0"
                    >
                      <td className="py-3 pr-4 text-primary/65 font-medium w-2/5">
                        {row.label}
                      </td>
                      <td className="py-3 text-primary font-semibold">
                        {row.value}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Reassurance */}
              <div className="mt-8 pt-6 border-t border-primary/8 space-y-3">
                {[
                  { icon: "fas fa-shield-check", text: "Entreprise enregistrée & conforme OHADA" },
                  { icon: "fas fa-medal", text: "Excellence — Innovation — Performance" },
                  { icon: "fas fa-handshake", text: "Partenaire de confiance depuis 2024" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-primary/65">
                    <i className={`${item.icon} text-accent text-xs w-4`} />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
