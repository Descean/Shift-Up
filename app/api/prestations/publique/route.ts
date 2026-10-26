/**
 * POST /api/prestations/publique — Demande de prestation sans compte (page /services/souscrire)
 *
 * La demande est enregistrée comme une prestation normale (EN_ATTENTE) :
 *  - adresse e-mail inconnue : un compte client est ouvert, sans mot de passe ; le courriel de
 *    confirmation contient un lien (7 jours) pour choisir le mot de passe et activer l'espace ;
 *  - adresse déjà inscrite : la demande est rattachée à ce compte, le client se connecte normalement.
 * Protégée par hCaptcha et par une limite de 5 demandes / 15 min par adresse IP.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { generateAffiliationCode } from "@/lib/utils";
import { freeTextSchema, isSafe } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendActivationCompte, sendDemandeConfirmation, sendNewDemandeAdmin } from "@/lib/email";
import { envoyer } from "@/lib/prestations";
import { conflitsAvis, libelleConflit, preparerMontage } from "@/lib/montage-serveur";
import { SECTEUR_MONTAGE } from "@/lib/montage";

const schema = z.object({
  name: z.string().trim().min(2).max(120).refine(isSafe),
  email: z.string().trim().toLowerCase().email().max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  company: z.string().trim().max(150).refine(isSafe).optional().nullable(),
  sector: freeTextSchema(1, 100),
  customService: z.string().trim().max(150).refine(isSafe).optional().nullable(),
  brief: freeTextSchema(0, 3000).optional().nullable(),
  /** Fiche de l'appel d'offres (montage de dossier) ; le DAO se dépose ensuite dans l'espace client */
  dossier: z.unknown().optional(),
  budget: z.string().max(50).optional().nullable(),
  deadline: z.string().max(50).optional().nullable(),
  captchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = await rateLimit(`prestation-publique:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Vérifiez les champs du formulaire." }, { status: 422 });
  const d = parsed.data;
  let brief = d.brief ?? "";
  let montage: { dossier: unknown; pieces: unknown[] } | null = null;
  let urgence: string | null = null;
  if (d.dossier !== undefined && d.dossier !== null) {
    if (d.sector !== SECTEUR_MONTAGE) return NextResponse.json({ error: "Fiche d'appel d'offres réservée au montage de dossiers." }, { status: 422 });
    const m = preparerMontage(d.dossier, "", null, brief);
    if (!m.ok) return NextResponse.json({ error: m.erreur }, { status: 422 });
    montage = { dossier: m.dossier, pieces: m.pieces };
    brief = m.brief;
    urgence = m.urgence;
  }
  if (!brief) return NextResponse.json({ error: "Décrivez votre besoin." }, { status: 422 });
  if (!(await verifyCaptcha(d.captchaToken))) {
    return NextResponse.json({ error: "Vérification anti-robot échouée. Réessayez." }, { status: 403 });
  }

  try {
    let user = await prisma.user.findUnique({ where: { email: d.email } });
    let nouveau = false;
    if (!user) {
      user = await prisma.user.create({
        data: { name: d.name, email: d.email, phone: d.phone || null, role: "CLIENT", affiliationCode: generateAffiliationCode() },
      });
      await prisma.clientProfile.create({ data: { userId: user.id, companyName: d.company || null } });
      nouveau = true;
    }

    const prestation = await prisma.prestation.create({
      data: {
        clientId: user.id,
        sector: d.sector,
        customService: d.customService || null,
        brief,
        budget: d.budget || null,
        deadline: d.deadline || null,
        company: d.company || null,
        phone: d.phone || null,
        status: "EN_ATTENTE",
        amount: 0,
        customFields: { origine: "formulaire public", nomDeclare: d.name, ...(montage ?? {}) } as Prisma.InputJsonValue,
      },
    });

    await prisma.auditLog.create({
      data: { userId: user.id, action: "PRESTATION_CREATED", entity: "Prestation", entityId: prestation.id, details: { sector: d.sector, origine: "public", nouveauCompte: nouveau } },
    });

    const serviceName = d.customService || d.sector;
    const conflits = montage ? (await conflitsAvis(prestation.id, (montage.dossier as { referenceAvis: string }).referenceAvis).catch(() => [])).map(libelleConflit) : [];
    const envois: Promise<unknown>[] = [
      sendNewDemandeAdmin({ clientName: d.name, clientEmail: d.email, serviceName, brief, prestationId: prestation.id, urgence, conflits }),
      alerterEquipeWhatsApp(`Nouvelle demande${urgence ? ` (URGENT ${urgence})` : ""}`, `${d.name} — ${serviceName}`),
    ];

    // Compte sans mot de passe (nouveau, ou ouvert par une demande précédente jamais activée) : lien d'activation
    if (!user.password) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      await prisma.passwordResetToken.upsert({
        where: { userId: user.id },
        update: { token, expiresAt, used: false },
        create: { userId: user.id, token, expiresAt },
      });
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");
      envois.push(sendActivationCompte({ to: d.email, name: d.name, serviceName, prestationId: prestation.id, lien: `${base}/reinitialiser-mot-de-passe?token=${token}`, piecesAFournir: montage?.pieces.length ?? 0 }));
    } else {
      envois.push(sendDemandeConfirmation({ to: d.email, name: user.name ?? d.name, serviceName, prestationId: prestation.id, piecesAFournir: montage?.pieces.length ?? 0 }));
    }
    await envoyer("demande publique", envois);

    return NextResponse.json({ ok: true, reference: prestation.id.slice(-8).toUpperCase(), compteExistant: !nouveau && Boolean(user.password) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/prestations/publique error:", error);
    return NextResponse.json({ error: "Erreur serveur. Réessayez ou écrivez à contact@shiftup.bj." }, { status: 500 });
  }
}
