/**
 * app/loading.tsx — Écran de chargement global SHIFT UP
 *
 * Affiché par Next.js (Suspense) pendant le chargement initial d'une page
 * (navigation entre routes côté client, streaming SSR).
 *
 * Affiche un logo centré avec un anneau de progression animé.
 */

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-primary z-50 flex flex-col items-center justify-center gap-6">
      {/* Anneau tournant avec le logo au centre */}
      <div className="relative flex items-center justify-center">
        {/* Anneau animé */}
        <svg
          className="animate-spin"
          width={72}
          height={72}
          viewBox="0 0 72 72"
          fill="none"
          aria-hidden
        >
          <circle
            cx={36}
            cy={36}
            r={30}
            stroke="rgba(30,159,212,0.2)"
            strokeWidth={4}
          />
          <path
            d="M 36 6 A 30 30 0 0 1 66 36"
            stroke="url(#spin-gradient)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="spin-gradient" x1="36" y1="6" x2="66" y2="36" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E9FD4" />
              <stop offset="100%" stopColor="#00D4A0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Logo au centre */}
        <div className="absolute inset-0 flex items-center justify-center">
          {/* Flèche SHIFT UP */}
          <div className="flex flex-col items-center" style={{ gap: 3 }}>
            <div
              style={{
                width: 0,
                height: 0,
                borderLeft: "8px solid transparent",
                borderRight: "8px solid transparent",
                borderBottom: "10px solid #00D4A0",
              }}
            />
            <div
              style={{
                width: 6,
                height: 11,
                background: "linear-gradient(180deg, #00D4A0 0%, #1E9FD4 100%)",
                borderRadius: 2,
              }}
            />
          </div>
        </div>
      </div>

      {/* Nom de la marque */}
      <div className="text-center">
        <p className="font-syne font-black text-white text-lg tracking-widest">
          SHIFT <span style={{ color: "#1E9FD4" }}>UP</span>
        </p>
        <p className="text-white/40 text-xs mt-1">Chargement…</p>
      </div>
    </div>
  );
}
