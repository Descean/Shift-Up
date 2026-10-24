import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { verifyTOTPCode } from "@/lib/totp";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { rateLimit, getClientIp } from "@/lib/ratelimit";

/**
 * POST /api/auth/2fa/verify
 * Body: { code: "123456" }
 *
 * Vérifie un code TOTP pour l'utilisateur connecté.
 * Utilisé par le middleware ou la page de double authentification.
 */
export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = await rateLimit(`2fa:${ip}`, { limit: 5, windowMs: 5 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { code } = await req.json();
  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code requis." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpEnabled || !user.totpSecret) {
    return NextResponse.json({ error: "Le 2FA n'est pas activé sur ce compte." }, { status: 400 });
  }

  const valid = verifyTOTPCode(code, user.totpSecret);
  if (!valid) {
    return NextResponse.json({ error: "Code incorrect." }, { status: 422 });
  }

  return NextResponse.json({ success: true });
}
