"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { HCaptchaField } from "@/components/ui/HCaptchaField";

export interface ApporteurServiceProps {
  id: string;
  title: string;
  description: string;
  category: string;
  features: string[];
  priceMin: number;
  priceMax: number | null;
  currency: string;
  duration: string | null;
  providerName: string;
}

const t = (min: number, max: number, msg: string) =>
  z.string().max(max).transform((s) => s.trim()).pipe(z.string().min(min, msg));

const schema = z.object({
  name: t(2, 100, "Nom complet requis (2 caractères min)"),
  email: z.string().email("Email invalide"),
  phone: t(6, 30, "Téléphone requis"),
  brief: z.string().max(1000).transform((s) => s.trim()).optional(),
  consent: z.boolean().refine((v) => v === true, { message: "Consentement requis" }),
});

type FormData = z.infer<typeof schema>;

export default function ServiceLeadForm({ service }: { service: ApporteurServiceProps }) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const [captchaToken, setCaptchaToken] = useState("");

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    if (process.env.NEXT_PUBLIC_HCAPTCHA_SITE_KEY && !captchaToken) {
      toast.error("Veuillez compléter le captcha.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/apporteur-services/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, ...data, captchaToken }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de l'envoi");
      setSent(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Erreur lors de l'envoi";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl shadow-card-hover max-w-lg w-full p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-5 text-3xl">✅</div>
          <h1 className="font-syne font-black text-2xl text-primary mb-2">Demande envoyée !</h1>
          <p className="text-gray-500">
            Votre demande pour <strong>&laquo; {service.title} &raquo;</strong> a bien été transmise.
            Le prestataire vous contactera très prochainement pour finaliser les modalités.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-40 pointer-events-none" />
        <div className="container-custom relative z-10 text-center">
          <span className="inline-flex items-center gap-2 bg-white/10 text-accent-200 px-4 py-2 rounded-full text-sm font-medium mb-5">
            {service.category}
          </span>
          <h1 className="font-syne font-black text-3xl sm:text-4xl text-white leading-tight mb-3">
            {service.title}
          </h1>
          <p className="text-white/55 text-base max-w-xl mx-auto">
            Proposé par <strong className="text-white/80">{service.providerName}</strong>, partenaire SHIFT UP
          </p>
        </div>
      </section>

      <section className="bg-paper pb-20 -mt-6">
        <div className="container-custom max-w-2xl">

          <div className="bg-white rounded-2xl shadow-card p-6 mb-5 space-y-4">
            <p className="text-gray-600 leading-relaxed text-sm">{service.description}</p>
            {service.features.length > 0 && (
              <ul className="grid sm:grid-cols-2 gap-2">
                {service.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                    <i className="fas fa-check text-secondary text-[10px] flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-gray-100">
              <div>
                <p className="text-xs text-gray-400">Tarif indicatif</p>
                <p className="font-syne font-black text-xl text-primary">
                  {service.priceMin.toLocaleString("fr-FR")}
                  {service.priceMax ? ` – ${service.priceMax.toLocaleString("fr-FR")}` : "+"}
                  <span className="text-sm font-normal text-gray-400 ml-1">{service.currency}</span>
                </p>
              </div>
              {service.duration && (
                <div className="text-right">
                  <p className="text-xs text-gray-400">Délai</p>
                  <p className="font-semibold text-primary text-sm">{service.duration}</p>
                </div>
              )}
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="bg-white border border-gray-100 rounded-2xl p-5 sm:p-6 shadow-card space-y-4">
            <p className="text-xs font-bold uppercase tracking-widest text-accent mb-1">
              Je suis intéressé(e) par ce service
            </p>

            <Field label="Nom complet" error={errors.name?.message} required>
              <input {...register("name")} placeholder="Votre nom complet" className={inputCls(!!errors.name)} />
            </Field>
            <Field label="Adresse e-mail" error={errors.email?.message} required>
              <input type="email" {...register("email")} placeholder="votre@email.com" className={inputCls(!!errors.email)} />
            </Field>
            <Field label="Téléphone / WhatsApp" error={errors.phone?.message} required>
              <input type="tel" {...register("phone")} placeholder="+229 01 XX XX XX XX" className={inputCls(!!errors.phone)} />
            </Field>
            <Field label="Décrivez votre besoin" hint="Optionnel">
              <textarea {...register("brief")} rows={3} placeholder="Contexte, délai souhaité, précisions utiles..." className={inputCls(false) + " resize-y min-h-[80px]"} />
            </Field>

            <label className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 cursor-pointer">
              <input type="checkbox" {...register("consent")} className="mt-0.5 accent-accent flex-shrink-0" />
              <p className="text-sm text-amber-900 leading-relaxed">
                J'accepte d'être contacté(e) par le prestataire et par SHIFT UP au sujet de cette demande.
                <span className="text-red-500 ml-0.5">*</span>
              </p>
            </label>
            <AnimatePresence>
              {errors.consent && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-500">
                  {errors.consent.message}
                </motion.p>
              )}
            </AnimatePresence>

            <div className="flex justify-center">
              <HCaptchaField onVerify={setCaptchaToken} onExpire={() => setCaptchaToken("")} />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-accent to-primary text-white font-syne font-bold text-base py-3.5 px-8 rounded-2xl shadow-glow hover:shadow-card-hover hover:-translate-y-0.5 transition-all disabled:opacity-60"
            >
              {submitting ? (<><i className="fas fa-spinner fa-spin" /> Envoi en cours…</>) : (<><i className="fas fa-paper-plane" /> Envoyer ma demande</>)}
            </button>
            <p className="text-center text-xs text-gray-400">
              Aucun paiement n'est demandé à cette étape. Le prestataire vous recontactera pour finaliser le tarif.
            </p>
          </form>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children, error, required, hint }: {
  label: string; children: React.ReactNode; error?: string; required?: boolean; hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-primary mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {hint && <p className="text-xs text-gray-400 mb-1.5">{hint}</p>}
      {children}
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-red-500 mt-1">
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

const inputCls = (err: boolean) =>
  `w-full font-grotesk text-sm text-primary bg-gray-50 border rounded-xl px-3.5 py-2.5 outline-none transition-all focus:bg-white focus:ring-2 ${
    err ? "border-red-300 focus:border-red-400 focus:ring-red-100" : "border-gray-200 focus:border-accent focus:ring-accent/10"
  }`;
