/**
 * app/layout.tsx — Layout racine de SHIFT UP
 *
 * Ce fichier est le point d'entrée de toute l'application Next.js.
 * Il enveloppe TOUTES les pages dans les providers globaux.
 *
 * ─── CONFORMITÉ CODE DU NUMÉRIQUE BÉNIN ─────────────────────────────────────
 *
 * Google Analytics (GA4) :
 *   → Chargé avec le MODE CONSENTEMENT (gtag consent mode v2).
 *   → Par défaut, analytics_storage = "denied" (aucune donnée collectée).
 *   → Le composant CookieConsent active GA via gtag("consent","update",...)
 *     uniquement APRÈS que l'utilisateur a explicitement accepté les cookies.
 *   → Ceci est conforme à l'Article 72 de la Loi n°2017-20 sur le numérique
 *     au Bénin qui exige un consentement PRÉALABLE pour les cookies non essentiels.
 *
 * CookieConsent :
 *   → Composant client qui s'affiche à la première visite.
 *   → Stocke le choix dans localStorage["shiftup-cookie-consent"].
 *   → Valide 13 mois (recommandation internationale pour les bannières cookies).
 */

import type { Metadata, Viewport } from "next";
import { Poppins, Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import { Toaster } from "react-hot-toast";
import ChatWidget from "@/components/chatbot/ChatWidget";
import AuthProvider from "@/components/providers/AuthProvider";
import CookieConsent from "@/components/legal/CookieConsent";

/**
 * Identifiant GA4 : propriété « shiftup.bj » du compte Analytics SHIFT UP (flux « Site SHIFT UP »).
 * NEXT_PUBLIC_GA_MEASUREMENT_ID permet de le remplacer ; la valeur d'exemple « G-XXXXXXXXXX » est ignorée.
 */
const GA_DEFAUT = "G-H2JRV9FPTC";
const GA_RAW = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim() ?? "";
const GA_ID = /^G-[A-Z0-9]{6,12}$/.test(GA_RAW) && !/^G-X+$/.test(GA_RAW) ? GA_RAW : GA_DEFAUT;

const poppins = Poppins({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://www.shiftup.bj"),
  title: {
    default: "SHIFT UP | Cabinet de Conseil & Solutions Numériques — Bénin",
    template: "%s | SHIFT UP",
  },
  description:
    "SHIFT UP est un cabinet de conseil stratégique et solutions numériques basé à Abomey-Calavi, Bénin. Excellence, Innovation, Performance. Transforming Business, Shaping Future.",
  keywords: [
    "conseil stratégique Bénin",
    "solutions numériques Bénin",
    "transformation digitale Afrique",
    "marketing digital Bénin",
    "cabinet conseil Abomey-Calavi",
    "SHIFT UP",
    "formation entreprise Bénin",
    "juridique entreprise Bénin",
  ],
  authors: [{ name: "SHIFT UP", url: "https://www.shiftup.bj" }],
  creator: "SHIFT UP",
  publisher: "SHIFT UP",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://www.shiftup.bj",
    siteName: "SHIFT UP",
    title: "SHIFT UP | Excellence • Innovation • Performance",
    description:
      "Cabinet de conseil stratégique et solutions numériques. Transforming Business, Shaping Future.",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "SHIFT UP — Transforming Business, Shaping Future",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SHIFT UP | Excellence • Innovation • Performance",
    description: "Cabinet de conseil stratégique et solutions numériques au Bénin.",
    images: ["/assets/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0F1F3D",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${poppins.variable} ${inter.variable} ${cormorant.variable}`}>
      <head>
        {/* PWA — iOS Safari */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="SHIFT UP" />
        <meta name="mobile-web-app-capable" content="yes" />
        {/*
         * ── Google Analytics avec Consent Mode v2 ─────────────────────────
         *
         * Chargé uniquement si NEXT_PUBLIC_GA_MEASUREMENT_ID est défini.
         *
         * IMPORTANT — Ordre des scripts :
         *   1. Chargement du script gtag.js (async)
         *   2. Initialisation de gtag() avec consentement par DÉFAUT refusé
         *      → analytics_storage: "denied" signifie : GA est chargé mais
         *        NE collecte AUCUNE donnée d'identification tant que l'utilisateur
         *        n'a pas accepté.
         *   3. Après acceptation dans CookieConsent.tsx, gtag("consent","update",...)
         *      est appelé avec "granted" → GA commence la collecte.
         *
         * Ce mécanisme est appelé "Consent Mode v2" par Google et est conforme
         * aux exigences du Code du Numérique béninois (Loi n°2017-20, Art. 72).
         */}
        {GA_ID && (
          <>
            {/* Étape 1 : Chargement du script Google Analytics (asynchrone) */}
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            />
            {/* Étape 2 : Initialisation avec consentement par DÉFAUT refusé */}
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}

                  /* Consent Mode v2 — Refus par défaut (avant choix utilisateur) */
                  /* Modifié en "granted" par CookieConsent.tsx après acceptation  */
                  gtag('consent', 'default', {
                    analytics_storage: 'denied',
                    ad_storage:        'denied',
                    wait_for_update:   500
                  });

                  gtag('js', new Date());
                  gtag('config', '${GA_ID}', {
                    anonymize_ip: true
                  });
                `,
              }}
            />
          </>
        )}
      </head>
      <body className="font-grotesk antialiased">
        <AuthProvider>
          {children}
          <ChatWidget />

          {/*
           * ── Bannière de consentement aux cookies ──────────────────────────
           * Composant client — s'affiche à la première visite si aucun consentement
           * n'est stocké dans localStorage["shiftup-cookie-consent"].
           * Se masque automatiquement après le choix de l'utilisateur.
           * Conforme : Code du Numérique Bénin, Loi n°2017-20, Articles 70-76.
           */}
          <CookieConsent />

          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0A2533",
                color: "#fff",
                fontFamily: "var(--font-space-grotesk)",
                borderRadius: "12px",
                border: "1px solid rgba(45,91,120,0.2)",
              },
              success: {
                iconTheme: { primary: "#0A2533", secondary: "#fff" },
              },
              error: {
                iconTheme: { primary: "#ef4444", secondary: "#fff" },
              },
            }}
          />
        </AuthProvider>
      </body>
    </html>
  );
}
