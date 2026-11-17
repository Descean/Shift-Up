/**
 * lib/devis-client.ts — Envoi (ou rappel) du devis au client par courriel, avec un bouton qui le connecte
 * directement à son dossier (lien valable 3 jours, comptes client sans double authentification uniquement).
 */
import prisma from "@/lib/prisma";
import { sendDevisClient } from "@/lib/email";
import { lienAcces } from "@/lib/acces";

export async function prevenirClientDevis(prestationId: string, titre: string, acompte: number, relance = false) {
  const p = await prisma.prestation.findUnique({
    where: { id: prestationId },
    select: { client: { select: { id: true, name: true, email: true, role: true, totpEnabled: true } } },
  });
  const c = p?.client;
  if (!c?.email) return false;
  const suite = `/dashboard/client/prestations?id=${encodeURIComponent(prestationId)}`;
  const lien = c.role === "CLIENT" && !c.totpEnabled ? await lienAcces(c.id, suite, 72 * 60) : null;
  await sendDevisClient({ to: c.email, name: c.name ?? "", serviceName: titre, depositAmount: acompte, prestationId, lien, relance });
  return true;
}
