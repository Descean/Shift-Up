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
 *       - POST /api/auth/connexion  → protection contre le vol de comptes
 *       - POST /api/auth/register   → protection contre la création de faux comptes en masse
 *       - POST /api/auth/reset-password → protection contre l'abus de réinitialisation
 *       - POST /api/contact         → protection contre le spam
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
 */

import { withAuth } from "next-auth/middleware";
import { NextResponse, NextRequest } from "next/server";

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
 * Stockage en mémoire des compteurs par IP et par route.
 * Structure : Map<"IP:route", { count, resetAt }>
 *
 * TODO production multi-instances : remplacer par Upstash Redis :
 *   import { Ratelimit } from "@upstash/ratelimit";
 *   import { Redis } from "@upstash/redis";
 *   const ratelimit = new Ratelimit({ redis: Redis.fromEnv(), limiter: Ratelimit.slidingWindow(10, "15m") });
 */
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

/**
 * Routes sur lesquelles le rate limiter s'applique.
 * Seules les méthodes POST sont concernées (les GET ne modifient rien).
 */
const RATE_LIMITED_PATHS = [
  "/api/auth/connexion",
  "/api/auth/callback/credentials", // endpoint NextAuth pour la connexion credentials
  "/api/auth/register",
  "/api/auth/reset-password",
  "/api/contact",
];

/**
 * checkRateLimit — Vérifie si l'IP a dépassé le quota de requêtes.
 *
 * @param ip    Adresse IP du client (depuis x-forwarded-for ou x-real-ip)
 * @param path  Chemin de la requête (ex: "/api/auth/register")
 * @returns     true si la requête est bloquée, false si autorisée
 */
function checkRateLimit(ip: string, path: string): boolean {
  // Clé unique par (IP, route) pour éviter qu'une IP épuise le quota d'une
  // route et soit bloquée sur toutes les autres routes
  const key = `${ip}:${path}`;
  const now  = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now > entry.resetAt) {
    // Première tentative ou fenêtre expirée → réinitialise le compteur
    rateLimitMap.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return false; // autorisé
  }

  // Fenêtre active → incrémente le compteur
  entry.count += 1;

  // Dépasse le seuil → bloque la requête
  if (entry.count > MAX_REQUESTS) return true; // bloqué

  return false; // autorisé
}

// ─── Middleware principal ──────────────────────────────────────────────────────

export default withAuth(
  function middleware(req: NextRequest & { nextauth: { token: any } }) {
    const { pathname } = req.nextUrl;

    // ── 1. Rate limiting sur les routes sensibles ──────────────────────────
    // On applique le limiteur uniquement sur les méthodes POST (lectures non limitées)
    if (req.method === "POST" && RATE_LIMITED_PATHS.some((p) => pathname.startsWith(p))) {

      // Récupération de l'IP réelle (derrière un proxy/CDN comme Vercel/Cloudflare)
      // x-forwarded-for peut contenir plusieurs IPs séparées par des virgules ;
      // on prend la première (IP client originale).
      const forwarded = req.headers.get("x-forwarded-for");
      const ip = forwarded ? forwarded.split(",")[0].trim() : "unknown";

      const blocked = checkRateLimit(ip, pathname);
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
    // Routes API d'authentification (rate limiting + contrôle accès)
    "/api/auth/register",
    "/api/auth/connexion",
    "/api/auth/reset-password",
    // Routes de paiement (accès authentifié uniquement)
    "/api/payments/:path*",
    // Route de contact (rate limiting anti-spam)
    "/api/contact",
  ],
};
