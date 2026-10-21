/**
 * app/api/auth/reset-password/route.ts — API de réinitialisation de mot de passe
 *
 * Deux méthodes HTTP sont exposées sur cette même URL :
 *
 *  POST  /api/auth/reset-password  → Étape 1 : demander un lien de réinitialisation
 *  PATCH /api/auth/reset-password  → Étape 2 : confirmer le token et changer le mot de passe
 *
 * Sécurité :
 *  - Le POST ne révèle jamais si un email est enregistré (anti-énumération).
 *  - Le token est généré avec crypto.randomBytes(32) → 256 bits d'entropie.
 *  - Le token expire après 1 heure.
 *  - Le token est marqué `used: true` dès sa première utilisation réussie
 *    → impossible d'utiliser le même lien deux fois.
 *  - Le changement de mot de passe, le marquage du token et la création de
 *    l'entrée AuditLog se font dans une transaction atomique Prisma.
 */

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/ratelimit";

// ── Schémas de validation Zod ─────────────────────────────────────────────────

// POST : on attend seulement un email valide
const requestSchema = z.object({
  email: z.string().email(),
});

// PATCH : on attend un token (min 32 chars) et un mot de passe (min 8 chars)
const confirmSchema = z.object({
  token: z.string().min(32),
  password: z.string().min(8),
});

// ══════════════════════════════════════════════════════════════════════════════
// POST /api/auth/reset-password — Demande de lien de réinitialisation
// ══════════════════════════════════════════════════════════════════════════════
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = rateLimit(`reset:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const { email } = requestSchema.parse(body); // Valide l'email ou lève ZodError

    /**
     * Anti-énumération : on cherche l'utilisateur mais on répond { success: true }
     * dans tous les cas. Même si l'email n'existe pas, la réponse est identique.
     * Un attaquant ne peut pas distinguer "email existant" de "email inconnu".
     */
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ success: true }); // Sortie silencieuse
    }

    /**
     * Génération du token de réinitialisation.
     * - crypto.randomBytes(32) → 32 octets = 64 caractères hexadécimaux.
     * - Expiration dans 1 heure à partir de maintenant.
     */
    const token     = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // +1h

    /**
     * Upsert du token en base.
     * Si l'utilisateur en avait déjà un (ancienne demande), on le remplace
     * (update : nouveau token + nouvelle expiration + used=false).
     * Sinon on le crée (create).
     * Cela permet de faire plusieurs demandes sans créer de doublons.
     */
    await prisma.passwordResetToken.upsert({
      where:  { userId: user.id },
      update: { token, expiresAt, used: false },
      create: { userId: user.id, token, expiresAt },
    });

    // Lien que l'utilisateur devra cliquer dans son email
    const resetUrl = `${process.env.NEXTAUTH_URL}/reinitialiser-mot-de-passe?token=${token}`;

    /**
     * Envoi de l'email via Resend.
     * Conditionnel : si RESEND_API_KEY n'est pas configuré (ex : en dev local),
     * on saute silencieusement l'envoi. L'app reste fonctionnelle, mais les
     * emails ne partent pas — utile pour le développement.
     *
     * En production : configurer RESEND_API_KEY dans les variables d'environnement.
     * Le domaine expéditeur (noreply@shiftup.bj) doit être vérifié dans Resend.
     */
    if (process.env.RESEND_API_KEY) {
      try {
        const { Resend } = await import("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
          from: "SHIFT UP <noreply@shiftup.bj>",
          to: email,
          subject: "Réinitialisation de votre mot de passe — SHIFT UP",
          html: `
            <div style="font-family:sans-serif;max-width:560px;margin:0 auto;padding:24px">
              <h2 style="color:#0A2533;font-size:24px;margin-bottom:16px">Réinitialisation de votre mot de passe</h2>
              <p style="color:#666;line-height:1.6">
                Vous avez demandé la réinitialisation de votre mot de passe SHIFT UP.
                Cliquez sur le bouton ci-dessous pour choisir un nouveau mot de passe.
              </p>
              <div style="text-align:center;margin:32px 0">
                <a href="${resetUrl}"
                   style="background:#0A2533;color:#fff;
                          text-decoration:none;padding:14px 32px;border-radius:12px;
                          font-weight:600;font-size:15px;display:inline-block">
                  Réinitialiser mon mot de passe
                </a>
              </div>
              <p style="color:#999;font-size:13px;line-height:1.6">
                Ce lien est valable pendant <strong>1 heure</strong>.
                Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.
              </p>
              <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
              <p style="color:#ccc;font-size:12px">
                SHIFT UP — Abomey-Calavi, Bénin | contact@shiftup.bj
              </p>
            </div>
          `,
        });
      } catch {
        // L'envoi d'email a échoué — on logue en production mais on ne bloque pas la réponse.
        // L'utilisateur peut retenter. Le token est déjà en base.
        console.error("Email sending failed");
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Validation échouée (email mal formé)
      return NextResponse.json({ error: "Email invalide" }, { status: 422 });
    }
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// PATCH /api/auth/reset-password — Confirmation du token et mise à jour du mdp
// ══════════════════════════════════════════════════════════════════════════════
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = confirmSchema.parse(body); // Valide token + password

    /**
     * Récupération du token en base avec l'utilisateur associé.
     * On inclut l'utilisateur pour accéder à son email dans l'AuditLog.
     */
    const record = await prisma.passwordResetToken.findUnique({
      where:   { token },
      include: { user: true },
    });

    /**
     * Vérifications de sécurité :
     *  - record null      → token inconnu (jamais créé ou supprimé)
     *  - record.used      → token déjà utilisé (protection anti-replay)
     *  - expiresAt < now  → token expiré (délai de 1 heure dépassé)
     */
    if (!record || record.used || record.expiresAt < new Date()) {
      return NextResponse.json(
        { error: "Lien invalide ou expiré. Faites une nouvelle demande." },
        { status: 400 }
      );
    }

    /**
     * Hachage du nouveau mot de passe avec bcrypt (saltRounds=12).
     * bcryptjs est importé dynamiquement pour réduire le bundle côté client.
     * saltRounds=12 est un bon équilibre sécurité/performance en 2025.
     */
    const bcrypt = await import("bcryptjs");
    const hashed = await bcrypt.hash(password, 12);

    /**
     * Transaction atomique Prisma — toutes les opérations réussissent ou
     * toutes échouent ensemble :
     *  1. Mise à jour du mot de passe haché de l'utilisateur.
     *  2. Marquage du token comme utilisé (used: true) → anti-replay.
     *  3. Création d'une entrée AuditLog pour traçabilité (RGPD, sécurité).
     */
    await prisma.$transaction([
      prisma.user.update({
        where: { id: record.userId },
        data:  { password: hashed },
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data:  { used: true }, // Invalide définitivement ce token
      }),
      prisma.auditLog.create({
        data: {
          userId:    record.userId,
          action:    "PASSWORD_RESET",
          entity:    "User",
          entityId:  record.userId,
          details:   { email: record.user.email },
          ipAddress: req.headers.get("x-forwarded-for") || "", // IP du client (via proxy)
        },
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Données invalides (token trop court ou mot de passe trop court)
      return NextResponse.json({ error: "Données invalides" }, { status: 422 });
    }
    console.error("Confirm reset error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
