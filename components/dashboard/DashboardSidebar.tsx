"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

type NavItem = { href: string; icon: string; label: string; badge?: string };

const navByRole: Record<string, NavItem[]> = {
  CLIENT: [
    { href: "/dashboard/client", icon: "fas fa-grid-2", label: "Vue d'ensemble" },
    { href: "/dashboard/client/prestations", icon: "fas fa-briefcase", label: "Mes prestations" },
    { href: "/dashboard/client/suivi", icon: "fas fa-chart-line", label: "Suivi en temps réel" },
    { href: "/dashboard/client/messages", icon: "fas fa-comments", label: "Messagerie", badge: "3" },
    { href: "/dashboard/client/affiliation", icon: "fas fa-users", label: "Affiliation & gains" },
    { href: "/dashboard/client/factures", icon: "fas fa-file-invoice", label: "Factures" },
    { href: "/dashboard/client/profil", icon: "fas fa-user-circle", label: "Mon profil" },
  ],
  APPORTEUR: [
    { href: "/dashboard/apporteur", icon: "fas fa-grid-2", label: "Vue d'ensemble" },
    { href: "/dashboard/apporteur/catalogue", icon: "fas fa-list", label: "Catalogue services" },
    { href: "/dashboard/apporteur/campagnes", icon: "fas fa-bullhorn", label: "Mes campagnes" },
    { href: "/dashboard/apporteur/commissions", icon: "fas fa-coins", label: "Commissions" },
    { href: "/dashboard/apporteur/classement", icon: "fas fa-trophy", label: "Classement" },
    { href: "/dashboard/apporteur/profil", icon: "fas fa-user-circle", label: "Mon profil" },
  ],
  ETUDIANT: [
    { href: "/dashboard/etudiant", icon: "fas fa-grid-2", label: "Vue d'ensemble" },
    { href: "/dashboard/etudiant/ressources", icon: "fas fa-book", label: "Ressources & Cours" },
    { href: "/dashboard/etudiant/taches", icon: "fas fa-tasks", label: "Micro-tâches", badge: "5" },
    { href: "/dashboard/etudiant/badges", icon: "fas fa-award", label: "Mes badges" },
    { href: "/dashboard/etudiant/portfolio", icon: "fas fa-folder-open", label: "Portfolio" },
    { href: "/dashboard/etudiant/profil", icon: "fas fa-user-circle", label: "Mon profil" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", icon: "fas fa-grid-2", label: "Vue d'ensemble" },
    { href: "/dashboard/admin/prestations", icon: "fas fa-briefcase", label: "Prestations" },
    { href: "/dashboard/admin/utilisateurs", icon: "fas fa-users", label: "Utilisateurs" },
    { href: "/dashboard/admin/services", icon: "fas fa-cog", label: "Services & CMS" },
    { href: "/dashboard/admin/blog", icon: "fas fa-newspaper", label: "Blog" },
    { href: "/dashboard/admin/marketing", icon: "fas fa-bullhorn", label: "Marketing" },
    { href: "/dashboard/admin/analytics", icon: "fas fa-chart-bar", label: "Analytics" },
    { href: "/dashboard/admin/finances", icon: "fas fa-coins", label: "Finances (DG)" },
  ],
  DEVELOPER: [
    { href: "/dashboard/admin", icon: "fas fa-grid-2", label: "Vue d'ensemble" },
    { href: "/dashboard/admin/prestations", icon: "fas fa-briefcase", label: "Prestations" },
    { href: "/dashboard/admin/utilisateurs", icon: "fas fa-users", label: "Utilisateurs" },
    { href: "/dashboard/admin/services", icon: "fas fa-cog", label: "Services & CMS" },
    { href: "/dashboard/admin/blog", icon: "fas fa-newspaper", label: "Blog" },
    { href: "/dashboard/admin/analytics", icon: "fas fa-chart-bar", label: "Analytics" },
  ],
};

// Bottom tabs shown on mobile (max 5 items — most important ones)
const mobileTabsByRole: Record<string, NavItem[]> = {
  CLIENT: [
    { href: "/dashboard/client", icon: "fas fa-grid-2", label: "Accueil" },
    { href: "/dashboard/client/prestations", icon: "fas fa-briefcase", label: "Projets" },
    { href: "/dashboard/client/suivi", icon: "fas fa-chart-line", label: "Suivi" },
    { href: "/dashboard/client/messages", icon: "fas fa-comments", label: "Messages", badge: "3" },
    { href: "/dashboard/client/profil", icon: "fas fa-user-circle", label: "Profil" },
  ],
  APPORTEUR: [
    { href: "/dashboard/apporteur", icon: "fas fa-grid-2", label: "Accueil" },
    { href: "/dashboard/apporteur/catalogue", icon: "fas fa-list", label: "Catalogue" },
    { href: "/dashboard/apporteur/commissions", icon: "fas fa-coins", label: "Gains" },
    { href: "/dashboard/apporteur/classement", icon: "fas fa-trophy", label: "Classement" },
    { href: "/dashboard/apporteur/profil", icon: "fas fa-user-circle", label: "Profil" },
  ],
  ETUDIANT: [
    { href: "/dashboard/etudiant", icon: "fas fa-grid-2", label: "Accueil" },
    { href: "/dashboard/etudiant/taches", icon: "fas fa-tasks", label: "Tâches", badge: "5" },
    { href: "/dashboard/etudiant/badges", icon: "fas fa-award", label: "Badges" },
    { href: "/dashboard/etudiant/portfolio", icon: "fas fa-folder-open", label: "Portfolio" },
    { href: "/dashboard/etudiant/profil", icon: "fas fa-user-circle", label: "Profil" },
  ],
  ADMIN: [
    { href: "/dashboard/admin", icon: "fas fa-grid-2", label: "Accueil" },
    { href: "/dashboard/admin/prestations", icon: "fas fa-briefcase", label: "Projets" },
    { href: "/dashboard/admin/utilisateurs", icon: "fas fa-users", label: "Utilisateurs" },
    { href: "/dashboard/admin/analytics", icon: "fas fa-chart-bar", label: "Stats" },
    { href: "/dashboard/admin/finances", icon: "fas fa-coins", label: "Finances" },
  ],
  DEVELOPER: [
    { href: "/dashboard/admin", icon: "fas fa-grid-2", label: "Accueil" },
    { href: "/dashboard/admin/prestations", icon: "fas fa-briefcase", label: "Projets" },
    { href: "/dashboard/admin/utilisateurs", icon: "fas fa-users", label: "Users" },
    { href: "/dashboard/admin/analytics", icon: "fas fa-chart-bar", label: "Stats" },
    { href: "/dashboard/admin/blog", icon: "fas fa-newspaper", label: "Blog" },
  ],
};

export default function DashboardSidebar({ role }: { role: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const navItems = navByRole[role] || navByRole["CLIENT"];
  const mobileItems = mobileTabsByRole[role] || mobileTabsByRole["CLIENT"];

  // Close drawer when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <>
      {/* ── DESKTOP SIDEBAR (lg+) ─────────────────────────────────────── */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3 }}
        className="hidden lg:flex bg-primary flex-col h-screen sticky top-0 overflow-hidden z-30 flex-shrink-0"
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="flex items-center gap-2"
              >
                <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
                  <span className="text-white font-syne font-black text-sm">SU</span>
                </div>
                <span className="text-white font-syne font-bold">SHIFT UP</span>
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-white flex-shrink-0"
          >
            <i className={`fas fa-${collapsed ? "chevron-right" : "chevron-left"} text-xs`} />
          </button>
        </div>

        {/* Role badge */}
        {!collapsed && (
          <div className="px-4 py-2">
            <span className="bg-accent/15 text-accent text-xs font-semibold px-3 py-1 rounded-full">
              {role === "CLIENT" ? "Client" :
               role === "APPORTEUR" ? "Apporteur d'affaires" :
               role === "ETUDIANT" ? "Étudiant" : "Admin"}
            </span>
          </div>
        )}

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                title={collapsed ? item.label : undefined}
                className={cn("sidebar-item", isActive && "active", collapsed && "justify-center")}
              >
                <i className={`${item.icon} ${isActive ? "text-accent" : "text-gray-400"} w-4 text-center`} />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1">
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {item.badge && !collapsed && (
                  <span className="bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="p-2 border-t border-white/10">
          <Link href="/" className={cn("sidebar-item", collapsed && "justify-center")} title={collapsed ? "Retour au site" : undefined}>
            <i className="fas fa-arrow-left text-gray-400 w-4 text-center" />
            {!collapsed && <span>Retour au site</span>}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className={cn("sidebar-item w-full text-red-400 hover:bg-red-50/10 hover:text-red-300", collapsed && "justify-center")}
            title={collapsed ? "Déconnexion" : undefined}
          >
            <i className="fas fa-sign-out-alt w-4 text-center" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      {/* ── MOBILE HEADER BAR (< lg) ────────────────────────────────────── */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-primary shadow-lg">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
              <span className="text-white font-syne font-black text-sm">SU</span>
            </div>
            <span className="text-white font-syne font-bold text-base">SHIFT UP</span>
          </div>
          <button
            onClick={() => setMobileOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10 text-white"
          >
            <i className="fas fa-bars" />
          </button>
        </div>
      </div>

      {/* ── MOBILE DRAWER OVERLAY ────────────────────────────────────────── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/60 z-50"
            />
            {/* Drawer */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-72 bg-primary z-50 flex flex-col shadow-2xl"
            >
              {/* Drawer header */}
              <div className="flex items-center justify-between p-4 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center">
                    <span className="text-white font-syne font-black text-sm">SU</span>
                  </div>
                  <span className="text-white font-syne font-bold">SHIFT UP</span>
                </div>
                <button onClick={() => setMobileOpen(false)} className="text-white/60 hover:text-white p-2">
                  <i className="fas fa-times" />
                </button>
              </div>

              {/* Role badge */}
              <div className="px-4 py-3">
                <span className="bg-accent/15 text-accent text-xs font-semibold px-3 py-1 rounded-full">
                  {role === "CLIENT" ? "Client" :
                   role === "APPORTEUR" ? "Apporteur d'affaires" :
                   role === "ETUDIANT" ? "Étudiant" : "Admin"}
                </span>
              </div>

              {/* Nav items */}
              <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1">
                {navItems.map((item) => {
                  const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={cn("sidebar-item", isActive && "active")}
                    >
                      <i className={`${item.icon} ${isActive ? "text-accent" : "text-gray-400"} w-4 text-center`} />
                      <span className="flex-1">{item.label}</span>
                      {item.badge && (
                        <span className="bg-accent text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>

              {/* Drawer footer */}
              <div className="p-2 border-t border-white/10">
                <Link href="/" className="sidebar-item">
                  <i className="fas fa-arrow-left text-gray-400 w-4 text-center" />
                  <span>Retour au site</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="sidebar-item w-full text-red-400 hover:bg-red-50/10 hover:text-red-300"
                >
                  <i className="fas fa-sign-out-alt w-4 text-center" />
                  <span>Déconnexion</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── MOBILE BOTTOM NAV BAR (< lg) ─────────────────────────────────── */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-primary border-t border-white/10 safe-area-bottom">
        <div className="flex items-stretch">
          {mobileItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center py-2 gap-0.5 relative transition-colors",
                  isActive ? "text-accent" : "text-gray-400 hover:text-white"
                )}
              >
                {item.badge && (
                  <span className="absolute top-1.5 right-1/4 bg-accent text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
                <i className={`${item.icon} text-lg`} />
                <span className="text-[10px] font-medium leading-none">{item.label}</span>
                {isActive && (
                  <motion.div
                    layoutId="mobile-tab-indicator"
                    className="absolute top-0 left-1/4 right-1/4 h-0.5 bg-accent rounded-full"
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
