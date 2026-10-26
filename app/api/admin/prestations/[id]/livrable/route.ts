/**
 * POST  /api/admin/prestations/[id]/livrable — Ajouter un livrable
 * PATCH /api/admin/prestations/[id]/livrable — Rendre un livrable disponible
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { lienEspaceClient, notifierClientWhatsApp } from "@/lib/whatsapp";
import { sendLivrableClient } from "@/lib/email";
import { envoyer, livrableAccessible } from "@/lib/prestations";

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
    const { title, description, type, url, isAvailable, phaseId } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Titre requis." }, { status: 400 });

    const livrable = await prisma.livrable.create({
      data: {
        prestationId: id,
        title,
        description,
        type: type ?? "LINK",
        url: url || null,
        isAvailable: isAvailable ?? false,
        phaseId: phaseId || null,
      },
    });

    // Si disponible immédiatement → notifier le client
    if (isAvailable) {
      const prestation = await prisma.prestation.findUnique({
        where: { id },
        include: { client: true, service: true },
      });
      if (prestation?.client?.email) {
        const serviceName = prestation.service?.title ?? prestation.customService ?? "Prestation";
        await envoyer("livrable", [
          sendLivrableClient({ to: prestation.client.email, name: prestation.client.name ?? "Client", livrableTitle: title, serviceName, apresSolde: !livrableAccessible({ type: livrable.type, isAvailable: true }, prestation) }),
          notifierClientWhatsApp(prestation.clientId, "shiftup_livrable", [prestation.client.name ?? "", serviceName, lienEspaceClient()]),
        ]);
      }
    }

    return NextResponse.json({ livrable });
  } catch (error) {
    console.error("POST /livrable error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  const { id } = await params;

  try {
    const { livrableId, isAvailable, url } = await req.json();
    if (!livrableId) return NextResponse.json({ error: "livrableId requis." }, { status: 400 });

    const livrable = await prisma.livrable.update({
      where: { id: livrableId },
      data: {
        ...(isAvailable !== undefined && { isAvailable }),
        ...(url !== undefined && { url }),
      },
    });

    // Email si on rend disponible maintenant
    if (isAvailable === true) {
      const prestation = await prisma.prestation.findUnique({
        where: { id },
        include: { client: true, service: true },
      });
      if (prestation?.client?.email) {
        const serviceName = prestation.service?.title ?? prestation.customService ?? "Prestation";
        await envoyer("livrable", [
          sendLivrableClient({ to: prestation.client.email, name: prestation.client.name ?? "Client", livrableTitle: livrable.title, serviceName, apresSolde: !livrableAccessible({ type: livrable.type, isAvailable: true }, prestation) }),
          notifierClientWhatsApp(prestation.clientId, "shiftup_livrable", [prestation.client.name ?? "", serviceName, lienEspaceClient()]),
        ]);
      }
    }

    return NextResponse.json({ livrable });
  } catch (error) {
    console.error("PATCH /livrable error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
