/**
 * proxy.ts — Middleware global de SHIFT UP (Next.js 16)
 *
 * Renommé de middleware.ts → proxy.ts (Next.js 16, runtime Node.js).
 * Ce fichier s'exécute avant chaque requête et gère :
 *
 *  1. RATE LIMITING (protection brute-force)
 *     ─────────────────────────────────────
 *     Conforme à l'Article 20 du Code du Numérique béninois et aux bonnes
 *     pratiques ANSSI de lutte contre les attaques par force brute.
 *
 *     Principe : on maintient un compteur en mémoire (Map) par adresse IP
 *     pour chaque route sensible. Si l'IP dépasse MAX_REQUESTS tentatives
 *     dans la fenêtre WINDOW_MS, on retourne immédiatement HTTP 429
 *     (Too Many Requests) sans traiter la requête.
 *
 *     Routes protégées par le rate limiter :
 *       - POST /api/auth/register   → protection contre la création de faux comptes en masse
 *       - POST /api/auth/reset-password → protection contre l'abus de réinitialisation
 *       - POST /api/contact         → protection contre le spam
 *
 *     ⚠️  IMPORTANT : next-auth court-circuite en interne ce middleware pour
 *     tout chemin commençant par le basePath NextAuth (/api/auth/*, y compris
 *     /api/auth/callback/credentials) — ce rate limiter ne s'exécute donc
 *     JAMAIS pour la connexion. La protection anti brute-force du login est
 *     posée directement dans lib/auth.ts (authorize()), pas ici.
 *
 *     ⚠️  Note Edge Runtime : ce compteur est stocké en mémoire du process
 *     Node.js (Map). Dans un déploiement multi-instances (Vercel, serverless),
 *     chaque instance a sa propre Map → pour un rate limiting fiable à l'échelle,
 *     remplacer par Redis/Upstash (TODO commenté dans le code).
 *
 *  2. CONTRÔLE D'ACCÈS PAR RÔLE (RBAC)
 *     ────────────────────────────────
 *     Vérifie le JWT NextAuth de chaque requête vers /dashboard/*.
 *     Redirige vers la bonne vue selon le rôle (ADMIN, APPORTEUR, ETUDIANT, CLIENT).
 *     Un utilisateur non authentifié est redirigé vers /connexion.
 *     Cas particulier : /dashboard/admin/finances* est réservé à ADMIN
 *     uniquement (pas DEVELOPER) — accès aux données financières et aux
 *     versements de commissions.
 *
 *  Les routes /api/payments/* ne sont PAS couvertes par ce middleware : les
 *  routes de création (payments/create, payments/boutique) vérifient leur
 *  propre session, et les webhooks FedaPay/Stripe sont publics par nature
 *  (protégés par vérification de signature et/ou re-vérification serveur
 *  auprès du fournisseur, jamais par une session utilisateur).
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";
import { rateLimit } from "@/lib/ratelimit";
import type { JWT } from "next-auth/jwt";

// ─── Configuration du rate limiter ────────────────────────────────────────────

/**
 * Fenêtre de temps pour le comptage des tentatives (15 minutes en ms).
 * Après 15 minutes sans nouvelle tentative, le compteur se réinitialise.
 */
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

/**
 * Nombre maximum de requêtes autorisées par IP dans la fenêtre WINDOW_MS.
 * Au-delà, la requête est bloquée avec HTTP 429.
 */
const MAX_REQUESTS = 10;

/**
 * Routes sur lesquelles le rate limiter s'applique.
 * Seules les méthodes POST sont concernées (les GET ne modifient rien).
 */
const RATE_LIMITED_PATHS = [
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/contact",
];

/** Vrai si l'IP a dépassé le quota sur cette route (compteur partagé Upstash, voir lib/ratelimit.ts). */
async function checkRateLimit(ip: string, path: string): Promise<boolean> {
  const { allowed } = await rateLimit(`proxy:${ip}:${path}`, { limit: MAX_REQUESTS, windowMs: WINDOW_MS });
  return !allowed;
}

// ─── Middleware principal ──────────────────────────────────────────────────────

export default withAuth(
  async function middleware(req: NextRequest & { nextauth: { token: JWT | null } }) {
    const { pathname } = req.nextUrl;

    // ── 1. Rate limiting sur les routes sensibles ──────────────────────────
    // On applique le limiteur uniquement sur les méthodes POST (lectures non limitées)
    if (req.method === "POST" && RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {

      // Récupération de l'IP réelle (derrière un proxy/CDN comme Vercel/Cloudflare)
      // x-forwarded-for peut contenir plusieurs IPs séparées par des virgules ;
      // on prend la première (IP client originale).
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

      const blocked = await checkRateLimit(ip, pathname);
      if (blocked) {
        // Retourne HTTP 429 avec le délai d'attente dans l'en-tête Retry-After
        return new NextResponse(
          JSON.stringify({
            error: "Trop de tentatives. Veuillez réessayer dans 15 minutes.",
            code:  "RATE_LIMITED",
          }),
          {
            status: 429,
            headers: {
              "Content-Type":  "application/json",
              "Retry-After":   "900", // 900 secondes = 15 minutes
              // En-tête informatif pour le client
              "X-RateLimit-Limit":   String(MAX_REQUESTS),
              "X-RateLimit-Remaining": "0",
            },
          }
        );
      }
    }

    // ── 2. Contrôle d'accès basé sur les rôles (RBAC) ─────────────────────
    // withAuth a déjà vérifié la présence du token JWT.
    // Ici on vérifie que le rôle correspond à la section du dashboard accédée.
    const token = req.nextauth.token;

    // Sécurité défensive : si pas de token sur une route dashboard, redirige
    if (!token) return NextResponse.redirect(new URL("/connexion", req.url));

    const role = token.role as string;

    // Finances : réservé au rôle ADMIN uniquement (pas DEVELOPER) — données
    // financières et validation des versements de commissions.
    if (
      pathname.startsWith("/dashboard/admin/finances") &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard/admin", req.url));
    }

    // Routes réservées aux administrateurs et développeurs
    if (
      pathname.startsWith("/dashboard/admin") &&
      role !== "ADMIN" &&
      role !== "DEVELOPER"
    ) {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    // Routes réservées aux apporteurs d'affaires (les admins peuvent aussi y accéder)
    if (
      pathname.startsWith("/dashboard/apporteur") &&
      role !== "APPORTEUR" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    // Routes réservées aux étudiants
    if (
      pathname.startsWith("/dashboard/etudiant") &&
      role !== "ETUDIANT" &&
      role !== "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/dashboard/client", req.url));
    }

    // Tout est OK → laisse passer la requête
    return NextResponse.next();
  },
  {
    // withAuth callback : définit si l'utilisateur est "autorisé" à accéder à la route
    // Ici : toute route du matcher nécessite un token valide
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

// ─── Routes couvertes par le middleware ───────────────────────────────────────
export const config = {
  matcher: [
    // Toutes les sous-routes du dashboard (contrôle d'accès RBAC)
    "/dashboard/:path*",
    // Routes API d'authentification (rate limiting — note : sans effet réel,
    // voir le commentaire en tête de fichier ; le vrai rate limiting du
    // login vit dans lib/auth.ts)
    "/api/auth/register",
    "/api/auth/reset-password",
    // Route de contact (rate limiting anti-spam)
    "/api/contact",
  ],
};
