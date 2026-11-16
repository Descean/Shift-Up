/** Messages automatiques du fil de discussion d'un dossier (« L'acompte a été reçu… »). */
import prisma from "@/lib/prisma";

export const SUJET_SYSTEME = "__systeme__";
export const fil = (prestationId: string) => `prestation:${prestationId}`;

/** Ajoute un message du système dans le fil (auteur technique : l'utilisateur à l'origine de l'événement). */
export async function messageSysteme(prestationId: string, texte: string, auteurId?: string | null) {
  try {
    const p = await prisma.prestation.findUnique({ where: { id: prestationId }, select: { clientId: true } });
    if (!p) return;
    await prisma.message.create({
      data: { senderId: auteurId ?? p.clientId, recipientId: null, subject: SUJET_SYSTEME, content: texte.slice(0, 1000), conversationId: fil(prestationId), isRead: true },
    });
  } catch (e) {
    console.error("[fil] message système", e);
  }
}
