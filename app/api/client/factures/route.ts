/** GET /api/client/factures — Paiements reçus du client (une facture / un reçu par paiement). */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { reference, titreDossier } from "@/lib/dossier";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const paiements = await prisma.payment.findMany({
    where: { userId: session.user.id, status: "COMPLETED" },
    include: { prestation: { select: { id: true, customFields: true, customService: true, service: { select: { title: true } } } } },
    orderBy: { createdAt: "asc" },
  });
  const vus = new Map<string, number>();
  const factures = paiements.map((p) => {
    const rang = (vus.get(p.prestationId) ?? 0) + 1;
    vus.set(p.prestationId, rang);
    return {
      id: p.id, numero: `FAC-${p.id.slice(-6).toUpperCase()}`, date: p.createdAt.toISOString(), montant: p.amount,
      dossierId: p.prestationId, dossier: reference(p.prestationId), titre: titreDossier(p.prestation),
      type: rang === 1 ? "Acompte" : "Solde", reference: p.reference,
    };
  }).reverse();
  return NextResponse.json({ factures, payePar: session.user.name ?? session.user.email ?? "" });
}
