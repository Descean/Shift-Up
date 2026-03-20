import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }
  if (!["ADMIN", "DEVELOPER"].includes(session.user.role as string)) {
    return NextResponse.json({ error: "Non autorisé." }, { status: 403 });
  }

  try {
    const { recipientId, subject, content } = await req.json();
    if (!recipientId || !content?.trim()) {
      return NextResponse.json({ error: "recipientId et content requis." }, { status: 400 });
    }

    await prisma.message.create({
      data: {
        senderId: session.user.id,
        recipientId,
        subject: subject ?? null,
        content,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/messages/reply error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
