/**
 * app/(public)/paiement/echec/page.tsx — Paiement échoué ou annulé
 *
 * Redirigé depuis FedaPay ou Stripe en cas d'échec ou d'annulation.
 * Paramètres URL :
 *  ?type=boutique&id=1&name=Template+Business+Plan+Pro&amount=15000
 *  ?type=service&amount=xxx&label=xxx
 *  ?reason=cancelled | failed
 */

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

function EchecContent() {
  const params      = useSearchParams();
  const type        = params.get("type") || "boutique";
  const productName = params.get("name") || params.get("label") || "votre commande";
  const amount      = params.get("amount") || "";
  const reason      = params.get("reason") || "failed"; // cancelled | failed

  const isCancelled = reason === "cancelled";

  // Build retry URL
  const retryParams = new URLSearchParams();
  retryParams.set("type", type);
  if (params.get("id"))           retryParams.set("id", params.get("id")!);
  if (params.get("prestationId")) retryParams.set("prestationId", params.get("prestationId")!);
  if (productName)                retryParams.set("name", productName);
  if (params.get("label"))        retryParams.set("label", params.get("label")!);
  if (amount)                     retryParams.set("amount", amount);
  const retryHref = `/paiement?${retryParams.toString()}`;

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="bg-white rounded-3xl shadow-card-hover max-w-lg w-full p-8 text-center"
      >
        {/* Icône animée */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.15, type: "spring", stiffness: 200, damping: 15 }}
          className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${
            isCancelled ? "bg-amber-50" : "bg-red-50"
          }`}
        >
          <i
            className={`text-4xl ${
              isCancelled
                ? "fas fa-circle-xmark text-amber-500"
                : "fas fa-triangle-exclamation text-red-500"
            }`}
          />
        </motion.div>

        <h1 className="font-syne font-black text-2xl text-primary mb-2">
          {isCancelled ? "Paiement annulé" : "Paiement échoué"}
        </h1>
        <p className="text-gray-500 mb-6">
          {isCancelled
            ? `Vous avez annulé le paiement pour "${productName}". Aucun montant n'a été débité.`
            : `Le paiement pour "${productName}" n'a pas pu être traité. Aucun montant n'a été débité.`}
        </p>

        {/* Raisons courantes */}
        {!isCancelled && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-6 text-left">
            <p className="text-sm font-semibold text-red-700 mb-2">
              <i className="fas fa-circle-info mr-2" />
              Causes possibles
            </p>
            <ul className="space-y-1.5 text-sm text-red-600">
              <li className="flex gap-2 items-start">
                <i className="fas fa-dot-circle text-xs mt-1 flex-shrink-0" />
                Solde Mobile Money insuffisant
              </li>
              <li className="flex gap-2 items-start">
                <i className="fas fa-dot-circle text-xs mt-1 flex-shrink-0" />
                Numéro de téléphone ou carte invalide
              </li>
              <li className="flex gap-2 items-start">
                <i className="fas fa-dot-circle text-xs mt-1 flex-shrink-0" />
                Transaction expirée ou timeout réseau
              </li>
              <li className="flex gap-2 items-start">
                <i className="fas fa-dot-circle text-xs mt-1 flex-shrink-0" />
                Confirmation non effectuée sur votre téléphone
              </li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-3">
          {/* Réessayer */}
          <Link
            href={retryHref}
            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-accent to-secondary text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity"
          >
            <i className="fas fa-rotate-right" />
            Réessayer le paiement
          </Link>

          {/* Retour boutique / services */}
          <Link
            href={type === "service" ? "/services" : "/boutique"}
            className="w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
          >
            {type === "service" ? "Retour aux services" : "Retour à la boutique"}
          </Link>

          {/* Contact support */}
          <Link
            href="/contact"
            className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="fas fa-headset mr-1.5" />
            Contacter le support
          </Link>
        </div>

        {/* Garantie */}
        <p className="text-xs text-gray-300 mt-6">
          Aucun prélèvement n'a été effectué. Pour toute question&nbsp;:{" "}
          <strong>contact@shiftup.bj</strong>
        </p>
      </motion.div>
    </div>
  );
}

export default function PaiementEchecPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <EchecContent />
    </Suspense>
  );
}
