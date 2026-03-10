import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import prisma from "@/lib/prisma";

const SHIFT_UP_CONTEXT = `
Tu es l'assistant IA officiel de SHIFT UP, un cabinet de conseil stratégique et solutions numériques basé à Abomey-Calavi, Bénin.

IDENTITÉ DE L'ENTREPRISE :
- Nom : SHIFT UP
- Dirigeant : Jean-Eudes MÈTOGBÉ GNANCADJA
- Slogan : Excellence • Innovation • Performance
- Sous-titre : Transforming Business, Shaping Future
- RCCM : RB/ABC/25 A 124734
- IFU : 0202113434116
- Adresse : Abomey-Calavi, Atlantique, Bénin
- Email : shiftup.eudes@gmail.com
- Tél : (+229) 01 95 03 50 99
- Site : shiftup.bj

SERVICES (6 domaines) :
1. Conseil Stratégique : Diagnostic, Business Plan (350 000+ FCFA), Stratégie de croissance (500 000+ FCFA)
2. Solutions Numériques : Sites web (300 000+ FCFA), Applications web/SaaS (1 500 000+ FCFA), Applications mobiles (1 000 000+ FCFA), Intégration IA
3. Formation & Coaching : Formations (75 000+ FCFA/pers.), Coaching dirigeant (150 000/mois), E-Learning (25 000/mois)
4. Marketing Digital : Audit stratégique (150 000+ FCFA), Gestion réseaux sociaux (100 000/mois), SEO & Pub (200 000/mois)
5. Juridique & Fiscal : Création entreprise (100 000+ FCFA), Conformité OHADA, Contrats (50 000+ FCFA)
6. Finance & Comptabilité : Plan financier (200 000+ FCFA), Levée de fonds, Comptabilité externalisée (75 000/mois)

PAIEMENT : Acompte 40% à la souscription, solde à la livraison. MTN Mobile Money, Moov, Visa/Mastercard.

TON RÔLE : Accueillir chaleureusement les visiteurs, comprendre leurs besoins, présenter les services appropriés, et les encourager à s'inscrire ou prendre un RDV. Sois professionnel, bienveillant et orienté solutions. Réponds TOUJOURS en français sauf si l'utilisateur écrit en anglais. Sois concis (max 3-4 phrases par réponse).
`;

export async function POST(req: NextRequest) {
  try {
    const { messages, sessionId, page } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages requis" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GOOGLE_AI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    // Build conversation history for Gemini
    const history = messages.slice(0, -1).map((m: { role: string; content: string }) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: SHIFT_UP_CONTEXT }] },
        { role: "model", parts: [{ text: "Compris ! Je suis l'assistant SHIFT UP, prêt à aider vos visiteurs." }] },
        ...history,
      ],
      generationConfig: {
        maxOutputTokens: 400,
        temperature: 0.7,
      },
    });

    const lastMessage = messages[messages.length - 1]?.content;
    const result = await chat.sendMessage(lastMessage);
    const response = result.response.text();

    // Save to database for analytics
    if (sessionId) {
      try {
        await prisma.chatMessage.createMany({
          data: [
            { sessionId, role: "user", content: lastMessage },
            { sessionId, role: "assistant", content: response },
          ],
        });
      } catch { /* ignore DB errors */ }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Je rencontre une difficulté technique. Contactez-nous directement au (+229) 01 95 03 50 99." },
      { status: 500 }
    );
  }
}

// Create a new chat session
export async function GET(req: NextRequest) {
  try {
    const session = await prisma.chatSession.create({
      data: {
        page: req.nextUrl.searchParams.get("page") || "/",
        visitorId: req.nextUrl.searchParams.get("visitorId") || undefined,
      },
    });
    return NextResponse.json({ sessionId: session.id });
  } catch {
    return NextResponse.json({ sessionId: null });
  }
}
