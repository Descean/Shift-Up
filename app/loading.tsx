import Image from "next/image";

export default function Loading() {
  return (
    <div className="fixed inset-0 bg-primary z-50 flex flex-col items-center justify-center gap-8">
      <div className="relative flex items-center justify-center">
        {/* Anneau animé */}
        <svg
          className="animate-spin"
          width={120}
          height={120}
          viewBox="0 0 120 120"
          fill="none"
          aria-hidden
        >
          <circle
            cx={60}
            cy={60}
            r={54}
            stroke="rgba(45,91,120,0.15)"
            strokeWidth={4}
          />
          <path
            d="M 60 6 A 54 54 0 0 1 114 60"
            stroke="url(#spin-gradient)"
            strokeWidth={4}
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="spin-gradient" x1="60" y1="6" x2="114" y2="60" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#2D5B78" />
              <stop offset="100%" stopColor="#8FAEC2" />
            </linearGradient>
          </defs>
        </svg>

        {/* Logo centré dans l'anneau */}
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src="/assets/logo-icon.png"
            alt="SHIFT UP"
            width={72}
            height={72}
            className="object-contain"
            priority
          />
        </div>
      </div>

      {/* Nom de la marque */}
      <p className="text-white font-bold text-2xl tracking-widest">SHIFT UP</p>
      <p className="text-white/40 text-xs -mt-6">Chargement…</p>
    </div>
  );
}
