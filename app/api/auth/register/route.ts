import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { generateAffiliationCode } from "@/lib/utils";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";

const schema = z.object({
  name: z.string().refine((s) => s.trim().length >= 2, { message: "Nom requis (min. 2 caractères)" }),
  email: z.string().email().transform((s) => s.trim().toLowerCase()),
  password: z.string().min(8),
  captchaToken: z.string().optional(),
  phone: z.string().optional(),
  role: z.enum(["CLIENT", "APPORTEUR", "ETUDIANT"]),
  affiliationCode: z.string().optional(),
  ifu: z.string().optional(),
  companyName: z.string().optional(),
  rccm: z.string().optional(),
  cnss: z.string().optional(),
  rib: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = rateLimit(`register:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
  if (!allowed) {
    return NextResponse.json(
      { error: "Trop de tentatives. Réessayez plus tard." },
      { status: 429, headers: { "Retry-After": String(retryAfter) } }
    );
  }

  try {
    const body = await req.json();
    const data = schema.parse(body);

    if (!(await verifyCaptcha(data.captchaToken))) {
      return NextResponse.json({ error: "Vérification captcha échouée." }, { status: 403 });
    }

    // Check if email already exists
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      return NextResponse.json({ error: "Cette adresse email est déjà utilisée." }, { status: 400 });
    }

    // Validate IFU for apporteur
    if (data.role === "APPORTEUR" && !data.ifu) {
      return NextResponse.json({ error: "L'IFU est requis pour les apporteurs d'affaires." }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(data.password, 12);
    const affiliationCode = generateAffiliationCode();

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone,
        role: data.role as any,
        affiliationCode,
      },
    });

    // Create role-specific profile
    if (data.role === "CLIENT") {
      await prisma.clientProfile.create({
        data: {
          userId: user.id,
          affiliatedBy: data.affiliationCode || null,
          companyName: data.companyName || null,
          rccm: data.rccm || null,
          ifu: data.ifu || null,
          cnss: data.cnss || null,
          rib: data.rib || null,
        },
      });
    } else if (data.role === "APPORTEUR") {
      await prisma.apporteurProfile.create({
        data: { userId: user.id, ifu: data.ifu! },
      });
    } else if (data.role === "ETUDIANT") {
      await prisma.etudiantProfile.create({
        data: { userId: user.id },
      });
    }

    // Audit log
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: "REGISTER",
        entity: "User",
        entityId: user.id,
        details: { role: data.role, email: data.email },
        ipAddress: req.headers.get("x-forwarded-for") || "",
      },
    });

    return NextResponse.json({ success: true, userId: user.id }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides.", details: error.errors }, { status: 422 });
    }
    console.error("Register error:", error);
    return NextResponse.json({ error: "Erreur serveur. Réessayez." }, { status: 500 });
  }
}
