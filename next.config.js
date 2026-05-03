/**
 * next.config.js — Configuration Next.js de SHIFT UP
 *
 * Ce fichier configure :
 *  1. Les en-têtes HTTP de sécurité (Article 20 Code du Numérique Bénin,
 *     Référentiel de sécurité ANSSI/CRIET) — appliqués sur TOUTES les routes.
 *  2. Les domaines d'images autorisés (Supabase, Google, GitHub avatars).
 *  3. Les packages Prisma/bcrypt marqués comme externes côté serveur.
 *
 * ─── EN-TÊTES DE SÉCURITÉ ────────────────────────────────────────────────────
 *
 * Strict-Transport-Security (HSTS)
 *   → Force le navigateur à utiliser HTTPS pendant 1 an (max-age=31536000).
 *   → includeSubDomains : s'applique aussi aux sous-domaines (api., www., etc.).
 *   → preload : autorise l'inscription dans la liste de préchargement HSTS des navigateurs.
 *
 * Content-Security-Policy (CSP)
 *   → Restreint les origines des scripts, styles, images, fonts, iframes.
 *   → 'self' = uniquement notre propre domaine.
 *   → Les domaines tiers (Google Fonts, CDN FontAwesome, Stripe, FedaPay) sont
 *     explicitement autorisés et ne peuvent pas être remplacés par des injections.
 *   → Protège contre les attaques XSS (Cross-Site Scripting).
 *
 * X-Content-Type-Options: nosniff
 *   → Empêche le navigateur de deviner le type MIME d'un fichier.
 *   → Protège contre les attaques de type "MIME sniffing".
 *
 * X-Frame-Options: SAMEORIGIN
 *   → Empêche l'intégration de nos pages dans un iframe d'un site tiers.
 *   → Protège contre les attaques de type "clickjacking".
 *
 * X-XSS-Protection: 1; mode=block
 *   → Active le filtre XSS natif des navigateurs plus anciens (IE, ancien Chrome).
 *
 * Referrer-Policy: strict-origin-when-cross-origin
 *   → Envoie le referrer complet pour les requêtes same-origin.
 *   → Pour les requêtes cross-origin, envoie uniquement l'origine (pas le chemin).
 *   → Limite la fuite d'URLs internes vers des sites tiers.
 *
 * Permissions-Policy
 *   → Désactive les APIs sensibles non utilisées (caméra, microphone, géolocalisation).
 *   → Principe de moindre privilège (Article 21 Code du Numérique).
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  // ── Configuration des images distantes autorisées ──────────────────────────
  images: {
    remotePatterns: [
      { hostname: "lh3.googleusercontent.com" },   // avatars Google OAuth
      { hostname: "avatars.githubusercontent.com" }, // avatars GitHub OAuth
      { hostname: "*.supabase.co" },                 // images/fichiers Supabase Storage
    ],
  },

  // ── Packages Node.js à ne pas bundler côté serveur ────────────────────────
  // Prisma et bcryptjs utilisent des binaires natifs — doivent rester externes.
  // (déplacé hors de experimental depuis Next.js 15)
  serverExternalPackages: ["@prisma/client", "bcryptjs", "@react-pdf/renderer"],

  // ── En-têtes de sécurité HTTP ─────────────────────────────────────────────
  // Appliqués à toutes les routes (source: "/(.*)" = pattern regex catch-all).
  async headers() {
    return [
      {
        // Applique les en-têtes à TOUTES les routes du site
        source: "/(.*)",
        headers: [

          // ── HSTS : Force HTTPS pour 1 an ──────────────────────────────────
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },

          // ── CSP : Politique de sécurité du contenu ────────────────────────
          // Chaque directive est une règle d'autorisation par type de ressource.
          {
            key: "Content-Security-Policy",
            value: [
              // Scripts : notre domaine + Google (Analytics) + Stripe
              "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://js.stripe.com",
              // Styles : notre domaine + Google Fonts (FontAwesome est désormais self-hosted via npm)
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              // Images : notre domaine + Google Analytics + Supabase + data: URIs (SVG inline)
              "img-src 'self' data: https://www.google-analytics.com https://*.supabase.co https://lh3.googleusercontent.com",
              // Fonts : notre domaine + Google Fonts + fonts gstatic pour PDF invoices
              "font-src 'self' https://fonts.gstatic.com",
              // Connexions fetch/WebSocket : notre domaine + APIs externes
              "connect-src 'self' https://www.google-analytics.com https://*.supabase.co https://api.fedapay.com https://sandbox-api.fedapay.com",
              // Iframes : Stripe Payment Element
              "frame-src 'self' https://js.stripe.com https://hooks.stripe.com",
              // Toute ressource non couverte : uniquement notre domaine
              "default-src 'self'",
              // Bloque les formulaires qui soumettent vers des sites tiers non listés
              "form-action 'self'",
              // Bloque l'inclusion de notre site dans un iframe externe
              "frame-ancestors 'self'",
            ].join("; "),
          },

          // ── Empêche le sniffing MIME ───────────────────────────────────────
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },

          // ── Empêche le clickjacking (notre site ne peut être mis en iframe) ─
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },

          // ── Filtre XSS des anciens navigateurs ────────────────────────────
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },

          // ── Politique de référent : limite la fuite d'URLs internes ────────
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },

          // ── Désactive les APIs sensibles non utilisées ────────────────────
          // Principe de moindre privilège — Art. 21 Code du Numérique Bénin
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self https://js.stripe.com)",
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
