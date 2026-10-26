/**
 * POST /api/prestations/:id/pieces — Pièces à fournir d'un montage de dossier
 *
 * Client (propriétaire de la demande) :
 *   deposer       { pieceId, fichier:{url,nom}, commentaire? }  → la pièce passe « reçue, en vérification »
 *   retirer       { pieceId, url }                               → retire un fichier (sauf pièce déjà validée)
 *   indisponible  { pieceId, commentaire }                       → « je n'ai pas cette pièce »
 *   ajouter_autre { libelle, fichier }                           → document supplémentaire
 *   notifier      { message? }                                   → prévient SHIFT UP (courriel)
 *
 * Administrateur :
 *   statut        { pieceId, statut, commentaire? }   (VALIDE, A_REPRENDRE, NON_REQUIS, A_FOURNIR…)
 *   ajouter       { libelle, categorie }
 *   supprimer     { pieceId }
 *   deposer       { pieceId, fichier }                 (document reçu par un autre canal)
 *   dossier       { dossier }                          → crée ou corrige la fiche de l'appel d'offres
 *   notifier_client { message? }                       → courriel au client : pièces à fournir / à reprendre
 *
 * Les fichiers doivent avoir été déposés par l'auteur de l'action (stockage privé) ;
 * leur lien est ajouté aux pièces jointes de la prestation pour que l'équipe y ait accès.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { randomBytes } from "crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { alerterEquipeWhatsApp, lienEspaceClient, notifierClientWhatsApp } from "@/lib/whatsapp";
import { isSafe } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { envoyer, nomService } from "@/lib/prestations";
import { fichierDe } from "@/lib/montage-serveur";
import {
  CATEGORIES_PIECE, STATUTS_PIECE, dossierSchema, dateLimiteFr, enAttenteClient, lireMontage, piecesInitiales,
  type Piece, type StatutPiece,
} from "@/lib/montage";
import { sendPiecesClient, sendPiecesDeposeesAdmin } from "@/lib/email";

const txt = (max: number) => z.string().trim().max(max).refine(isSafe, "Contenu non autorisé détecté.");
const fichier = z.object({ url: z.string().url().max(500), nom: z.string().trim().min(1).max(200) });
const pieceId = z.string().min(1).max(40);

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("deposer"), pieceId, fichier, commentaire: txt(500).optional().nullable() }),
  z.object({ action: z.literal("retirer"), pieceId, url: z.string().max(500) }),
  z.object({ action: z.literal("indisponible"), pieceId, commentaire: txt(500).pipe(z.string().min(2, "Précisez la raison.")) }),
  z.object({ action: z.literal("ajouter_autre"), libelle: txt(200).pipe(z.string().min(2, "Nommez le document.")), fichier }),
  z.object({ action: z.literal("notifier"), message: txt(1500).optional().nullable() }),
  z.object({ action: z.literal("statut"), pieceId, statut: z.enum(Object.keys(STATUTS_PIECE) as [StatutPiece, ...StatutPiece[]]), commentaire: txt(500).optional().nullable() }),
  z.object({ action: z.literal("ajouter"), libelle: txt(200).pipe(z.string().min(2, "Nommez la pièce.")), categorie: z.enum(CATEGORIES_PIECE) }),
  z.object({ action: z.literal("supprimer"), pieceId }),
  z.object({ action: z.literal("dossier"), dossier: z.unknown() }),
  z.object({ action: z.literal("notifier_client"), message: txt(1500).optional().nullable() }),
]);

const ACTIONS_CLIENT = ["deposer", "retirer", "indisponible", "ajouter_autre", "notifier"];
const ACTIONS_ADMIN = ["statut", "ajouter", "supprimer", "deposer", "dossier", "notifier_client"];
const MAX_FICHIERS_PIECE = 10;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = await params;
  const admin = ["ADMIN", "DEVELOPER"].includes(session.user.role as string);

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  const a = parsed.data;

  const p = await prisma.prestation.findFirst({
    where: admin ? { id } : { id, clientId: session.user.id },
    include: { service: { select: { title: true } }, client: { select: { name: true, email: true } } },
  });
  if (!p) return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
  const estClient = p.clientId === session.user.id;
  if (!(admin ? ACTIONS_ADMIN : ACTIONS_CLIENT).includes(a.action) || (!admin && !estClient)) {
    return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  }
  if (!admin && ["TERMINEE", "ANNULEE"].includes(p.status)) {
    return NextResponse.json({ error: "Cette prestation est close." }, { status: 409 });
  }

  const cf = ((p.customFields as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  const { dossier } = lireMontage(cf);
  let pieces: Piece[] = lireMontage(cf).pieces.map((x) => ({ ...x, fichiers: [...(x.fichiers ?? [])] }));
  let nouveauDossier = dossier;
  const maintenant = new Date().toISOString();
  const nouvellesPJ: string[] = [];
  const trouver = (pid: string) => pieces.find((x) => x.id === pid);
  const introuvable = () => NextResponse.json({ error: "Pièce introuvable." }, { status: 404 });

  switch (a.action) {
    case "deposer": {
      const piece = trouver(a.pieceId);
      if (!piece) return introuvable();
      if (!fichierDe(a.fichier.url, session.user.id)) return NextResponse.json({ error: "Fichier invalide : déposez-le à nouveau." }, { status: 422 });
      if (piece.fichiers.length >= MAX_FICHIERS_PIECE) return NextResponse.json({ error: `${MAX_FICHIERS_PIECE} fichiers maximum par pièce.` }, { status: 422 });
      piece.fichiers.push({ url: a.fichier.url, nom: a.fichier.nom, date: maintenant });
      piece.statut = admin && piece.statut === "VALIDE" ? "VALIDE" : "FOURNI";
      if (a.commentaire) piece.commentaireClient = a.commentaire;
      piece.majLe = maintenant;
      nouvellesPJ.push(a.fichier.url);
      break;
    }
    case "retirer": {
      const piece = trouver(a.pieceId);
      if (!piece) return introuvable();
      if (piece.statut === "VALIDE") return NextResponse.json({ error: "Pièce déjà validée : contactez-nous pour la remplacer." }, { status: 409 });
      piece.fichiers = piece.fichiers.filter((f) => f.url !== a.url);
      if (piece.fichiers.length === 0 && piece.statut === "FOURNI") piece.statut = "A_FOURNIR";
      piece.majLe = maintenant;
      break;
    }
    case "indisponible": {
      const piece = trouver(a.pieceId);
      if (!piece) return introuvable();
      if (piece.statut === "VALIDE") return NextResponse.json({ error: "Cette pièce est déjà validée." }, { status: 409 });
      piece.statut = "INDISPONIBLE";
      piece.commentaireClient = a.commentaire;
      piece.majLe = maintenant;
      break;
    }
    case "ajouter_autre": {
      if (!fichierDe(a.fichier.url, session.user.id)) return NextResponse.json({ error: "Fichier invalide : déposez-le à nouveau." }, { status: 422 });
      if (pieces.length >= 80) return NextResponse.json({ error: "Nombre maximum de pièces atteint." }, { status: 422 });
      pieces.push({ id: `c${randomBytes(4).toString("hex")}`, libelle: a.libelle, categorie: "Autre", statut: "FOURNI", fichiers: [{ url: a.fichier.url, nom: a.fichier.nom, date: maintenant }], majLe: maintenant });
      nouvellesPJ.push(a.fichier.url);
      break;
    }
    case "statut": {
      const piece = trouver(a.pieceId);
      if (!piece) return introuvable();
      piece.statut = a.statut;
      piece.commentaireAdmin = a.commentaire ?? (a.statut === "A_REPRENDRE" ? piece.commentaireAdmin : null);
      piece.majLe = maintenant;
      break;
    }
    case "ajouter": {
      if (pieces.length >= 80) return NextResponse.json({ error: "Nombre maximum de pièces atteint." }, { status: 422 });
      pieces.push({ id: `a${randomBytes(4).toString("hex")}`, libelle: a.libelle, categorie: a.categorie, statut: "A_FOURNIR", fichiers: [], majLe: maintenant });
      break;
    }
    case "supprimer": {
      if (!trouver(a.pieceId)) return introuvable();
      pieces = pieces.filter((x) => x.id !== a.pieceId);
      break;
    }
    case "dossier": {
      const r = dossierSchema.safeParse(a.dossier);
      if (!r.success) return NextResponse.json({ error: r.error.issues[0]?.message ?? "Fiche incomplète." }, { status: 422 });
      nouveauDossier = r.data;
      if (pieces.length === 0) pieces = piecesInitiales(r.data);
      break;
    }
    case "notifier": {
      const { allowed } = await rateLimit(`pieces-notifier:${id}`, { limit: 3, windowMs: 60 * 60 * 1000 });
      if (!allowed) return NextResponse.json({ error: "SHIFT UP a déjà été prévenu. Réessayez dans une heure." }, { status: 429 });
      const recues = pieces.filter((x) => x.statut === "FOURNI");
      const indisponibles = pieces.filter((x) => x.statut === "INDISPONIBLE");
      if (!recues.length && !indisponibles.length && !a.message) return NextResponse.json({ error: "Déposez au moins une pièce avant de nous prévenir." }, { status: 422 });
      await envoyer("pièces déposées", [
        sendPiecesDeposeesAdmin({
          clientName: p.client.name ?? p.client.email ?? "Client", clientEmail: p.client.email ?? "", serviceName: nomService(p), prestationId: id,
          recues: recues.map((x) => `${x.libelle} (${x.fichiers.length} fichier${x.fichiers.length > 1 ? "s" : ""})`),
          indisponibles: indisponibles.map((x) => ({ libelle: x.libelle, commentaire: x.commentaireClient })),
          message: a.message ?? null,
        }),
        alerterEquipeWhatsApp("Pièces déposées", `${p.client.name ?? p.client.email ?? "Client"} — ${recues.length} à vérifier`),
      ]);
      const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "DEVELOPER"] } }, select: { id: true } });
      await prisma.message.createMany({
        data: admins.map((u) => ({
          senderId: session.user.id, recipientId: u.id, subject: `Pièces déposées — ${nomService(p)}`,
          content: `${recues.length} pièce(s) à vérifier, ${indisponibles.length} signalée(s) non disponible(s).${a.message ? `\n\nMessage :\n${a.message}` : ""}`,
        })),
      });
      cf.piecesNotifieesLe = maintenant;
      break;
    }
    case "notifier_client": {
      const aReprendre = pieces.filter((x) => x.statut === "A_REPRENDRE");
      const aFournir = pieces.filter((x) => x.statut === "A_FOURNIR");
      if (!p.client.email) return NextResponse.json({ error: "Le client n'a pas d'adresse e-mail." }, { status: 422 });
      if (!aReprendre.length && !aFournir.length && !a.message) return NextResponse.json({ error: "Aucune pièce en attente : rien à envoyer." }, { status: 422 });
      await envoyer("pièces client", [
        sendPiecesClient({
          to: p.client.email, name: p.client.name ?? "", serviceName: nomService(p),
          aFournir: aFournir.map((x) => x.libelle), aReprendre: aReprendre.map((x) => ({ libelle: x.libelle, commentaire: x.commentaireAdmin })),
          message: a.message ?? null, dateLimite: dossier ? dateLimiteFr(dossier.dateLimite) : null,
        }),
        notifierClientWhatsApp(p.clientId, "shiftup_pieces", [p.client.name ?? "", String(aReprendre.length + aFournir.length), dossier?.referenceAvis ?? nomService(p), dossier ? dateLimiteFr(dossier.dateLimite) : "—", lienEspaceClient()]),
      ]);
      cf.clientRelanceLe = maintenant;
      break;
    }
  }

  const ajoutPJ = [...new Set(nouvellesPJ)].filter((u) => !p.attachments.includes(u));
  const maj = await prisma.prestation.update({
    where: { id },
    data: {
      customFields: { ...cf, dossier: nouveauDossier ?? undefined, pieces } as unknown as Prisma.InputJsonValue,
      ...(ajoutPJ.length ? { attachments: { push: ajoutPJ } } : {}),
    },
    select: { customFields: true },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id, action: `PIECES_${a.action.toUpperCase()}`, entity: "Prestation", entityId: id,
      details: { pieceId: "pieceId" in a ? a.pieceId : null, ...(a.action === "statut" ? { statut: a.statut } : {}) },
    },
  });

  const res = lireMontage(maj.customFields);
  return NextResponse.json({
    ok: true,
    dossier: res.dossier,
    pieces: res.pieces,
    attendues: res.pieces.filter(enAttenteClient).length,
    ...(a.action === "notifier" ? { message: "SHIFT UP a été prévenu. Nous vérifions vos pièces." } : {}),
    ...(a.action === "notifier_client" ? { message: "Courriel envoyé au client." } : {}),
  });
}
