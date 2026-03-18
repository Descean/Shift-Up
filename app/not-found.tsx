/**
 * app/not-found.tsx — Page 404 personnalisée SHIFT UP
 *
 * Affichée automatiquement par Next.js pour toute URL introuvable.
 * Conserve le Header et le Footer publics pour ne pas désorienter l'utilisateur.
 */

import Link from "next/link";
import Image from "next/image";

export const metadata = {
  title: "Page introuvable | SHIFT UP",
  description: "La page que vous cherchez n'existe pas ou a été déplacée.",
};

export default function NotFound() {
  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-6 text-center">
      {/* Logo */}
      <Link href="/" className="mb-10 inline-block">
        <Image
          src="/assets/logo-full.png"
          alt="SHIFT UP"
          width={280}
          height={90}
          className="h-20 w-auto brightness-0 invert"
          priority
        />
      </Link>

      {/* Code 404 */}
      <div className="relative mb-6">
        <p
          className="font-syne font-black select-none"
          style={{
            fontSize: "clamp(80px, 20vw, 160px)",
            lineHeight: 1,
            background: "linear-gradient(135deg, #1E9FD4 0%, #00D4A0 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          404
        </p>
      </div>

      {/* Message */}
      <h1 className="font-syne font-bold text-2xl md:text-3xl text-white mb-4">
        Page introuvable
      </h1>
      <p className="text-white/60 text-base max-w-md mb-10">
        La page que vous cherchez n&apos;existe pas, a été déplacée ou
        l&apos;URL a été mal saisie.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <Link
          href="/"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-6 py-3 rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity"
        >
          <i className="fas fa-house" />
          Retour à l&apos;accueil
        </Link>
        <Link
          href="/services"
          className="inline-flex items-center gap-2 border border-white/20 text-white/80 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          <i className="fas fa-briefcase" />
          Nos services
        </Link>
        <Link
          href="/contact"
          className="inline-flex items-center gap-2 border border-white/20 text-white/80 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-white/10 transition-colors"
        >
          <i className="fas fa-envelope" />
          Nous contacter
        </Link>
      </div>

      {/* Décoration de fond */}
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden -z-0"
        aria-hidden
      >
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-secondary/5 rounded-full blur-3xl" />
      </div>
    </div>
  );
}
