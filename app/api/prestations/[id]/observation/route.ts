/**
 * POST /api/prestations/[id]/observation
 * Client soumet une observation sur un livrable.
 * L'observation est sauvegardée sur le Livrable ET envoyée en message à l'admin.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendObservationAdmin } from "@/lib/email";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  const { id: prestationId } = await params;

  try {
    const { livrableId, observation, voiceNoteUrl } = await req.json();
    if (!livrableId || (!observation?.trim() && !voiceNoteUrl)) {
      return NextResponse.json({ error: "livrableId et observation (texte ou vocal) requis." }, { status: 400 });
    }

    // Verify prestation belongs to client
    const prestation = await prisma.prestation.findFirst({
      where: { id: prestationId, clientId: session.user.id },
      include: { service: { select: { title: true } } },
    });
    if (!prestation) {
      return NextResponse.json({ error: "Prestation introuvable." }, { status: 404 });
    }

    // Save observation on livrable
    const observationText = observation?.trim() ?? "";
    const livrable = await prisma.livrable.update({
      where: { id: livrableId, prestationId },
      data: {
        observation: observationText || (voiceNoteUrl ? "[Note vocale]" : ""),
        observationAt: new Date(),
      },
    });

    // Send as message to all admins
    const serviceName = prestation.service?.title ?? prestation.customService ?? "Prestation";
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "DEVELOPER"] } },
      select: { id: true, email: true },
    });

    const messageContent = [
      `📋 Livrable : "${livrable.title}"`,
      observationText ? `\nObservation :\n${observationText}` : "",
      voiceNoteUrl ? `\n🎙️ Note vocale : ${voiceNoteUrl}` : "",
    ].join("");

    await Promise.all(
      admins.map((admin) =>
        prisma.message.create({
          data: {
            senderId: session.user.id,
            recipientId: admin.id,
            subject: `Observation livrable — ${serviceName}`,
            content: messageContent,
          },
        })
      )
    );

    // Email notification to all admins
    const clientName = (session.user as { name?: string }).name ?? "Client";
    const adminEmails = admins.map((a) => a.email).filter(Boolean) as string[];
    await Promise.allSettled(
      adminEmails.map((email) =>
        sendObservationAdmin({
          to: email,
          clientName,
          serviceName,
          livrableTitle: livrable.title,
          observation: observationText || "(note vocale uniquement)",
          voiceNoteUrl: voiceNoteUrl ?? null,
          prestationId,
        })
      )
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /observation error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
