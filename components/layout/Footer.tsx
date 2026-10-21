import Link from "next/link";
import Image from "next/image";
import NewsletterForm from "./NewsletterForm";

const services = [
  "Conseil Stratégique",
  "Solutions Numériques",
  "Formation & Coaching",
  "Marketing Digital",
  "Juridique & Fiscal",
  "Finance & Comptabilité",
];

const quickLinks = [
  { href: "/a-propos", label: "À propos" },
  { href: "/services", label: "Nos services" },
  { href: "/blog", label: "Blog & Ressources" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
  { href: "/inscription", label: "S'inscrire" },
];

const legalLinks = [
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/confidentialite", label: "Politique de confidentialité" },
  { href: "/cgv", label: "CGV" },
  { href: "/cookies", label: "Cookies" },
];

export default function Footer() {
  return (
    <footer className="bg-primary text-white">
      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
                <Image
                  src="/assets/logo-icon.png"
                  alt="SHIFT UP"
                  width={48}
                  height={48}
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div>
                <p className="text-white font-syne font-bold text-2xl leading-none">SHIFT UP</p>
                <p className="text-accent-300 text-[10px] tracking-widest uppercase">Transforming Business</p>
              </div>
            </div>
            <p className="text-white/60 text-sm leading-relaxed mb-6">
              Cabinet de conseil stratégique et solutions numériques. Nous accompagnons les entreprises et
              entrepreneurs dans leur transformation et croissance.
            </p>
            <div className="flex items-center gap-3">
              <span className="text-white/40 text-xs font-syne uppercase tracking-widest">Excellence</span>
              <span className="text-accent-300">•</span>
              <span className="text-white/40 text-xs font-syne uppercase tracking-widest">Innovation</span>
              <span className="text-secondary-300">•</span>
              <span className="text-white/40 text-xs font-syne uppercase tracking-widest">Performance</span>
            </div>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-syne font-bold text-lg mb-5">Nos Services</h4>
            <ul className="space-y-3">
              {services.map((s) => (
                <li key={s}>
                  <Link
                    href="/services"
                    className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                  >
                    <i className="fas fa-chevron-right text-xs text-accent/0 group-hover:text-white transition-all duration-200" />
                    {s}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-syne font-bold text-lg mb-5">Liens Utiles</h4>
            <ul className="space-y-3">
              {quickLinks.map((l) => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-white/60 hover:text-white text-sm transition-colors flex items-center gap-2 group"
                  >
                    <i className="fas fa-chevron-right text-xs text-accent/0 group-hover:text-white transition-all duration-200" />
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-syne font-bold text-lg mb-5">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <i className="fas fa-map-marker-alt text-accent-300 mt-0.5 w-4" />
                <span className="text-white/60 text-sm">
                  Abomey-Calavi, Atlantique<br />République du Bénin
                </span>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-phone text-accent-300 w-4" />
                <a href="tel:+2290195035099" className="text-white/60 hover:text-white text-sm transition-colors">
                  (+229) 01 95 03 50 99
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-envelope text-accent-300 w-4" />
                <a
                  href="mailto:contact@shiftup.bj"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  contact@shiftup.bj
                </a>
              </li>
              <li className="flex items-center gap-3">
                <i className="fab fa-whatsapp text-accent-300 w-4" />
                <a
                  href="https://wa.me/2290195035099"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/60 hover:text-white text-sm transition-colors"
                >
                  WhatsApp Business
                </a>
              </li>
            </ul>

            {/* Social */}
            <div className="flex items-center gap-3 mt-6">
              {[
                { icon: "fab fa-linkedin-in", href: "https://www.linkedin.com/company/cshift-up/", label: "LinkedIn" },
                { icon: "fab fa-facebook-f", href: "https://www.facebook.com/profile.php?id=61580406154960", label: "Facebook" },
                { icon: "fab fa-instagram", href: "https://www.instagram.com/shiftup.bj?igsh=MW96Njgwd2g1dmRlYg==", label: "Instagram" },
                { icon: "fab fa-x-twitter", href: "https://x.com/Gneudes", label: "X" },
              ].map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={s.label}
                  className="w-9 h-9 bg-white/10 hover:bg-accent rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-110"
                >
                  <i className={`${s.icon} text-sm`} />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="font-syne font-bold text-lg">Restez informé</p>
              <p className="text-white/50 text-sm">Inscrivez-vous à notre newsletter</p>
            </div>
            <NewsletterForm />
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-white/5">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-white/30 text-xs text-center md:text-left">
              <p>© {new Date().getFullYear()} SHIFT UP — Tous droits réservés</p>
              <p className="mt-1">
                RCCM : RB/ABC/25 A 124734 | IFU : 0202113434116
              </p>
            </div>
            <div className="flex items-center gap-4">
              {legalLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-white/30 hover:text-white/60 text-xs transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
