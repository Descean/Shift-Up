/**
 * GET  /api/admin/whatsapp            — conversations (les plus récentes d'abord)
 * GET  /api/admin/whatsapp?id=…       — messages d'une conversation (marquée lue)
 * POST /api/admin/whatsapp            — repondre { id, texte } | prendre_main { id } | rendre_main { id }
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { repondreEquipe } from "@/lib/whatsapp-assistant";
import { whatsappAutomatique } from "@/lib/whatsapp";
import { iaDisponible } from "@/lib/ia";

async function admin() {
  const s = await getServerSession(authOptions);
  return s?.user?.id && ["ADMIN", "DEVELOPER"].includes(s.user.role as string) ? s : null;
}
const absentes = (e: unknown) => (e as { code?: string })?.code === "P2021" || /does not exist/i.test(String((e as Error)?.message));

const schema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("repondre"), id: z.string().min(1), texte: z.string().trim().min(1).max(4000) }),
  z.object({ action: z.literal("prendre_main"), id: z.string().min(1) }),
  z.object({ action: z.literal("rendre_main"), id: z.string().min(1) }),
]);

export async function GET(req: NextRequest) {
  if (!(await admin())) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const config = {
    automatique: whatsappAutomatique(), webhook: Boolean(process.env.WHATSAPP_VERIFY_TOKEN), signature: Boolean(process.env.WHATSAPP_APP_SECRET), ia: iaDisponible(),
    urlWebhook: `${(process.env.NEXT_PUBLIC_APP_URL ?? "https://www.shiftup.bj").replace(/\/$/, "")}/api/whatsapp/webhook`,
  };
  try {
    const id = req.nextUrl.searchParams.get("id");
    if (id) {
      const conv = await prisma.conversationWhatsApp.update({ where: { id }, data: { nonLus: 0 } });
      const [messages, client] = await Promise.all([
        prisma.messageWhatsApp.findMany({ where: { conversationId: id }, orderBy: { createdAt: "asc" }, take: 300 }),
        conv.userId ? prisma.user.findUnique({ where: { id: conv.userId }, select: { name: true, email: true } }) : null,
      ]);
      return NextResponse.json({ conversation: { ...conv, client }, messages, config });
    }
    const conversations = await prisma.conversationWhatsApp.findMany({
      orderBy: { dernierMessageLe: "desc" }, take: 100,
      include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
    });
    const clients = await prisma.user.findMany({ where: { id: { in: conversations.map((c) => c.userId).filter((x): x is string => Boolean(x)) } }, select: { id: true, name: true, email: true } });
    return NextResponse.json({
      conversations: conversations.map(({ messages, ...c }) => ({ ...c, dernier: messages[0] ?? null, client: clients.find((u) => u.id === c.userId) ?? null })),
      config,
    });
  } catch (e) {
    if (absentes(e)) return NextResponse.json({ indisponible: true, conversations: [], config });
    console.error("GET /api/admin/whatsapp", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await admin();
  if (!session) return NextResponse.json({ error: "Accès refusé." }, { status: 403 });
  const p = schema.safeParse(await req.json().catch(() => ({})));
  if (!p.success) return NextResponse.json({ error: p.error.issues[0]?.message ?? "Données invalides." }, { status: 422 });
  const a = p.data;
  try {
    if (a.action === "repondre") {
      const r = await repondreEquipe(a.id, a.texte);
      if (!r.ok) return NextResponse.json({ error: r.erreur }, { status: 409 });
      await prisma.auditLog.create({ data: { userId: session.user.id, action: "WHATSAPP_REPONSE_EQUIPE", entity: "ConversationWhatsApp", entityId: a.id } });
      return NextResponse.json({ ok: true, message: "Message envoyé." });
    }
    await prisma.conversationWhatsApp.update({ where: { id: a.id }, data: { humainJusquau: a.action === "prendre_main" ? new Date(Date.now() + 24 * 3600_000) : null } });
    return NextResponse.json({ ok: true, message: a.action === "prendre_main" ? "Vous avez la main : l'assistant ne répond plus pendant 24 h." : "L'assistant reprend la conversation." });
  } catch (e) {
    console.error("POST /api/admin/whatsapp", e);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
