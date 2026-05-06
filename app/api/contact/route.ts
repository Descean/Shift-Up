import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(3),
  service: z.string().optional(),
  message: z.string().min(20),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const data = schema.parse(body);

    // Save to database
    await prisma.contactMessage.create({ data });

    // Send email notification (using Resend or Nodemailer)
    try {
      await sendContactEmail(data);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, message: "Message envoyé avec succès." });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("Contact error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}

async function sendContactEmail(data: { name: string; email: string; subject: string; message: string; service?: string }) {
  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: process.env.EMAIL_FROM!,
    to: "contact@shiftup.bj",
    subject: `[SHIFT UP] Nouveau message : ${data.subject}`,
    html: `
      <div style="font-family: 'Space Grotesk', sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0A2533; padding: 30px; border-radius: 16px 16px 0 0;">
          <h1 style="color: white; font-size: 24px; margin: 0;">Nouveau message de contact</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Nom :</td><td style="padding: 8px 0; font-weight: 600;">${data.name}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Email :</td><td style="padding: 8px 0; font-weight: 600;">${data.email}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Service :</td><td style="padding: 8px 0;">${data.service || "Non précisé"}</td></tr>
            <tr><td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Objet :</td><td style="padding: 8px 0; font-weight: 600;">${data.subject}</td></tr>
          </table>
          <div style="margin-top: 20px; padding: 15px; background: #f9fafb; border-radius: 12px;">
            <p style="color: #374151; line-height: 1.6; margin: 0;">${data.message.replace(/\n/g, "<br>")}</p>
          </div>
        </div>
      </div>
    `,
  });
}
