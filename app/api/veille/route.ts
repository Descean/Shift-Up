/**
 * GET  /api/veille — Abonnement du client connecté + avis qui lui ont été signalés (60 derniers jours)
 * POST /api/veille — Demande d'abonnement ou modification des critères
 *
 * Première demande : l'abonnement est créé « en attente » et une prestation « Abonnement à la veille »
 * est ouverte pour que SHIFT UP envoie le devis ; la veille est activée par l'équipe (paiement reçu ou essai).
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSafe } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { envoyer } from "@/lib/prestations";
import { sendDemandeVeilleAdmin } from "@/lib/email";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { DEPARTEMENTS, SECTEURS_VEILLE, SECTEUR_VEILLE, TYPES_VEILLE } from "@/lib/veille/criteres";
import { tablesAbsentes } from "@/lib/veille/moteur";

const mot = z.string().trim().min(3).max(60).refine(isSafe, "Contenu non autorisé détecté.");
const schema = z.object({
  secteurs: z.array(z.string().refine((s) => s in SECTEURS_VEILLE)).max(Object.keys(SECTEURS_VEILLE).length),
  motsCles: z.array(mot).max(30),
  exclusions: z.array(mot).max(30),
  typesMarche: z.array(z.enum(TYPES_VEILLE)).max(4),
  zones: z.array(z.enum(DEPARTEMENTS as [string, ...string[]])).max(12),
}).refine((c) => c.secteurs.length + c.motsCles.length > 0, { message: "Choisissez au moins un secteur ou un mot-clé." });

const indisponible = () => NextResponse.json({ error: "La veille n'est pas encore ouverte. Réessayez bientôt.", indisponible: true }, { status: 503 });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const abonnement = await prisma.abonnementVeille.findUnique({ where: { userId: session.user.id } });
    const alertes = abonnement
      ? await prisma.alerteVeille.findMany({
          where: { abonnementId: abonnement.id, createdAt: { gte: new Date(Date.now() - 60 * 86_400_000) } },
          include: { avis: true }, orderBy: [{ createdAt: "desc" }, { score: "desc" }], take: 200,
        })
      : [];
    return NextResponse.json({ abonnement, avis: alertes.map((x) => ({ ...x.avis, score: x.score, signaleLe: x.createdAt })) });
  } catch (e) {
    if (tablesAbsentes(e)) return indisponible();
    console.error("GET /api/veille", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { allowed } = await rateLimit(`veille:${session.user.id}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de modifications. Réessayez dans quelques minutes." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Critères invalides." }, { status: 422 });
  const c = parsed.data;
  try {
    const existant = await prisma.abonnementVeille.findUnique({ where: { userId: session.user.id } });
    const abonnement = existant
      ? await prisma.abonnementVeille.update({ where: { id: existant.id }, data: { ...c, ...(existant.statut === "EXPIRE" ? { statut: "EN_ATTENTE" } : {}) } })
      : await prisma.abonnementVeille.create({ data: { userId: session.user.id, ...c } });

    const nouveau = !existant || existant.statut === "EXPIRE";
    if (nouveau) {
      await prisma.prestation.create({
        data: {
          clientId: session.user.id, sector: SECTEUR_VEILLE, customService: "Abonnement à la veille des appels d'offres",
          brief: `Abonnement à la veille des appels d'offres.\nSecteurs : ${c.secteurs.join(", ") || "—"}\nMots-clés : ${c.motsCles.join(", ") || "—"}\nZones : ${c.zones.join(", ") || "tout le Bénin"}`,
          status: "EN_ATTENTE", amount: 0, customFields: { abonnementVeilleId: abonnement.id, origine: existant ? "renouvellement veille" : "abonnement veille" },
        },
      });
    }
    const clientName = session.user.name ?? session.user.email ?? "Client";
    await envoyer("veille", [
      sendDemandeVeilleAdmin({
        clientName, clientEmail: session.user.email ?? "", nouveau,
        criteres: [["Secteurs", c.secteurs.join(", ")], ["Mots-clés", c.motsCles.join(", ")], ["Exclusions", c.exclusions.join(", ")], ["Types de marché", c.typesMarche.join(", ")], ["Zones", c.zones.join(", ")]],
      }),
      ...(nouveau ? [alerterEquipeWhatsApp("Abonnement veille demandé", clientName, "/dashboard/admin/veille")] : []),
    ]);
    return NextResponse.json({
      abonnement,
      message: nouveau ? "Demande enregistrée : SHIFT UP vous envoie le devis de l'abonnement." : "Critères enregistrés. Ils s'appliquent dès le prochain passage de la veille.",
    });
  } catch (e) {
    if (tablesAbsentes(e)) return indisponible();
    console.error("POST /api/veille", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
