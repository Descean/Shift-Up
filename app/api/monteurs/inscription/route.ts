/**
 * POST /api/monteurs/inscription — Demande de compte monteur indépendant (page « Devenir monteur »).
 * Le compte est créé en attente ; la Direction l'active depuis son espace.
 */
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/lib/prisma";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";
import { isSafe } from "@/lib/validation";
import { generateAffiliationCode } from "@/lib/utils";
import { sendAlerteDirection, sendMonteurCandidat } from "@/lib/email";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";

const schema = z.object({
  nom: z.string().trim().min(2, "Indiquez votre nom.").max(120).refine(isSafe),
  email: z.string().trim().toLowerCase().email("Adresse e-mail invalide.").max(200),
  telephone: z.string().trim().min(8, "Indiquez votre téléphone.").max(30),
  ville: z.string().trim().max(80).refine(isSafe).optional().default(""),
  experience: z.string().trim().max(80).optional().default(""),
  specialites: z.array(z.enum(["cotation", "trp", "dao"])).max(3).default([]),
  presentation: z.string().trim().max(1500).refine(isSafe, "Contenu non autorisé.").optional().default(""),
  captchaToken: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const { allowed } = await rateLimit(`monteur:${getClientIp(req)}`, { limit: 4, windowMs: 60 * 60 * 1000 });
  if (!allowed) return NextResponse.json({ error: "Trop de demandes. Réessayez plus tard." }, { status: 429 });
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Vérifiez le formulaire." }, { status: 422 });
  const d = parsed.data;
  if (!(await verifyCaptcha(d.captchaToken))) return NextResponse.json({ error: "Vérification anti-robot échouée. Réessayez." }, { status: 403 });

  if (await prisma.user.findUnique({ where: { email: d.email }, select: { id: true } })) {
    return NextResponse.json({ error: "Cette adresse a déjà un compte sur SHIFT UP. Utilisez une autre adresse ou écrivez-nous à contact@shiftup.bj." }, { status: 409 });
  }
  try {
    const user = await prisma.user.create({ data: { name: d.nom, email: d.email, phone: d.telephone, role: "MONTEUR", affiliationCode: generateAffiliationCode() } });
    await prisma.monteurProfil.create({
      data: { userId: user.id, statut: "EN_ATTENTE", type: "INDEPENDANT", telephone: d.telephone, ville: d.ville || null, experience: d.experience || null, specialites: d.specialites, presentation: d.presentation || null },
    });
    await Promise.allSettled([
      sendMonteurCandidat({ to: d.email, name: d.nom }),
      sendAlerteDirection({ titre: "Nouvelle demande de compte monteur", lignes: [["Nom", d.nom], ["E-mail", d.email], ["Téléphone", d.telephone], ["Ville", d.ville || "—"], ["Expérience", d.experience || "—"], ["Dossiers", d.specialites.join(", ") || "—"], ["Présentation", d.presentation || "—"]] }),
      alerterEquipeWhatsApp("Candidature monteur", `${d.nom} — ${d.telephone}`),
    ]);
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (e) {
    console.error("[monteurs/inscription]", e);
    return NextResponse.json({ error: "Inscription impossible pour le moment. Réessayez ou écrivez à contact@shiftup.bj." }, { status: 500 });
  }
}
