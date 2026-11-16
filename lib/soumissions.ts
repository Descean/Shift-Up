/**
 * lib/soumissions.ts — Résultats des dossiers déposés pour les clients.
 *
 * Cycle : EN_ATTENTE (offre valide, Tendo cherche le PV d'attribution chaque jour)
 *   → GAGNE ou NON_RETENU (détecté par Tendo ou saisi par l'admin)
 *   → A_VERIFIER si le délai de validité (+ marge) est passé sans résultat publié.
 * Un « gagné » compte aussitôt dans les chiffres publics (lib/accueil.ts).
 */
import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";

export const RESULTATS = ["EN_ATTENTE", "GAGNE", "NON_RETENU", "A_VERIFIER"] as const;
export type Resultat = (typeof RESULTATS)[number];
export const LIB_RESULTATS: Record<Resultat, string> = {
  EN_ATTENTE: "En attente",
  GAGNE: "Gagné",
  NON_RETENU: "Non retenu",
  A_VERIFIER: "À vérifier",
};

/** Jours ajoutés après la fin de validité avant de demander une vérification manuelle. */
export const MARGE_JOURS = 15;

export function finDeSuivi(s: { dateDepot: Date; validiteJours: number }): Date {
  return new Date(s.dateDepot.getTime() + (s.validiteJours + MARGE_JOURS) * 86_400_000);
}

/** Passe en « À vérifier » les offres en attente dont le délai de suivi est écoulé. */
export async function marquerEchues(): Promise<number> {
  const enAttente = await prisma.soumission.findMany({
    where: { resultat: "EN_ATTENTE" },
    select: { id: true, dateDepot: true, validiteJours: true },
  });
  const maintenant = Date.now();
  const echues = enAttente.filter((s) => finDeSuivi(s).getTime() < maintenant).map((s) => s.id);
  if (!echues.length) return 0;
  const r = await prisma.soumission.updateMany({ where: { id: { in: echues } }, data: { resultat: "A_VERIFIER" } });
  return r.count;
}

const fcfa = (n: number | null | undefined) =>
  n ? `${Math.round(n).toLocaleString("fr-FR").replace(/ /g, " ")} FCFA` : "montant non lu";

/** Enregistre un résultat, rafraîchit l'accueil et prévient l'équipe. */
export async function appliquerResultat(
  id: string,
  donnees: {
    resultat: Resultat;
    attributaire?: string | null;
    montantAttribue?: number | null;
    preuveUrl?: string | null;
    detecteParTendo?: boolean;
  },
) {
  const finalise = donnees.resultat === "GAGNE" || donnees.resultat === "NON_RETENU";
  const s = await prisma.soumission.update({
    where: { id },
    data: {
      resultat: donnees.resultat,
      attributaire: donnees.attributaire ?? undefined,
      montantAttribue: donnees.montantAttribue ?? undefined,
      preuveUrl: donnees.preuveUrl ?? undefined,
      detecteParTendo: donnees.detecteParTendo ?? false,
      resultatAt: finalise ? new Date() : null,
    },
  });
  revalidatePath("/");
  if (donnees.detecteParTendo && finalise) {
    const titre = donnees.resultat === "GAGNE" ? `Marché gagné : ${s.entrepriseNom}` : `Marché non retenu : ${s.entrepriseNom}`;
    const detail = `${s.objet.slice(0, 120)} (${s.autorite}). Attributaire : ${s.attributaire ?? "?"}, ${fcfa(s.montantAttribue)}.`;
    await alerterEquipeWhatsApp(titre, detail, "/dashboard/admin/soumissions").catch(() => []);
  }
  return s;
}
