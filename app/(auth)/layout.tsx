import Link from "next/link";
import Image from "next/image";
import PanneauAuth from "@/components/auth/PanneauAuth";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-su-nuit">
      {/* Panneau de gauche (ordinateur) */}
      <div className="relative hidden w-1/2 flex-col justify-between overflow-hidden p-12 lg:flex">
        <span aria-hidden="true" className="absolute left-[-200px] top-[-220px] h-[560px] w-[560px] rounded-full bg-su-cadet" />
        <span aria-hidden="true" className="absolute bottom-[-180px] right-[-160px] h-[460px] w-[460px] rounded-full border border-su-ciel/25" />

        <Link href="/" className="relative z-10 flex items-center gap-3">
          <Image src="/assets/logo-icon.png" alt="" width={44} height={44} className="h-11 w-11 object-contain brightness-0 invert" priority />
          <span>
            <span className="block font-bold text-2xl leading-none text-white">SHIFT UP</span>
            <span className="block text-[11px] text-su-ciel">Transforming Business, Shaping Future</span>
          </span>
        </Link>

        <PanneauAuth />

        <p className="relative z-10 m-0 text-xs text-su-ciel">Abomey-Calavi, Bénin · contact@shiftup.bj</p>
      </div>

      {/* Formulaire */}
      <div className="flex flex-1 items-center justify-center overflow-y-auto bg-white p-6 lg:rounded-l-[32px] lg:p-12">
        <div className="w-full max-w-md">
          <Link href="/" className="mb-8 flex items-center gap-2 lg:hidden">
            <Image src="/assets/logo-icon.png" alt="" width={36} height={36} className="h-9 w-9 object-contain brightness-0" />
            <span className="text-xl font-bold text-su-nuit">SHIFT UP</span>
          </Link>
          {children}
        </div>
      </div>
    </div>
  );
}
