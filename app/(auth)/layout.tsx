import Link from "next/link";
import Image from "next/image";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-primary flex">
      {/* Left branding panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-60" />
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: "linear-gradient(rgba(30,159,212,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(30,159,212,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Logo */}
        <Link href="/" className="relative z-10 flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0">
            <Image
              src="/assets/logo-icon.png"
              alt="SHIFT UP"
              width={48}
              height={48}
              className="w-full h-full object-contain brightness-0 invert"
              priority
            />
          </div>
          <div>
            <p className="text-white font-syne font-bold text-2xl leading-none">SHIFT UP</p>
            <p className="text-accent/80 text-[10px] tracking-widest uppercase">Transforming Business</p>
          </div>
        </Link>

        {/* Center content */}
        <div className="relative z-10">
          <blockquote className="text-white/90 text-2xl font-syne font-bold leading-relaxed mb-8">
            "Rejoignez plus de 120 entreprises qui font confiance à SHIFT UP pour leur transformation."
          </blockquote>
          <div className="flex -space-x-3">
            {["KA", "AS", "PD", "MA", "OB"].map((initials, i) => (
              <div
                key={i}
                className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-secondary border-2 border-primary flex items-center justify-center text-white text-xs font-bold"
              >
                {initials}
              </div>
            ))}
            <div className="w-10 h-10 rounded-full bg-white/10 border-2 border-primary flex items-center justify-center text-white/60 text-xs">
              +115
            </div>
          </div>
        </div>

        {/* Bottom stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "120+", label: "Clients actifs" },
            { value: "98%", label: "Satisfaction" },
            { value: "6", label: "Domaines" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="font-syne font-black text-2xl text-white">{s.value}</p>
              <p className="text-white/40 text-xs">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12 bg-white lg:rounded-l-3xl overflow-y-auto">
        <div className="w-full max-w-md">
          {/* Logo (mobile uniquement — desktop : panneau gauche) */}
          <Link href="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src="/assets/logo-icon.png"
                alt="SHIFT UP"
                width={36}
                height={36}
                className="w-full h-full object-contain brightness-0"
              />
            </div>
            <span className="font-syne font-bold text-primary text-xl">SHIFT UP</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
