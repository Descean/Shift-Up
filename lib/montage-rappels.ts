/**
 * lib/montage-rappels.ts — Rappels automatiques des montages de dossiers (tâche quotidienne, 7 h au Bénin)
 *
 * Client :
 *   - pièces encore attendues : rappel à J-5 puis à J-2 (une fois chacun) ;
 *   - le client dépose lui-même et rien n'est enregistré : rappel la veille (J-1) ;
 *   - offre déposée depuis 21 jours sans résultat : on lui demande s'il l'a reçu (une fois).
 * SHIFT UP (un seul courriel récapitulatif, envoyé seulement s'il y a quelque chose à signaler) :
 *   - offres à déposer sous 3 jours ;
 *   - date limite passée sans dépôt enregistré (signalé une fois) ;
 *   - résultats à obtenir (dépôt depuis plus de 21 jours, signalé une fois).
 * Les envois déjà faits sont notés dans customFields.rappels pour ne pas les répéter.
 */
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendPointDepotsAdmin, sendRappelClient, type LigneRappel } from "@/lib/email";
import { lienEspaceClient, notifierClientWhatsApp } from "@/lib/whatsapp";
import {
  SECTEUR_MONTAGE, bilanPieces, dateLimiteFr, dateLimiteVersDate, echeance, enAttenteClient, joursRestants, lireMontage, shiftUpDepose,
} from "@/lib/montage";

const JOURS_AVANT_RELANCE_RESULTAT = 21;

