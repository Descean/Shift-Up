/**
 * GET  /api/equipe/dossiers — Dossiers du Kanban (équipe de montage et Direction).
 * POST /api/equipe/dossiers — Un partenaire ouvre la demande d'un de ses clients (compte client créé si besoin),
 *      pour un service de ses compétences ; le dossier lui est confié et le client reçoit un lien pour le
 *      suivre et payer en ligne.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { IDS_NATURES } from "@/lib/tarifs-montage";
import { isSafe } from "@/lib/validation";
import { generateAffiliationCode } from "@/lib/utils";
import { fichierDe } from "@/lib/montage-serveur";
import { creerDemandeExpress } from "@/lib/demande-express";
import { lienAcces } from "@/lib/acces";
import { libelleNature } from "@/lib/reglages";
import { sendDossierOuvertClient } from "@/lib/email";
import prisma from "@/lib/prisma";
import { carteDossier, exigerEquipe } from "@/lib/dossier-serveur";
import { competencesPartenaire, filtreDossiers } from "@/lib/monteurs";
import { DOMAINE_MONTAGE } from "@/lib/competences";
import { trouverDomaine } from "@/lib/catalogue";

export async function GET() {
  const a = await exigerEquipe();
  if ("erreur" in a) return a.erreur;
  const visibles = await filtreDossiers(a.ctx);
  const depuis = new Date(Date.now() - 60 * 24 * 3600 * 1000); // dossiers terminés : 60 derniers jours
  const liste = await prisma.prestation.findMany({
    where: { AND: [visibles, { OR: [{ status: { notIn: ["TERMINEE", "ANNULEE"] } }, { status: "TERMINEE", updatedAt: { gte: depuis } }] }] },
    include: { client: { select: { email: true, name: true } }, assignedTo: { select: { name: true } }, service: { select: { title: true } } },
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return NextResponse.json({ dossiers: liste.map(carteDossier), moi: a.session.user.id, independant: a.ctx.independant, direction: a.ctx.direction });
}

const schema = z.object({
  client: z.object({
    email: z.string().trim().toLowerCase().email("Adresse e-mail du client invalide.").max(200),
    nom: z.string().trim().min(2, "Indiquez le nom du client.").max(120).refine(isSafe),
    telephone: z.string().trim().max(30).optional().default(""),
    entreprise: z.string().trim().max(150).refine(isSafe).optional().default(""),
  }),
  montage: z.object({
    nature: z.enum(IDS_NATURES),
    dateLimite: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date limite invalide."),
    urgence: z.enum(["standard", "express"]).default("standard"),
    livraison: z.enum(["numerique", "physique"]).default("numerique"),
  }).optional(),
  service: z.object({
    domaine: z.string().regex(/^[a-z-]{2,30}$/),
    offre: z.string().trim().max(200).nullable().default(null),
    echeance: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date invalide.").nullable().default(null),
    urgence: z.enum(["standard", "express"]).default("standard"),
  }).optional(),
  consigne: z.string().trim().max(3000).refine(isSafe, "Contenu non autorisé.").optional().default(""),
  fichiers: z.array(z.object({ url: z.string().url().max(500), nom: z.string().trim().max(200) })).max(15).default([]),
});

export async function POST(req: NextRequest) {
  const a = await exigerEquipe();
  if ("erreur" in a) return a.erreur;
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Vérifiez le formulaire." }, { status: 422 });
  const d = parsed.data;
  const moi = a.session.user.id;
  // Seuls les services des compétences du partenaire (Direction et équipe interne : tout le catalogue)
  const comp = await competencesPartenaire(a.ctx);
  if (d.montage ? !comp.natures.includes(d.montage.nature) : !d.service || d.service.domaine === DOMAINE_MONTAGE || !comp.domaines.includes(d.service.domaine))
    return NextResponse.json({ error: "Ce service ne fait pas partie de vos compétences." }, { status: 403 });
  const domaine = d.service ? trouverDomaine(d.service.domaine) : undefined;
  if (d.service && !domaine) return NextResponse.json({ error: "Service inconnu." }, { status: 422 });
  if (d.service && !d.service.offre && d.consigne.length < 10) return NextResponse.json({ error: "Décrivez le besoin du client." }, { status: 422 });
  if (d.fichiers.some((f) => !fichierDe(f.url, moi))) return NextResponse.json({ error: "Fichier non reconnu : déposez-le à nouveau." }, { status: 422 });

  let client = await prisma.user.findUnique({ where: { email: d.client.email } });
  if (client && client.role !== "CLIENT") return NextResponse.json({ error: "Cette adresse n'est pas celle d'un compte client." }, { status: 409 });
  if (!client) {
    client = await prisma.user.create({ data: { name: d.client.nom, email: d.client.email, phone: d.client.telephone || null, role: "CLIENT", affiliationCode: generateAffiliationCode() } });
    await prisma.clientProfile.create({ data: { userId: client.id, companyName: d.client.entreprise || null } }).catch(() => {});
  }
  const titre = d.montage ? libelleNature(d.montage.nature) ?? "Dossier" : d.service?.offre || domaine?.label || "Demande";
  const monteur = a.session.user.name ?? "Votre monteur";
  const cible = client;
  const r = await creerDemandeExpress({
    clientId: cible.id, nomClient: cible.name ?? d.client.nom, emailClient: d.client.email,
    consigne: d.consigne, fichiers: d.fichiers, entrepriseLibre: d.client.entreprise || null, telephone: d.client.telephone || null,
    origine: "monteur", montage: d.montage ?? null, service: d.service ?? null, monteurId: a.ctx.direction ? null : moi,
    autresEnvois: (id) => [lienAcces(cible.id, `/dashboard/client/prestations?id=${id}`, 7 * 24 * 60).then((lien) =>
      sendDossierOuvertClient({ to: d.client.email, name: cible.name ?? d.client.nom, monteur, titre, lien }))],
  });
  return NextResponse.json({ id: r.id }, { status: 201 });
}
