"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useSession, signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";

const navLinks = [
  { href: "/", label: "Accueil" },
  { href: "/services", label: "Services" },
  { href: "/boutique", label: "Boutique" },
  { href: "/a-propos", label: "À propos" },
  { href: "/recrutement", label: "Recrutement" },
  { href: "/blog", label: "Blog" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const role = session?.user?.role;
  const dashboardHref =
    role === "ADMIN" || role === "DEVELOPER" ? "/dashboard/admin" :
    role === "APPORTEUR" ? "/dashboard/apporteur" :
    role === "ETUDIANT"  ? "/dashboard/etudiant"  : "/dashboard/client";

  const profilHref =
    role === "ADMIN" || role === "DEVELOPER" ? "/dashboard/admin" :
    role === "APPORTEUR" ? "/dashboard/apporteur/profil" :
    role === "ETUDIANT"  ? "/dashboard/etudiant/profil"  : "/dashboard/client/profil";

  const isDark = scrolled;

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        isDark
          ? "bg-primary/98 backdrop-blur-md shadow-lg py-3"
          : "bg-white/95 backdrop-blur-md border-b border-primary/8 py-4"
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
              isDark ? "text-white" : "text-primary"
            )}>
              SHIFT UP
            </p>
            <p className="text-accent text-[10px] tracking-widest uppercase">
              Excellence • Innovation
            </p>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200",
                isDark
                  ? "text-white/80 hover:text-white hover:bg-white/10"
                  : "text-primary/70 hover:text-primary hover:bg-primary/8"
              )}
            >
              {link.label}
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
                  isDark ? "bg-white/10 hover:bg-white/20" : "bg-primary/8 hover:bg-primary/15"
                )}
              >
                <div className="w-7 h-7 bg-gradient-to-br from-accent to-secondary rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">
                    {session.user?.name?.charAt(0) || "U"}
                  </span>
                </div>
                <span className={cn(
                  "text-sm font-medium max-w-[120px] truncate transition-colors duration-300",
                  isDark ? "text-white" : "text-primary"
                )}>
                  {session.user?.name}
                </span>
                <i className={cn(
                  "fas fa-chevron-down text-xs transition-colors duration-300",
                  isDark ? "text-white/60" : "text-primary/65"
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
                      <i className="fas fa-grid-2 text-accent w-4" />
                      Mon tableau de bord
                    </Link>
                    <Link
                      href={profilHref}
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <i className="fas fa-user text-accent w-4" />
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
                href="/connexion"
                variant="ghost"
                size="sm"
                className={isDark ? "text-white hover:bg-white/10" : "text-primary hover:bg-primary/8"}
              >
                Connexion
              </Button>
              <Button href="/inscription" variant="gradient" size="sm" animate={false}>
                Commencer
                <i className="fas fa-arrow-right text-sm" />
              </Button>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden w-10 h-10 flex flex-col justify-center items-center gap-1.5"
        >
          <span className={cn(
            "block w-6 h-0.5 transition-all duration-300",
            isDark ? "bg-white" : "bg-primary",
            mobileOpen && "rotate-45 translate-y-2"
          )} />
          <span className={cn(
            "block w-6 h-0.5 transition-all duration-300",
            isDark ? "bg-white" : "bg-primary",
            mobileOpen && "opacity-0"
          )} />
          <span className={cn(
            "block w-6 h-0.5 transition-all duration-300",
            isDark ? "bg-white" : "bg-primary",
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
                ? "bg-primary/98 border-white/10"
                : "bg-white/98 border-primary/8"
            )}
          >
            <div className="container-custom py-4 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-xl transition-colors",
                    isDark
                      ? "text-white/80 hover:text-white hover:bg-white/10"
                      : "text-primary/70 hover:text-primary hover:bg-primary/8"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <div className="flex flex-col gap-2 mt-4 pt-4 border-t border-primary/10">
                {session ? (
                  <>
                    <Button href={dashboardHref} variant="outline" size="md" className={isDark ? "border-white/30 text-white" : "border-primary/30 text-primary"}>
                      <i className="fas fa-grid-2" />
                      Mon tableau de bord
                    </Button>
                    <Button onClick={() => signOut({ callbackUrl: "/" })} variant="ghost" size="md" className="text-red-400">
                      Déconnexion
                    </Button>
                  </>
                ) : (
                  <>
                    <Button href="/connexion" variant="outline" size="md" className={isDark ? "border-white/30 text-white" : "border-primary/30 text-primary"}>
                      Connexion
                    </Button>
                    <Button href="/inscription" variant="gradient" size="md">
                      Commencer gratuitement
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
