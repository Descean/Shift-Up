"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

// Menus du site, regroupés : tous les liens d'origine restent, rangés en deux sous-menus
type Lien = { href: string; label: string; texte?: string };
type Entree = Lien | { label: string; enfants: Lien[] };
const navLinks: Entree[] = [
  { href: "/", label: "Accueil" },
  { label: "Nos offres", enfants: [
    { href: "/services", label: "Services", texte: "Tous nos domaines d'intervention" },
    { href: "/boutique", label: "Boutique", texte: "Modèles, guides et outils" },
  ] },
  { label: "SHIFT UP", enfants: [
    { href: "/a-propos", label: "À propos", texte: "Qui nous sommes" },
    { href: "/recrutement", label: "Recrutement", texte: "Nos offres d'emploi et de stage" },
    { href: "/blog", label: "Blog", texte: "Conseils et actualités" },
  ] },
  { href: "/contact", label: "Contact" },
];
const aplatir = (e: Entree[]): Lien[] => e.flatMap((x) => ("enfants" in x ? x.enfants : [x]));

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [sousMenu, setSousMenu] = useState<string | null>(null);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const role = session?.user?.role;
  const dashboardHref =
    role === "ADMIN" || role === "DEVELOPER" ? "/dashboard/admin" :
    role === "MONTEUR" ? "/dashboard/equipe" : "/dashboard/client";

  const profilHref =
    role === "ADMIN" || role === "DEVELOPER" ? "/dashboard/admin" :
    role === "MONTEUR" ? "/dashboard/equipe" : "/dashboard/client/profil";

  const isDark = scrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isDark
          ? "bg-su-nuit/95 backdrop-blur-md shadow-lg py-3"
          : "bg-su-brume/95 backdrop-blur-md border-b border-su-lavande py-4"
      )}
    >
      <div className="container-custom flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src="/assets/logo-icon.png"
              alt="SHIFT UP"
              width={40}
              height={40}
              className={cn(
                "w-full h-full object-contain transition-all duration-300",
                isDark ? "brightness-0 invert" : "brightness-0"
              )}
              priority
            />
          </div>
          <div className="hidden sm:block">
            <p className={cn(
              "font-syne font-bold text-xl leading-none transition-colors duration-300",
              isDark ? "text-white" : "text-su-nuit"
            )}>
              SHIFT UP
            </p>
            <p className={cn("text-[10px] tracking-widest uppercase transition-colors duration-300", isDark ? "text-su-ciel" : "text-su-bleu")}>
              Excellence • Innovation
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((e) => "enfants" in e ? (
            <div key={e.label} className="relative" onMouseEnter={() => setSousMenu(e.label)} onMouseLeave={() => setSousMenu(null)}>
              <button type="button" onClick={() => setSousMenu(sousMenu === e.label ? null : e.label)} aria-expanded={sousMenu === e.label}
                className={cn("flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                  isDark ? "text-white/80 hover:text-white hover:bg-white/10" : "text-su-nuit/70 hover:text-su-nuit hover:bg-su-lavande/60")}>
                {e.label}<i className="fas fa-chevron-down text-[9px] opacity-60" />
              </button>
              {sousMenu === e.label && (
                <div className="absolute left-0 top-full pt-2">
                  <div className="w-64 rounded-2xl border border-su-lavande bg-white p-2 shadow-xl">
                    {e.enfants.map((l) => (
                      <Link key={l.href} href={l.href} onClick={() => setSousMenu(null)} className="block rounded-xl px-3 py-2.5 hover:bg-su-brume">
                        <span className="block text-sm font-semibold text-su-nuit">{l.label}</span>
                        {l.texte && <span className="block text-xs text-gray-500">{l.texte}</span>}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link
              key={e.href}
              href={e.href}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                isDark
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-su-nuit/70 hover:text-su-nuit hover:bg-su-lavande/60"
              )}
            >
              {e.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="hidden lg:flex items-center gap-3">
          {session ? (
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200",
                  isDark ? "bg-white/10 hover:bg-white/20" : "bg-su-lavande/60 hover:bg-su-lavande"
                )}
              >
                <div className="w-7 h-7 bg-gradient-to-br from-su-bleu to-su-cadet rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <span className={cn(
                  "text-sm font-medium max-w-[120px] truncate transition-colors duration-300",
                  isDark ? "text-white" : "text-su-nuit"
                )}>
                  {session.user?.name}
                </span>
                <i className={cn(
                  "fas fa-chevron-down text-xs transition-colors duration-300",
                  isDark ? "text-white/60" : "text-su-nuit/65"
                )} />
              </button>
              <AnimatePresence>
                {userMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                  >
                    <Link
                      href={dashboardHref}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="fas fa-table-cells-large text-su-bleu w-4" />
                      Mon tableau de bord
                    </Link>
                    <Link
                      href={profilHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="fas fa-user text-su-bleu w-4" />
                      Mon profil
                    </Link>
                    <hr className="border-gray-100" />
                    <button
                      onClick={() => signOut({ callbackUrl: "/" })}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                    >
                      <i className="fas fa-sign-out-alt w-4" />
                      Déconnexion
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Button
                href="/travailler-avec-nous"
                variant="ghost"
                size="sm"
                className={cn("rounded-full border", isDark ? "border-white/30 text-white hover:bg-white/10" : "border-su-clair text-su-nuit hover:bg-su-lavande/60")}
              >
                Travailler avec nous
              </Button>
              <Button href="/connexion" variant="gradient" size="sm" animate={false} className="bg-none bg-su-bleu hover:bg-su-cadet hover:opacity-100 rounded-full">
                <i className="fas fa-user text-xs" />
                Espace client
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label={mobileOpen ? "Fermer le menu" : "Ouvrir le menu"}
          aria-expanded={mobileOpen}
          className="lg:hidden w-11 h-11 flex flex-col justify-center items-center gap-1.5"
        >
          <span className={cn(
            "block w-6 h-0.5 transition-all duration-300",
            isDark ? "bg-white" : "bg-su-nuit",
            mobileOpen && "rotate-45 translate-y-2"
          )} />
          <span className={cn(
            "block w-6 h-0.5 transition-all duration-300",
            isDark ? "bg-white" : "bg-su-nuit",
            mobileOpen && "opacity-0"
          )} />
          <span className={cn(
            "block w-6 h-0.5 transition-all duration-300",
            isDark ? "bg-white" : "bg-su-nuit",
            mobileOpen && "-rotate-45 -translate-y-2"
          )} />
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className={cn(
              "lg:hidden backdrop-blur-md border-t overflow-hidden",
              isDark
                ? "bg-su-nuit/95 border-white/10"
                : "bg-su-brume/98 border-su-lavande"
            )}
          >
            <div className="container-custom py-4 flex flex-col gap-1">
              {aplatir(navLinks).map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl transition-colors",
                    isDark
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-su-nuit/70 hover:text-su-nuit hover:bg-su-lavande/60"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-su-lavande">
                {session ? (
                  <>
                    <Button href={dashboardHref} variant="outline" size="md" className={isDark ? "border-white/30 text-white" : "border-su-bleu/40 text-su-nuit"}>
                      <i className="fas fa-table-cells-large" />
                      Mon tableau de bord
                    </Button>
                    <Button onClick={() => signOut({ callbackUrl: "/" })} variant="ghost" size="md" className="text-red-400">
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Button href="/connexion" variant="gradient" size="md" className="bg-none bg-su-bleu hover:bg-su-cadet hover:opacity-100 rounded-full">
                      <i className="fas fa-user text-xs" />
                      Espace client
                    </Button>
                    <Button href="/travailler-avec-nous" variant="outline" size="md" className={isDark ? "border-white/30 text-white" : "border-su-bleu/40 text-su-nuit"}>
                      Travailler avec nous
                    </Button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