export async function rappelsMontage(now = new Date()) {
  const bilan = { clients: 0, aDeposer: 0, nonConfirmes: 0, resultats: 0, pointAdmin: false, erreurs: [] as string[] };
  const prestations = await prisma.prestation.findMany({
    where: { sector: SECTEUR_MONTAGE, status: { notIn: ["ANNULEE"] } },
    select: { id: true, clientId: true, status: true, createdAt: true, customFields: true, client: { select: { name: true, email: true } } },
  });

  const aDeposer: { t: number; l: LigneRappel }[] = [];
  const nonConfirmes: LigneRappel[] = [];
  const resultats: LigneRappel[] = [];

  for (const p of prestations) {
    const cf = ((p.customFields as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
    const { dossier, pieces, depot, resultat } = lireMontage(cf);
    if (!dossier) continue;
    const rappels = { ...((cf.rappels as Record<string, string> | undefined) ?? {}) };
    const avant = JSON.stringify(rappels);
    const limite = dateLimiteVersDate(dossier.dateLimite);
    const passee = limite.getTime() < now.getTime();
    const j = joursRestants(dossier.dateLimite, now);
    const attendues = pieces.filter(enAttenteClient);
    const b = bilanPieces(pieces);
    const nom = p.client.name ?? "";
    const ligne: LigneRappel = {
      client: p.client.name ?? p.client.email ?? "Client", avis: dossier.referenceAvis, objet: dossier.intitule,
      limite: dateLimiteFr(dossier.dateLimite), echeance: echeance(dossier.dateLimite, now).libelle,
      pieces: `${pieces.length ? `${b.recues}/${b.total} reçues` : "—"} · dépôt : ${shiftUpDepose(dossier) ? "SHIFT UP" : "client"}`,
    };
    // Pas de rappel de pièces le jour même de la demande (la confirmation contient déjà la liste)
    const recente = now.getTime() - p.createdAt.getTime() < 86_400_000;

    try {
      // Client : pièces encore attendues avant la date limite
      if (!passee && !depot && !recente && p.status !== "TERMINEE" && attendues.length && p.client.email) {
        const cle = j <= 2 ? "piecesJ2" : j <= 5 ? "piecesJ5" : null;
        if (cle && !rappels[cle]) {
          await sendRappelClient({
            to: p.client.email, name: nom, sujet: `${attendues.length} pièce(s) à fournir — ${dossier.referenceAvis}`,
            titre: "Des pièces manquent encore à votre dossier",
            paragraphes: [
              `La date limite de dépôt de l'avis ${dossier.referenceAvis} est fixée au ${dateLimiteFr(dossier.dateLimite)}.`,
              "Pour que votre offre soit complète, il nous manque encore les documents suivants. Déposez-les dans votre espace, ou dites-nous si vous ne les avez pas.",
            ],
            items: attendues.map((x) => x.libelle),
          });
          await notifierClientWhatsApp(p.clientId, "shiftup_pieces", [nom, String(attendues.length), dossier.referenceAvis, dateLimiteFr(dossier.dateLimite), lienEspaceClient()]);
          rappels[cle] = now.toISOString();
          if (cle === "piecesJ2") rappels.piecesJ5 ??= now.toISOString();
          bilan.clients++;
        }
      }

      // Client qui dépose lui-même : rappel la veille
      if (!passee && !depot && !shiftUpDepose(dossier) && j <= 1 && !rappels.depotClient && p.client.email) {
        await sendRappelClient({
          to: p.client.email, name: nom, sujet: `Dépôt de votre offre ${j <= 0 ? "aujourd'hui" : "demain"} — ${dossier.referenceAvis}`,
          titre: `Votre offre est à déposer ${j <= 0 ? "aujourd'hui" : "demain"}`,
          paragraphes: [
            `Date limite : ${dateLimiteFr(dossier.dateLimite)}${dossier.lieuDepot ? ` — ${dossier.lieuDepot}` : ""}.`,
            "Après le dépôt, indiquez-le dans votre espace et joignez la photo du récépissé : nous suivrons le résultat avec vous.",
          ],
        });
        await notifierClientWhatsApp(p.clientId, "shiftup_rappel_depot", [nom, dossier.referenceAvis, dateLimiteFr(dossier.dateLimite), lienEspaceClient()]);
        rappels.depotClient = now.toISOString();
        bilan.clients++;
      }

      // Client : résultat à communiquer, 21 jours après le dépôt
      const depuisDepot = depot ? (now.getTime() - new Date(depot.deposeLe).getTime()) / 86_400_000 : 0;
      const sansResultat = !resultat || resultat.statut === "EN_ATTENTE";
      if (depot && sansResultat && depuisDepot >= JOURS_AVANT_RELANCE_RESULTAT && !rappels.resultatClient && p.client.email) {
        await sendRappelClient({
          to: p.client.email, name: nom, sujet: `Résultat de l'avis ${dossier.referenceAvis} ?`,
          titre: "Avez-vous reçu le résultat ?",
          paragraphes: [
            `Votre offre pour l'avis ${dossier.referenceAvis} a été déposée il y a ${Math.floor(depuisDepot)} jours.`,
            "Si vous avez reçu une lettre, un procès-verbal ou vu une publication, indiquez le résultat dans votre espace (ou répondez à ce courriel). En cas de rejet, nous pouvons examiner avec vous la possibilité d'un recours.",
          ],
        });
        rappels.resultatClient = now.toISOString();
        bilan.clients++;
      }
    } catch (e) {
      bilan.erreurs.push(`rappel client ${p.id}: ${(e as Error).message}`);
    }

    // Récapitulatif SHIFT UP
    if (!depot && !passee && j <= 3) aDeposer.push({ t: limite.getTime(), l: ligne });
    if (!depot && passee && !rappels.nonConfirme) { nonConfirmes.push(ligne); rappels.nonConfirme = now.toISOString(); }
    if (depot && sansResultatAdmin(resultat) && depuisJours(depot.deposeLe, now) >= JOURS_AVANT_RELANCE_RESULTAT && !rappels.resultatAdmin) {
      resultats.push({ ...ligne, echeance: `Déposée il y a ${Math.floor(depuisJours(depot.deposeLe, now))} j` }); rappels.resultatAdmin = now.toISOString();
    }

    if (JSON.stringify(rappels) !== avant) {
      await prisma.prestation.update({ where: { id: p.id }, data: { customFields: { ...cf, rappels } as Prisma.InputJsonValue } });
    }
  }

  const aDeposerTries = aDeposer.sort((x, y) => x.t - y.t).map((x) => x.l);
  bilan.aDeposer = aDeposer.length;
  bilan.nonConfirmes = nonConfirmes.length;
  bilan.resultats = resultats.length;
  if (aDeposer.length || nonConfirmes.length || resultats.length) {
    try {
      const r = await sendPointDepotsAdmin({ aDeposer: aDeposerTries, nonConfirmes, resultats });
      if ((r as { error?: unknown })?.error) throw new Error(String((r as { error?: { message?: string } }).error?.message ?? "envoi refusé"));
      bilan.pointAdmin = true;
    } catch (e) {
      bilan.erreurs.push(`point admin: ${(e as Error).message}`);
    }
  }
  return bilan;
}

const sansResultatAdmin = (r: { statut: string } | null) => !r || r.statut === "EN_ATTENTE";
const depuisJours = (iso: string, now: Date) => (now.getTime() - new Date(iso).getTime()) / 86_400_000;
