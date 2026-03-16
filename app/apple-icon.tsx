/**
 * app/apple-icon.tsx — Icône Apple Touch auto-générée par Next.js 14
 *
 * Génère /apple-icon.png (180×180) utilisé sur iOS lors de l'ajout
 * à l'écran d'accueil via "Ajouter à l'écran d'accueil".
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 180,
          height: 180,
          borderRadius: 40,
          background: "linear-gradient(135deg, #0A2533 0%, #163548 60%, #0e2d42 100%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
        }}
      >
        {/* Flèche stylisée */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "28px solid transparent",
              borderRight: "28px solid transparent",
              borderBottom: "36px solid #00D4A0",
            }}
          />
          <div
            style={{
              width: 20,
              height: 32,
              background: "linear-gradient(180deg, #00D4A0 0%, #1E9FD4 100%)",
              borderRadius: 4,
            }}
          />
        </div>

        {/* Texte SHIFT UP */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: "white",
            letterSpacing: -0.5,
            marginTop: 4,
          }}
        >
          SHIFT{" "}
          <span style={{ color: "#1E9FD4" }}>UP</span>
        </div>
      </div>
    ),
    { ...size }
  );
}
