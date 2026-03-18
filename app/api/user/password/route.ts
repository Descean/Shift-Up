/**
 * PATCH /api/user/password — Changer le mot de passe
 * Body: { currentPassword: string, newPassword: string }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { currentPassword, newPassword } = await req.json();

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Champs requis manquants." }, { status: 400 });
    }
    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le mot de passe doit faire au moins 8 caractères." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    if (!user?.password) {
      return NextResponse.json({ error: "Compte OAuth — pas de mot de passe à modifier." }, { status: 400 });
    }

    const isValid = await bcrypt.compare(currentPassword, user.password);
    if (!isValid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashed },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/user/password error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
