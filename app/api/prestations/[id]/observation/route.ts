/**
 * POST /api/prestations/[id]/observation
 * Client soumet une observation sur un livrable.
 * L'observation (texte et/ou note vocale) est sauvegardée sur le livrable et ajoutée à la discussion du dossier
 * (Direction et monteur chargé) ; la Direction est aussi prévenue par courriel.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendObservationAdmin } from "@/lib/email";
import { fil } from "@/lib/fil";
import { fichierDe } from "@/lib/montage-serveur";

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

    if (voiceNoteUrl && (typeof voiceNoteUrl !== "string" || !fichierDe(voiceNoteUrl, session.user.id))) {
      return NextResponse.json({ error: "Note vocale non reconnue : enregistrez-la à nouveau." }, { status: 422 });
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

    // Discussion du dossier : Direction + monteur chargé (tous les monteurs tant que personne ne l'a pris)
    const serviceName = prestation.service?.title ?? prestation.customService ?? "Prestation";
    const admins = await prisma.user.findMany({
      where: { role: { in: ["ADMIN", "DEVELOPER"] } },
      select: { id: true, email: true },
    });
    const equipe = await prisma.user.findMany({
      where: prestation.assignedToId ? { OR: [{ role: { in: ["ADMIN", "DEVELOPER"] } }, { id: prestation.assignedToId }] } : { role: { in: ["ADMIN", "DEVELOPER", "MONTEUR"] } },
      select: { id: true },
    });
    const messageContent = `Remarque sur « ${livrable.title} »${observationText ? ` : ${observationText}` : " (note vocale)"}`;
    const quand = new Date();
    await prisma.message.createMany({
      data: equipe.map((u) => ({
        senderId: session.user.id, recipientId: u.id, subject: `Observation livrable — ${serviceName}`.slice(0, 190),
        content: messageContent.slice(0, 4000), attachments: voiceNoteUrl ? [voiceNoteUrl] : [], conversationId: fil(prestationId), createdAt: quand,
      })),
    });

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
