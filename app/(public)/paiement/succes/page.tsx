/**
 * app/(public)/paiement/succes/page.tsx — Confirmation de paiement réussi
 *
 * Redirigé depuis FedaPay ou Stripe après un paiement confirmé.
 * Paramètres URL :
 *  ?type=boutique&id=1&name=Template+Business+Plan+Pro
 *  ?type=service&prestationId=xxx
 *  ?ref=SU-PAY-xxx  (référence de transaction)
 */

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

// Liens de téléchargement par produit (à renseigner depuis Supabase Storage)
// Pour l'instant tous les produits sont livrés par email automatiquement.
const DOWNLOAD_LINKS: Record<string, { url: string; filename: string }> = {};

function SuccesContent() {
  const params      = useSearchParams();
  const type        = params.get("type") || "boutique";
  const step        = params.get("step") || "acompte"; // "acompte" | "solde"
  const productId   = params.get("id") || "";
  const productName = params.get("name") || "votre commande";
  const ref         = params.get("ref") || "";
  const isSolde     = step === "solde";

  const download = DOWNLOAD_LINKS[productId];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-card-hover max-w-lg w-full p-8 text-center"
      >
        {/* Icône succès animée */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <i className="fas fa-circle-check text-green-500 text-4xl" />
        </motion.div>

        <h1 className="font-syne font-black text-2xl text-primary mb-2">
          {type === "service" && isSolde ? "Prestation soldée !" : "Paiement confirmé !"}
        </h1>
        <p className="text-gray-500 mb-6">
          {type === "service" && isSolde
            ? "Votre solde a bien été reçu. Les livrables définitifs vont vous être remis très prochainement."
            : type === "service"
            ? "Votre acompte de 60% a bien été reçu. Notre équipe prendra contact avec vous sous 48h."
            : `Merci pour votre achat. "${productName}" est prêt à être téléchargé.`}
        </p>

        {/* Référence de transaction */}
        {ref && (
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6 text-left">
            <p className="text-xs text-gray-400 mb-1">Référence de transaction</p>
            <p className="font-mono text-sm font-semibold text-primary">{ref}</p>
          </div>
        )}

        {/* ── Boutique : bouton de téléchargement ─────────────────────────── */}
        {type === "boutique" && download && (
          <a
            href={download.url}
            download={download.filename}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-secondary text-white py-3.5 rounded-xl font-semibold mb-4 hover:opacity-90 transition-opacity"
          >
            <i className="fas fa-download" />
            Télécharger {productName}
          </a>
        )}

        {/* ── Boutique : produit sans lien direct ─────────────────────────── */}
        {type === "boutique" && !download && (
          <div className="bg-accent/5 border border-accent/20 rounded-xl p-4 mb-6 text-sm text-accent">
            <i className="fas fa-envelope mr-2" />
            Votre produit vous sera envoyé par email dans les <strong>15 minutes</strong>.
          </div>
        )}

        {/* ── Service acompte : prochaines étapes ─────────────────────────── */}
        {type === "service" && !isSolde && (
          <div className="bg-accent/5 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-accent mb-3">
              <i className="fas fa-list-check mr-2" />
              Prochaines étapes
            </p>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                Acompte 60% reçu
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                Notre équipe démarre votre prestation sous 48h
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-gray-100 text-gray-500 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                Paiement du solde 40% à la livraison
              </li>
            </ol>
          </div>
        )}

        {/* ── Service solde : récapitulatif final ──────────────────────────── */}
        {type === "service" && isSolde && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-green-700 mb-3">
              <i className="fas fa-circle-check mr-2" />
              Prestation complètement soldée
            </p>
            <ol className="space-y-2 text-sm text-gray-600">
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                Acompte 60% — réglé
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-green-100 text-green-700 text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">✓</span>
                Solde 40% — réglé
              </li>
              <li className="flex gap-2">
                <span className="w-5 h-5 bg-accent/20 text-accent text-xs font-bold rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">→</span>
                Remise des livrables définitifs en cours
              </li>
            </ol>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          <Link
            href={type === "service" ? "/dashboard/client/prestations" : "/boutique"}
            className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            {type === "service" ? "Voir mes prestations" : "Continuer mes achats"}
          </Link>
          <Link
            href="/"
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            Retour à l'accueil
          </Link>
        </div>

        {/* Note de bas */}
        <p className="text-xs text-gray-300 mt-6">
          Un reçu a été envoyé à votre adresse email.
          Pour toute question : <strong>shiftup.eudes@gmail.com</strong>
        </p>
      </motion.div>
    </div>
  );
}

export default function PaiementSuccesPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <SuccesContent />
    </Suspense>
  );
}
