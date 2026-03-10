/**
 * app/api/user/profile/route.ts — Profil de l'utilisateur connecté
 *
 * GET   /api/user/profile  → Récupère le profil complet (User + profil métier)
 * PATCH /api/user/profile  → Met à jour name, phone, image
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const patchSchema = z.object({
  name:  z.string().min(2).optional(),
  phone: z.string().optional(),
  image: z.string().url().optional(), // URL de l'avatar (stocké dans Supabase Storage)
});

// ── GET — Profil complet ──────────────────────────────────────────────────────
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        image: true,
        role: true,
        affiliationCode: true,
        stars: true,
        isActive: true,
        createdAt: true,
        // Profils métier (un seul sera non-null selon le rôle)
        clientProfile:   true,
        apporteurProfile: true,
        etudiantProfile: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "Utilisateur introuvable." }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("GET /api/user/profile error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

// ── PATCH — Mise à jour du profil ─────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = patchSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        ...(data.name  ? { name: data.name }   : {}),
        ...(data.phone ? { phone: data.phone } : {}),
        ...(data.image ? { image: data.image } : {}),
      },
      select: {
        id: true, name: true, email: true,
        phone: true, image: true, role: true,
      },
    });

    return NextResponse.json({ user: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("PATCH /api/user/profile error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
