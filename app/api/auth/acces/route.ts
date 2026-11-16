/**
 * POST /api/auth/acces { email, suite? } — Accès à l'espace client avec l'adresse e-mail seule.
 *
 *  - Adresse inconnue : le compte client est créé (« compte invisible ») et un jeton de connexion à usage
 *    unique est renvoyé au navigateur, qui ouvre la session tout de suite.
 *  - Compte client existant : un lien de connexion (30 min, usage unique) est envoyé par e-mail.
 *  - Compte client ou monteur existant : lien envoyé par e-mail (comme ci-dessus).
 *  - Direction, ou compte protégé par la double authentification : connexion par mot de passe.
 * Jetons stockés dans VerificationToken (identifiant « acces:<userId> »), consommés par le fournisseur
 * « lien » de lib/auth.ts.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { generateAffiliationCode } from "@/lib/utils";
import { sendLienConnexion } from "@/lib/email";
import { verifyCaptcha } from "@/lib/captcha";
import { jetonAcces, lienAcces, ROLES_LIEN } from "@/lib/acces";

const schema = z.object({ email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(200), suite: z.string().max(300).optional(), captchaToken: z.string().optional() });

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = await rateLimit(`acces:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de tentatives. Réessayez dans quelques minutes." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Adresse invalide." }, { status: 422 });
  const { email } = parsed.data;
  if (!(await verifyCaptcha(parsed.data.captchaToken))) return NextResponse.json({ error: "Vérification anti-robot échouée. Réessayez." }, { status: 403 });
  const suite = parsed.data.suite?.startsWith("/") && !parsed.data.suite.startsWith("//") ? parsed.data.suite : "/dashboard";

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      const nom = email.split("@")[0].replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).slice(0, 80);
      const cree = await prisma.user.create({ data: { name: nom, email, role: "CLIENT", affiliationCode: generateAffiliationCode() } });
      await prisma.clientProfile.create({ data: { userId: cree.id } }).catch(() => {});
      return NextResponse.json({ nouveau: true, jeton: await jetonAcces(cree.id, 5) });
    }
    if (!ROLES_LIEN.includes(user.role) || user.totpEnabled) return NextResponse.json({ motDePasse: true });

    const { allowed: ok } = await rateLimit(`acces-mail:${email}`, { limit: 4, windowMs: 60 * 60 * 1000 });
    if (!ok) return NextResponse.json({ error: "Plusieurs liens viennent d'être envoyés : regardez votre boîte de réception." }, { status: 429 });
    const lien = await lienAcces(user.id, suite);
    await sendLienConnexion({ to: email, name: user.name ?? "", lien });
    return NextResponse.json({ lienEnvoye: true });
  } catch (e) {
    console.error("[auth/acces]", e);
    return NextResponse.json({ error: "Connexion impossible pour le moment. Réessayez ou utilisez votre mot de passe." }, { status: 500 });
  }
}
