import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutique | SHIFT UP",
  description:
    "Achetez nos formations, templates et ressources professionnelles en ligne. Paiement sécurisé par Mobile Money (MTN, Moov) et carte bancaire.",
  keywords: [
    "boutique SHIFT UP", "formations en ligne Bénin", "templates professionnels",
    "ressources entreprise", "achat mobile money Bénin", "e-commerce Bénin",
  ],
  openGraph: {
    title: "Boutique | SHIFT UP",
    description: "Formations, templates et ressources professionnelles. Paiement Mobile Money.",
    url: "https://shiftup.bj/boutique",
  },
};

export default function BoutiqueLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
