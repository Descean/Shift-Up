/**
 * POST /api/prestations/publique/express — Demande en une fois, sans compte (page /services/souscrire).
 *
 * Le visiteur dépose son dossier (fichiers rangés dans « visiteurs/<jeton>/ »), dit ce qu'il faut faire
 * et donne son nom et son adresse e-mail. Comme pour /api/prestations/publique :
 *  - adresse inconnue : un compte client est ouvert sans mot de passe, et un lien d'activation est envoyé ;
 *  - adresse déjà inscrite : la demande est rattachée à ce compte.
 * Les fichiers sont ensuite rangés dans le dossier du compte, puis l'IA lit le dossier et envoie le devis.
 * Protégée par hCaptcha et par une limite de 5 demandes / 15 min par adresse IP.
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { generateAffiliationCode } from "@/lib/utils";
import { isSafe } from "@/lib/validation";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { sendActivationCompte, sendDemandeConfirmation } from "@/lib/email";
import { fichierDuJeton, rattacherFichiers } from "@/lib/fichiers";
import { creerDemandeExpress } from "@/lib/demande-express";

export const maxDuration = 300;

const schema = z.object({
  name: z.string().trim().min(2, "Indiquez votre nom.").max(120).refine(isSafe),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(200),
  phone: z.string().trim().max(30).optional().nullable(),
  company: z.string().trim().max(150).refine(isSafe).optional().nullable(),
  consigne: z.string().trim().max(3000).refine(isSafe, "Contenu non autorisé.").optional().default(""),
  fichiers: z.array(z.object({ url: z.string().url().max(500), nom: z.string().trim().max(200) })).max(15).default([]),
  vocal: z.string().url().max(500).optional().nullable(),
  jeton: z.string().max(40).optional().nullable(),
  captchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { allowed, retryAfter } = await rateLimit(`prestation-publique:${getClientIp(req)}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json({ error: "Trop de demandes. Réessayez dans quelques minutes." }, { status: 429, headers: { "Retry-After": String(retryAfter) } });
  }
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Vérifiez les champs du formulaire." }, { status: 422 });
  const d = parsed.data;
  if (!d.fichiers.length && !d.vocal && d.consigne.length < 10) {
    return NextResponse.json({ error: "Déposez votre dossier ou dites-nous en quelques mots ce qu'il faut faire." }, { status: 422 });
  }
  const jeton = d.jeton ?? "";
  if (d.fichiers.some((f) => !fichierDuJeton(f.url, jeton)) || (d.vocal && !fichierDuJeton(d.vocal, jeton))) {
    return NextResponse.json({ error: "Fichier non reconnu : déposez-le à nouveau." }, { status: 422 });
  }
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

    // Les fichiers rejoignent le dossier du compte (droits de lecture habituels)
    const urls = await rattacherFichiers([...d.fichiers.map((f) => f.url), ...(d.vocal ? [d.vocal] : [])], user.id);
    const fichiers = d.fichiers.map((f, i) => ({ url: urls[i], nom: f.nom }));
    const vocal = d.vocal ? urls[urls.length - 1] : null;

    // Compte sans mot de passe : lien d'activation ; sinon simple confirmation
    let activation: string | null = null;
    if (!user.password) {
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000);
      await prisma.passwordResetToken.upsert({
        where: { userId: user.id },
        update: { token, expiresAt, used: false },
        create: { userId: user.id, token, expiresAt },
      });
      const base = (process.env.NEXT_PUBLIC_APP_URL ?? process.env.NEXTAUTH_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");
      activation = `${base}/reinitialiser-mot-de-passe?token=${token}`;
    }
    const nom = user.name ?? d.name;
    const r = await creerDemandeExpress({
      clientId: user.id, nomClient: d.name, emailClient: d.email,
      consigne: d.consigne, fichiers, vocal, entrepriseLibre: d.company || null, telephone: d.phone || null, origine: "page publique",
      autresEnvois: (id) => [activation
        ? sendActivationCompte({ to: d.email, name: d.name, serviceName: "Votre demande", prestationId: id, lien: activation, piecesAFournir: 0 })
        : sendDemandeConfirmation({ to: d.email, name: nom, serviceName: "Votre demande", prestationId: id, piecesAFournir: 0 })],
    });

    return NextResponse.json({ ok: true, reference: r.id.slice(-8).toUpperCase(), analyse: r.analyse, compteExistant: !nouveau && Boolean(user.password) }, { status: 201 });
  } catch (error) {
    console.error("POST /api/prestations/publique/express error:", error);
    return NextResponse.json({ error: "Erreur serveur. Réessayez ou écrivez à contact@shiftup.bj." }, { status: 500 });
  }
}
