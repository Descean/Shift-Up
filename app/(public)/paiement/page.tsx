/**
 * app/(public)/paiement/page.tsx — Page de paiement universelle SHIFT UP
 *
 * Gère deux types de transactions :
 *  - "service"  : acompte (40%) ou solde (60%) d'une prestation
 *  - "boutique" : achat d'un produit numérique
 *
 * Paramètres URL :
 *  ?type=service&prestationId=xxx&amount=xxx&label=Acompte+Développement+Web
 *  ?type=boutique&id=1&name=Template+Business+Plan+Pro&amount=15000
 *
 * Providers disponibles :
 *  Mobile Money — MTN MoMo, Moov Money, Wave, Celtiis Cash  (FedaPay)
 *  Carte internationale (Visa/Mastercard)                    (Stripe Checkout)
 */

"use client";

import { Suspense, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";

// ─── Providers Mobile Money ────────────────────────────────────────────────────

const MM_PROVIDERS = [
  {
    id: "MTN_MOMO",
    name: "MTN MoMo",
    color: "from-yellow-400 to-amber-400",
    bg: "bg-yellow-50 border-yellow-200",
    activeBg: "bg-yellow-400/10 border-yellow-400 ring-1 ring-yellow-400",
    logo: "fas fa-mobile-screen-button",
    logoColor: "text-yellow-500",
    prefix: "+229 (MTN)",
  },
  {
    id: "MOOV_MONEY",
    name: "Moov Money",
    color: "from-blue-500 to-blue-400",
    bg: "bg-blue-50 border-blue-200",
    activeBg: "bg-blue-400/10 border-blue-500 ring-1 ring-blue-500",
    logo: "fas fa-mobile-screen-button",
    logoColor: "text-blue-500",
    prefix: "+229 (Moov)",
  },
  {
    id: "WAVE",
    name: "Wave",
    color: "from-sky-400 to-cyan-400",
    bg: "bg-sky-50 border-sky-200",
    activeBg: "bg-sky-400/10 border-sky-400 ring-1 ring-sky-400",
    logo: "fas fa-mobile-screen-button",
    logoColor: "text-sky-500",
    prefix: "+229 (Wave)",
  },
  {
    id: "CELTIIS",
    name: "Celtiis Cash",
    color: "from-green-500 to-emerald-400",
    bg: "bg-green-50 border-green-200",
    activeBg: "bg-green-400/10 border-green-500 ring-1 ring-green-500",
    logo: "fas fa-mobile-screen-button",
    logoColor: "text-green-500",
    prefix: "+229 (Celtiis)",
  },
];

// ─── Composant interne (useSearchParams nécessite Suspense) ───────────────────

function PaiementContent() {
  const params       = useSearchParams();
  const router       = useRouter();
  const { data: session } = useSession();

  // ── Lecture des paramètres URL ──────────────────────────────────────────
  const type         = params.get("type") || "boutique";        // "service" | "boutique"
  const prestationId = params.get("prestationId") || "";
  const productId    = params.get("id") || "";
  const productName  = params.get("name") || "Commande SHIFT UP";
  const amount       = Number(params.get("amount") || "0");
  const label        = params.get("label") || productName;      // libellé affichage

  // ── État du formulaire ──────────────────────────────────────────────────
  const [payMethod, setPayMethod]   = useState<"mobile" | "card">("mobile");
  const [provider,  setProvider]    = useState("MTN_MOMO");
  const [phone,     setPhone]       = useState("");
  const [loading,   setLoading]     = useState(false);

  // ── Calculs ─────────────────────────────────────────────────────────────
  const tva      = 0;                    // TVA incluse dans le prix affiché (XOF)
  const frais    = 0;                    // Frais de transaction (absorbés par SHIFT UP)
  const total    = amount;

  // ─── Soumission Mobile Money (FedaPay) ──────────────────────────────────
  async function handleMobileMoneyPay() {
    if (!phone.trim()) {
      toast.error("Veuillez entrer votre numéro Mobile Money.");
      return;
    }
    if (!session?.user?.id) {
      toast.error("Connectez-vous pour effectuer un paiement.");
      router.push("/connexion?redirect=/paiement?" + params.toString());
      return;
    }

    setLoading(true);
    try {
      const endpoint = type === "service" ? "/api/payments/create" : "/api/payments/boutique";
      const body = type === "service"
        ? { prestationId, amount, method: "MOBILE_MONEY", provider: "FEDAPAY", phone }
        : { productId, productName, amount, method: "MOBILE_MONEY", provider: "FEDAPAY", phone };

      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors du paiement.");
        return;
      }

      if (data.checkoutUrl) {
        // Redirection vers la page de paiement FedaPay
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("URL de paiement non reçue.");
      }
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Soumission Stripe (carte internationale) ────────────────────────────
  async function handleCardPay() {
    if (!session?.user?.id) {
      toast.error("Connectez-vous pour effectuer un paiement.");
      router.push("/connexion?redirect=/paiement?" + params.toString());
      return;
    }

    setLoading(true);
    try {
      const endpoint = type === "service" ? "/api/payments/create" : "/api/payments/boutique";
      const body = type === "service"
        ? { prestationId, amount, method: "CARD", provider: "STRIPE" }
        : { productId, productName, amount, method: "CARD", provider: "STRIPE" };

      const res  = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors du paiement.");
        return;
      }

      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else {
        toast.error("Session Stripe non créée.");
      }
    } catch {
      toast.error("Erreur réseau. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  // ─── Rendu ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      {/* Bandeau sécurisé */}
      <div className="max-w-4xl mx-auto mb-6 flex items-center justify-between flex-wrap gap-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/assets/logo-icon.png" alt="SHIFT UP" width={32} height={32}
            className="brightness-0" />
          <span className="font-syne font-bold text-primary">SHIFT UP</span>
        </Link>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <i className="fas fa-lock text-green-500" />
          Paiement 100% sécurisé — SSL / HTTPS
        </div>
      </div>

      <div className="max-w-4xl mx-auto grid lg:grid-cols-5 gap-6">

        {/* ── Colonne gauche : Récapitulatif ─────────────────────────────────── */}
        <div className="lg:col-span-2 space-y-4">

          {/* Carte récapitulative */}
          <div className="bg-white rounded-2xl shadow-card p-6">
            <p className="text-xs text-gray-400 uppercase tracking-widest mb-4">
              {type === "service" ? "Récapitulatif prestation" : "Récapitulatif commande"}
            </p>

            {/* Badge type */}
            <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full mb-4 ${
              type === "service"
                ? "bg-accent/10 text-accent"
                : "bg-secondary/10 text-secondary"
            }`}>
              <i className={type === "service" ? "fas fa-briefcase" : "fas fa-download"} />
              {type === "service" ? "Prestation de service" : "Produit numérique"}
            </div>

            <h2 className="font-syne font-bold text-primary text-lg mb-4 leading-snug">
              {label}
            </h2>

            {/* Détail des montants */}
            <div className="space-y-2 text-sm border-t border-gray-50 pt-4">
              <div className="flex justify-between text-gray-500">
                <span>Montant HT</span>
                <span>{amount.toLocaleString()} FCFA</span>
              </div>
              {tva > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>TVA</span>
                  <span>{tva.toLocaleString()} FCFA</span>
                </div>
              )}
              {frais > 0 && (
                <div className="flex justify-between text-gray-500">
                  <span>Frais de transaction</span>
                  <span>{frais.toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-primary text-base pt-2 border-t border-gray-100">
                <span>Total à payer</span>
                <span className="text-accent font-black text-lg">{total.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>

          {/* Sécurité & garanties */}
          <div className="bg-white rounded-2xl shadow-card p-5 space-y-3">
            {[
              { icon: "fa-shield-halved", color: "text-green-500", text: "Paiement chiffré SSL 256 bits" },
              { icon: "fa-clock-rotate-left", color: "text-accent", text: "Remboursement sous 48h si problème" },
              { icon: "fa-headset", color: "text-purple-500", text: "Support WhatsApp disponible" },
              { icon: "fa-receipt", color: "text-amber-500", text: "Reçu par email après paiement" },
            ].map((g) => (
              <div key={g.text} className="flex items-center gap-3 text-sm text-gray-600">
                <i className={`fas ${g.icon} ${g.color} w-4`} />
                {g.text}
              </div>
            ))}
          </div>

          {/* Providers acceptés */}
          <div className="bg-white rounded-2xl shadow-card p-4">
            <p className="text-xs text-gray-400 mb-3">Modes de paiement acceptés</p>
            <div className="flex items-center gap-3 flex-wrap">
              {["MTN MoMo", "Moov Money", "Wave", "Celtiis"].map((p) => (
                <span key={p} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium">
                  {p}
                </span>
              ))}
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
                <i className="fab fa-cc-visa" /> Visa
              </span>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-lg font-medium flex items-center gap-1">
                <i className="fab fa-cc-mastercard" /> Mastercard
              </span>
            </div>
          </div>
        </div>

        {/* ── Colonne droite : Formulaire de paiement ────────────────────────── */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-2xl shadow-card p-6">

            <h3 className="font-syne font-bold text-primary mb-6">
              Choisissez votre mode de paiement
            </h3>

            {/* Onglets Mobile Money / Carte */}
            <div className="flex rounded-xl bg-gray-100 p-1 mb-6">
              <button
                onClick={() => setPayMethod("mobile")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  payMethod === "mobile"
                    ? "bg-white shadow-sm text-primary"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <i className="fas fa-mobile-screen-button" />
                Mobile Money
              </button>
              <button
                onClick={() => setPayMethod("card")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  payMethod === "card"
                    ? "bg-white shadow-sm text-primary"
                    : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <i className="fas fa-credit-card" />
                Carte internationale
              </button>
            </div>

            {/* ── Formulaire Mobile Money ─────────────────────────────────────── */}
            {payMethod === "mobile" && (
              <div className="space-y-5">

                {/* Sélection du provider */}
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-3">
                    Votre opérateur Mobile Money
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    {MM_PROVIDERS.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => setProvider(p.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                          provider === p.id ? p.activeBg : `${p.bg} hover:border-gray-300`
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${p.color} flex items-center justify-center flex-shrink-0`}>
                          <i className={`${p.logo} text-white text-sm`} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-primary leading-none">{p.name}</p>
                          <p className="text-[10px] text-gray-400 mt-0.5">{p.prefix}</p>
                        </div>
                        {provider === p.id && (
                          <i className="fas fa-circle-check text-accent ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Numéro de téléphone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Numéro Mobile Money <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm select-none">
                      +229
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01 XX XX XX XX"
                      className="w-full border border-gray-200 rounded-xl pl-14 pr-4 py-3 text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
                      maxLength={15}
                    />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5">
                    Entrez le numéro enregistré chez {MM_PROVIDERS.find(p => p.id === provider)?.name}
                  </p>
                </div>

                {/* Information sur la redirection FedaPay */}
                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-sm text-blue-700">
                  <i className="fas fa-circle-info mr-2" />
                  Vous serez redirigé vers la page sécurisée <strong>FedaPay</strong> pour confirmer le paiement sur votre téléphone.
                </div>

                {/* Bouton de paiement */}
                <button
                  onClick={handleMobileMoneyPay}
                  disabled={loading || !phone.trim()}
                  className="w-full bg-gradient-to-r from-accent to-secondary text-white py-4 rounded-xl font-bold text-base hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Redirection en cours…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-mobile-screen-button" />
                      Payer {total.toLocaleString()} FCFA via {MM_PROVIDERS.find(p => p.id === provider)?.name}
                    </>
                  )}
                </button>
              </div>
            )}

            {/* ── Formulaire Carte internationale ────────────────────────────── */}
            {payMethod === "card" && (
              <div className="space-y-5">

                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
                  <i className="fas fa-circle-info mr-2" />
                  Le paiement par carte est traité en <strong>EUR</strong> via Stripe.
                  Votre banque appliquera le taux de change XOF → EUR en vigueur.
                </div>

                {/* Équivalent EUR */}
                <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-400">Montant en XOF</p>
                    <p className="font-bold text-primary">{total.toLocaleString()} FCFA</p>
                  </div>
                  <i className="fas fa-arrow-right text-gray-300" />
                  <div className="text-right">
                    <p className="text-xs text-gray-400">Équivalent EUR (approx.)</p>
                    <p className="font-bold text-primary">≈ {(total / 655).toFixed(2)} €</p>
                  </div>
                </div>

                <div className="flex gap-3 items-center">
                  <i className="fab fa-cc-visa text-3xl text-blue-700" />
                  <i className="fab fa-cc-mastercard text-3xl text-red-600" />
                  <i className="fab fa-cc-amex text-3xl text-blue-500" />
                  <span className="text-xs text-gray-400 ml-2">Toutes les cartes acceptées</span>
                </div>

                <button
                  onClick={handleCardPay}
                  disabled={loading}
                  className="w-full bg-primary text-white py-4 rounded-xl font-bold text-base hover:bg-primary/90 transition-colors disabled:opacity-60 flex items-center justify-center gap-3"
                >
                  {loading ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Redirection vers Stripe…
                    </>
                  ) : (
                    <>
                      <i className="fas fa-credit-card" />
                      Payer par carte — {(total / 655).toFixed(2)} €
                    </>
                  )}
                </button>

                <p className="text-xs text-gray-400 text-center">
                  <i className="fas fa-lock mr-1" />
                  Paiement sécurisé par <strong>Stripe</strong> — SHIFT UP ne stocke aucune donnée de carte
                </p>
              </div>
            )}

            {/* Lien retour */}
            <div className="mt-6 pt-5 border-t border-gray-100 text-center">
              <Link
                href={type === "service" ? "/dashboard/client/prestations" : "/boutique"}
                className="text-sm text-gray-400 hover:text-gray-600 inline-flex items-center gap-2"
              >
                <i className="fas fa-chevron-left text-xs" />
                Annuler et retourner
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Export avec Suspense (obligatoire pour useSearchParams) ──────────────────

export default function PaiementPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <span className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin inline-block mb-3" />
          <p className="text-gray-400 text-sm">Chargement…</p>
        </div>
      </div>
    }>
      <PaiementContent />
    </Suspense>
  );
}
