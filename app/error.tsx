/**
 * app/error.tsx — Error boundary global Next.js 14
 *
 * Intercepte les erreurs JavaScript non gérées côté client et côté serveur
 * (erreurs dans les Server Components, les Client Components, etc.).
 *
 * DOIT être un Client Component (directive "use client" obligatoire).
 */

"use client";

import { useEffect } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log l'erreur dans la console (à remplacer par un service de monitoring)
    console.error("[SHIFT UP Error]", error);
  }, [error]);

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6 text-center">
      {/* Icône d'erreur */}
      <div className="w-20 h-20 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
        <i className="fas fa-triangle-exclamation text-red-400 text-3xl" />
      </div>

      {/* Titre */}
      <h1 className="font-syne font-black text-2xl md:text-3xl text-white mb-3">
        Une erreur est survenue
      </h1>
      <p className="text-white/60 text-base max-w-md mb-2">
        Une erreur inattendue s&apos;est produite. Notre équipe a été notifiée.
      </p>

      {/* Code d'erreur technique (si disponible) */}
      {error.digest && (
        <p className="text-white/30 text-xs font-mono mb-8">
          Code : {error.digest}
        </p>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center mt-4">
        <button
          onClick={reset}
          className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-rotate-right" />
          Réessayer
        </button>
        <Link
          href="/"
          className="inline-flex items-center gap-2 border border-white/20 text-white/80 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          <i className="fas fa-house" />
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 border border-white/20 text-white/80 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          <i className="fas fa-headset" />
          Support
        </Link>
      </div>

      {/* Branding */}
      <div className="mt-16">
        <p className="font-syne font-black text-white/20 text-sm tracking-widest">
          SHIFT UP
        </p>
      </div>

      {/* Décors de fond */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden -z-0" aria-hidden>
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-red-500/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
