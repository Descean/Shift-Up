/**
 * GET /api/faq — FAQs actives (public)
 */
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const faqs = await prisma.fAQ.findMany({
      where: { isActive: true },
      orderBy: [{ category: "asc" }, { order: "asc" }],
    });
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error("GET /api/faq error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
