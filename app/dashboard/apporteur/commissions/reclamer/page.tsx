/**
 * app/dashboard/apporteur/commissions/reclamer/page.tsx
 *
 * Formulaire de demande de versement de commissions.
 * Minimum : 30 000 FCFA de commissions en attente.
 * Remboursement par Mobile Money (MTN MoMo, Moov Money, Wave, Celtiis).
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";

const PROVIDERS = [
  { id: "MTN_MOMO",    label: "MTN MoMo",    icon: "fa-mobile-screen-button", color: "from-yellow-400 to-yellow-300", prefix: "+229 6" },
  { id: "MOOV_MONEY", label: "Moov Money",  icon: "fa-mobile-screen-button", color: "from-blue-500 to-blue-400",   prefix: "+229 9" },
  { id: "WAVE",       label: "Wave",        icon: "fa-wave-square",           color: "from-cyan-500 to-teal-400",   prefix: "+229 5" },
  { id: "CELTIIS",    label: "Celtiis",     icon: "fa-mobile-screen-button", color: "from-green-500 to-green-400", prefix: "+229 4" },
];

const MIN_AMOUNT = 30_000;

// Mock: in production, fetch from session/API
const MOCK_PENDING = 80_000;

export default function ReclamerCommissionsPage() {
  const router = useRouter();

  const [provider, setProvider]     = useState<string>("");
  const [phone, setPhone]           = useState<string>("");
  const [amount, setAmount]         = useState<string>(String(MOCK_PENDING));
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string>("");
  const [success, setSuccess]       = useState(false);
  const [reference, setReference]   = useState<string>("");

  const numAmount = Number(amount);
  const canSubmit =
    provider &&
    phone.trim().length >= 8 &&
    numAmount >= MIN_AMOUNT &&
    numAmount <= MOCK_PENDING;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!canSubmit) return;

    setLoading(true);
    try {
      const res = await fetch("/api/payout/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: numAmount,
          mobileProvider: provider,
          mobileNumber: phone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Une erreur est survenue.");
        return;
      }

      setReference(data.reference);
      setSuccess(true);
    } catch {
      setError("Impossible de contacter le serveur. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="max-w-lg mx-auto mt-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-3xl shadow-card p-8 text-center"
        >
          <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="fas fa-circle-check text-green-500 text-4xl" />
          </div>
          <h2 className="font-syne font-black text-2xl text-primary mb-2">Demande envoyée !</h2>
          <p className="text-gray-500 text-sm mb-6">
            Votre demande de versement de{" "}
            <strong>{numAmount.toLocaleString()} F</strong> a bien été enregistrée.
            Notre équipe traitera votre demande dans les <strong>48h ouvrées</strong>.
          </p>
          <div className="bg-gray-50 rounded-xl px-4 py-3 mb-6">
            <p className="text-xs text-gray-400 mb-1">Référence de demande</p>
            <p className="font-mono text-sm font-semibold text-primary">{reference}</p>
          </div>
          <div className="space-y-3">
            <Link
              href="/dashboard/apporteur/commissions"
              className="block w-full bg-gradient-to-r from-accent to-secondary text-white py-3 rounded-xl font-semibold hover:opacity-90 transition-opacity"
            >
              Retour aux commissions
            </Link>
            <Link
              href="/dashboard/apporteur"
              className="block w-full border border-gray-200 text-gray-700 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors text-sm"
            >
              Tableau de bord
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto mt-2">
      {/* Back */}
      <Link
        href="/dashboard/apporteur/commissions"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary transition-colors mb-6"
      >
        <i className="fas fa-arrow-left" />
        Retour aux commissions
      </Link>

      <h1 className="font-syne font-black text-2xl text-primary mb-1">
        Réclamer mes commissions
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Demandez le versement de vos commissions en attente sur votre Mobile Money.
      </p>

      {/* Solde disponible */}
      <div className="bg-gradient-to-r from-accent to-secondary rounded-2xl p-5 text-white mb-6">
        <p className="text-white/70 text-sm">Commissions disponibles</p>
        <p className="font-syne font-black text-3xl mt-1">
          {MOCK_PENDING.toLocaleString()} <span className="text-lg font-medium">F CFA</span>
        </p>
        <p className="text-white/60 text-xs mt-2">
          Minimum de retrait&nbsp;: <strong className="text-white">30 000 F</strong>
        </p>
      </div>

      <motion.form
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-card p-6 space-y-6"
      >
        {/* Montant */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            Montant à réclamer (F CFA)
          </label>
          <div className="relative">
            <input
              type="number"
              min={MIN_AMOUNT}
              max={MOCK_PENDING}
              step={1000}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-3 pr-16 text-lg font-semibold focus:outline-none focus:border-accent transition-colors"
              placeholder="30000"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
              F CFA
            </span>
          </div>
          {numAmount < MIN_AMOUNT && amount !== "" && (
            <p className="text-red-500 text-xs mt-1">
              Montant minimum : {MIN_AMOUNT.toLocaleString()} F CFA
            </p>
          )}
          {numAmount > MOCK_PENDING && (
            <p className="text-red-500 text-xs mt-1">
              Montant supérieur à votre solde disponible.
            </p>
          )}
          <div className="flex gap-2 mt-2">
            {[30_000, 50_000, MOCK_PENDING].filter((v, i, arr) => arr.indexOf(v) === i).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setAmount(String(v))}
                className="text-xs px-3 py-1 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors"
              >
                {v.toLocaleString()} F
              </button>
            ))}
          </div>
        </div>

        {/* Provider */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-3">
            Opérateur Mobile Money
          </label>
          <div className="grid grid-cols-2 gap-3">
            {PROVIDERS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProvider(p.id)}
                className={`relative flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                  provider === p.id
                    ? "border-accent bg-accent/5"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className={`w-9 h-9 bg-gradient-to-br ${p.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                  <i className={`fas ${p.icon} text-sm`} />
                </div>
                <span className="font-medium text-sm text-primary">{p.label}</span>
                {provider === p.id && (
                  <i className="fas fa-circle-check text-accent text-sm absolute top-2 right-2" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-sm font-semibold text-primary mb-2">
            Numéro Mobile Money
          </label>
          <div className="flex gap-2">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-3 flex-shrink-0">
              <span className="text-sm text-gray-500">🇧🇯 +229</span>
            </div>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder={provider ? PROVIDERS.find((p) => p.id === provider)?.prefix.replace("+229 ", "") + "XXXXXXX" : "XXXXXXXXX"}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-accent transition-colors"
            />
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Assurez-vous que ce numéro est bien enregistré chez l'opérateur choisi.
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl px-4 py-3 text-sm">
            <i className="fas fa-triangle-exclamation mr-2" />
            {error}
          </div>
        )}

        {/* Info */}
        <div className="bg-accent/5 rounded-xl p-4 text-sm text-gray-600">
          <i className="fas fa-clock text-accent mr-2" />
          Traitement sous <strong>48h ouvrées</strong>. Vous recevrez une notification dès que le
          virement est effectué.
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit || loading}
          className="w-full bg-gradient-to-r from-accent to-secondary text-white py-3.5 rounded-xl font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Envoi en cours…
            </>
          ) : (
            <>
              <i className="fas fa-paper-plane" />
              Envoyer la demande
            </>
          )}
        </button>
      </motion.form>
    </div>
  );
}
