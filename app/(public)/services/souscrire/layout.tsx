import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Demander une prestation",
  description: "Déposez votre dossier, dites-nous ce qu'il faut faire et recevez le devis SHIFT UP.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
