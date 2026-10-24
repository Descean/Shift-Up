/**
 * app/(auth)/mot-de-passe-oublie/page.tsx — Demande de réinitialisation de mot de passe
 *
 * Cette page permet à un utilisateur ayant oublié son mot de passe de
 * demander l'envoi d'un lien de réinitialisation par email.
 *
 * Stratégie anti-énumération d'email :
 *   Que l'adresse email existe ou non en base, la page affiche TOUJOURS
 *   l'écran de succès. Cela empêche un attaquant de découvrir quels emails
 *   sont enregistrés sur la plateforme en observant la réponse.
 *
 * Flux utilisateur :
 *  1. Formulaire avec champ email (validé par zod).
 *  2. Soumission → POST /api/auth/reset-password.
 *  3. Affichage de l'écran de confirmation (toujours, même si email inconnu).
 *  4. L'utilisateur peut retenter avec une autre adresse ou contacter l'équipe.
 */

"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";

// ── Schéma de validation Zod ──────────────────────────────────────────────────
const schema = z.object({
  email: z.string().email("Adresse email invalide"),
});

type FormData = z.infer<typeof schema>;

export default function MotDePasseOubliePage() {
  // ── États locaux ───────────────────────────────────────────────────────────
  const [loading, setLoading]     = useState(false); // requête en cours
  const [sent, setSent]           = useState(false);  // écran de succès affiché ?
  const [sentEmail, setSentEmail] = useState("");     // email saisi (affiché dans l'écran succès)

  // react-hook-form avec validation zod
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /**
   * onSubmit — Envoie la demande de réinitialisation au backend.
   *
   * Stratégie anti-énumération :
   *   - Même en cas d'erreur réseau, on affiche l'écran succès (setSent(true)).
   *   - Le backend répond toujours { success: true } qu'il y ait un compte ou non.
   *   - L'utilisateur ne peut donc jamais savoir si un email est enregistré.
   */
  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email }),
      });

      // Toujours afficher le succès — jamais révéler si l'email existe
      setSentEmail(data.email);
      setSent(true);
      toast.success("Instructions envoyées !");
    } catch {
      // En cas d'erreur réseau : afficher quand même le succès (anti-énumération)
      setSentEmail(data.email);
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/*
       * AnimatePresence mode="wait" : attend que l'animation de sortie du
       * formulaire soit terminée avant de monter l'écran de succès.
       * Crée une transition fluide entre les deux états.
       */}
      <AnimatePresence mode="wait">

        {/* ── État 1 : Formulaire de demande ── */}
        {!sent ? (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <h1 className="font-syne font-black text-3xl text-primary mb-2">
              Mot de passe oublié ?
            </h1>
            <p className="text-gray-500 mb-8">
              Entrez votre email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="f-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Adresse email
                </label>
                <div className="relative">
                  <i className="fas fa-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                  <input
                    id="f-email"
                    {...register("email")}
                    type="email"
                    autoFocus
                    className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-accent transition-colors"
                    placeholder="vous@exemple.com"
                  />
                </div>
                {/* Message d'erreur de validation zod */}
                {errors.email && (
                  <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
                {loading ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
                {!loading && <i className="fas fa-paper-plane" />}
              </Button>
            </form>

            {/* Lien retour vers la page de connexion */}
            <div className="mt-6 text-center">
              <Link
                href="/connexion"
                className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors"
              >
                <i className="fas fa-arrow-left text-xs" />
                Retour à la connexion
              </Link>
            </div>
          </motion.div>

        ) : (
          /* ── État 2 : Écran de confirmation (affiché après envoi) ── */
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center"
          >
            {/* Icône de succès */}
            <div className="w-20 h-20 bg-secondary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <i className="fas fa-envelope-circle-check text-secondary text-3xl" />
            </div>

            <h1 className="font-syne font-black text-2xl text-primary mb-3">
              Email envoyé !
            </h1>

            {/* Texte : on affiche l'email saisi mais sans confirmer s'il existe */}
            <p className="text-gray-500 text-sm leading-relaxed mb-2">
              Si un compte existe avec l'adresse
            </p>
            <p className="font-semibold text-accent mb-4">{sentEmail}</p>
            <p className="text-gray-500 text-sm leading-relaxed mb-8">
              vous recevrez dans quelques minutes un email avec un lien de réinitialisation valable <strong>1 heure</strong>.
            </p>

            {/* Conseils si l'email n'arrive pas */}
            <div className="bg-gray-50 rounded-2xl p-5 text-left space-y-3 mb-8">
              <p className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-3">
                Vous ne recevez pas l'email ?
              </p>
              {[
                "Vérifiez votre dossier spam / courrier indésirable",
                "Attendez quelques minutes et rechargez votre boîte",
                "Assurez-vous que l'adresse email est correcte",
                "Contactez-nous si le problème persiste",
              ].map((tip) => (
                <div key={tip} className="flex items-start gap-2">
                  <i className="fas fa-circle-dot text-accent text-xs mt-1.5 flex-shrink-0" />
                  <p className="text-gray-500 text-sm">{tip}</p>
                </div>
              ))}
            </div>

            {/* Actions : retenter, revenir à connexion, ou aide WhatsApp */}
            <div className="space-y-3">
              {/* Retenter avec une autre adresse : remet sent=false pour réafficher le formulaire */}
              <button
                onClick={() => setSent(false)}
                className="w-full border-2 border-gray-200 hover:border-accent text-gray-600 hover:text-accent py-3 rounded-xl text-sm font-semibold transition-all"
              >
                <i className="fas fa-rotate-left mr-2" />
                Réessayer avec une autre adresse
              </button>
              <Link
                href="/connexion"
                className="block w-full bg-primary hover:bg-primary/90 text-white py-3 rounded-xl text-sm font-semibold text-center transition-colors"
              >
                <i className="fas fa-arrow-left mr-2" />
                Retour à la connexion
              </Link>
              {/* Lien WhatsApp direct vers le support SHIFT UP */}
              <a
                href="https://wa.me/2290195035099"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-accent hover:bg-accent-600 text-white py-3 rounded-xl text-sm font-semibold transition-colors"
              >
                <i className="fab fa-whatsapp" />
                Aide via WhatsApp
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
