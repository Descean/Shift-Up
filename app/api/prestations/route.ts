/**
 * app/api/prestations/route.ts
 *
 * GET  /api/prestations  → Liste les prestations du client connecté
 * POST /api/prestations  → Soumet une nouvelle demande de prestation
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { sendDemandeConfirmation, sendNewDemandeAdmin } from "@/lib/email";
import type { Prisma } from "@prisma/client";
import { z } from "zod";
import { freeTextSchema, isSafe } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { envoyer, vueClient } from "@/lib/prestations";
import { conflitsAvis, libelleConflit, preparerMontage } from "@/lib/montage-serveur";
import { SECTEUR_MONTAGE, dateLimiteVersDate, type Piece } from "@/lib/montage";
import { reprendreDuCoffre } from "@/lib/entreprises";
import { creerAvis, lienDemande } from "@/lib/notifications";
import { offreDepuisDemande } from "@/lib/catalogue";

const bodySchema = z.object({
  serviceId:     z.string().max(100).optional().nullable(),
  sector:        freeTextSchema(1, 100),
  customService: z.string().max(150).refine(isSafe).optional().nullable(),
  brief:         freeTextSchema(0, 3000).optional().nullable(),
  budget:        z.string().max(50).optional().nullable(),
  deadline:      z.string().max(50).optional().nullable(),
  company:       z.string().max(150).refine(isSafe).optional().nullable(),
  phone:         z.string().max(30).optional().nullable(),
  attachments:   z.array(z.string().url().max(500)).max(20).optional(),
  customFields:  z.record(z.string(), z.unknown()).optional().nullable(),
  /** Fiche de l'appel d'offres (montage de dossier) */
  dossier:       z.unknown().optional(),
  dao:           z.object({ url: z.string().url().max(500), nom: z.string().max(200) }).optional().nullable(),
  /** Entreprise soumissionnaire choisie dans « Mes entreprises » (montage de dossier) */
  entrepriseId:  z.string().max(40).optional().nullable(),
});

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");

  try {
    const prestations = await prisma.prestation.findMany({
      where: {
        clientId: session.user.id,
        ...(status ? { status: status as never } : {}),
      },
      include: {
        service: true,
        payments: true,
        prestationPhases: { orderBy: { order: "asc" } },
        livrables: { orderBy: { createdAt: "asc" }, include: { phase: { select: { id: true, title: true, order: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ prestations: prestations.map(vueClient) });
  } catch (error) {
    console.error("GET /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const ip = getClientIp(req);
  const { allowed, retryAfter } = await rateLimit(`prestations:${session.user.id}:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de demandes. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const parsed = bodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides.", details: parsed.error.flatten().fieldErrors },
        { status: 422 }
      );
    }
    const {
      serviceId, customService, budget, deadline,
      company, phone, attachments, dossier, dao,
    } = parsed.data;
    // Libellé de domaine du catalogue et offre choisie (prix, délai) reconnue côté serveur
    const norme = offreDepuisDemande(parsed.data.sector, customService);
    const sector = norme.sector;
    const customFields = { ...(parsed.data.customFields ?? {}), ...(norme.offre ? { offre: norme.offre } : {}) };
    let brief = parsed.data.brief ?? "";

    // Montage de dossier : fiche de l'appel d'offres + liste des pièces à fournir
    let montage: { dossier: unknown; pieces: unknown[] } | null = null;
    let coffre: { entrepriseId: string; entrepriseNom: string; reprises: number; expirees: number } | null = null;
    let repriseUrls: string[] = [];
    let urgence: string | null = null;
    if (dossier !== undefined && dossier !== null) {
      if (sector !== SECTEUR_MONTAGE) return NextResponse.json({ error: "Fiche d'appel d'offres réservée au montage de dossiers." }, { status: 422 });
      const m = preparerMontage(dossier, session.user.id, dao ?? null, brief);
      if (!m.ok) return NextResponse.json({ error: m.erreur }, { status: 422 });
      montage = { dossier: m.dossier, pieces: m.pieces };
      brief = m.brief;
      urgence = m.urgence;
      // Entreprise de « Mes entreprises » : pièces encore valides à la date limite reprises du coffre
      if (parsed.data.entrepriseId) {
        const ent = await prisma.entreprise.findFirst({
          where: { id: parsed.data.entrepriseId, userId: session.user.id },
          include: { pieces: true },
        }).catch(() => null);
        if (ent) {
          const limite = dateLimiteVersDate((m.dossier as { dateLimite: string }).dateLimite);
          const r = reprendreDuCoffre(m.pieces as Piece[], ent.pieces, limite);
          montage = { dossier: m.dossier, pieces: r.pieces };
          coffre = { entrepriseId: ent.id, entrepriseNom: ent.nom, reprises: r.reprises, expirees: r.expirees };
          repriseUrls = r.pieces.filter((x) => x.statut === "FOURNI").flatMap((x) => x.fichiers.map((f) => f.url));
        }
      }
    }
    if (!brief) return NextResponse.json({ error: "Décrivez votre besoin.", details: { brief: ["Obligatoire."] } }, { status: 422 });
    const pieceJointes = [...new Set([...(attachments ?? []), ...(montage && dao ? [dao.url] : []), ...repriseUrls])];

    // "autre" est une valeur interne UI, pas un vrai ID de service
    const realServiceId = (serviceId && serviceId !== "autre") ? serviceId : null;

    // Vérifie le service si fourni
    let service = null;
    if (realServiceId) {
      service = await prisma.service.findUnique({ where: { id: realServiceId, isActive: true } });
    }

    const prestation = await prisma.prestation.create({
      data: {
        clientId: session.user.id,
        serviceId: realServiceId,
        sector,
        customService: customService || null,
        brief,
        budget: budget || null,
        deadline: deadline || null,
        company: company || coffre?.entrepriseNom || null,
        phone: phone || null,
        attachments: pieceJointes,
        customFields: (montage ? { ...customFields, ...montage, ...(coffre ? { entrepriseId: coffre.entrepriseId, entrepriseNom: coffre.entrepriseNom } : {}) } : customFields) as Prisma.InputJsonValue,
        status: "EN_ATTENTE",
        amount: 0, // Défini par le devis admin
      },
      include: { service: true },
    });

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "PRESTATION_CREATED",
        entity: "Prestation",
        entityId: prestation.id,
        details: { sector, serviceId, brief: brief.slice(0, 100) },
      },
    });

    // Notifications email (attendues : sur Vercel, un envoi non attendu peut être interrompu)
    const serviceName = service?.title ?? customService ?? sector;
    const conflits = montage ? (await conflitsAvis(prestation.id, (montage.dossier as { referenceAvis: string }).referenceAvis).catch(() => [])).map(libelleConflit) : [];
    const clientName = session.user.name ?? session.user.email ?? "Client";
    await envoyer("nouvelle demande", [
      sendDemandeConfirmation({ to: session.user.email!, name: clientName, serviceName, prestationId: prestation.id, piecesAFournir: montage ? montage.pieces.length : 0 }),
      sendNewDemandeAdmin({ clientName, clientEmail: session.user.email!, serviceName, brief, prestationId: prestation.id, urgence, conflits }),
      alerterEquipeWhatsApp(`Nouvelle demande${urgence ? ` (URGENT ${urgence})` : ""}`, `${clientName} — ${serviceName}`),
    ]);

    await creerAvis({ userId: session.user.id, prestationId: prestation.id, type: "DEMANDE", titre: "Demande reçue",
      texte: montage ? (coffre?.reprises ? `${coffre.reprises} pièce(s) reprise(s) du coffre de ${coffre.entrepriseNom}${coffre.expirees ? `, ${coffre.expirees} à renouveler` : ""}. Déposez les autres ; le devis suit sous 48 heures ouvrées.` : "Déposez dès maintenant les pièces dont vous disposez ; le devis suit sous 48 heures ouvrées.") : "Notre équipe étudie votre besoin ; le devis suit sous 48 heures ouvrées.", lien: lienDemande(prestation.id) });

    return NextResponse.json({ prestation }, { status: 201 });
  } catch (error) {
    console.error("POST /api/prestations error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
