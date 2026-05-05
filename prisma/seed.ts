/**
 * prisma/seed.ts — Données initiales SHIFT UP
 *
 * Exécuter avec : npx ts-node prisma/seed.ts
 * ou via       : npx prisma db seed  (si configuré dans package.json)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Formation présentielle "IA & Marchés Publics — 28-30 mai 2026"
  await prisma.formation.upsert({
    where: { slug: "ia-marches-publics" },
    create: {
      slug: "ia-marches-publics",
      titre: "Intelligence Artificielle & Marchés Publics",
      description:
        "Apprenez à utiliser l'IA pour rédiger des offres DAO gagnantes, structurer des propositions compétitives et décrocher plus de marchés publics.",
      dateDebut: new Date("2026-05-28T08:00:00Z"),
      dateFin: new Date("2026-05-30T18:00:00Z"),
      lieu: "Cotonou, Bénin",
      prixFCFA: 50000,
      placesMax: 30,
      isActive: true,
    },
    update: {
      titre:       "Intelligence Artificielle & Marchés Publics",
      description: "Apprenez à utiliser l'IA pour rédiger des offres DAO gagnantes, structurer des propositions compétitives et décrocher plus de marchés publics.",
      dateDebut:   new Date("2026-05-28T08:00:00Z"),
      dateFin:     new Date("2026-05-30T18:00:00Z"),
      lieu:        "Cotonou, Bénin",
      prixFCFA:    50000,
    },
  });
  console.log("✅ Formation 'ia-marches-publics' (présentiel) synchronisée.");

  // Formation en ligne "IA & Marchés Publics — 4-6 juin 2026"
  await prisma.formation.upsert({
    where: { slug: "ia-marches-publics-enligne" },
    create: {
      slug: "ia-marches-publics-enligne",
      titre: "Intelligence Artificielle & Marchés Publics",
      description:
        "Apprenez à utiliser l'IA pour rédiger des offres DAO gagnantes, structurer des propositions compétitives et décrocher plus de marchés publics.",
      dateDebut: new Date("2026-06-04T08:00:00Z"),
      dateFin: new Date("2026-06-06T18:00:00Z"),
      lieu: "Classe virtuelle (Zoom)",
      prixFCFA: 35500,
      placesMax: 50,
      isActive: true,
    },
    update: {
      dateDebut: new Date("2026-06-04T08:00:00Z"),
      dateFin:   new Date("2026-06-06T18:00:00Z"),
      lieu:      "Classe virtuelle (Zoom)",
      prixFCFA:  35500,
    },
  });
  console.log("✅ Formation 'ia-marches-publics-enligne' synchronisée.");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
