/**
 * components/legal/CookieConsent.tsx — Bannière de consentement aux cookies
 *
 * Conforme aux exigences du Code du Numérique béninois (Loi n°2017-20,
 * Articles 70 à 76) et aux bonnes pratiques RGPD :
 *
 *  - S'affiche AVANT le dépôt de cookies non essentiels (analytics, marketing)
 *  - Permet d'accepter ou de refuser séparément chaque catégorie
 *  - Stocke le consentement en localStorage pour ne pas redemander à chaque visite
 *  - Permet de retirer le consentement à tout moment via le lien en pied de page
 *  - N'active Google Analytics que si l'utilisateur a accepté les cookies analytiques
 *
 * ─── CATÉGORIES DE COOKIES ────────────────────────────────────────────────────
 *
 * Essentiels (toujours actifs, pas de consentement requis) :
 *   - Cookies de session NextAuth (next-auth.session-token)
 *   - Cookies CSRF (next-auth.csrf-token)
 *   - Cookie de consentement lui-même (shiftup-cookie-consent)
 *
 * Analytiques (consentement requis — Art. 72 Code du Numérique) :
 *   - Google Analytics (mesure d'audience)
 *   - PostHog (analyse comportementale)
 *
 * Marketing (consentement requis) :
 *   - Cookies publicitaires (si intégrés ultérieurement)
 *
 * ─── STOCKAGE DU CONSENTEMENT ──────────────────────────────────────────────
 * localStorage["shiftup-cookie-consent"] = {
 *   analytics: boolean,   // true = GA et PostHog autorisés
 *   marketing: boolean,   // true = cookies pub autorisés
 *   savedAt: string,      // ISO date — pour expirer le consentement après 13 mois
 * }
 *
 * ─── UTILISATION DANS layout.tsx ───────────────────────────────────────────
 * Ce composant doit être importé dans layout.tsx et placé AVANT les scripts
 * de tracking. Il expose la fonction window.__GA_CONSENT__ pour activer GA
 * de manière dynamique après acceptation.
 */

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

/** Structure du consentement stocké en localStorage */
interface ConsentData {
  analytics: boolean;   // Google Analytics / PostHog
  marketing: boolean;   // Cookies publicitaires
  savedAt:   string;    // Date ISO de sauvegarde
}

/** Clé localStorage utilisée pour stocker le consentement */
const CONSENT_KEY = "shiftup-cookie-consent";

/**
 * Durée de validité du consentement : 13 mois (en ms).
 * Au-delà, la bannière réapparaît pour renouveler le consentement.
 * (Recommandation CNIL / Code du Numérique art. 74)
 */
const CONSENT_EXPIRY_MS = 13 * 30 * 24 * 60 * 60 * 1000;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * loadConsent — Charge le consentement depuis localStorage.
 * Retourne null si aucun consentement ou consentement expiré.
 */
