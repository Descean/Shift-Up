import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créer un compte",
  description: "Créez votre compte SHIFT UP pour demander une prestation, suivre vos projets et vos paiements.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
