import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contactez-nous",
  description:
    "Prenez contact avec SHIFT UP pour un devis, une question ou un partenariat. Basé à Abomey-Calavi, Bénin. Réponse sous 24h.",
  keywords: [
    "contact SHIFT UP", "devis conseil Bénin", "cabinet conseil Abomey-Calavi",
    "contact entreprise Bénin", "partenariat SHIFT UP",
  ],
  openGraph: {
    title: "Contactez-nous | SHIFT UP",
    description: "Basé à Abomey-Calavi, Bénin. Réponse sous 24h.",
    url: "https://www.shiftup.bj/contact",
  },
};

export default function ContactLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
