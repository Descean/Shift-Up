/**
 * GET  /api/messages  — Messages reçus par l'utilisateur connecté
 * POST /api/messages  — Envoyer un message à l'équipe SHIFT UP (admins)
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const messages = await prisma.message.findMany({
      where: { recipientId: session.user.id },
      include: { sender: { select: { name: true, role: true } } },
      orderBy: { createdAt: "desc" },
    });

    const items = messages.map((m) => ({
      id: m.id,
      from: m.sender.name ?? "Équipe SHIFT UP",
      initials: (m.sender.name ?? "SU")
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
      subject: m.subject ?? "(Sans objet)",
      preview: m.content.slice(0, 80) + (m.content.length > 80 ? "…" : ""),
      content: m.content,
      date: new Date(m.createdAt).toLocaleDateString("fr-FR"),
      isRead: m.isRead,
      isFromTeam: ["ADMIN", "DEVELOPER"].includes(m.sender.role),
    }));

    return NextResponse.json({ messages: items });
  } catch (error) {
    console.error("GET /api/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { subject, content } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
    }

    // Envoyer à tous les admins
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "DEVELOPER"] } },
      select: { id: true },
    });

    await Promise.all(
      admins.map((admin) =>
        prisma.message.create({
          data: {
            senderId: session.user.id,
            recipientId: admin.id,
            subject: subject ?? null,
            content,
          },
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    await prisma.message.update({
      where: { id, recipientId: session.user.id },
      data: { isRead: true },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PATCH /api/messages error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
