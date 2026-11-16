"use client";

/**
 * Cadre des espaces : barre du haut (maquette « plateforme de montage ») pour le client, le monteur
 * et les pages de l'équipe (/dashboard/equipe) ; barre latérale pour le back-office et les autres rôles.
 */
import { usePathname } from "next/navigation";
import EnTeteEspace from "@/components/espace/EnTeteEspace";

export default function CadreEspace({ role, nom, barreLaterale, enTeteBureau, children }: {
  role: string; nom: string; barreLaterale: React.ReactNode; enTeteBureau: React.ReactNode; children: React.ReactNode;
}) {
  const chemin = usePathname() ?? "";
  const maquette = role === "CLIENT" || role === "MONTEUR" || chemin.startsWith("/dashboard/equipe");

  if (maquette) {
    return (
      <div className="min-h-screen bg-[#F6F8FC]">
        <EnTeteEspace role={role} nom={nom} />
        <main className="mx-auto w-full max-w-[1200px] px-4 py-8 lg:px-8">{children}</main>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-su-brume flex">
      {barreLaterale}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="hidden lg:block">{enTeteBureau}</div>
        <div className="lg:hidden h-14 flex-shrink-0" />
        <main className="flex-1 p-4 lg:p-6 overflow-auto pb-20 lg:pb-6">{children}</main>
      </div>
    </div>
  );
}