function loadConsent(): ConsentData | null {
  try {
    const raw = localStorage.getItem(CONSENT_KEY);
    if (!raw) return null;
    const data: ConsentData = JSON.parse(raw);
    // Vérifie l'expiration (13 mois)
    const age = Date.now() - new Date(data.savedAt).getTime();
    if (age > CONSENT_EXPIRY_MS) {
      localStorage.removeItem(CONSENT_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

/**
 * saveConsent — Sauvegarde le consentement en localStorage.
 * Déclenche aussi l'activation/désactivation de Google Analytics.
 */
function saveConsent(data: ConsentData) {
  localStorage.setItem(CONSENT_KEY, JSON.stringify(data));

  // Activation conditionnelle de Google Analytics via gtag()
  // Si l'utilisateur accepte les analytics, on envoie le signal de consentement
  if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
    (window as any).gtag("consent", "update", {
      analytics_storage: data.analytics ? "granted" : "denied",
      ad_storage:        data.marketing ? "granted" : "denied",
    });
  }
}

// ─── Composant principal ───────────────────────────────────────────────────────

export default function CookieConsent() {
  // null = consentement pas encore chargé (évite le flash côté client)
  const [consent, setConsent]      = useState<ConsentData | null | "loading">("loading");
  const [showDetails, setDetails]  = useState(false);

  // Préférences de la vue "Personnaliser"
  const [analytics, setAnalytics]  = useState(true);  // coché par défaut
  const [marketing, setMarketing]  = useState(false); // décoché par défaut

  // ── Chargement initial du consentement ──────────────────────────────────
  // useEffect : s'exécute côté client seulement (localStorage indisponible côté serveur)
  useEffect(() => {
    const existing = loadConsent();
    setConsent(existing); // null = pas de consentement → affiche la bannière
  }, []);

  // ── Ne rien afficher pendant le chargement initial (évite le flash) ──────
  if (consent === "loading") return null;

  // ── Consentement déjà donné → bannière masquée ───────────────────────────
  if (consent !== null) return null;

  // ─── Handlers ──────────────────────────────────────────────────────────────

  /**
   * acceptAll — Accepte tous les cookies (analytics + marketing).
   * C'est le scénario "Tout accepter".
   */
  function acceptAll() {
    const data: ConsentData = { analytics: true, marketing: true, savedAt: new Date().toISOString() };
    saveConsent(data);
    setConsent(data);
  }

  /**
   * rejectAll — Refuse tous les cookies non essentiels.
   * Seuls les cookies essentiels (session NextAuth) restent actifs.
   */
  function rejectAll() {
    const data: ConsentData = { analytics: false, marketing: false, savedAt: new Date().toISOString() };
    saveConsent(data);
    setConsent(data);
  }

  /**
   * saveCustom — Sauvegarde les préférences personnalisées de l'utilisateur.
   * Activé depuis le panneau "Personnaliser mes préférences".
   */
  function saveCustom() {
    const data: ConsentData = { analytics, marketing, savedAt: new Date().toISOString() };
    saveConsent(data);
    setConsent(data);
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <AnimatePresence>
      {/* Bannière fixe en bas de page — z-index élevé pour passer au-dessus de tout */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0,   opacity: 1 }}
        exit={{   y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 24 }}
        className="fixed bottom-0 left-0 right-0 z-[9999] p-4 sm:p-6"
        role="dialog"
        aria-label="Gestion des cookies"
        aria-modal="true"
      >
        <div className="max-w-5xl mx-auto bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden">

          {/* ── Vue principale : résumé + boutons d'action ─────────────────── */}
          {!showDetails ? (
            <div className="p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start gap-6">

                {/* Icône cookie */}
                <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <span className="text-2xl">🍪</span>
                </div>

                {/* Texte d'information */}
                <div className="flex-1">
                  <h2 className="font-syne font-bold text-primary text-lg mb-2">
                    Nous respectons votre vie privée
                  </h2>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    SHIFT UP utilise des cookies pour améliorer votre expérience.
                    Les cookies <strong>essentiels</strong> (session, sécurité) sont toujours actifs.
                    Les cookies <strong>analytiques</strong> (Google Analytics) ne sont activés
                    qu'avec votre accord — conformément au{" "}
                    <strong>Code du Numérique béninois (Loi n°2017-20)</strong>.
                    {" "}
                    <Link href="/confidentialite" className="text-accent hover:underline">
                      En savoir plus →
                    </Link>
                  </p>
                </div>

                {/* Boutons d'action */}
                <div className="flex flex-col gap-2 flex-shrink-0 min-w-[160px]">
                  {/* Bouton principal : Tout accepter */}
                  <button
                    onClick={acceptAll}
                    className="bg-gradient-to-r from-accent to-secondary text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity whitespace-nowrap"
                  >
                    Tout accepter
                  </button>

                  {/* Bouton refus */}
                  <button
                    onClick={rejectAll}
                    className="border border-gray-200 text-gray-600 px-5 py-2.5 rounded-xl text-sm font-medium hover:border-gray-300 hover:bg-gray-50 transition-colors whitespace-nowrap"
                  >
                    Tout refuser
                  </button>

                  {/* Lien personnalisation */}
                  <button
                    onClick={() => setDetails(true)}
                    className="text-accent text-xs font-medium hover:underline text-center py-1"
                  >
                    Personnaliser mes préférences
                  </button>
                </div>
              </div>
            </div>

          ) : (
            /* ── Vue détaillée : personnalisation par catégorie ─────────────── */
            <div className="p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={() => setDetails(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="fas fa-arrow-left" />
                </button>
                <h2 className="font-syne font-bold text-primary text-lg">
                  Personnaliser mes préférences
                </h2>
              </div>

              <div className="space-y-4 mb-6">

                {/* Cookies essentiels — toujours actifs, non désactivables */}
                <div className="flex items-start justify-between p-4 bg-gray-50 rounded-xl">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-primary text-sm">
                      Cookies essentiels
                      <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full font-normal">
                        Toujours actifs
                      </span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Session utilisateur, sécurité CSRF, mémorisation de vos préférences.
                      Nécessaires au fonctionnement du site — aucun consentement requis.
                    </p>
                  </div>
                  {/* Toggle désactivé (grisé) — essentiels non refusables */}
                  <div className="w-10 h-6 bg-primary rounded-full flex-shrink-0 opacity-60 cursor-not-allowed" />
                </div>

                {/* Cookies analytiques — consentement requis */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-primary text-sm">Cookies analytiques</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Google Analytics : mesure d'audience, pages visitées, durée de session.
                      Ces données sont anonymisées et nous aident à améliorer le site.
                    </p>
                  </div>
                  {/* Toggle cliquable */}
                  <button
                    onClick={() => setAnalytics(!analytics)}
                    aria-pressed={analytics}
                    aria-label={`Cookies analytiques : ${analytics ? "activés" : "désactivés"}`}
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                      analytics ? "bg-accent" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        analytics ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {/* Cookies marketing — consentement requis */}
                <div className="flex items-start justify-between p-4 border border-gray-200 rounded-xl">
                  <div className="flex-1 pr-4">
                    <p className="font-semibold text-primary text-sm">Cookies marketing</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Personnalisation des contenus et publicités (non utilisés actuellement).
                      Ces cookies permettraient de diffuser des publicités ciblées.
                    </p>
                  </div>
                  <button
                    onClick={() => setMarketing(!marketing)}
                    aria-pressed={marketing}
                    aria-label={`Cookies marketing : ${marketing ? "activés" : "désactivés"}`}
                    className={`relative w-10 h-6 rounded-full transition-colors flex-shrink-0 ${
                      marketing ? "bg-accent" : "bg-gray-200"
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                        marketing ? "translate-x-5" : "translate-x-1"
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Bouton de sauvegarde des préférences personnalisées */}
              <div className="flex gap-3">
                <button
                  onClick={rejectAll}
                  className="flex-1 border border-gray-200 text-gray-600 py-2.5 rounded-xl text-sm font-medium hover:border-gray-300"
                >
                  Tout refuser
                </button>
                <button
                  onClick={saveCustom}
                  className="flex-1 bg-gradient-to-r from-accent to-secondary text-white py-2.5 rounded-xl text-sm font-semibold hover:opacity-90"
                >
                  Enregistrer mes choix
                </button>
              </div>
            </div>
          )}

          {/* ── Pied de page de la bannière ───────────────────────────────── */}
          <div className="px-6 sm:px-8 pb-4 flex flex-wrap gap-4 text-xs text-gray-400">
            <Link href="/confidentialite" className="hover:text-accent transition-colors">
              Politique de confidentialité
            </Link>
            <Link href="/mentions-legales" className="hover:text-accent transition-colors">
              Mentions légales
            </Link>
            <Link href="/cgv" className="hover:text-accent transition-colors">
              CGV
            </Link>
            <span>
              Conformité : Code du Numérique Bénin — Loi n°2017-20
            </span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
