import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import ServiceLeadForm from "./ServiceLeadForm";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const service = await prisma.apporteurService.findFirst({ where: { id, isApproved: true, isActive: true } });
  if (!service) return { title: "Service introuvable" };
  return {
    title: service.title,
    description: service.description.slice(0, 160),
    robots: { index: false, follow: false },
  };
}

export default async function ApporteurServicePage({ params }: Props) {
  const { id } = await params;

  const service = await prisma.apporteurService.findFirst({
    where: { id, isApproved: true, isActive: true },
    include: { apporteur: { select: { name: true } } },
  });

  if (!service) notFound();

  return (
    <ServiceLeadForm
      service={{
        id: service.id,
        title: service.title,
        description: service.description,
        category: service.category,
        features: service.features,
        priceMin: service.priceMin,
        priceMax: service.priceMax,
        currency: service.currency,
        duration: service.duration,
        providerName: service.apporteur.name ?? "Partenaire SHIFT UP",
      }}
    />
  );
}
