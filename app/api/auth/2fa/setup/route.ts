import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import QRCode from "qrcode";
import prisma from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { generateTOTPSecret, verifyTOTPCode, generateTOTPKeyURI } from "@/lib/totp";

/**
 * GET  /api/auth/2fa/setup  → génère un secret + QR code (non encore actif)
 * POST /api/auth/2fa/setup  → { code } confirme le code OTP et active le 2FA
 * DELETE /api/auth/2fa/setup → { code } désactive le 2FA après vérification
 */

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { email: true, totpEnabled: true },
  });
  if (!user) return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
  if (user.totpEnabled) return NextResponse.json({ error: "Le 2FA est déjà activé." }, { status: 409 });

  const secret = generateTOTPSecret();
  const otpUri = generateTOTPKeyURI(user.email!, "SHIFT UP", secret);
  const qrCode = await QRCode.toDataURL(otpUri);

  // Stocker provisoirement — sera activé uniquement après confirmation POST
  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: secret },
  });

  return NextResponse.json({ secret, qrCode });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { code } = await req.json();
  if (!code || typeof code !== "string") return NextResponse.json({ error: "Code requis." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpSecret) return NextResponse.json({ error: "Lancez d'abord la configuration (GET)." }, { status: 400 });
  if (user.totpEnabled) return NextResponse.json({ error: "2FA déjà actif." }, { status: 409 });

  if (!verifyTOTPCode(code, user.totpSecret)) {
    return NextResponse.json({ error: "Code incorrect. Réessayez." }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpEnabled: true },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });

  const { code } = await req.json();
  if (!code || typeof code !== "string") return NextResponse.json({ error: "Code requis pour désactiver." }, { status: 400 });

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { totpSecret: true, totpEnabled: true },
  });

  if (!user?.totpEnabled || !user.totpSecret) return NextResponse.json({ error: "Le 2FA n'est pas activé." }, { status: 400 });

  if (!verifyTOTPCode(code, user.totpSecret)) {
    return NextResponse.json({ error: "Code incorrect." }, { status: 422 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { totpSecret: null, totpEnabled: false },
  });

  return NextResponse.json({ success: true });
}
