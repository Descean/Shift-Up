/**
 * GET   /api/admin/marketing — Stats newsletter + liste des abonnés + contacts
 * PATCH /api/admin/marketing — Marquer un contact comme lu
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!["ADMIN", "DEVELOPER"].includes(session.user.role as string)) return null;
  return session;
}

export async function GET() {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const [subscribers, contacts, totalUsers] = await Promise.all([
      prisma.newsletterSubscriber.findMany({ orderBy: { subscribedAt: "desc" } }),
      prisma.contactMessage.findMany({ orderBy: { createdAt: "desc" }, take: 20 }),
      prisma.user.count(),
    ]);

    const activeSubscribers = subscribers.filter((s) => s.isActive).length;
    const unreadContacts    = contacts.filter((c) => !c.isRead).length;

    return NextResponse.json({
      stats: { totalSubscribers: subscribers.length, activeSubscribers, unreadContacts, totalUsers },
      subscribers,
      contacts,
    });
  } catch (error) {
    console.error("GET /api/admin/marketing error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { id, isRead } = await req.json();
    if (!id) return NextResponse.json({ error: "ID requis." }, { status: 400 });
    const contact = await prisma.contactMessage.update({ where: { id }, data: { isRead: Boolean(isRead) } });
    return NextResponse.json({ contact });
  } catch (error) {
    console.error("PATCH /api/admin/marketing error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
