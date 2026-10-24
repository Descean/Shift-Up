/**
 * app/(auth)/reinitialiser-mot-de-passe/page.tsx — Confirmation de réinitialisation
 *
 * Cette page est la destination du lien envoyé par email.
 * URL attendue : /reinitialiser-mot-de-passe?token=<hex_64_chars>
 *
 * Fonctionnement :
 *  1. Le token est lu depuis les paramètres de l'URL (?token=...).
 *  2. Si aucun token → affichage d'un écran d'erreur.
 *  3. Si token présent → formulaire de nouveau mot de passe.
 *  4. À la soumission → PATCH /api/auth/reset-password.
 *  5. Si succès → écran de confirmation + lien vers /connexion.
 *
 * ⚠️  Pourquoi le composant est-il dans un <Suspense> ?
 *   Next.js App Router interdit l'appel à `useSearchParams()` dans un
 *   composant qui n'est pas wrappé dans <Suspense>. Sans cela, le build
 *   échoue avec l'erreur : "useSearchParams() should be wrapped in a
 *   suspense boundary". Le fallback est un spinner affiché pendant
 *   l'hydratation côté client.
 */

"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import Button from "@/components/ui/Button";

// ── Schéma de validation Zod ──────────────────────────────────────────────────
// Mot de passe : 8 caractères minimum.
// La règle .refine() vérifie que les deux champs correspondent.
const schema = z
  .object({
    password: z.string().min(8, "Minimum 8 caractères"),
    confirmPassword: z.string(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"], // L'erreur est attachée au champ confirmPassword
  });

type FormData = z.infer<typeof schema>;

/**
 * ResetForm — Composant interne contenant la logique du formulaire.
 * Séparé du composant de page pour être wrappé dans <Suspense>,
 * ce qui est requis pour utiliser useSearchParams().
 */
function ResetForm() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const token        = searchParams.get("token"); // Token lu depuis ?token=...

  // ── États locaux ───────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false); // requête PATCH en cours
  const [done, setDone]       = useState(false);  // mot de passe mis à jour avec succès
  const [showPwd, setShowPwd] = useState(false);  // afficher/masquer le mot de passe en clair

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  /**
   * useEffect — Avertit l'utilisateur si le token est absent.
   * Déclenché une seule fois au montage du composant.
   * Si token=null (lien invalide, expiré ou URL mal formée), on affiche
   * un toast d'erreur pour guider l'utilisateur.
   */
  useEffect(() => {
    if (!token) {
      toast.error("Lien invalide ou expiré.");
    }
  }, [token]);

  /**
   * onSubmit — Envoie le nouveau mot de passe au backend.
   *
   * Appelle PATCH /api/auth/reset-password avec { token, password }.
   * Le backend vérifie que le token existe, n'est pas expiré et n'a pas
   * déjà été utilisé, puis hache le nouveau mot de passe et met à jour
   * l'utilisateur dans une transaction atomique Prisma.
   */
  const onSubmit = async (data: FormData) => {
    if (!token) return; // Guard : ne rien envoyer si pas de token
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password: data.password }),
      });
      const json = await res.json();
      if (res.ok) {
        setDone(true); // Bascule vers l'écran de succès
        toast.success("Mot de passe mis à jour !");
      } else {
        // Le token peut être invalide, expiré ou déjà utilisé
        toast.error(json.error || "Lien invalide ou expiré.");
      }
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  };

  // ── État 1 : Token absent → lien invalide ─────────────────────────────────
  if (!token) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-5">
          <i className="fas fa-triangle-exclamation text-red-500 text-2xl" />
        </div>
        <h1 className="font-syne font-black text-2xl text-primary mb-3">Lien invalide</h1>
        <p className="text-gray-500 text-sm mb-6">
          Ce lien de réinitialisation est invalide ou a expiré.
          Faites une nouvelle demande.
        </p>
        <Link
          href="/mot-de-passe-oublie"
          className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-xl font-semibold text-sm"
        >
          Nouvelle demande
        </Link>
      </div>
    );
  }

  // ── État 2 : Mot de passe mis à jour avec succès ──────────────────────────
  if (done) {
    return (
      <div className="text-center">
        <div className="w-20 h-20 bg-secondary/10 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <i className="fas fa-check-circle text-secondary text-3xl" />
        </div>
        <h1 className="font-syne font-black text-2xl text-primary mb-3">
          Mot de passe mis à jour !
        </h1>
        <p className="text-gray-500 text-sm mb-8">
          Votre mot de passe a été réinitialisé avec succès.
          Vous pouvez maintenant vous connecter.
        </p>
        <Link
          href="/connexion"
          className="inline-flex items-center gap-2 bg-gradient-to-r from-accent to-secondary text-white px-8 py-3 rounded-xl font-semibold"
        >
          Se connecter
          <i className="fas fa-arrow-right" />
        </Link>
      </div>
    );
  }

  // ── État 3 : Formulaire de saisie du nouveau mot de passe ─────────────────
  return (
    <div>
      <h1 className="font-syne font-black text-3xl text-primary mb-2">
        Nouveau mot de passe
      </h1>
      <p className="text-gray-500 mb-8">
        Choisissez un mot de passe sécurisé (minimum 8 caractères).
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

        {/* Champ "Nouveau mot de passe" avec bouton show/hide */}
        <div>
          <label htmlFor="f-password" className="block text-sm font-medium text-gray-700 mb-2">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              id="f-password"
              {...register("password")}
              type={showPwd ? "text" : "password"} // Bascule clair/masqué
              className="w-full border border-gray-200 rounded-xl pl-11 pr-12 py-3.5 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Minimum 8 caractères"
            />
            {/* Bouton icône oeil pour afficher/masquer le mot de passe */}
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className={`fas fa-${showPwd ? "eye-slash" : "eye"} text-sm`} />
            </button>
          </div>
          {errors.password && (
            <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Champ "Confirmer le mot de passe" */}
        <div>
          <label htmlFor="f-confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
            Confirmer le mot de passe
          </label>
          <div className="relative">
            <i className="fas fa-lock absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
            <input
              id="f-confirmPassword"
              {...register("confirmPassword")}
              type="password"
              className="w-full border border-gray-200 rounded-xl pl-11 pr-4 py-3.5 text-sm focus:outline-none focus:border-accent transition-colors"
              placeholder="Répéter le mot de passe"
            />
          </div>
          {/* Erreur de la règle .refine() : mots de passe différents */}
          {errors.confirmPassword && (
            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" variant="gradient" size="lg" loading={loading} className="w-full">
          {loading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
          {!loading && <i className="fas fa-check" />}
        </Button>
      </form>

      {/* Lien retour vers connexion */}
      <div className="mt-6 text-center">
        <Link
          href="/connexion"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-accent transition-colors"
        >
          <i className="fas fa-arrow-left text-xs" />
          Retour à la connexion
        </Link>
      </div>
    </div>
  );
}

/**
 * ReinitialiserMotDePassePage — Composant de page exporté (point d'entrée Next.js).
 *
 * Wrappé dans <Suspense> pour satisfaire l'exigence de Next.js App Router :
 * useSearchParams() doit toujours être dans un composant enfant d'un <Suspense>.
 * Le fallback affiche un spinner pendant l'hydratation.
 */
export default function ReinitialiserMotDePassePage() {
  return (
    <Suspense fallback={
      /* Spinner affiché pendant le chargement de useSearchParams */
      <div className="flex justify-center py-12">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ResetForm />
    </Suspense>
  );
}
