import type { Metadata, Viewport } from "next";
import { Syne, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import ChatWidget from "@/components/chatbot/ChatWidget";
import AuthProvider from "@/components/providers/AuthProvider";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-syne",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "https://shiftup.bj"),
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
  authors: [{ name: "SHIFT UP", url: "https://shiftup.bj" }],
  creator: "SHIFT UP",
  publisher: "SHIFT UP",
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://shiftup.bj",
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
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#0A2533",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className={`${syne.variable} ${spaceGrotesk.variable}`}>
      <head>
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          crossOrigin="anonymous"
        />
        {/* Google Analytics */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <>
            <script
              async
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
            />
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  window.dataLayer = window.dataLayer || [];
                  function gtag(){dataLayer.push(arguments);}
                  gtag('js', new Date());
                  gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
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
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: "#0A2533",
                color: "#fff",
                fontFamily: "var(--font-space-grotesk)",
                borderRadius: "12px",
                border: "1px solid rgba(30,159,212,0.2)",
              },
              success: {
                iconTheme: { primary: "#00D4A0", secondary: "#fff" },
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
