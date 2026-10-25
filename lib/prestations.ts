/**
 * lib/prestations.ts — Règles communes du circuit « demande → devis → acompte → livraison → solde »
 *
 *  - confirmerPaiement : appelé par les webhooks FedaPay et Stripe (idempotent)
 *  - soldeRegle / livrableAccessible : les livrables ne sont ouverts qu'une fois le solde payé,
 *    sauf ceux de type APERCU (version provisoire envoyée pour relecture)
 *  - vueClient : retire les liens des livrables encore verrouillés avant de les envoyer au navigateur
 */
import prisma from "@/lib/prisma";
import { getPhaseTemplates } from "@/lib/service-templates";
import { sendPaiementAdmin } from "@/lib/email";

export const TYPE_APERCU = "APERCU";

type Montants = { amount: number; amountPaid: number };

/** Le client a-t-il tout payé ? (tolérance de 1 F sur les arrondis) */
export function soldeRegle(p: Montants) {
  return p.amount > 0 && p.amountPaid >= p.amount - 1;
}

export function livrableAccessible(l: { type: string; isAvailable: boolean }, p: Montants) {
  return l.isAvailable && (l.type === TYPE_APERCU || soldeRegle(p));
}

export function nomService(p: { service?: { title: string } | null; customService?: string | null; sector?: string | null }) {
  return p.service?.title ?? p.customService ?? p.sector ?? "Prestation";
}

/** Prépare une prestation pour l'espace client : liens des livrables verrouillés retirés. */
export function vueClient<T extends Montants & { livrables?: { type: string; isAvailable: boolean; url: string | null }[] }>(p: T) {
  if (!p.livrables) return p;
  return {
    ...p,
    livrables: p.livrables
      .filter((l) => l.isAvailable)
      .map((l) => (livrableAccessible(l, p) ? { ...l, verrouille: false } : { ...l, url: null, verrouille: true })),
  };
}

/** Exécute des envois de courriels et journalise les échecs (sans faire échouer la requête). */
export async function envoyer(label: string, envois: Promise<unknown>[]) {
  const r = await Promise.allSettled(envois);
  r.forEach((x, i) => {
    if (x.status === "rejected") console.error(`[e-mail ${label} #${i}]`, x.reason);
    else if ((x.value as { error?: unknown } | null)?.error) console.error(`[e-mail ${label} #${i}]`, (x.value as { error?: unknown }).error);
  });
}

const STATUTS_AVANT_DEMARRAGE = ["EN_ATTENTE", "DEVIS_ENVOYE", "EN_ATTENTE_PAIEMENT"];

/**
 * Confirme un paiement vérifié auprès du prestataire. Idempotent : un second appel ne fait rien.
 * L'acompte fait démarrer les travaux (EN_COURS + phases types) ; le solde ne change pas l'étape en cours.
 */
export async function confirmerPaiement(paymentId: string) {
  const res = await prisma.payment.updateMany({ where: { id: paymentId, status: { not: "COMPLETED" } }, data: { status: "COMPLETED" } });
  if (res.count === 0) return false; // déjà traité

  const payment = await prisma.payment.findUniqueOrThrow({ where: { id: paymentId }, include: { prestation: true } });
  const p = payment.prestation;
  const demarrage = STATUTS_AVANT_DEMARRAGE.includes(p.status);

  const maj = await prisma.prestation.update({
    where: { id: p.id },
    data: {
      amountPaid: { increment: payment.amount },
      ...(demarrage ? { status: "EN_COURS" as const, startDate: new Date() } : {}),
    },
    include: { client: { select: { name: true, email: true } }, service: { select: { title: true } } },
  });

  if (demarrage && (await prisma.prestationPhase.count({ where: { prestationId: p.id } })) === 0) {
    const templates = getPhaseTemplates(p.sector ?? null);
    if (templates.length > 0) {
      await prisma.prestationPhase.createMany({
        data: templates.map((t) => ({
          prestationId: p.id, title: t.title, description: t.description, order: t.order,
          status: t.order === 0 ? "IN_PROGRESS" : "PENDING", progress: 0,
        })),
      });
    }
  }

  await prisma.auditLog.create({
    data: {
      userId: payment.userId, action: "PAYMENT_COMPLETED", entity: "Payment", entityId: payment.id,
      details: { amount: payment.amount, provider: payment.provider, reference: payment.reference },
    },
  });

  await envoyer("paiement", [
    sendPaiementAdmin({
      clientName: maj.client.name ?? maj.client.email ?? "Client", clientEmail: maj.client.email ?? "",
      serviceName: nomService(maj), montant: payment.amount, total: maj.amount, paye: maj.amountPaid, prestationId: p.id,
    }),
  ]);
  return true;
}
