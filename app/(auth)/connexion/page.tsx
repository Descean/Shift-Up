"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Icone } from "@/components/home/icones";
import { TitrePoints } from "@/components/site/Gabarit";
import { retourDepuisAdresse } from "@/lib/retour";
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
  // Accès par e-mail seul (par défaut) ou par mot de passe
  const [mode, setMode] = useState<"email" | "motdepasse">("email");
  const [emailAcces, setEmailAcces] = useState("");
  const [lienEnvoye, setLienEnvoye] = useState("");

  // ── Étape 2FA : credentials déjà validés, code TOTP requis ─────────────────
  const [needs2FA, setNeeds2FA] = useState(false);
  const [pendingCreds, setPendingCreds] = useState<{ email: string; password: string } | null>(null);
  const [codeError, setCodeError] = useState("");

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  async function acceder(e: React.FormEvent) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(emailAcces.trim())) { toast.error("Entrez une adresse e-mail valide."); return; }
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) { toast.error("Cochez la case anti-robot."); return; }
    setLoading(true);
    try {
      const suite = retourDepuisAdresse();
      const r = await fetch("/api/auth/acces", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: emailAcces.trim(), suite, captchaToken }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) { toast.error(d.error ?? "Connexion impossible."); return; }
      if (d.nouveau && d.jeton) {
        const res = await signIn("lien", { jeton: d.jeton, redirect: false });
        if (res?.error) { toast.error("Connexion impossible. Réessayez."); return; }
        router.push(suite);
        return;
      }
      if (d.lienEnvoye) { setLienEnvoye(emailAcces.trim()); return; }
      if (d.motDePasse) {
        setValue("email", emailAcces.trim());
        setMode("motdepasse");
        toast("Ce compte se connecte avec son mot de passe.");
      }
    } finally {
      setLoading(false);
    }
  }

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
    // Retour à la page demandée (ex. une offre choisie), sinon l'espace du rôle
    router.push(retourDepuisAdresse());
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
        <TitrePoints as="h1" taille="text-[30px]">Vérification en deux étapes</TitrePoints>
        <p className="mb-8 mt-3 text-[#4B5563]">
          Entrez le code à 6 chiffres généré par votre application d&apos;authentification.
        </p>
        <form onSubmit={handleSubmitCode(onSubmitCode)} className="space-y-5">
          <div>
            <label htmlFor="f-code" className="mb-1.5 block text-sm font-semibold text-su-nuit">Code de vérification</label>
            <input
              id="f-code"
              {...registerCode("code")}
              type="text"
              inputMode="numeric"
              maxLength={6}
              autoFocus
              className="w-full rounded-xl border border-su-lavande px-4 py-3.5 text-center font-mono text-2xl tracking-[0.5em] focus:border-su-bleu focus:outline-none"
              placeholder="······"
            />
            {codeErrors.code && <p className="text-red-500 text-xs mt-1">{codeErrors.code.message}</p>}
            {codeError && <p className="text-red-500 text-xs mt-1">{codeError}</p>}
          </div>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-su-bleu px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-su-cadet disabled:opacity-60">
            {loading ? "Vérification…" : "Valider"}
          </button>
          <button
            type="button"
            onClick={() => { setNeeds2FA(false); setPendingCreds(null); setCodeError(""); }}
            className="w-full text-center text-sm font-semibold text-su-bleu"
          >
            ← Retour
          </button>
        </form>
      </div>
    );
  }

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: retourDepuisAdresse() });
  };

  if (lienEnvoye) {
    return (
      <div className="text-center">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-su-brume text-su-bleu"><i className="fas fa-envelope-open-text text-2xl" /></div>
        <TitrePoints as="h1" taille="text-[28px]">Regardez votre boîte de réception</TitrePoints>
        <p className="mt-3 text-[15px] text-[#4B5563]">
          Un lien de connexion vient d&apos;être envoyé à <strong className="text-su-nuit">{lienEnvoye}</strong>. Il est valable 30 minutes.
        </p>
        <button type="button" onClick={() => setLienEnvoye("")} className="mt-6 text-sm font-semibold text-su-bleu">← Utiliser une autre adresse</button>
      </div>
    );
  }

  if (mode === "email") {
    return (
      <div>
        <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-su-nuit text-white"><i className="fas fa-layer-group text-2xl" /></div>
        <TitrePoints as="h1" taille="text-[30px]">Bienvenue sur SHIFT UP</TitrePoints>
        <p className="mb-8 mt-3 text-[15px] text-[#4B5563]">La plateforme dédiée au montage rapide et sécurisé de vos dossiers d&apos;appels d&apos;offres.</p>
        <form onSubmit={acceder} className="space-y-4 rounded-2xl border border-su-lavande p-6">
          <div>
            <label htmlFor="f-acces" className="mb-1.5 block text-sm font-semibold text-su-nuit">Entrez votre e-mail pour commencer</label>
            <input id="f-acces" type="email" autoComplete="email" value={emailAcces} onChange={(e) => setEmailAcces(e.target.value)}
              className="w-full rounded-xl border border-su-lavande bg-su-brume/40 px-4 py-3.5 text-[15px] text-su-nuit focus:border-su-bleu focus:outline-none" placeholder="vous@entreprise.com" />
          </div>
          <div className="flex justify-center"><HCaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} /></div>
          <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-su-nuit px-6 py-3.5 text-base font-semibold text-white transition-colors hover:bg-su-cadet disabled:opacity-60">
            {loading ? "Un instant…" : <>Accéder à mon espace <Icone nom="fleche" taille={18} epaisseur={2} /></>}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-[#6B7280]">
          Vous avez un mot de passe ?{" "}
          <button type="button" onClick={() => { setValue("email", emailAcces.trim()); setMode("motdepasse"); }} className="font-semibold text-su-bleu underline">Se connecter avec le mot de passe</button>
        </p>
      </div>
    );
  }

  return (
    <div>
      <button type="button" onClick={() => setMode("email")} className="mb-6 text-sm font-semibold text-su-bleu">← Accès par e-mail seul</button>
      <TitrePoints as="h1" taille="text-[32px]">Connexion</TitrePoints>
      <p className="mb-8 mt-3 text-[15px] text-[#4B5563]">
        Pas encore de compte ?{" "}
        <Link href="/inscription" className="font-semibold text-su-bleu underline"
          onClick={(e) => { e.preventDefault(); router.push(`/inscription${window.location.search}`); }}>Créer un compte</Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-5">
        <div>
          <label htmlFor="f-email" className="mb-1.5 block text-sm font-semibold text-su-nuit">Adresse e-mail</label>
          <input id="f-email" {...register("email")} type="email" autoComplete="email" className="w-full rounded-xl border border-su-lavande px-4 py-3.5 text-[15px] text-su-nuit transition-colors focus:border-su-bleu focus:outline-none" placeholder="vous@exemple.com" />
          {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex justify-between">
            <label htmlFor="f-password" className="text-sm font-semibold text-su-nuit">Mot de passe</label>
            <Link href="/mot-de-passe-oublie" className="text-[13px] font-semibold text-su-bleu hover:underline">Mot de passe oublié ?</Link>
          </div>
          <div className="relative">
            <input id="f-password" {...register("password")} type={showPwd ? "text" : "password"} autoComplete="current-password"
              className="w-full rounded-xl border border-su-lavande px-4 py-3.5 text-[15px] text-su-nuit transition-colors focus:border-su-bleu focus:outline-none pr-24" placeholder="••••••••" />
            <button type="button" onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[13px] font-semibold text-su-bleu">
              {showPwd ? "Masquer" : "Afficher"}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password.message}</p>}
        </div>

        <div className="flex justify-center">
          <HCaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
        </div>

        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-su-bleu px-6 py-4 text-base font-semibold text-white transition-colors hover:bg-su-cadet disabled:opacity-60">
          {loading ? "Connexion…" : <>Se connecter <Icone nom="fleche" taille={18} epaisseur={2} /></>}
        </button>
      </form>

      <div className="my-6 flex items-center gap-4">
        <span className="h-px flex-1 bg-su-lavande" />
        <span className="text-sm text-[#6B7280]">ou</span>
        <span className="h-px flex-1 bg-su-lavande" />
      </div>

      <button type="button" onClick={handleGoogle} disabled={googleLoading}
        className="flex w-full items-center justify-center gap-3 rounded-full border border-su-clair px-5 py-3.5 font-semibold text-su-nuit transition-colors hover:border-su-bleu disabled:opacity-50">
        {googleLoading ? (
          <span className="h-5 w-5 animate-spin rounded-full border-2 border-su-bleu border-t-transparent" />
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
        )}
        Continuer avec Google
      </button>
    </div>
  );
}
