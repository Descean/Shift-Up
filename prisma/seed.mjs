// Seed script en ESM pur (pas de TypeScript requis)
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existing = await prisma.formation.findUnique({ where: { slug: "ia-marches-publics" } });
  if (!existing) {
    await prisma.formation.create({
      data: {
        slug: "ia-marches-publics",
        titre: "Intelligence Artificielle & Marchés Publics",
        description: "Apprenez à utiliser l'IA pour rédiger des offres DAO gagnantes et décrocher plus de marchés publics.",
        dateDebut: new Date("2026-05-28T08:00:00Z"),
        dateFin:   new Date("2026-05-30T18:00:00Z"),
        lieu:      "Cotonou, Bénin",
        prixFCFA:  50000,
        placesMax: 30,
        isActive:  true,
      },
    });
    console.log("✅ Formation 'ia-marches-publics' créée.");
  } else {
    console.log("ℹ️  Formation déjà existante — ignorée.");
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
