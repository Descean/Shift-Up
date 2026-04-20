/**
 * GET /api/badges — Compteurs dynamiques pour les badges de la sidebar
 * Retourne selon le rôle :
 *  - messages  : nb de messages non lus reçus
 *  - tasks     : nb de micro-tâches DISPONIBLE (étudiant)
 *  - pending   : nb de services apporteurs en attente de validation (admin)
 *  - prestations : nb de prestations EN_ATTENTE (admin)
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ messages: 0, tasks: 0, pending: 0, prestations: 0 });
  }

  const userId = session.user.id;
  const role   = session.user.role as string;

  try {
    const [messages, tasks, pendingServices, pendingPrestations] = await Promise.all([
      // Messages non lus pour tout le monde
      prisma.message.count({
        where: { recipientId: userId, isRead: false },
      }),

      // Tâches disponibles pour les étudiants
      role === "ETUDIANT"
        ? prisma.microTask.count({ where: { status: "DISPONIBLE" } })
        : Promise.resolve(0),

      // Services apporteurs en attente pour les admins
      role === "ADMIN" || role === "DEVELOPER"
        ? prisma.apporteurService.count({ where: { isApproved: false } })
        : Promise.resolve(0),

      // Prestations en attente pour les admins
      role === "ADMIN" || role === "DEVELOPER"
        ? prisma.prestation.count({ where: { status: "EN_ATTENTE" } })
        : Promise.resolve(0),
    ]);

    return NextResponse.json({ messages, tasks, pending: pendingServices, prestations: pendingPrestations });
  } catch {
    return NextResponse.json({ messages: 0, tasks: 0, pending: 0, prestations: 0 });
  }
}
