/**
 * lib/notifications.ts — Avis aux utilisateurs : cloche de l'espace, journal de chaque demande et courriel.
 *
 * Tolérant : si la table Notification n'existe pas encore (script SQL non exécuté), l'avis est
 * simplement ignoré et l'action qui l'a déclenché n'échoue jamais.
 */
import prisma from "@/lib/prisma";
import { sendEtapeClient } from "@/lib/email";
import { nomService } from "@/lib/prestations-noms";

export type TypeAvis = "DEMANDE" | "DEVIS" | "PAIEMENT" | "ETAPE" | "LIVRABLE" | "MESSAGE" | "PIECES" | "DEPOT" | "RESULTAT" | "STATUT";

/** Lien vers la fiche d'une demande dans l'espace client. */
export const lienDemande = (prestationId: string) => `/dashboard/client/prestations?id=${prestationId}`;

export async function creerAvis(a: { userId: string; prestationId?: string | null; type: TypeAvis; titre: string; texte?: string | null; lien?: string | null }) {
  try {
    await prisma.notification.create({
      data: { userId: a.userId, prestationId: a.prestationId ?? null, type: a.type, titre: a.titre.slice(0, 200), texte: a.texte?.slice(0, 1000) ?? null, lien: a.lien ?? null },
    });
  } catch (e) {
    console.warn("[avis] non enregistré :", (e as Error).message?.slice(0, 160));
  }
}

/**
 * Avis au client d'une demande : notification dans l'espace + courriel (sauf courriel: false,
 * quand un courriel dédié est déjà envoyé par ailleurs, ex. devis ou livrable).
 */
export async function avertirClient(prestationId: string, type: TypeAvis, titre: string, texte: string, options: { courriel?: boolean } = {}) {
  try {
    const p = await prisma.prestation.findUnique({
      where: { id: prestationId },
      select: { id: true, clientId: true, sector: true, customService: true, service: { select: { title: true } }, client: { select: { name: true, email: true } } },
    });
    if (!p) return;
    const lien = lienDemande(p.id);
    await creerAvis({ userId: p.clientId, prestationId: p.id, type, titre, texte, lien });
    if (options.courriel !== false && p.client.email) {
      await sendEtapeClient({ to: p.client.email, name: p.client.name ?? "", titre, texte, serviceName: nomService(p), lien }).catch((e) => console.error("[avis courriel]", e));
    }
  } catch (e) {
    console.error("[avertirClient]", e);
  }
}
