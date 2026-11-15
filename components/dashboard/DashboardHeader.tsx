"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string | null;
  };
}

function profilHref(role?: string | null) {
  if (role === "APPORTEUR") return "/dashboard/apporteur/profil";
  if (role === "ETUDIANT")  return "/dashboard/etudiant/profil";
  if (role === "ADMIN" || role === "DEVELOPER") return "/dashboard/admin";
  return "/dashboard/client/profil";
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-su-lavande flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Gauche : salutation et date */}
      <div className="hidden sm:flex flex-col">
        <span className="font-syne text-[15px] font-bold text-su-nuit">Bonjour{user?.name ? `, ${user.name.split(" ")[0]}` : ""}</span>
        <span className="text-xs capitalize text-gray-500">{new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Help */}
        <Link
          href="/faq"
          aria-label="Aide" className="w-9 h-9 bg-su-brume border border-su-lavande rounded-full flex items-center justify-center hover:border-su-bleu transition-colors"
        >
          <i className="fas fa-circle-question text-su-bleu text-sm" />
        </Link>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 bg-su-brume border border-su-lavande hover:border-su-bleu pl-1.5 pr-3 py-1.5 rounded-full transition-colors"
          >
            <div className="w-7 h-7 bg-su-bleu rounded-full flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-su-nuit leading-none">{user?.name}</p>
              <p className="text-[10px] text-gray-400">{user?.email}</p>
            </div>
            <i className="fas fa-chevron-down text-gray-400 text-xs" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-su-lavande overflow-hidden z-50">
              <Link href={profilHref(user?.role)} onClick={() => setMenuOpen(false)} className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-su-brume">
                <i className="fas fa-user text-su-bleu w-4" />
                Mon profil
              </Link>
              <Link href="/contact" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-su-brume">
                <i className="fas fa-headset text-su-bleu w-4" />
                Support
              </Link>
              <hr className="border-gray-100" />
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 px-4 py-3 text-sm text-red-500 hover:bg-red-50 w-full"
              >
                <i className="fas fa-sign-out-alt w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
