/**
 * app/api/payments/webhook/stripe/route.ts — Webhook Stripe
 *
 * Cette route reçoit les événements envoyés par Stripe en temps réel
 * lorsque des paiements sont traités. Stripe appelle cette URL depuis
 * ses serveurs avec un corps JSON signé.
 *
 * Sécurité — Vérification de signature :
 *   Chaque requête Stripe contient le header "stripe-signature".
 *   `stripe.webhooks.constructEvent()` vérifie que la requête provient
 *   bien de Stripe (et non d'un attaquant qui tenterait de simuler des paiements).
 *   Si la signature est invalide → rejet 400 immédiat.
 *
 * ⚠️  Important : le corps de la requête doit être lu en texte brut (req.text())
 *   et NON en JSON. La vérification de signature Stripe dépend des octets exacts
 *   du corps — si on le parse en JSON puis re-sérialise, la signature échoue.
 *
 * Événements gérés :
 *  - payment_intent.succeeded      → paiement réussi
 *  - payment_intent.payment_failed → paiement échoué
 *  - charge.refunded               → remboursement
 *
 * Configuration requise :
 *  - STRIPE_SECRET_KEY        → clé secrète Stripe (dashboard.stripe.com)
 *  - STRIPE_WEBHOOK_SECRET    → Signing Secret du webhook (obtenu à la création)
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import prisma from "@/lib/prisma";
import { confirmerPaiement } from "@/lib/prestations";

// ── Client Stripe créé à l'appel (le build ne dépend pas de la clé) ──────────
function stripeClient() {
  if (!process.env.STRIPE_SECRET_KEY) throw new Error("STRIPE_SECRET_KEY manquante.");
  return new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-02-25.clover" });
}

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/payments/webhook/stripe — Réception des événements Stripe
// ══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  // Lecture du corps en texte brut (obligatoire pour la vérification de signature)
  const body = await req.text();
  const sig  = req.headers.get("stripe-signature");

  // Si la signature ou le secret webhook manquent → refus immédiat
  if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Webhook signature missing" }, { status: 400 });
  }

  // ── Vérification cryptographique de la signature Stripe ───────────────────
  let event: Stripe.Event;
  try {
    event = stripeClient().webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    // Signature invalide → soit requête falsifiée, soit mauvais secret
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // ── Traitement des événements selon leur type ─────────────────────────────
  try {
    switch (event.type) {

      // ────────────────────────────────────────────────────────────────────
      // Événement : paiement réussi
      // ────────────────────────────────────────────────────────────────────
      // ────────────────────────────────────────────────────────────────────
      // Événement : session Checkout payée (paiement d'une prestation par carte)
      // La référence SU-PAY-… est passée dans metadata lors de /api/payments/create.
      // ────────────────────────────────────────────────────────────────────
      case "checkout.session.completed": {
        const cs = event.data.object as Stripe.Checkout.Session;
        const reference = cs.metadata?.reference;
        if (reference && cs.payment_status === "paid") {
          const payment = await prisma.payment.findUnique({ where: { reference } });
          if (payment) await confirmerPaiement(payment.id);
        }
        break;
      }

      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        const { prestationId, clientId } = paymentIntent.metadata;
        // Les métadonnées (prestationId, clientId) sont passées lors de la
        // création du PaymentIntent dans /api/payments/create/route.ts.

        // 1. Mettre à jour le statut du paiement en base
        await prisma.payment.updateMany({
          where: { reference: paymentIntent.id },
          data:  { status: "COMPLETED" },
        });

        // 2. L'avancement de la prestation est fait par « checkout.session.completed » (voir plus haut).

        // 3. Créer une entrée dans l'AuditLog pour traçabilité
        if (clientId) {
          await prisma.auditLog.create({
            data: {
              userId:   clientId,
              action:   "PAYMENT_SUCCEEDED",
              entity:   "Payment",
              entityId: paymentIntent.id,
              details: {
                amount:       paymentIntent.amount / 100, // Stripe exprime en centimes
                currency:     paymentIntent.currency,
                provider:     "STRIPE",
                prestationId: prestationId || null,
              },
            },
          });
        }
        break;
      }

      // ────────────────────────────────────────────────────────────────────
      // Événement : paiement échoué (carte refusée, fonds insuffisants, etc.)
      // ────────────────────────────────────────────────────────────────────
      case "payment_intent.payment_failed": {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Mettre à jour le statut du paiement → FAILED
        await prisma.payment.updateMany({
          where: { reference: paymentIntent.id },
          data:  { status: "FAILED" },
        });

        // Créer une entrée AuditLog avec le message d'erreur de Stripe
        const clientId = paymentIntent.metadata?.clientId;
        if (clientId) {
          await prisma.auditLog.create({
            data: {
              userId:   clientId,
              action:   "PAYMENT_FAILED",
              entity:   "Payment",
              entityId: paymentIntent.id,
              details: {
                amount:         paymentIntent.amount / 100,
                currency:       paymentIntent.currency,
                failureMessage: paymentIntent.last_payment_error?.message, // Raison de l'échec
              },
            },
          });
        }
        break;
      }

      // ────────────────────────────────────────────────────────────────────
      // Événement : remboursement effectué
      // ────────────────────────────────────────────────────────────────────
      case "charge.refunded": {
        const charge = event.data.object as Stripe.Charge;
        // On cherche le paiement par le payment_intent associé à cette charge
        if (charge.payment_intent) {
          await prisma.payment.updateMany({
            where: { reference: charge.payment_intent as string },
            data:  { status: "REFUNDED" },
          });
        }
        break;
      }

      // ────────────────────────────────────────────────────────────────────
      // Événements d'abonnement — non utilisés actuellement, réservé au futur
      // ────────────────────────────────────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated":
      case "customer.subscription.deleted":
        // TODO : implémenter si SHIFT UP propose des abonnements récurrents
        break;

      default:
        // Tous les autres événements Stripe sont ignorés silencieusement.
        // On logue le type pour faciliter le débogage.
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    // Répondre 200 à Stripe pour confirmer la réception.
    // Si on ne répond pas 200, Stripe re-tentera l'envoi jusqu'à 3 jours.
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook handler error:", error);
    return NextResponse.json({ error: "Webhook handler failed" }, { status: 500 });
  }
}
