/**
 * POST  /api/admin/prestations/[id]/livrable — Ajouter un livrable
 * PATCH /api/admin/prestations/[id]/livrable — Rendre un livrable disponible
 */

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendLivrableClient } from "@/lib/email";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;
  if (!["ADMIN", "DEVELOPER"].includes(session.user.role as string)) return null;
  return session;
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

  try {
    const { title, description, type, url, isAvailable } = await req.json();
    if (!title?.trim()) return NextResponse.json({ error: "Titre requis." }, { status: 400 });

    const livrable = await prisma.livrable.create({
      data: { prestationId: params.id, title, description, type: type ?? "LINK", url: url || null, isAvailable: isAvailable ?? false },
    });

    // Si disponible immédiatement → notifier le client
    if (isAvailable) {
      const prestation = await prisma.prestation.findUnique({
        where: { id: params.id },
        include: { client: true, service: true },
      });
      if (prestation?.client?.email) {
        const serviceName = prestation.service?.title ?? prestation.customService ?? "Prestation";
        sendLivrableClient({ to: prestation.client.email, name: prestation.client.name ?? "Client", livrableTitle: title, serviceName })
          .catch((e) => console.error("Email error:", e));
      }
    }

    return NextResponse.json({ livrable });
  } catch (error) {
    console.error("POST /livrable error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await requireAdmin();
  if (!session) return NextResponse.json({ error: "Non autorisé." }, { status: 403 });

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
        where: { id: params.id },
        include: { client: true, service: true },
      });
      if (prestation?.client?.email) {
        const serviceName = prestation.service?.title ?? prestation.customService ?? "Prestation";
        sendLivrableClient({ to: prestation.client.email, name: prestation.client.name ?? "Client", livrableTitle: livrable.title, serviceName })
          .catch((e) => console.error("Email error:", e));
      }
    }

    return NextResponse.json({ livrable });
  } catch (error) {
    console.error("PATCH /livrable error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
