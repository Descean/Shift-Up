/**
 * POST /api/apporteur-services/lead — Enregistrement public d'une demande
 * pour un service créé par un apporteur d'affaires.
 *
 * Ne déclenche aucun paiement : crée une commande "EN_ATTENTE" que l'apporteur
 * doit ensuite qualifier (tarif définitif) depuis "Mes Services" avant de
 * générer un lien de paiement FedaPay.
 */

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { nameSchema, emailSchema, phoneSchema, freeTextSchema } from "@/lib/validation";
import { sendApporteurServiceLeadClient, sendApporteurServiceLeadOwner } from "@/lib/email";

const COMMISSION_RATE = 0.10;

const schema = z.object({
  serviceId: z.string().min(1),
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema,
  brief: freeTextSchema(0, 1000).optional().or(z.literal("")),
  captchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = rateLimit(`apporteur-service-lead:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez dans quelques minutes." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (!(await verifyCaptcha(data.captchaToken))) {
      return NextResponse.json({ error: "Vérification captcha échouée." }, { status: 403 });
    }

    const service = await prisma.apporteurService.findFirst({
      where: { id: data.serviceId, isApproved: true, isActive: true },
      include: { apporteur: { select: { name: true, email: true } } },
    });

    if (!service) {
      return NextResponse.json({ error: "Service introuvable ou indisponible." }, { status: 404 });
    }

    const amount = service.priceMin;
    const commission = amount * COMMISSION_RATE;
    const apporteurRevenue = amount - commission;

    const order = await prisma.apporteurServiceOrder.create({
      data: {
        serviceId: service.id,
        clientName: data.name,
        clientEmail: data.email,
        clientPhone: data.phone,
        brief: data.brief || null,
        amount,
        commission,
        apporteurRevenue,
        status: "EN_ATTENTE",
      },
    });

    await Promise.allSettled([
      sendApporteurServiceLeadClient({ to: data.email, name: data.name, serviceTitle: service.title }),
      sendApporteurServiceLeadOwner({
        to: service.apporteur.email,
        apporteurName: service.apporteur.name ?? "Partenaire SHIFT UP",
        serviceTitle: service.title,
        clientName: data.name,
        clientEmail: data.email,
        clientPhone: data.phone,
        brief: data.brief || null,
      }),
    ]);

    return NextResponse.json({ orderId: order.id }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("POST /api/apporteur-services/lead error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
