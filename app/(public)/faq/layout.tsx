import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQ | SHIFT UP",
  description:
    "Trouvez les réponses à vos questions sur les services SHIFT UP : délais, tarifs, processus de commande, paiements, et plus encore.",
  keywords: [
    "FAQ SHIFT UP", "questions fréquentes", "comment commander", "tarifs SHIFT UP",
    "délais prestation", "paiement mobile money Bénin",
  ],
  openGraph: {
    title: "Foire aux questions | SHIFT UP",
    description: "Toutes les réponses à vos questions sur nos services.",
    url: "https://shiftup.bj/faq",
  },
};

export default function FaqLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
