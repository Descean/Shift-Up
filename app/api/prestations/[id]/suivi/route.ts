/**
 * POST /api/prestations/:id/suivi — Dépôt de l'offre et résultat de l'appel d'offres
 *
 *   depot          { deposeLe, numero?, recepisse?, commentaire? }   client ou SHIFT UP
 *   annuler_depot  {}                                                 SHIFT UP uniquement
 *   resultat       { statut, date?, montantOffre?, montantAttribue?, rang?, attributaire?, motif?, document?, commentaire? }
 *
 * L'autre partie est prévenue par courriel. Le dépôt clôt la phase « Dépôt de l'offre ».
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { alerterEquipeWhatsApp, lienEspaceClient, notifierClientWhatsApp } from "@/lib/whatsapp";
import { isSafe } from "@/lib/validation";
import { envoyer, nomService } from "@/lib/prestations";
import { fichierDe } from "@/lib/montage-serveur";
import { RESULTATS, dateLimiteFr, dateLimiteVersDate, lireMontage, type Depot, type Resultat, type StatutResultat } from "@/lib/montage";
import { sendDepotClient, sendResultatClient, sendSuiviAdmin } from "@/lib/email";

const txt = (max: number) => z.string().trim().max(max).refine(isSafe, "Contenu non autorisé détecté.").optional().nullable().transform((v) => v || null);
const fichier = z.object({ url: z.string().url().max(500), nom: z.string().trim().min(1).max(200) }).optional().nullable();
const montant = z.number().nonnegative().max(1e13).optional().nullable();

const schema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("depot"),
    deposeLe: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/, "Indiquez la date et l'heure du dépôt."),
    numero: txt(100), recepisse: fichier, commentaire: txt(1000),
  }),
  z.object({ action: z.literal("annuler_depot") }),
  z.object({
    action: z.literal("resultat"),
    statut: z.enum(Object.keys(RESULTATS) as [StatutResultat, ...StatutResultat[]]),
    date: z.union([z.string().regex(/^\d{4}-\d{2}-\d{2}$/), z.literal("")]).optional().nullable().transform((v) => v || null),
    montantOffre: montant, montantAttribue: montant,
    rang: z.number().int().min(1).max(500).optional().nullable(),
    attributaire: txt(200), motif: txt(1000), document: fichier, commentaire: txt(1000),
  }),
]);

const F = (n?: number | null) => (n || n === 0 ? `${Math.round(n).toLocaleString("fr-FR")} F CFA` : null);

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
    include: { service: { select: { title: true } }, client: { select: { name: true, email: true } }, prestationPhases: true },
  });
  if (!p) return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
  if (a.action === "annuler_depot" && !admin) return NextResponse.json({ error: "Action non autorisée." }, { status: 403 });
  if (p.status === "ANNULEE") return NextResponse.json({ error: "Cette demande est annulée." }, { status: 409 });

  const cf = ((p.customFields as Record<string, unknown> | null) ?? {}) as Record<string, unknown>;
  const m = lireMontage(cf);
  if (!m.dossier) return NextResponse.json({ error: "Aucune fiche d'appel d'offres pour cette demande." }, { status: 409 });
  const par = admin && p.clientId !== session.user.id ? "SHIFT_UP" : "CLIENT";
  const maintenant = new Date().toISOString();
  const pj: string[] = [];
  const verifier = (f?: { url: string } | null) => !f || fichierDe(f.url, session.user.id);
  const serviceName = nomService(p);
  const clientName = p.client.name ?? p.client.email ?? "Client";
  const envois: Promise<unknown>[] = [];
  let message = "";

  if (a.action === "depot") {
    if (!verifier(a.recepisse)) return NextResponse.json({ error: "Fichier invalide : déposez-le à nouveau." }, { status: 422 });
    const quand = dateLimiteVersDate(a.deposeLe);
    if (Number.isNaN(quand.getTime())) return NextResponse.json({ error: "Date de dépôt invalide." }, { status: 422 });
    if (quand.getTime() > Date.now() + 10 * 60_000) return NextResponse.json({ error: "La date de dépôt ne peut pas être dans le futur." }, { status: 422 });
    const depot: Depot = {
      deposeLe: quand.toISOString(), par, numero: a.numero,
      recepisse: a.recepisse ? { ...a.recepisse, date: maintenant } : (m.depot?.recepisse ?? null),
      commentaire: a.commentaire, enregistreLe: maintenant,
    };
    cf.depot = depot;
    if (!m.resultat) cf.resultat = { statut: "EN_ATTENTE", enregistrePar: par, enregistreLe: maintenant } satisfies Resultat;
    if (a.recepisse) pj.push(a.recepisse.url);
    const horsDelai = quand.getTime() > dateLimiteVersDate(m.dossier.dateLimite).getTime();
    const quandFr = quand.toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", dateStyle: "full", timeStyle: "short" });
    if (par === "SHIFT_UP" && p.client.email) {
      envois.push(sendDepotClient({ to: p.client.email, name: p.client.name ?? "", serviceName, avis: m.dossier.referenceAvis, deposeLe: quandFr, numero: a.numero, lienRecepisse: depot.recepisse?.url ?? null }));
      envois.push(notifierClientWhatsApp(p.clientId, "shiftup_depot", [p.client.name ?? "", m.dossier.referenceAvis, quandFr, lienEspaceClient()]));
    } else if (par === "CLIENT") {
      envois.push(sendSuiviAdmin({
        clientName, clientEmail: p.client.email ?? "", serviceName, prestationId: id, titre: "Offre déposée par le client",
        lignes: [["Avis", m.dossier.referenceAvis], ["Déposée le", quandFr], ["Récépissé", a.numero ?? (a.recepisse ? "joint" : null)], ["Hors délai", horsDelai ? "OUI — après la date limite" : null], ["Commentaire", a.commentaire]],
      }));
      envois.push(alerterEquipeWhatsApp("Offre déposée par le client", `${clientName} — ${m.dossier.referenceAvis}`));
    }
    message = horsDelai ? "Dépôt enregistré — attention : après la date limite." : "Dépôt enregistré.";
  } else if (a.action === "annuler_depot") {
    delete cf.depot;
    if (m.resultat?.statut === "EN_ATTENTE") delete cf.resultat;
    message = "Dépôt retiré.";
  } else {
    if (!verifier(a.document)) return NextResponse.json({ error: "Fichier invalide : déposez-le à nouveau." }, { status: 422 });
    const resultat: Resultat = {
      statut: a.statut, date: a.date, montantOffre: a.montantOffre ?? null, montantAttribue: a.montantAttribue ?? null, rang: a.rang ?? null,
      attributaire: a.attributaire, motif: a.motif, document: a.document ? { ...a.document, date: maintenant } : (m.resultat?.document ?? null),
      commentaire: a.commentaire, enregistrePar: par, enregistreLe: maintenant,
    };
    cf.resultat = resultat;
    if (a.document) pj.push(a.document.url);
    const details: [string, string | null | undefined][] = [
      ["Résultat", RESULTATS[a.statut]], ["Date", a.date ? new Date(`${a.date}T12:00:00+01:00`).toLocaleDateString("fr-FR") : null],
      ["Montant de l'offre", F(a.montantOffre)], ["Rang", a.rang ? String(a.rang) : null], ["Attributaire", a.attributaire],
      ["Montant attribué", F(a.montantAttribue)], ["Motif communiqué", a.motif], ["Commentaire", a.commentaire],
    ];
    if (a.statut !== "EN_ATTENTE") {
      if (par === "SHIFT_UP" && p.client.email) envois.push(sendResultatClient({ to: p.client.email, name: p.client.name ?? "", avis: m.dossier.referenceAvis, libelle: RESULTATS[a.statut], details }));
      if (par === "SHIFT_UP") envois.push(notifierClientWhatsApp(p.clientId, "shiftup_resultat", [p.client.name ?? "", m.dossier.referenceAvis, RESULTATS[a.statut], lienEspaceClient()]));
      if (par === "CLIENT") envois.push(alerterEquipeWhatsApp(`Résultat : ${RESULTATS[a.statut]}`, `${clientName} — ${m.dossier.referenceAvis}`));
      if (par === "CLIENT") envois.push(sendSuiviAdmin({ clientName, clientEmail: p.client.email ?? "", serviceName, prestationId: id, titre: `Résultat communiqué : ${RESULTATS[a.statut]}`, lignes: [["Avis", m.dossier.referenceAvis], ...details] }));
    }
    message = "Résultat enregistré.";
  }

  const ajoutPJ = [...new Set(pj)].filter((u) => !p.attachments.includes(u));
  const maj = await prisma.prestation.update({
    where: { id },
    data: { customFields: cf as Prisma.InputJsonValue, ...(ajoutPJ.length ? { attachments: { push: ajoutPJ } } : {}) },
    select: { customFields: true },
  });

  // Dépôt enregistré : la phase « Dépôt de l'offre » est terminée
  if (a.action === "depot") {
    const phase = p.prestationPhases.find((x) => /d[ée]p[ôo]t/i.test(x.title));
    if (phase && phase.status !== "DONE") {
      await prisma.prestationPhase.update({ where: { id: phase.id }, data: { status: "DONE", progress: 100, endDate: new Date() } });
      const toutes = p.prestationPhases.map((x) => (x.id === phase.id ? 100 : x.progress));
      await prisma.prestation.update({ where: { id }, data: { globalProgress: Math.round(toutes.reduce((s, x) => s + x, 0) / toutes.length) } });
    }
  }

  await prisma.auditLog.create({
    data: { userId: session.user.id, action: `SUIVI_${a.action.toUpperCase()}`, entity: "Prestation", entityId: id, details: { par, ...(a.action === "resultat" ? { statut: a.statut } : {}) } },
  });
  await envoyer(`suivi ${a.action}`, envois);

  const r = lireMontage(maj.customFields);
  return NextResponse.json({ ok: true, message, depot: r.depot, resultat: r.resultat, dateLimite: dateLimiteFr(m.dossier.dateLimite) });
}
