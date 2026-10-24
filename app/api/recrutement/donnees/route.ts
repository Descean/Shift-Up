/**
 * POST /api/recrutement/donnees  { jeton, choix: "oui" | "non" }
 * Réponse du candidat non retenu : conserver son dossier (vivier, 24 mois) ou le supprimer.
 * Le lien personnel reste valable : le candidat peut retirer son accord plus tard.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { DUREE_CONSERVATION_MOIS, ajouterMois } from "@/lib/recrutement/motifs";
import { supprimerDonnees, lienDonnees } from "@/lib/recrutement/donnees";
import { sendConfirmationDonneesCandidat } from "@/lib/email";

const schema = z.object({ jeton: z.string().regex(/^[A-Za-z0-9_-]{20,64}$/), choix: z.enum(["oui", "non"]) });

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`recrut-donnees:${getClientIp(req)}`, { limit: 20, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez plus tard." }, { status: 429 });
  const p = schema.safeParse(await req.json().catch(() => null));
  if (!p.success) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });

  const c = await prisma.candidature.findUnique({ where: { jetonDonnees: p.data.jeton } });
  if (!c) return NextResponse.json({ error: "Lien invalide ou expiré." }, { status: 404 });
  if (c.donneesSupprimeesLe) return NextResponse.json({ etat: "SUPPRIMEES" });

  const now = new Date();
  if (p.data.choix === "oui") {
    const jusquau = ajouterMois(now, DUREE_CONSERVATION_MOIS);
    // Un accord déjà donné n'est pas prolongé par un second clic
    const maj = c.conservation === "ACCEPTEE" ? c : await prisma.candidature.update({ where: { id: c.id }, data: { conservation: "ACCEPTEE", conservationLe: now, conservationJusquau: jusquau } });
    if (c.conservation !== "ACCEPTEE") {
      await sendConfirmationDonneesCandidat({ to: c.email, prenoms: c.prenoms, reference: c.reference, choix: "ACCEPTEE", jusquau, lien: lienDonnees(p.data.jeton) }).catch((e) => console.error("[recrutement/donnees] courriel", e));
    }
    return NextResponse.json({ etat: "ACCEPTEE", jusquau: maj.conservationJusquau });
  }

  // Suppression : on prévient d'abord (l'adresse est ensuite effacée)
  await sendConfirmationDonneesCandidat({ to: c.email, prenoms: c.prenoms, reference: c.reference, choix: "REFUSEE", lien: lienDonnees(p.data.jeton) }).catch((e) => console.error("[recrutement/donnees] courriel", e));
  await prisma.candidature.update({ where: { id: c.id }, data: { conservationLe: now } });
  await supprimerDonnees(c, "REFUSEE");
  return NextResponse.json({ etat: "SUPPRIMEES" });
}
