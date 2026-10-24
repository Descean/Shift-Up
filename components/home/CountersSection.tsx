import prisma from "@/lib/prisma";
import { ENTREPRISE } from "@/lib/entreprise";
import CounterDisplay from "./CounterDisplay";

/**
 * Indicateurs de l'accueil, calculés sur les données réelles.
 * Les compteurs clients / projets n'apparaissent qu'à partir de 10, pour ne pas afficher
 * de petits chiffres peu parlants ; ils sont remplacés par l'offre (domaines, services, formations).
 */
async function getStats() {
  const now = new Date();
  const [clients, projets, domaines, services, formations] = await Promise.all([
    prisma.user.count({ where: { role: "CLIENT" } }),
    prisma.prestation.count({ where: { status: "TERMINEE" } }),
    prisma.service.findMany({ where: { isActive: true }, select: { domain: true }, distinct: ["domain"] }).then((r) => r.length),
    prisma.service.count({ where: { isActive: true } }),
    prisma.formation.count({ where: { dateFin: { lt: now } } }),
  ]).catch(() => [0, 0, 0, 0, 0] as const);

  const candidats = [
    projets >= 10 && { value: projets, suffix: "", label: "Projets livrés" },
    clients >= 10 && { value: clients, suffix: "", label: "Clients accompagnés" },
    domaines > 0 && { value: domaines, suffix: "", label: "Domaines d'expertise" },
    services > 0 && { value: services, suffix: "", label: "Services au catalogue" },
    formations > 0 && { value: formations, suffix: "", label: formations > 1 ? "Sessions de formation tenues" : "Session de formation tenue" },
  ].filter(Boolean) as { value: number; suffix: string; label: string }[];

  return [...candidats.slice(0, 3), { value: ENTREPRISE.anneeCreation, suffix: "", label: "Année de création", static: true }];
}

export default async function CountersSection() {
  const stats = await getStats();
  return (
    <section className="bg-white border-y border-primary/10 py-14">
      <div className="container-custom">
        <CounterDisplay stats={stats} />
      </div>
    </section>
  );
}
