/**
 * Fil de discussion d'une demande (client ↔ équipe SHIFT UP).
 *
 * GET  /api/prestations/[id]/messages → messages du fil (et marque comme lus ceux reçus)
 * POST /api/prestations/[id]/messages { content } → nouveau message
 *
 * Stockage : table Message, conversationId = « prestation:<id> ». Un message du client est remis à chaque
 * membre de l'équipe (même horodatage, regroupé à l'affichage) pour rester visible dans leur messagerie.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isSafe } from "@/lib/validation";
import { rateLimit } from "@/lib/ratelimit";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { avertirClient } from "@/lib/notifications";
import { nomService } from "@/lib/prestations-noms";

const fil = (id: string) => `prestation:${id}`;
const corps = z.object({ content: z.string().trim().min(1, "Message vide.").max(4000).refine(isSafe, "Contenu non autorisé.") });

async function acces(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { erreur: NextResponse.json({ error: "Non authentifié." }, { status: 401 }) };
  const equipe = ["ADMIN", "DEVELOPER"].includes(session.user.role as string);
  const p = await prisma.prestation.findUnique({
    where: { id },
    select: { id: true, clientId: true, sector: true, customService: true, service: { select: { title: true } }, client: { select: { name: true, email: true } } },
  });
  if (!p || (!equipe && p.clientId !== session.user.id)) return { erreur: NextResponse.json({ error: "Demande introuvable." }, { status: 404 }) };
  return { session, equipe, p };
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await acces(id);
  if ("erreur" in a) return a.erreur;
  const moi = a.session.user.id;
  const bruts = await prisma.message.findMany({
    where: { conversationId: fil(id) },
    include: { sender: { select: { id: true, name: true, role: true } } },
    orderBy: { createdAt: "asc" },
  });
  // Un message du client remis à plusieurs membres de l'équipe n'est affiché qu'une fois
  const vus = new Set<string>();
  const messages = bruts.filter((m) => {
    const cle = `${m.senderId}|${m.createdAt.getTime()}|${m.content.length}`;
    if (vus.has(cle)) return false;
    vus.add(cle);
    return true;
  }).map((m) => ({
    id: m.id, content: m.content, date: m.createdAt.toISOString(),
    deMoi: m.senderId === moi,
    auteur: m.senderId === a.p.clientId ? (a.p.client.name ?? "Client") : "Équipe SHIFT UP",
    equipe: m.senderId !== a.p.clientId,
  }));
  await prisma.message.updateMany({ where: { conversationId: fil(id), recipientId: moi, isRead: false }, data: { isRead: true } });
  return NextResponse.json({ messages });
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const a = await acces(id);
  if ("erreur" in a) return a.erreur;
  const moi = a.session.user.id;
  const { allowed } = await rateLimit(`fil:${moi}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de messages d'affilée. Réessayez dans quelques minutes." }, { status: 429 });
  const parsed = corps.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Message invalide." }, { status: 422 });
  const content = parsed.data.content;
  const service = nomService(a.p);
  const sujet = `Demande ${id.slice(-8).toUpperCase()} — ${service}`.slice(0, 190);

  if (a.equipe) {
    await prisma.message.create({ data: { senderId: moi, recipientId: a.p.clientId, subject: sujet, content, conversationId: fil(id) } });
    await avertirClient(id, "MESSAGE", "Nouveau message de l'équipe", content.length > 280 ? `${content.slice(0, 280)}…` : content);
  } else {
    const equipe = await prisma.user.findMany({ where: { role: { in: ["ADMIN", "DEVELOPER"] } }, select: { id: true } });
    const quand = new Date();
    await prisma.message.createMany({
      data: equipe.map((u) => ({ senderId: moi, recipientId: u.id, subject: sujet, content, conversationId: fil(id), createdAt: quand })),
    });
    await alerterEquipeWhatsApp("Message client", `${a.p.client.name ?? a.p.client.email ?? "Client"} — ${service} : ${content.slice(0, 120)}`).catch(() => {});
  }
  return NextResponse.json({ ok: true });
}
