/**
 * POST /api/admin/prestations/[id]/devis
 *
 * L'admin envoie le devis + plan de réalisation au client.
 * Le statut passe à DEVIS_ENVOYE et un email est envoyé au client.
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendDevisClient } from "@/lib/email";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!["ADMIN", "DEVELOPER"].includes(session.user.role as string)) return null;
  return session;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;

  try {
    const body = await req.json();
    const { quote, plan, adminNote, amount } = body;

    // quote = { items: [{ label, amount }], deposit: number, total: number, validity: string, terms: string }
    // plan  = { phases: [{ title, description, duration, order }] }

    if (!quote?.total) return NextResponse.json({ error: "Le devis doit contenir un montant total." }, { status: 400 });

    const prestation = await prisma.prestation.findUnique({
      where: { id },
      include: { client: true, service: true },
    });
    if (!prestation) return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });

    const updated = await prisma.prestation.update({
      where: { id },
      data: {
        quote,
        plan,
        adminNote: adminNote || null,
        amount: amount ?? quote.total,
        status: "DEVIS_ENVOYE",
      },
      include: { service: true, prestationPhases: true, livrables: true },
    });

    // Email au client
    const clientEmail = prestation.client.email;
    const clientName  = prestation.client.name ?? clientEmail ?? "Client";
    const serviceName = prestation.service?.title ?? prestation.customService ?? prestation.sector ?? "Prestation";
    const depositAmount = quote.deposit ?? Math.round(quote.total * 0.4);

    if (clientEmail) {
      sendDevisClient({ to: clientEmail, name: clientName, serviceName, depositAmount, prestationId: id })
        .catch((e) => console.error("Email error:", e));
    }

    // Message interne
    const admins = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "DEVELOPER"] }, id: { not: session.user.id } }, select: { id: true } });
    await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId: prestation.clientId,
        subject: `Devis disponible — ${serviceName}`,
        content: `Votre devis pour "${serviceName}" est prêt. Consultez-le depuis votre dashboard et payez l'acompte pour démarrer votre projet.`,
      },
    });
    void admins;

    return NextResponse.json({ prestation: updated });
  } catch (error) {
    console.error("POST /api/admin/prestations/[id]/devis error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
