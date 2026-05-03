import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import FormationForm from "./FormationForm";

interface Props {
  params: { slug: string };
  searchParams: { succes?: string; ref?: string; echec?: string };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const f = await prisma.formation.findUnique({ where: { slug: params.slug, isActive: true } });
  if (!f) return { title: "Formation introuvable" };
  return {
    title: f.titre,
    description: f.description ?? `Inscription à la formation ${f.titre} — SHIFT UP`,
    robots: { index: false, follow: false },
  };
}

export default async function FormationPage({ params, searchParams }: Props) {
  const formation = await prisma.formation.findUnique({
    where: { slug: params.slug, isActive: true },
    include: {
      _count: { select: { inscriptions: { where: { status: "PAIEMENT_CONFIRME" } } } },
    },
  });

  if (!formation) notFound();

  const placesRestantes = Math.max(0, formation.placesMax - formation._count.inscriptions);
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });

  const succes = searchParams.succes === "1";
  const echec = searchParams.echec === "1";
  const reference = searchParams.ref ?? "";

  return (
    <FormationForm
      formation={{
        id: formation.id,
        titre: formation.titre,
        description: formation.description ?? "",
        dateDebut: fmt.format(formation.dateDebut),
        dateFin: fmt.format(formation.dateFin),
        lieu: formation.lieu,
        prixFCFA: formation.prixFCFA,
        placesRestantes,
        succes,
        echec,
        reference,
      }}
    />
  );
}
