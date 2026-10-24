/**
 * app/api/payout/request/route.ts
 *
 * POST — Créer une demande de versement de commissions.
 * Réservé aux APPORTEUR. Minimum 30 000 F CFA.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { z } from "zod";

const MIN_AMOUNT = 30_000;

const schema = z.object({
  amount:         z.number().int().min(MIN_AMOUNT),
  mobileProvider: z.enum(["MTN_MOMO", "MOOV_MONEY", "WAVE", "CELTIIS"]),
  // Numérotation béninoise à 10 chiffres : +229 01 XX XX XX XX
  mobileNumber:   z.string().transform((v) => v.replace(/[\s.-]/g, "")).pipe(z.string().regex(/^\+22901\d{8}$/, "Numéro Mobile Money invalide (10 chiffres, commençant par 01).")),
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (session.user.role !== "APPORTEUR") {
    return NextResponse.json({ error: "Accès réservé aux apporteurs." }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Check apporteur profile & pending earnings
    const profile = await prisma.apporteurProfile.findUnique({
      where: { userId: session.user.id },
    });

    if (!profile) {
      return NextResponse.json({ error: "Profil apporteur introuvable." }, { status: 404 });
    }

    if (profile.pendingEarnings < MIN_AMOUNT) {
      return NextResponse.json(
        { error: `Solde insuffisant. Minimum requis : ${MIN_AMOUNT.toLocaleString()} F CFA.` },
        { status: 400 }
      );
    }

    if (data.amount > profile.pendingEarnings) {
      return NextResponse.json(
        { error: `Montant supérieur à votre solde disponible (${profile.pendingEarnings.toLocaleString()} F).` },
        { status: 400 }
      );
    }

    // Check no pending request already exists
    const existing = await prisma.payoutRequest.findFirst({
      where: { userId: session.user.id, status: "PENDING" },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Vous avez déjà une demande en cours de traitement. Attendez qu'elle soit traitée." },
        { status: 409 }
      );
    }

    const reference = `SU-POUT-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 6)
      .toUpperCase()}`;

    const payoutRequest = await prisma.payoutRequest.create({
      data: {
        userId:         session.user.id,
        amount:         data.amount,
        currency:       "XOF",
        mobileProvider: data.mobileProvider,
        mobileNumber:   data.mobileNumber,
        status:         "PENDING",
        reference,
      },
    });

    return NextResponse.json({ success: true, reference: payoutRequest.reference });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("Payout request error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
