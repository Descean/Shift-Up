/**
 * lib/effacement.ts — Effacement des fichiers et des échanges 30 jours après la fin d'une prestation.
 *
 * J+23 : le client est prévenu (télécharger ses livrables). J+30 : dossier déposé, livrables, pièces,
 * discussion, historique et étapes sont supprimés. Restent : la demande (intitulé, montants), le devis,
 * les paiements et les factures, pour la comptabilité. Les fichiers du coffre « Mes entreprises » sont épargnés.
 */
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { supprimerFichiers } from "@/lib/fichiers";
import { avertirClient } from "@/lib/notifications";
import { lireMontage } from "@/lib/montage";

export const JOURS_CONSERVATION = 30;
export const JOURS_AVIS = 7;
const JOUR = 86_400_000;

/** Date de fin retenue : date de clôture, sinon dernière mise à jour. */
const finDe = (p: { endDate: Date | null; updatedAt: Date }) => p.endDate ?? p.updatedAt;

export async function effacerUnePrestation(id: string) {
  const p = await prisma.prestation.findUnique({
    where: { id },
    select: { id: true, attachments: true, customFields: true, livrables: { select: { url: true } } },
  });
  if (!p) return 0;
  const cf = (p.customFields ?? {}) as Record<string, unknown>;
  const m = lireMontage(p.customFields);
  const messages = await prisma.message.findMany({ where: { conversationId: `prestation:${id}` }, select: { attachments: true } });
  const urls = [
    ...p.attachments,
    ...p.livrables.map((l) => l.url).filter((u): u is string => Boolean(u)),
    ...m.pieces.flatMap((x) => x.fichiers.map((f) => f.url)),
    ...[m.depot?.recepisse?.url, m.resultat?.document?.url].filter((u): u is string => Boolean(u)),
    ...messages.flatMap((x) => x.attachments),
    ...(typeof cf.consigneVocale === "string" ? [cf.consigneVocale] : []),
  ].map((u) => u.split("?")[0]);
  // Ne jamais effacer un fichier conservé dans le coffre d'une entreprise
  const coffre = new Set(
    (await prisma.pieceEntreprise.findMany({ where: { url: { in: urls } }, select: { url: true } }).catch(() => [])).map((x) => x.url),
  );
  const aEffacer = urls.filter((u) => !coffre.has(u));
  const n = await supprimerFichiers(aEffacer).catch((e) => { console.error("[effacement fichiers]", e); return 0; });

  await prisma.$transaction([
    prisma.livrable.deleteMany({ where: { prestationId: id } }),
    prisma.prestationPhase.deleteMany({ where: { prestationId: id } }),
    prisma.message.deleteMany({ where: { conversationId: `prestation:${id}` } }),
    prisma.prestation.update({
      where: { id },
      data: {
        attachments: [],
        brief: null,
        customFields: {
          ...(cf.offre ? { offre: cf.offre } : {}),
          ...(cf.entrepriseNom ? { entrepriseNom: cf.entrepriseNom } : {}),
          ...(m.dossier ? { referenceAvis: m.dossier.referenceAvis } : {}),
          effaceLe: new Date().toISOString(),
        } as Prisma.InputJsonValue,
      },
    }),
  ]);
  await prisma.notification.deleteMany({ where: { prestationId: id } }).catch(() => {});
  return n;
}

/** Tâche quotidienne : avis à J-7 puis effacement à J+30. */
export async function effacementQuotidien(maintenant = new Date()) {
  const candidates = await prisma.prestation.findMany({
    where: { status: { in: ["TERMINEE", "ANNULEE"] } },
    select: { id: true, endDate: true, updatedAt: true, customFields: true },
  });
  let avis = 0, effaces = 0, fichiers = 0;
  for (const p of candidates) {
    const cf = (p.customFields ?? {}) as Record<string, unknown>;
    if (cf.effaceLe) continue;
    const age = (maintenant.getTime() - finDe(p).getTime()) / JOUR;
    if (age >= JOURS_CONSERVATION) {
      fichiers += await effacerUnePrestation(p.id);
      effaces++;
    } else if (age >= JOURS_CONSERVATION - JOURS_AVIS && !cf.avisEffacementLe) {
      const date = new Date(finDe(p).getTime() + JOURS_CONSERVATION * JOUR).toLocaleDateString("fr-FR", { timeZone: "Africa/Porto-Novo" });
      await avertirClient(p.id, "STATUT", "Vos fichiers seront effacés bientôt",
        `Pour protéger vos données, les fichiers et les échanges de cette demande seront effacés le ${date}. Téléchargez dès maintenant les livrables que vous souhaitez garder. Le devis et les factures restent disponibles.`);
      await prisma.prestation.update({ where: { id: p.id }, data: { customFields: { ...cf, avisEffacementLe: maintenant.toISOString() } as Prisma.InputJsonValue } });
      avis++;
    }
  }
  return { avis, effaces, fichiers };
}
