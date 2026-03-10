"use client";

import { useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

interface DashboardHeaderProps {
  user?: {
    name?: string | null;
    email?: string | null;
    role?: string;
  };
}

export default function DashboardHeader({ user }: DashboardHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="h-16 bg-white border-b border-gray-100 flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left: Search */}
      <div className="hidden sm:flex items-center gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-2 w-64">
        <i className="fas fa-search text-gray-400 text-sm" />
        <input
          type="text"
          placeholder="Rechercher..."
          className="bg-transparent text-sm focus:outline-none flex-1 text-gray-600 placeholder:text-gray-400"
        />
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Notifications */}
        <button className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center relative hover:border-gray-200 transition-colors">
          <i className="fas fa-bell text-gray-500 text-sm" />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-accent text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            2
          </span>
        </button>

        {/* Help */}
        <Link
          href="/faq"
          className="w-9 h-9 bg-gray-50 border border-gray-100 rounded-xl flex items-center justify-center hover:border-gray-200 transition-colors"
        >
          <i className="fas fa-circle-question text-gray-500 text-sm" />
        </Link>

        {/* User */}
        <div className="relative">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 bg-gray-50 border border-gray-100 hover:border-gray-200 px-3 py-2 rounded-xl transition-colors"
          >
            <div className="w-7 h-7 bg-gradient-to-br from-accent to-secondary rounded-lg flex items-center justify-center text-white text-xs font-bold">
              {user?.name?.charAt(0) || "U"}
            </div>
            <div className="hidden sm:block text-left">
              <p className="text-xs font-semibold text-primary leading-none">{user?.name}</p>
              <p className="text-[10px] text-gray-400">{user?.email}</p>
            </div>
            <i className="fas fa-chevron-down text-gray-400 text-xs" />
          </button>

          {menuOpen && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden z-50">
              <Link href="/dashboard/profil" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                <i className="fas fa-user text-accent w-4" />
                Mon profil
              </Link>
              <Link href="/contact" className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 hover:bg-gray-50">
                <i className="fas fa-headset text-accent w-4" />
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
