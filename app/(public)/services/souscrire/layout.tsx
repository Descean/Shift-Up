import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demander une prestation",
  description: "Décrivez votre besoin et recevez un devis SHIFT UP sous 48 heures ouvrées.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
