import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre espace SHIFT UP : prestations, devis, paiements, livrables et formations.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
