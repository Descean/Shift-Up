import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Travailler avec nous",
  description: "Monteur de dossiers d'appels d'offres ou professionnel d'un de nos domaines : rejoignez SHIFT UP comme partenaire, traitez vos clients sur la plateforme et recevez votre part de chaque paiement.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
