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

// ── Initialisation du client Stripe ──────────────────────────────────────────
// STRIPE_SECRET_KEY est obligatoire — le `!` indique à TypeScript qu'on garantit
// sa présence (vérification faite dans le handler).
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2026-02-25.clover",
});

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
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
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

        // 2. Si on a un prestationId → vérifier si on peut avancer le statut de la prestation
        if (prestationId) {
          const prestation = await prisma.prestation.findUnique({
            where:   { id: prestationId },
            include: { payments: true }, // Inclure tous les paiements liés
          });

          if (prestation) {
            // Calculer le total effectivement encaissé (paiements COMPLETED uniquement)
            const totalPaid = prestation.payments
              .filter((p) => p.status === "COMPLETED")
              .reduce((sum, p) => sum + p.amount, 0);

            /**
             * Règle d'avancement automatique :
             * Si la prestation était EN_ATTENTE et que le client a payé au moins
             * 60% du montant total → passer en EN_COURS (début des travaux).
             * Cela correspond à l'acompte de 60% défini dans les CGV.
             */
            if (prestation.status === "EN_ATTENTE" && totalPaid >= prestation.amount * 0.6) {
              await prisma.prestation.update({
                where: { id: prestationId },
                data:  { status: "EN_COURS" },
              });
            }
          }
        }

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
