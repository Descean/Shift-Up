/**
 * lib/recrutement/donnees.ts — Cycle de vie des données des candidats non retenus
 *
 *  1. L'admin notifie le candidat (motifs) : un lien personnel lui est envoyé.
 *  2. Le candidat choisit : conserver son dossier (vivier, 24 mois) ou le supprimer.
 *  3. Sans réponse : relance à J+15, suppression à J+30.
 *  4. Accord expiré (24 mois) : suppression.
 * La suppression efface les PDF du stockage et anonymise la fiche (on garde poste, motifs
 * et dates pour les statistiques, plus aucune donnée permettant d'identifier la personne).
 */
import { randomBytes } from "crypto";
import type { Candidature } from "@prisma/client";
import prisma from "@/lib/prisma";
import { removeObjects, listAllObjects } from "./storage";
import { RELANCE_APRES_JOURS, ajouterJours } from "./motifs";
import { sendRelanceDonneesCandidat } from "@/lib/email";

type Piece = { path: string };

export function nouveauJeton() {
  return randomBytes(24).toString("base64url");
}

export function lienDonnees(jeton: string) {
  const base = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");
  return `${base}/recrutement/donnees/${jeton}`;
}

/** Efface les pièces et anonymise la candidature. */
export async function supprimerDonnees(c: Candidature, conservation: "REFUSEE" | "EXPIREE" | "ACCEPTEE") {
  const paths = ((c.fichiers as Piece[] | null) ?? []).map((f) => f.path).filter(Boolean);
  await removeObjects(paths);
  return prisma.candidature.update({
    where: { id: c.id },
    data: {
      conservation,
      nom: "CANDIDAT SUPPRIMÉ",
      prenoms: "—",
      email: `supprime-${c.id}@shiftup.invalid`,
      telephone: "—",
      ville: "—",
      nationalite: "—",
      diplome: "—",
      source: null,
      noteInterne: null,
      commentaireNonRetenu: null,
      fichiers: [],
      donneesSupprimeesLe: new Date(),
    },
  });
}

/** Tâche quotidienne : relances, suppressions à échéance, fichiers abandonnés. */
export async function entretienDonnees(now = new Date()) {
  const bilan = { relances: 0, expirees: 0, finConservation: 0, fichiersOrphelins: 0, erreurs: [] as string[] };

  // 1. Relance des candidats sans réponse
  const aRelancer = await prisma.candidature.findMany({
    where: { conservation: "EN_ATTENTE", relanceLe: null, donneesSupprimeesLe: null, notifieLe: { lte: ajouterJours(now, -RELANCE_APRES_JOURS) } },
  });
  for (const c of aRelancer) {
    try {
      if (!c.jetonDonnees || !c.conservationJusquau) continue;
      await sendRelanceDonneesCandidat({ to: c.email, prenoms: c.prenoms, poste: c.offreTitre, reference: c.reference, lien: lienDonnees(c.jetonDonnees), dateLimite: c.conservationJusquau });
      await prisma.candidature.update({ where: { id: c.id }, data: { relanceLe: now } });
      bilan.relances++;
    } catch (e) { bilan.erreurs.push(`relance ${c.reference}: ${(e as Error).message}`); }
  }

  // 2. Sans réponse à la date limite → suppression
  const expirees = await prisma.candidature.findMany({ where: { conservation: "EN_ATTENTE", donneesSupprimeesLe: null, conservationJusquau: { lte: now } } });
  for (const c of expirees) {
    try { await supprimerDonnees(c, "EXPIREE"); bilan.expirees++; } catch (e) { bilan.erreurs.push(`expiration ${c.reference}: ${(e as Error).message}`); }
  }

  // 3. Fin de la durée de conservation acceptée
  const finies = await prisma.candidature.findMany({ where: { conservation: "ACCEPTEE", donneesSupprimeesLe: null, conservationJusquau: { lte: now } } });
  for (const c of finies) {
    try { await supprimerDonnees(c, "ACCEPTEE"); bilan.finConservation++; } catch (e) { bilan.erreurs.push(`fin conservation ${c.reference}: ${(e as Error).message}`); }
  }

  // 4. Fichiers déposés sans candidature validée depuis plus de 7 jours
  try {
    const utilises = new Set<string>();
    const toutes = await prisma.candidature.findMany({ select: { fichiers: true } });
    for (const c of toutes) for (const f of (c.fichiers as Piece[] | null) ?? []) utilises.add(f.path);
    const limite = ajouterJours(now, -7);
    const orphelins = (await listAllObjects()).filter((o) => !utilises.has(o.path) && o.createdAt < limite).map((o) => o.path);
    await removeObjects(orphelins);
    bilan.fichiersOrphelins = orphelins.length;
  } catch (e) { bilan.erreurs.push(`fichiers orphelins: ${(e as Error).message}`); }

  return bilan;
}
