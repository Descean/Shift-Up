import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  email: z.string().email(),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = schema.parse(body);

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (!existing.isActive) {
        await prisma.newsletterSubscriber.update({ where: { email }, data: { isActive: true } });
        return NextResponse.json({ message: "Vous êtes de nouveau abonné(e) !" });
      }
      return NextResponse.json({ message: "Vous êtes déjà abonné(e) à notre newsletter." });
    }

    await prisma.newsletterSubscriber.create({ data: { email, name } });

    // Optional: Sync with Brevo/Sendinblue
    if (process.env.BREVO_API_KEY) {
      try {
        await syncToBrevo(email, name);
      } catch (e) {
        console.error("Brevo sync failed:", e);
      }
    }

    return NextResponse.json({ success: true, message: "Inscription réussie ! Merci de rejoindre la communauté SHIFT UP." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Email invalide." }, { status: 422 });
    }
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

async function syncToBrevo(email: string, name?: string) {
  await fetch("https://api.brevo.com/v3/contacts", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "api-key": process.env.BREVO_API_KEY!,
    },
    body: JSON.stringify({
      email,
      attributes: { FIRSTNAME: name || "" },
      listIds: [Number(process.env.BREVO_LIST_ID)],
      updateEnabled: true,
    }),
  });
}
