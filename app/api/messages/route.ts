/**
 * GET  /api/messages           — Liste des conversations (groupées par contact)
 * GET  /api/messages?thread=id — Messages d'une conversation avec un contact
 * POST /api/messages           — Envoyer un message à l'équipe SHIFT UP (admins)
 * PATCH /api/messages          — Marquer un message comme lu
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const userId = session.user.id;
  const threadWith = new URL(req.url).searchParams.get("thread");
  const isAdmin = ["ADMIN", "DEVELOPER"].includes(session.user.role as string);

  try {
    // ── Mode thread : retourner tous les messages d'une conversation ──────
    if (threadWith) {
      const messages = await prisma.message.findMany({
        where: {
          OR: [
            { senderId: userId, recipientId: threadWith },
            { senderId: threadWith, recipientId: userId },
          ],
        },
        include: { sender: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      });

      // Mark received messages as read
      await prisma.message.updateMany({
        where: { senderId: threadWith, recipientId: userId, isRead: false },
        data: { isRead: true },
      });

      const items = messages.map((m) => ({
        id: m.id,
        content: m.content,
        subject: m.subject,
        isMine: m.senderId === userId,
        senderName: m.sender.name ?? "Inconnu",
        date: m.createdAt.toISOString(),
        isRead: m.isRead,
      }));

      return NextResponse.json({ messages: items });
    }

    // ── Mode conversations : retourner la liste des contacts ──────────────
    // Pour chaque conversation, on veut : contact info, dernier message, nb non lus
    const allMessages = await prisma.message.findMany({
      where: {
        OR: [{ senderId: userId }, { recipientId: userId }],
      },
      include: {
        sender: { select: { id: true, name: true, role: true } },
        recipient: { select: { id: true, name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Group by conversation partner
    const contactMap = new Map<string, {
      id: string;
      name: string;
      role: string;
      lastMessage: string;
      lastDate: string;
      unread: number;
    }>();

    for (const m of allMessages) {
      // Determine the "other" party
      const other = m.senderId === userId ? m.recipient : m.sender;
      if (!other) continue;

      // Skip inter-admin messages (admin↔admin, admin↔developer)
      if (isAdmin && ["ADMIN", "DEVELOPER"].includes(other.role)) continue;

      if (!contactMap.has(other.id)) {
        contactMap.set(other.id, {
          id: other.id,
          name: other.name ?? "Inconnu",
          role: other.role,
          lastMessage: m.content.slice(0, 60) + (m.content.length > 60 ? "…" : ""),
          lastDate: m.createdAt.toISOString(),
          unread: (!m.isRead && m.recipientId === userId) ? 1 : 0,
        });
      } else {
        // Count additional unread
        const existing = contactMap.get(other.id)!;
        if (!m.isRead && m.recipientId === userId) {
          existing.unread += 1;
        }
      }
    }

    const conversations = Array.from(contactMap.values());
    return NextResponse.json({ conversations });
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
    const { subject, content, recipientId } = await req.json();
    if (!content?.trim()) {
      return NextResponse.json({ error: "Contenu requis." }, { status: 400 });
    }

    if (recipientId) {
      // Direct message to a specific user
      await prisma.message.create({
        data: {
          senderId: session.user.id,
          recipientId,
          subject: subject ?? null,
          content,
        },
      });
    } else {
      // Send to all admins (client → team)
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
    }

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
