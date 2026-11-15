/**
 * GET   /api/notifications                 → 30 derniers avis de l'utilisateur + nombre de non lus
 * GET   /api/notifications?prestationId=x  → journal complet d'une demande (client propriétaire ou équipe)
 * PATCH /api/notifications { id? }          → marque un avis (ou tous) comme lu(s)
 *
 * Si la table n'existe pas encore (script SQL non exécuté), renvoie une liste vide.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const prestationId = req.nextUrl.searchParams.get("prestationId");
  const equipe = ["ADMIN", "DEVELOPER"].includes(session.user.role as string);
  try {
    if (prestationId) {
      const p = await prisma.prestation.findUnique({ where: { id: prestationId }, select: { clientId: true } });
      if (!p || (!equipe && p.clientId !== session.user.id)) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
      const journal = await prisma.notification.findMany({
        where: { prestationId, userId: p.clientId },
        orderBy: { createdAt: "desc" }, take: 100,
        select: { id: true, type: true, titre: true, texte: true, createdAt: true },
      });
      return NextResponse.json({ journal });
    }
    const [avis, nonLus] = await Promise.all([
      prisma.notification.findMany({
        where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 30,
        select: { id: true, type: true, titre: true, texte: true, lien: true, lu: true, createdAt: true, prestationId: true },
      }),
      prisma.notification.count({ where: { userId: session.user.id, lu: false } }),
    ]);
    return NextResponse.json({ avis, nonLus });
  } catch {
    return NextResponse.json({ avis: [], nonLus: 0, journal: [] });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const { id } = (await req.json().catch(() => ({}))) as { id?: string };
  try {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, lu: false, ...(typeof id === "string" ? { id } : {}) },
      data: { lu: true },
    });
  } catch { /* table absente : rien à marquer */ }
  return NextResponse.json({ ok: true });
}
