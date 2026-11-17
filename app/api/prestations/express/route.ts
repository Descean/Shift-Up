/**
 * POST /api/prestations/express — Demande en une fois : le dossier + ce qu'il faut faire.
 *
 * Le client dépose ses fichiers et écrit (ou dit, en message vocal) ce qu'il attend. La demande est
 * créée tout de suite ; l'IA lit ensuite le dossier en arrière-plan et envoie le devis automatique
 * (lib/ia-devis). Sans IA, l'équipe chiffre à la main.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { IDS_NATURES } from "@/lib/tarifs-montage";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSafe } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { fichierDe } from "@/lib/montage-serveur";
import { sendDemandeConfirmation } from "@/lib/email";
import { creerDemandeExpress } from "@/lib/demande-express";
import { monteurParCode } from "@/lib/monteurs";

export const maxDuration = 300;

const schema = z.object({
  consigne: z.string().trim().max(3000).refine(isSafe, "Contenu non autorisé.").optional().default(""),
  fichiers: z.array(z.object({ url: z.string().url().max(500), nom: z.string().trim().max(200) })).max(15).default([]),
  vocal: z.string().url().max(500).optional().nullable(),
  entrepriseId: z.string().max(40).optional().nullable(),
  telephone: z.string().trim().max(40).optional().nullable(),
  // Formulaire en 3 étapes : nature du marché, date limite, urgence, livraison
  montage: z.object({
    nature: z.enum(IDS_NATURES),
    dateLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date limite invalide."),
    urgence: z.enum(["standard", "express"]).default("standard"),
    livraison: z.enum(["numerique", "physique"]).default("numerique"),
  }).optional().nullable(),
  // Autres services : domaine et offre du catalogue, date souhaitée
  service: z.object({
    domaine: z.string().regex(/^[a-z-]{2,30}$/),
    offre: z.string().trim().max(200).optional().nullable(),
    echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
    urgence: z.enum(["standard", "express"]).default("standard"),
  }).optional().nullable(),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Connectez-vous pour envoyer votre demande." }, { status: 401 });
  const { allowed } = await rateLimit(`express:${session.user.id}`, { limit: 6, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de demandes en peu de temps. Réessayez plus tard." }, { status: 429 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Demande invalide." }, { status: 422 });
  const d = parsed.data;
  if (!d.fichiers.length && !d.vocal && d.consigne.length < 10) {
    return NextResponse.json({ error: "Déposez votre dossier ou dites-nous en quelques mots ce qu'il faut faire." }, { status: 422 });
  }
  const moi = session.user.id;
  if (d.fichiers.some((f) => !fichierDe(f.url, moi)) || (d.vocal && !fichierDe(d.vocal, moi))) {
    return NextResponse.json({ error: "Fichier non reconnu : déposez-le à nouveau." }, { status: 422 });
  }

  const ent = d.entrepriseId
    ? await prisma.entreprise.findFirst({ where: { id: d.entrepriseId, userId: moi }, select: { id: true, nom: true } }).catch(() => null)
    : null;

  const nom = session.user.name ?? session.user.email ?? "Client";
  const r = await creerDemandeExpress({
    clientId: moi, nomClient: nom, emailClient: session.user.email!,
    consigne: d.consigne, fichiers: d.fichiers, vocal: d.vocal, entreprise: ent, telephone: d.telephone, origine: "demande express", montage: d.montage ?? null,
    service: d.service ? { domaine: d.service.domaine, offre: d.service.offre ?? null, echeance: d.service.echeance ?? null, urgence: d.service.urgence } : null,
    // Client venu par le lien d'un monteur indépendant : le dossier lui est confié
    monteurId: (await monteurParCode(req.cookies.get("su_monteur")?.value))?.id ?? null,
    autresEnvois: (id) => [sendDemandeConfirmation({ to: session.user.email!, name: nom, serviceName: "Votre demande", prestationId: id, piecesAFournir: 0 })],
  });
  return NextResponse.json(r, { status: 201 });
}
