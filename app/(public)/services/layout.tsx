import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Nos Services | SHIFT UP",
  description:
    "Découvrez nos services de conseil stratégique, transformation digitale, marketing, juridique, BTP, formation et bien plus. Expertise sur mesure pour les entreprises au Bénin et en Afrique de l'Ouest.",
  keywords: [
    "services conseil Bénin", "transformation digitale Bénin", "marketing digital",
    "juridique entreprise", "formation professionnelle Bénin", "BTP Bénin",
    "marchés publics", "SHIFT UP services",
  ],
  openGraph: {
    title: "Nos Services | SHIFT UP",
    description: "Expertise sur mesure : conseil, digital, marketing, juridique, BTP, formation.",
    url: "https://shiftup.bj/services",
  },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
