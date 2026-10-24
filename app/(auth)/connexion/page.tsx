"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { HCaptchaField } from "@/components/ui/HCaptchaField";

const schema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Mot de passe trop court"),
});

type FormData = z.infer<typeof schema>;

const codeSchema = z.object({
  code: z.string().min(6, "Code à 6 chiffres requis").max(6),
});

type CodeFormData = z.infer<typeof codeSchema>;

export default function ConnexionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  // ── Étape 2FA : credentials déjà validés, code TOTP requis ─────────────────
  const [needs2FA, setNeeds2FA] = useState(false);
  const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string } | null>(null);
  const [codeError, setCodeError] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    formState: { errors: codeErrors },
  } = useForm<CodeFormData>({ resolver: zodResolver(codeSchema) });

  async function trySignIn(email: string, password: string, code?: string) {
    const result = await signIn("credentials", {
      email,
      password,
      ...(code ? { code } : {}),
      redirect: false,
    });

    if (result?.error === "2FA_REQUIRED") {
      setPendingCreds({ email, password });
      setNeeds2FA(true);
      return;
    }
    if (result?.error === "2FA_INVALID") {
      setCodeError("Code incorrect. Réessayez.");
      return;
    }
    if (result?.error === "RATE_LIMITED") {
      toast.error("Trop de tentatives. Réessayez dans quelques minutes.");
      return;
    }
    if (result?.error) {
      toast.error("Email ou mot de passe incorrect");
      return;
    }

    toast.success("Connexion réussie !");
    router.push("/dashboard/client");
  }

  const onSubmit = async (data: FormData) => {
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) {
      toast.error("Veuillez compléter le captcha.");
      return;
    }
    setLoading(true);
    try {
      await trySignIn(data.email, data.password);
    } catch {
      toast.error("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmitCode = async (data: CodeFormData) => {
    if (!pendingCreds) return;
    setLoading(true);
    setCodeError("");
    try {
      await trySignIn(pendingCreds.email, pendingCreds.password, data.code);
    } catch {
      toast.error("Erreur de connexion. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // ── Écran 2FA ────────────────────────────────────────────────────────────
  if (needs2FA) {
    return (
      <div>
        <h1 className="font-syne font-black text-3xl text-primary mb-2">Vérification en 2 étapes</h1>
        <p className="text-gray-500 mb-8">
          Entrez le code à 6 chiffres généré par votre application d&apos;authentification.
        </p>
        <form onSubmit={handleSubmitCode(onSubmitCode)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Code de vérification</label>
            <input
              {...registerCode("code")}
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="w-full border border-gray-200 rounded-xl px-4 py-3.5 text-center text-2xl tracking-[0.5em] font-mono focus:outline-none focus:border-accent transition-colors"
              placeholder="······"
            />
            {codeErrors.code && <p className="text-red-500 text-xs mt-1">{codeErrors.code.message}</p>}
            {codeError && <p className="text-red-500 text-xs mt-1">{codeError}</p>}
          </div>
          <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
            {loading ? "Vérification..." : "Valider"}
          </Button>
          <button
            type="button"
            onClick={() => { setNeeds2FA(false); setPendingCreds(null); setCodeError(""); }}
            className="w-full text-sm text-gray-400 hover:text-gray-600 text-center"
          >
            ← Retour
          </button>
        </form>
      </div>
    );
  }

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/dashboard/client" });
  };

  return (
    <div>
      {/* Logo desktop */}
      <Link href="/" className="hidden lg:flex items-center gap-2 mb-8">
        <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0">
          <Image
            src="/assets/logo-icon.png"
            alt="SHIFT UP"
            width={40}
            height={40}
            className="w-full h-full object-contain brightness-0"
          />
        </div>
        <div>
          <p className="font-syne font-bold text-primary text-lg leading-none">SHIFT UP</p>
          <p className="text-accent text-[9px] tracking-widest uppercase">Excellence • Innovation</p>
        </div>
      </Link>

      <h1 className="font-syne font-black text-3xl text-primary mb-2">Bon retour !</h1>
      <p className="text-gray-500 mb-8">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="text-accent font-semibold hover:underline">
          S'inscrire gratuitement
        </Link>
      </p>

      {/* Google OAuth */}
      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className="w-full flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 px-5 py-3.5 rounded-xl font-semibold text-gray-700 transition-all duration-200 mb-6 disabled:opacity-50"
      >
        {googleLoading ? (
          <span className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continuer avec Google
      </button>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 h-px bg-gray-100" />
        <span className="text-gray-400 text-sm">ou par email</span>
        <div className="flex-1 h-px bg-gray-100" />
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div>
          <label htmlFor="f-email" className="block text-sm font-medium text-gray-700 mb-2">Adresse email</label>
          <div className="relative">
            <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              id="f-email"
              {...register("email")}
              type="email"
              className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="vous@exemple.com"
            />
          </div>
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label htmlFor="f-password" className="text-sm font-medium text-gray-700">Mot de passe</label>
            <Link href="/mot-de-passe-oublie" className="text-xs text-accent hover:underline">
              Mot de passe oublié ?
            </Link>
          </div>
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              id="f-password"
              {...register("password")}
              type={showPwd ? "text" : "password"}
              className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className={`fas fa-${showPwd ? "eye-slash" : "eye"} text-sm`} />
            </button>
          </div>
          {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
        </div>

        <div className="flex justify-center">
          <HCaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
        </div>

        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
          {loading ? "Connexion..." : "Se connecter"}
          {!loading && <i className="fas fa-arrow-right" />}
        </Button>
      </form>
    </div>
  );
}
