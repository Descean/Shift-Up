/** Pictogrammes au trait de la page d'accueil (couleur = currentColor). */
import type { ReactNode } from "react";
import { Manrope } from "next/font/google";

export const manrope = Manrope({ subsets: ["latin"], weight: ["600", "700", "800"], display: "swap" });

const traces: Record<string, ReactNode> = {
  conseil: (<><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>),
  numerique: (<><rect x="3" y="4" width="18" height="12" rx="2" /><path d="M8 20h8M12 16v4" /></>),
  formation: (<><path d="M2 9l10-5 10 5-10 5-10-5z" /><path d="M6 11v5c0 1.5 2.7 3 6 3s6-1.5 6-3v-5" /></>),
  dossiers: (<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />),
  marketing: (<><path d="M3 11v2a1 1 0 0 0 1 1h3l6 4V6L7 10H4a1 1 0 0 0-1 1z" /><path d="M17 9a4 4 0 0 1 0 6" /></>),
  juridique: (<><path d="M12 4v16M7 20h10M5 8h14" /><path d="M5 8l-3 6a3 3 0 0 0 6 0z" /><path d="M19 8l-3 6a3 3 0 0 0 6 0z" /></>),
  finance: (<path d="M4 20V10M10 20V4M16 20v-8M22 20H2" />),
  documents: (<><path d="M9 3h7l4 4v10a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" /><path d="M16 3v4h4" /><path d="M4 7v12a2 2 0 0 0 2 2h9" /><path d="M10.5 12.5l1.8 1.8 3.4-3.6" /></>),
  entreprise: (<><rect x="4" y="3" width="10" height="18" rx="1" /><path d="M14 9h5a1 1 0 0 1 1 1v11" /><path d="M7.5 7h3M7.5 11h3M7.5 15h3" /><path d="M2 21h20" /></>),
  coupe: (<><path d="M8 4h8v5a4 4 0 0 1-8 0z" /><path d="M8 6H5.5a2 2 0 0 0 0 4H8M16 6h2.5a2 2 0 0 1 0 4H16" /><path d="M12 13v4M9 21h6M10 17h4v4h-4z" /></>),
  devis: (<><path d="M7 3h7l5 5v13H7z" /><path d="M14 3v5h5M10 13h6M10 17h6" /></>),
  personne: (<><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" /></>),
  cadenas: (<><rect x="4" y="11" width="16" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>),
  horloge: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  telephone: (<path d="M5 4h4l2 5-3 2a11 11 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />),
  mail: (<><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></>),
  lieu: (<><path d="M12 21s-7-6-7-12a7 7 0 0 1 14 0c0 6-7 12-7 12z" /><circle cx="12" cy="9" r="2.5" /></>),
  coche: (<path d="M5 12l5 5L19 7" />),
  facebook: (<path d="M15 3h-2a4 4 0 0 0-4 4v3H7v4h2v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h2z" />),
  instagram: (<><rect x="3" y="3" width="18" height="18" rx="5" /><circle cx="12" cy="12" r="4" /><path d="M17.5 6.5h0" /></>),
  linkedin: (<><path d="M4 9h4v11H4zM6 4a2 2 0 1 1 0 4 2 2 0 0 1 0-4z" /><path d="M11 9h4v1.5a4 4 0 0 1 6 3.5V20h-4v-5a2 2 0 0 0-4 0v5h-2z" /></>),
  fleche: (<path d="M5 12h14M13 6l6 6-6 6" />),
  loupe: (<><circle cx="11" cy="11" r="7" /><path d="M20 20l-4-4" /></>),
  telecharger: (<path d="M12 4v11M7 10l5 5 5-5M5 20h14" />),
  whatsapp: (<><path d="M4 20l1.3-4A8 8 0 1 1 8 19z" /><path d="M9 9.5c.5 2 2 3.5 4 4l1-1.5 2 1-.5 1.5c-3 .5-7-3.5-6.5-6.5L10.5 8l1 2z" /></>),
  plus: (<path d="M12 5v14M5 12h14" />),
  moins: (<path d="M5 12h14" />),
  calendrier: (<><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></>),
  agrandir: (<path d="M14 4h6v6M20 4l-7 7M10 20H4v-6M4 20l7-7" />),
};

export function Icone({ nom, taille = 22, epaisseur = 1.8 }: { nom: keyof typeof traces | string; taille?: number; epaisseur?: number }) {
  return (
    <svg width={taille} height={taille} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={epaisseur}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {traces[nom]}
    </svg>
  );
}

export const SERVICES = [
  { icone: "conseil", titre: "Conseil stratégique", texte: "Analyse de marché, business plan, stratégie de croissance, restructuration.", href: "/services#conseil" },
  { icone: "numerique", titre: "Solutions numériques", texte: "Sites web et applications, transformation digitale, automatisation des processus.", href: "/services#numerique" },
  { icone: "formation", titre: "Formation & coaching", texte: "Programmes certifiants, coaching de dirigeants, ateliers pratiques, e-learning.", href: "/services#formation" },
  { icone: "dossiers", titre: "Montage de dossiers", texte: "Appels d'offres, financement bancaire, création d'entreprise, subventions.", href: "/services#marches-publics" },
  { icone: "marketing", titre: "Marketing digital", texte: "Stratégie de contenu, référencement, réseaux sociaux, e-réputation.", href: "/services#marketing" },
  { icone: "juridique", titre: "Juridique & fiscal", texte: "Création d'entreprise, conformité OHADA, optimisation fiscale, contrats.", href: "/services#juridique" },
  { icone: "finance", titre: "Finance & comptabilité", texte: "Gestion financière, analyse de rentabilité, levée de fonds, audit.", href: "/services#finance" },
] as const;
