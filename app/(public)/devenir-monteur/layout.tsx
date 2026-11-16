import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Devenir monteur de dossiers",
  description: "Vous savez monter des dossiers d'appels d'offres ? Ouvrez votre compte monteur sur SHIFT UP : vos clients déposent leur dossier, paient en ligne, et vous recevez votre part.",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
