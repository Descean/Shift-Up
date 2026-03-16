/**
 * app/icon.tsx — Favicon dynamique SHIFT UP
 *
 * Next.js 14 génère automatiquement /icon.png à partir de ce fichier
 * via ImageResponse (Edge Runtime). Tailles exportées : 32×32 et 180×180.
 *
 * Pas besoin de fichier favicon.ico statique — Next.js gère tout.
 * Ce fichier remplace les favicons statiques et assure que la couleur
 * de la marque est toujours à jour.
 */

import { ImageResponse } from "next/og";

export const runtime = "edge";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          background: "linear-gradient(135deg, #0A2533 0%, #1E9FD4 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {/* Flèche vers le haut — symbole "SHIFT UP" */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
          }}
        >
          {/* Pointe de la flèche */}
          <div
            style={{
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderBottom: "9px solid #00D4A0",
            }}
          />
          {/* Corps de la flèche */}
          <div
            style={{
              width: 5,
              height: 10,
              background: "#00D4A0",
              borderRadius: 1,
            }}
          />
        </div>
      </div>
    ),
    { ...size }
  );
}
