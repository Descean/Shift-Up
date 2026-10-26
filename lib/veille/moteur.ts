/**
 * lib/veille/moteur.ts — Passage quotidien de la veille (tâche de 7 h, voir /api/cron/recrutement)
 *
 *  1. Collecte des avis (portail national, Banque mondiale).
 *  2. Abonnements arrivés à échéance : statut EXPIRE + courriel au client.
 *  3. Pour chaque abonné actif : avis encore ouverts, publiés depuis moins de 21 jours, jamais signalés,
 *     qui correspondent à ses critères → courriel récapitulatif (et WhatsApp s'il l'a accepté).
 */
import prisma from "@/lib/prisma";
import { sendVeilleClient, sendVeilleStatutClient, type AvisCourriel } from "@/lib/email";
import { lienEspaceClient, notifierClientWhatsApp } from "@/lib/whatsapp";
import { scoreCorrespondance } from "@/lib/veille/criteres";
import { collecterBanqueMondiale, collecterSigmap, enregistrerAvis } from "@/lib/veille/sources";

const FENETRE_JOURS = 21;
const MAX_PAR_COURRIEL = 15;
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");
export const LIBELLES_SOURCE: Record<string, string> = { SIGMAP: "Portail des marchés publics", BANQUE_MONDIALE: "Banque mondiale", MANUEL: "SHIFT UP" };

export const dateFr = (d: Date | null | undefined) =>
  d ? d.toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" }) : null;

/** La table existe-t-elle ? (script SQL de la veille pas encore exécuté sur Supabase) */
export const tablesAbsentes = (e: unknown) => (e as { code?: string })?.code === "P2021" || /does not exist/i.test(String((e as Error)?.message));

export async function collecter() {
  const bilan = { sigmap: 0, banqueMondiale: 0, nouveaux: 0, erreurs: [] as string[] };
  for (const [nom, f] of [["sigmap", collecterSigmap], ["banqueMondiale", collecterBanqueMondiale]] as const) {
    try {
      const avis = await f();
      bilan[nom] = avis.length;
      bilan.nouveaux += await enregistrerAvis(avis);
    } catch (e) {
      bilan.erreurs.push(`${nom}: ${(e as Error).message}`);
    }
  }
  return bilan;
}

/** Signale aux abonnés actifs les avis qui leur correspondent. */
export async function distribuer(now = new Date(), { envoyer = true } = {}) {
  const bilan = { abonnes: 0, alertes: 0, courriels: 0, expires: 0, erreurs: [] as string[] };

  // Échéances
  const expires = await prisma.abonnementVeille.findMany({
    where: { statut: "ACTIF", actifJusquau: { lt: now } },
    include: { user: { select: { name: true, email: true } } },
  });
  for (const a of expires) {
    await prisma.abonnementVeille.update({ where: { id: a.id }, data: { statut: "EXPIRE" } });
    bilan.expires++;
    if (envoyer && a.user.email) await sendVeilleStatutClient({ to: a.user.email, name: a.user.name ?? "", statut: "EXPIRE" }).catch((e) => bilan.erreurs.push(`expiration ${a.id}: ${(e as Error).message}`));
  }

  const abonnes = await prisma.abonnementVeille.findMany({
    where: { statut: "ACTIF", OR: [{ actifJusquau: null }, { actifJusquau: { gte: now } }] },
    include: { user: { select: { id: true, name: true, email: true } } },
  });
  if (!abonnes.length) return bilan;
  const avis = await prisma.avisMarche.findMany({
    where: { dateLimite: { gt: new Date(now.getTime() + 24 * 3600_000) }, createdAt: { gte: new Date(now.getTime() - FENETRE_JOURS * 86_400_000) } },
    orderBy: { dateLimite: "asc" },
  });

  for (const ab of abonnes) {
    bilan.abonnes++;
    try {
      const deja = new Set((await prisma.alerteVeille.findMany({ where: { abonnementId: ab.id }, select: { avisId: true } })).map((x) => x.avisId));
      const trouves = avis
        .filter((a) => !deja.has(a.id))
        .map((a) => ({ a, score: scoreCorrespondance(a, ab) }))
        .filter((x) => x.score > 0)
        .sort((x, y) => y.score - x.score);
      if (!trouves.length) continue;
      if (envoyer && ab.user.email) {
        // Courriel d'abord : en cas d'échec, rien n'est enregistré et les avis seront retentés au prochain passage
        const contenu: AvisCourriel[] = trouves.slice(0, MAX_PAR_COURRIEL).map(({ a }) => ({
          reference: a.reference, objet: a.objet, autorite: a.autorite, dateLimite: dateFr(a.dateLimite), source: LIBELLES_SOURCE[a.source] ?? a.source,
          lien: a.lien, monter: `${APP_URL}/dashboard/client/nouvelle-demande?avis=${a.id}`,
        }));
        const r = await sendVeilleClient({ to: ab.user.email, name: ab.user.name ?? "", avis: contenu, total: trouves.length });
        if ((r as { error?: unknown })?.error) throw new Error("envoi refusé par le service de courriel");
        await notifierClientWhatsApp(ab.user.id, "shiftup_veille", [ab.user.name ?? "", String(trouves.length), lienEspaceClient("/dashboard/client/veille")]);
      }
      await prisma.alerteVeille.createMany({ data: trouves.map((x) => ({ abonnementId: ab.id, avisId: x.a.id, score: x.score, envoyeLe: envoyer && ab.user.email ? now : null })), skipDuplicates: true });
      bilan.alertes += trouves.length;
      if (!envoyer || !ab.user.email) continue;
      await prisma.abonnementVeille.update({ where: { id: ab.id }, data: { dernierEnvoi: now } });
      bilan.courriels++;
    } catch (e) {
      bilan.erreurs.push(`abonné ${ab.id}: ${(e as Error).message}`);
    }
  }
  return bilan;
}

/** Passage complet (collecte + distribution). Sans effet si les tables n'existent pas encore. */
export async function executerVeille(now = new Date()) {
  try {
    const collecte = await collecter();
    const distribution = await distribuer(now);
    return { collecte, distribution, erreurs: [...collecte.erreurs, ...distribution.erreurs] };
  } catch (e) {
    if (tablesAbsentes(e)) return { erreurs: ["Tables de la veille absentes : exécuter prisma/sql/2026-10_veille_whatsapp.sql dans Supabase."] };
    return { erreurs: [(e as Error).message] };
  }
}
