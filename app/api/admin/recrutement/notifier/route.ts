/**
 * POST /api/admin/recrutement/notifier
 * { ids: string[], motifs: CodeMotif[], commentaire?: string }
 * Passe les candidatures en « Non retenue », enregistre les motifs et envoie à chaque candidat
 * le courriel de non-sélection avec son lien personnel (conservation ou suppression des données).
 * Une candidature déjà notifiée et sans réponse reçoit un nouvel envoi (délai repoussé).
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { requireAdmin } from "../_lib";
import { CODES_MOTIFS, libelleMotif, DELAI_REPONSE_JOURS, ajouterJours } from "@/lib/recrutement/motifs";
import { nouveauJeton, lienDonnees } from "@/lib/recrutement/donnees";
import { sendNonRetenuCandidat } from "@/lib/email";

export const maxDuration = 60;

const schema = z.object({
  ids: z.array(z.string().min(1)).min(1).max(200),
  motifs: z.array(z.enum(CODES_MOTIFS)).min(1, "Choisissez au moins un motif.").max(CODES_MOTIFS.length),
  commentaire: z.string().trim().max(1500).optional(),
});

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Requête invalide." }, { status: 400 });
  const { ids, motifs, commentaire } = p.data;

  const liste = await prisma.candidature.findMany({ where: { id: { in: ids } } });
  const resultats: { id: string; reference: string; ok: boolean; raison?: string }[] = [];
  const now = new Date();

  for (const c of liste) {
    if (c.donneesSupprimeesLe) { resultats.push({ id: c.id, reference: c.reference, ok: false, raison: "données déjà supprimées" }); continue; }
    if (c.statut === "RETENUE") { resultats.push({ id: c.id, reference: c.reference, ok: false, raison: "candidature retenue" }); continue; }
    if (c.conservation === "ACCEPTEE" || c.conservation === "REFUSEE") { resultats.push({ id: c.id, reference: c.reference, ok: false, raison: "le candidat a déjà répondu" }); continue; }

    const jeton = c.jetonDonnees ?? nouveauJeton();
    const dateLimite = ajouterJours(now, DELAI_REPONSE_JOURS);
    try {
      const r = await sendNonRetenuCandidat({
        to: c.email, prenoms: c.prenoms, poste: c.offreTitre, reference: c.reference,
        motifs: motifs.map(libelleMotif), commentaire: commentaire || null, lien: lienDonnees(jeton), dateLimite,
      });
      if ((r as { error?: { message?: string } })?.error) throw new Error((r as { error: { message?: string } }).error.message ?? "envoi refusé");
      await prisma.candidature.update({
        where: { id: c.id },
        data: {
          statut: "NON_RETENUE", motifsNonRetenu: motifs, commentaireNonRetenu: commentaire || null,
          notifieLe: now, relanceLe: null, conservation: "EN_ATTENTE", conservationJusquau: dateLimite, jetonDonnees: jeton,
        },
      });
      resultats.push({ id: c.id, reference: c.reference, ok: true });
    } catch (e) {
      console.error("[recrutement/notifier]", c.reference, e);
      resultats.push({ id: c.id, reference: c.reference, ok: false, raison: "échec de l'envoi du courriel" });
    }
  }

  const candidatures = await prisma.candidature.findMany({ where: { id: { in: ids } } });
  return NextResponse.json({ resultats, envoyes: resultats.filter((r) => r.ok).length, candidatures });
}
