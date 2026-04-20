import prisma from "@/lib/prisma";
import CounterDisplay from "./CounterDisplay";

// Cache pendant 1 heure — les stats ne changent pas à la minute
export const revalidate = 3600;

async function getStats() {
  const [clients, projetsTermines, domainesCount] = await Promise.all([
    // Nombre de clients enregistrés
    prisma.user.count({ where: { role: "CLIENT" } }),

    // Projets livrés et acceptés
    prisma.prestation.count({ where: { status: "TERMINEE" } }),

    // Domaines distincts de services actifs
    prisma.service
      .findMany({ where: { isActive: true }, select: { domain: true }, distinct: ["domain"] })
      .then((r) => r.length),
  ]);

  // Années d'expérience calculées depuis la création (2024)
  const anneesExperience = new Date().getFullYear() - 2024 || 1;

  return { clients, projetsTermines, domainesCount, anneesExperience };
}

export default async function CountersSection() {
  const { clients, projetsTermines, domainesCount, anneesExperience } =
    await getStats();

  const stats = [
    {
      value: clients,
      suffix: clients >= 100 ? "+" : "",
      label: "Clients enregistrés",
    },
    {
      value: projetsTermines,
      suffix: projetsTermines >= 10 ? "+" : "",
      label: "Projets livrés",
    },
    {
      value: domainesCount || 7,
      suffix: "",
      label: "Domaines d'expertise",
    },
    {
      value: anneesExperience,
      suffix: anneesExperience > 1 ? " ans" : " an",
      label: "D'expérience prouvée",
    },
  ];

  return (
    <section className="bg-white border-y border-primary/10 py-14">
      <div className="container-custom">
        <CounterDisplay stats={stats} />
      </div>
    </section>
  );
}
