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
import { motion, AnimatePresence } from "framer-motion";
import { registerSchema, passwordStrength } from "@/lib/validation";
import { HCaptchaField } from "@/components/ui/HCaptchaField";

const schema = registerSchema;

type FormData = z.infer<typeof schema>;

const roles = [
  {
    value: "CLIENT",
    label: "Client",
    icon: "fas fa-briefcase",
    description: "Accédez à nos services et suivez vos prestations",
    color: "from-primary to-accent",
  },
  {
    value: "APPORTEUR",
    label: "Apporteur d'affaires",
    icon: "fas fa-handshake",
    description: "Recommandez nos services et gagnez des commissions",
    color: "from-primary to-accent",
  },
  {
    value: "ETUDIANT",
    label: "Étudiant",
    icon: "fas fa-graduation-cap",
    description: "Accédez aux ressources, formations et micro-tâches rémunérées",
    color: "from-primary to-accent",
  },
];

export default function InscriptionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [pwdValue, setPwdValue] = useState("");
  const [captchaToken, setCaptchaToken] = useState("");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: "CLIENT", acceptTerms: false },
  });

  const selectedRole = watch("role");

  const onSubmit = async (data: FormData) => {
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) {
      toast.error("Veuillez compléter le captcha.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, captchaToken }),
      });

      const json = await res.json();
      if (res.ok) {
        toast.success("Compte créé ! Connexion en cours...");
        await signIn("credentials", {
          email: data.email,
          password: data.password,
          redirect: false,
        });
        router.push("/dashboard/client");
      } else {
        toast.error(json.error || "Erreur lors de la création du compte");
      }
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="font-syne font-black text-3xl text-primary mb-2">Créer un compte</h1>
      <p className="text-gray-500 mb-6">
        Déjà inscrit ?{" "}
        <Link href="/connexion" className="text-accent font-semibold hover:underline">
          Se connecter
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Role selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">Votre profil</label>
          <div className="grid gap-3">
            {roles.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => setValue("role", role.value as "CLIENT" | "APPORTEUR" | "ETUDIANT")}
                className={`flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                  selectedRole === role.value
                    ? "border-accent bg-accent/5"
                    : "border-gray-100 hover:border-gray-200 bg-white"
                }`}
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${role.color} rounded-xl flex items-center justify-center flex-shrink-0`}>
                  <i className={`${role.icon} text-white text-sm`} />
                </div>
                <div>
                  <p className={`font-semibold text-sm ${selectedRole === role.value ? "text-accent" : "text-primary"}`}>
                    {role.label}
                  </p>
                  <p className="text-gray-400 text-xs">{role.description}</p>
                </div>
                {selectedRole === role.value && (
                  <i className="fas fa-check-circle text-accent ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Name & Email */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="f-name" className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
            <input
              id="f-name"
              {...register("name")}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Jean Dupont"
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label htmlFor="f-phone" className="block text-sm font-medium text-gray-700 mb-2">Téléphone</label>
            <input
              id="f-phone"
              {...register("phone")}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="+229 01 XX XX XX XX"
            />
          </div>
        </div>

        <div>
          <label htmlFor="f-email" className="block text-sm font-medium text-gray-700 mb-2">Adresse email *</label>
          <input
            id="f-email"
            {...register("email")}
            type="email"
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
            placeholder="vous@exemple.com"
          />
          {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>}
        </div>

        {/* Password */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="f-password" className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
            <div className="relative">
              <input
                id="f-password"
                {...register("password")}
                type={showPwd ? "text" : "password"}
                className="w-full border border-gray-200 rounded-xl px-4 pr-11 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                placeholder="Min 8 car., majuscule, chiffre, symbole"
                onChange={(e) => { register("password").onChange(e); setPwdValue(e.target.value); }}
              />
              <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                <i className={`fas fa-${showPwd ? "eye-slash" : "eye"} text-sm`} />
              </button>
            </div>
            {pwdValue && <PasswordStrengthBar value={pwdValue} />}
            {errors.password && <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>}
          </div>
          <div>
            <label htmlFor="f-confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">Confirmer *</label>
            <input
              id="f-confirmPassword"
              {...register("confirmPassword")}
              type="password"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Répéter le mot de passe"
            />
            {errors.confirmPassword && <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>}
          </div>
        </div>

        {/* Conditional fields — CLIENT */}
        <AnimatePresence>
          {selectedRole === "CLIENT" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 space-y-3">
                <p className="text-sm font-semibold text-accent flex items-center gap-2">
                  <i className="fas fa-building" />Informations entreprise (optionnel)
                </p>
                <input
                  {...register("companyName")}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                  placeholder="Nom de l'entreprise"
                />
                <div className="grid grid-cols-2 gap-3">
                  <input
                    {...register("rccm")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="N° RCCM"
                  />
                  <input
                    {...register("ifu")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="N° IFU"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <input
                    {...register("cnss")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="N° CNSS"
                  />
                  <input
                    {...register("rib")}
                    className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="RIB bancaire"
                  />
                </div>
                <p className="text-xs text-gray-400">Ces informations sont utilisées pour la facturation et peuvent être complétées depuis votre profil.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conditional fields — APPORTEUR */}
        <AnimatePresence>
          {selectedRole === "APPORTEUR" && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
              <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-4">
                <label htmlFor="f-ifu" className="block text-sm font-medium text-gray-700 mb-2">
                  <i className="fas fa-id-card text-secondary mr-2" />
                  IFU (requis pour les apporteurs)
                </label>
                <input
                  id="f-ifu"
                  {...register("ifu")}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-secondary transition-colors"
                  placeholder="Votre numéro IFU"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div>
          <label htmlFor="f-affiliationCode" className="block text-sm font-medium text-gray-700 mb-2">
            Code d'affiliation (optionnel)
          </label>
          <input
            id="f-affiliationCode"
            {...register("affiliationCode")}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent transition-colors"
            placeholder="Code de parrainage"
          />
        </div>

        {/* Terms */}
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            {...register("acceptTerms")}
            type="checkbox"
            className="mt-0.5 w-4 h-4 rounded text-accent border-gray-300 focus:ring-accent"
          />
          <span className="text-sm text-gray-600">
            J'accepte les{" "}
            <Link href="/cgv" className="text-accent hover:underline">conditions générales</Link>{" "}
            et la{" "}
            <Link href="/confidentialite" className="text-accent hover:underline">politique de confidentialité</Link>
          </span>
        </label>
        {errors.acceptTerms && <p className="text-red-500 text-xs -mt-3">{errors.acceptTerms.message}</p>}

        <div className="flex justify-center">
          <HCaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
        </div>

        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
          {loading ? "Création du compte..." : "Créer mon compte"}
          {!loading && <i className="fas fa-user-plus" />}
        </Button>
      </form>
    </div>
  );
}

function PasswordStrengthBar({ value }: { value: string }) {
  const score = passwordStrength(value);
  const labels = ["", "Faible", "Moyen", "Fort", "Très fort"];
  const colors = ["", "bg-red-400", "bg-amber-400", "bg-primary-400", "bg-primary-500"];
  const textColors = ["", "text-red-500", "text-amber-500", "text-primary-600", "text-primary-600"];
  const rules = [
    { ok: value.length >= 8,           label: "8 caractères min." },
    { ok: /[A-Z]/.test(value),         label: "Majuscule" },
    { ok: /[a-z]/.test(value),         label: "Minuscule" },
    { ok: /[0-9]/.test(value),         label: "Chiffre" },
    { ok: /[^A-Za-z0-9]/.test(value),  label: "Caractère spécial" },
  ];
  return (
    <div className="mt-2 space-y-1.5">
      <div className="flex gap-1 h-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex-1 rounded-full transition-colors duration-300 ${score >= i ? colors[score] : "bg-gray-200"}`} />
        ))}
      </div>
      {score > 0 && (
        <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
      )}
      <div className="flex flex-wrap gap-x-3 gap-y-0.5">
        {rules.map((r) => (
          <span key={r.label} className={`text-[11px] flex items-center gap-1 ${r.ok ? "text-primary-600" : "text-gray-400"}`}>
            <i className={`fas fa-${r.ok ? "check" : "times"} text-[9px]`} />
            {r.label}
          </span>
        ))}
      </div>
    </div>
  );
}
