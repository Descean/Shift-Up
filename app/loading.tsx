import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-primary z-50 flex flex-col items-center justify-center gap-6">
      {/* Anneau tournant avec le logo au centre */}
      <div className="relative flex items-center justify-center">
        {/* Anneau animé */}
        <svg
          className="animate-spin"
          width={96}
          height={96}
          viewBox="0 0 96 96"
          fill="none"
          aria-hidden
        >
          <circle
            cx={48}
            cy={48}
            r={42}
            stroke="rgba(30,159,212,0.15)"
            strokeWidth={4}
          />
          <path
            d="M 48 6 A 42 42 0 0 1 90 48"
            stroke="url(#spin-gradient)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="spin-gradient" x1="48" y1="6" x2="90" y2="48" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#1E9FD4" />
              <stop offset="100%" stopColor="#00D4A0" />
            </linearGradient>
          </defs>
        </svg>

        {/* Logo centré */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/assets/logo-icon.png"
            alt="SHIFT UP"
            width={48}
            height={48}
            className="object-contain brightness-0 invert"
            priority
          />
        </div>
      </div>

      {/* Nom de la marque */}
      <div className="text-center">
        <Image
          src="/assets/logo-full.png"
          alt="SHIFT UP"
          width={160}
          height={48}
          className="object-contain brightness-0 invert mx-auto"
          priority
        />
        <p className="text-white/40 text-xs mt-3">Chargement…</p>
      </div>
    </div>
  );
}
