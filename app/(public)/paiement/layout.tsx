import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paiement sécurisé",
  description: "Réglez votre prestation ou votre commande SHIFT UP par Mobile Money ou carte bancaire.",
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
