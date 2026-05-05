import { Metadata } from "next";
import { notFound } from "next/navigation";
import prisma from "@/lib/prisma";
import FormationForm, { type FormationHighlight } from "./FormationForm";

// ── Contenu riche par slug ────────────────────────────────────────────────────
// Permet d'enrichir une formation sans toucher au schéma Prisma.
const FORMATION_RICH_CONTENT: Record<string, {
  about?: string;
  highlights?: FormationHighlight[];
  heroImage?: string;
}> = {
  "ia-marches-publics": {
    about:
      "Vous perdez du temps à rédiger vos dossiers d'appels d'offres ? Vous voulez améliorer la qualité technique de vos propositions et augmenter vos chances de succès ? Cette formation intensive vous montre concrètement comment exploiter l'intelligence artificielle pour rédiger plus vite, structurer des offres gagnantes et décrocher plus de marchés publics.",
    highlights: [
      { icon: "fas fa-pen-to-square",       text: "Rédiger vos DAO plus rapidement grâce aux outils IA" },
      { icon: "fas fa-trophy",              text: "Structurer des offres compétitives et percutantes" },
      { icon: "fas fa-chart-line",          text: "Améliorer la qualité technique de vos propositions" },
      { icon: "fas fa-clock",               text: "Gagner du temps sur chaque appel d'offres public" },
      { icon: "fas fa-briefcase",           text: "Méthodes concrètes issues de cas réels" },
      { icon: "fas fa-screwdriver-wrench",  text: "Outils professionnels immédiatement applicables" },
      { icon: "fas fa-certificate",         text: "Certificat professionnel Shift Up délivré à l'issue" },
    ],
    heroImage: "/images/formations/ia-marches-publics.png",
  },
};

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ succes?: string; ref?: string; echec?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const f = await prisma.formation.findUnique({ where: { slug, isActive: true } });
  if (!f) return { title: "Formation introuvable" };
  return {
    title: f.titre,
    description: f.description ?? `Inscription à la formation ${f.titre} — SHIFT UP`,
    robots: { index: false, follow: false },
  };
}

// ── Slugs associés pour le sélecteur de session ──────────────────────────────
// Pour une formation présentielle, liste les slugs des variantes à afficher côte à côte.
const SESSION_SIBLINGS: Record<string, { label: string; icon: string; badge?: string; siblingSlug: string; siblingLabel: string; siblingIcon: string }> = {
  "ia-marches-publics": {
    label:        "Présentiel",
    icon:         "fas fa-users",
    badge:        "Meilleure offre",
    siblingSlug:  "ia-marches-publics-enligne",
    siblingLabel: "En ligne",
    siblingIcon:  "fas fa-laptop",
  },
};

export default async function FormationPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const sp = await searchParams;

  const includeCount = { _count: { select: { inscriptions: { where: { status: "PAIEMENT_CONFIRME" } } } } } as const;

  // Cherche la formation principale — tente aussi le slug jumeau si non trouvé
  const mainSlug =
    slug in SESSION_SIBLINGS                                       ? slug :
    Object.values(SESSION_SIBLINGS).some(v => v.siblingSlug === slug) ? Object.keys(SESSION_SIBLINGS).find(k => SESSION_SIBLINGS[k].siblingSlug === slug)! : slug;

  const formation = await prisma.formation.findUnique({
    where: { slug: mainSlug, isActive: true },
    include: includeCount,
  });

  if (!formation) notFound();

  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const richContent = FORMATION_RICH_CONTENT[mainSlug] ?? {};

  // Construction des sessions si des variantes existent
  const config = SESSION_SIBLINGS[mainSlug];
  let sessions: import("./FormationForm").FormationSession[] | undefined;

  if (config) {
    const sibling = await prisma.formation.findUnique({
      where: { slug: config.siblingSlug, isActive: true },
      include: includeCount,
    });

    const mainPlaces = Math.max(0, formation.placesMax - formation._count.inscriptions);
    const siblingPlaces = sibling ? Math.max(0, sibling.placesMax - sibling._count.inscriptions) : 0;

    sessions = [
      {
        formationId:    formation.id,
        label:          config.label,
        icon:           config.icon,
        badge:          config.badge,
        dateDebut:      fmt.format(formation.dateDebut),
        dateFin:        fmt.format(formation.dateFin),
        lieu:           `${config.label} · ${formation.lieu}`,
        prixFCFA:       formation.prixFCFA,
        placesRestantes: mainPlaces,
      },
      ...(sibling ? [{
        formationId:    sibling.id,
        label:          config.siblingLabel,
        icon:           config.siblingIcon,
        dateDebut:      fmt.format(sibling.dateDebut),
        dateFin:        fmt.format(sibling.dateFin),
        lieu:           `${config.siblingLabel} · ${sibling.lieu}`,
        prixFCFA:       sibling.prixFCFA,
        placesRestantes: siblingPlaces,
      }] : []),
    ];
  }

  const placesRestantes = Math.max(0, formation.placesMax - formation._count.inscriptions);

  return (
    <FormationForm
      formation={{
        id: formation.id,
        titre: formation.titre,
        description: formation.description ?? "",
        dateDebut: fmt.format(formation.dateDebut),
        dateFin: fmt.format(formation.dateFin),
        lieu: formation.lieu,
        prixFCFA: formation.prixFCFA,
        placesRestantes,
        sessions,
        succes: sp.succes === "1",
        echec: sp.echec === "1",
        reference: sp.ref ?? "",
        ...richContent,
      }}
    />
  );
}
