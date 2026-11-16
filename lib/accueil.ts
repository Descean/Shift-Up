/**
 * lib/accueil.ts — Chiffres affichés en haut de la page d'accueil.
 *
 * Les dossiers traités avant la mise en service de l'espace client ne sont pas en base :
 * on part donc des chiffres arrêtés par la direction (CHIFFRES_DEPART, à la date `arreteAu`),
 * puis on ajoute automatiquement ce que le site enregistre après cette date.
 *
 * - dossiers montés          = départ + prestations du domaine « Dossiers » terminées depuis la date d'arrêt
 * - entreprises accompagnées = départ + clients ayant eu une première prestation terminée depuis la date d'arrêt
 * - dossiers gagnés          = départ + soumissions marquées « gagné » (par l'admin ou par Tendo) depuis la date d'arrêt
 */
import prisma from "@/lib/prisma";

export const CHIFFRES_DEPART = {
  arreteAu: new Date("2026-11-15T00:00:00Z"),
  dossiersMontes: 26,
  entreprisesAccompagnees: 7,
  dossiersGagnes: 14,
} as const;

export type ChiffresAccueil = {
  dossiersMontes: number;
  entreprisesAccompagnees: number;
  dossiersGagnes: number;
};

/** Soumissions gagnées depuis la date d'arrêt (0 si la table n'existe pas encore). */
async function gagnesDepuisArret(arreteAu: Date): Promise<number> {
  try {
    return await prisma.soumission.count({ where: { resultat: "GAGNE", resultatAt: { gte: arreteAu } } });
  } catch {
    return 0;
  }
}

export async function getChiffresAccueil(): Promise<ChiffresAccueil> {
  const { arreteAu } = CHIFFRES_DEPART;
  const gagnes = CHIFFRES_DEPART.dossiersGagnes + (await gagnesDepuisArret(arreteAu));
  try {
    const [dossiers, nouveauxClients] = await Promise.all([
      prisma.prestation.count({
        where: { status: "TERMINEE", endDate: { gte: arreteAu }, service: { is: { domain: "Dossiers" } } },
      }),
      prisma.prestation
        .groupBy({ by: ["clientId"], where: { status: "TERMINEE" }, _min: { endDate: true } })
        .then((rows) => rows.filter((r) => r._min.endDate && r._min.endDate >= arreteAu).length),
    ]);
    return {
      dossiersMontes: CHIFFRES_DEPART.dossiersMontes + dossiers,
      entreprisesAccompagnees: CHIFFRES_DEPART.entreprisesAccompagnees + nouveauxClients,
      dossiersGagnes: gagnes,
    };
  } catch {
    return {
      dossiersMontes: CHIFFRES_DEPART.dossiersMontes,
      entreprisesAccompagnees: CHIFFRES_DEPART.entreprisesAccompagnees,
      dossiersGagnes: gagnes,
    };
  }
}
