/**
 * GET/PUT /api/notifications/preferences — Accord du client pour recevoir des messages WhatsApp.
 */
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { numeroInternational } from "@/lib/whatsapp-lien";
import { whatsappAutomatique } from "@/lib/whatsapp";

const schema = z.object({ whatsapp: z.boolean(), numero: z.string().trim().max(30).optional().nullable() });

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  try {
    const p = await prisma.preferenceNotification.findUnique({ where: { userId: session.user.id } });
    const u = await prisma.user.findUnique({ where: { id: session.user.id }, select: { phone: true } });
    return NextResponse.json({ whatsapp: p?.whatsapp ?? false, numero: p?.numero ?? u?.phone ?? "", automatique: whatsappAutomatique() });
  } catch {
    return NextResponse.json({ whatsapp: false, numero: "", automatique: false, indisponible: true });
  }
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: "Données invalides." }, { status: 422 });
  const numero = parsed.data.numero ? numeroInternational(parsed.data.numero) : null;
  if (parsed.data.whatsapp && !numero) return NextResponse.json({ error: "Numéro WhatsApp invalide (ex. 01 97 00 00 00 ou +229 01 97 00 00 00)." }, { status: 422 });
  try {
    const data = { whatsapp: parsed.data.whatsapp, numero: numero ? `+${numero}` : null, consentLe: parsed.data.whatsapp ? new Date() : null };
    const p = await prisma.preferenceNotification.upsert({ where: { userId: session.user.id }, update: data, create: { userId: session.user.id, ...data } });
    await prisma.auditLog.create({ data: { userId: session.user.id, action: parsed.data.whatsapp ? "WHATSAPP_ACCEPTE" : "WHATSAPP_REFUSE", entity: "PreferenceNotification", entityId: p.id } });
    return NextResponse.json({ whatsapp: p.whatsapp, numero: p.numero, message: p.whatsapp ? "Notifications WhatsApp activées." : "Notifications WhatsApp désactivées." });
  } catch {
    return NextResponse.json({ error: "Préférences indisponibles pour le moment." }, { status: 503 });
  }
}
