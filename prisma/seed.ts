/**
 * prisma/seed.ts — Données initiales SHIFT UP
 *
 * Exécuter avec : npx ts-node prisma/seed.ts
 * ou via       : npx prisma db seed  (si configuré dans package.json)
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Formation "IA & Marchés Publics — 28-30 mai 2026"
  const existing = await prisma.formation.findUnique({ where: { slug: "ia-marches-publics" } });
  if (!existing) {
    await prisma.formation.create({
      data: {
        slug: "ia-marches-publics",
        titre: "Intelligence Artificielle & Marchés Publics",
        description:
          "Apprenez à utiliser l'IA pour rédiger des offres DAO gagnantes et décrocher plus de marchés publics.",
        dateDebut: new Date("2026-05-28T08:00:00Z"),
        dateFin: new Date("2026-05-30T18:00:00Z"),
        lieu: "Cotonou, Bénin",
        prixFCFA: 50000,
        placesMax: 30,
        isActive: true,
      },
    });
    console.log("✅ Formation 'ia-marches-publics' créée.");
  } else {
    console.log("ℹ️  Formation 'ia-marches-publics' déjà existante — ignorée.");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
