import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { z } from "zod";
import { rateLimit, getClientIp } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";

// trim AVANT min() : rejette les champs composés uniquement d'espaces
// .max() → .transform(trim) → .pipe(min) garantit l'ordre correct des validations
const t = (min: number, max: number, msg: string) =>
  z.string().max(max).transform((s) => s.trim()).pipe(z.string().min(min, msg));

const schema = z.object({
  formationId: z.string().min(1),
  prenom: t(2, 80, "Prénom requis"),
  nom: t(2, 80, "Nom requis"),
  email: z.string().email("Email invalide").transform((s) => s.trim().toLowerCase()),
  telephone: z.string().max(30).transform((s) => s.trim()).pipe(z.string().min(6, "Téléphone requis")),
  ville: z.string().min(1),
  structure: t(2, 120, "Structure requise"),
  poste: t(2, 120, "Poste requis"),
  secteur: z.string().min(1),
  attente: z.string().min(1),
  detail: z.string().max(1000).transform((s) => s.trim()).optional(),
  source: z.string().min(1),
  methodePaiement: z.enum(["MTN Mobile Money", "Moov / Flooz", "Wave", "Virement bancaire"]),
  typeInscription: z.enum(["COMPLET", "ACOMPTE"]).default("COMPLET"),
  captchaToken: z.string().optional(),
});

const ACOMPTE_MONTANT = 15_000;

function generateReference(): string {
  const year = new Date().getFullYear();
  const rand = Math.random().toString(36).slice(2, 7).toUpperCase();
  return `SU-FORM-${year}-${rand}`;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed, retryAfter } = await rateLimit(`inscription:${ip}`, { limit: 5, windowMs: 15 * 60 * 1000 });
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

    const formation = await prisma.formation.findUnique({
      where: { id: data.formationId, isActive: true },
      include: { _count: { select: { inscriptions: { where: { status: "PAIEMENT_CONFIRME" } } } } },
    });

    if (!formation) {
      return NextResponse.json({ error: "Formation introuvable." }, { status: 404 });
    }

    if (formation.placesMax - formation._count.inscriptions <= 0) {
      return NextResponse.json({ error: "Cette formation est complète." }, { status: 409 });
    }

    const existing = await prisma.formationInscription.findFirst({
      where: { formationId: data.formationId, email: data.email, status: "PAIEMENT_CONFIRME" },
    });
    if (existing) {
      return NextResponse.json({ error: "Une inscription confirmée existe déjà pour cet email." }, { status: 409 });
    }

    const reference = generateReference();
    const montantPaye = data.typeInscription === "ACOMPTE" ? ACOMPTE_MONTANT : formation.prixFCFA;

    // Créer l'inscription en attente de paiement
    const inscription = await prisma.formationInscription.create({
      data: {
        ...data,
        reference,
        detail: data.detail ?? null,
        typeInscription: data.typeInscription,
        montantPaye,
      },
    });

    // Créer la transaction FedaPay
    const isLive = process.env.FEDAPAY_ENVIRONMENT === "live";
    const apiBase = isLive
      ? "https://api.fedapay.com"
      : "https://sandbox-api.fedapay.com";
    const authHeader = {
      Authorization: `Bearer ${process.env.FEDAPAY_SECRET_KEY}`,
      "Content-Type": "application/json",
    };

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    const callbackUrl = `${appUrl}/api/formations/webhook/fedapay?inscriptionId=${inscription.id}`;

    const [firstName, ...lastParts] = `${data.prenom} ${data.nom}`.split(" ");
    const customer: Record<string, unknown> = {
      email: data.email,
      firstname: firstName,
      lastname: lastParts.join(" ") || firstName,
      phone_number: { number: data.telephone, country: "BJ" },
    };

    const txRes = await fetch(`${apiBase}/v1/transactions`, {
      method: "POST",
      headers: authHeader,
      body: JSON.stringify({
        description: data.typeInscription === "ACOMPTE"
          ? `Acompte réservation : ${formation.titre} — Réf. ${reference}`
          : `Formation : ${formation.titre} — Réf. ${reference}`,
        amount: montantPaye,
        currency: { iso: "XOF" },
        callback_url: callbackUrl,
        customer,
      }),
    });

    const txData = await txRes.json();

    if (!txRes.ok) {
      console.error("FedaPay create error:", JSON.stringify(txData));
      await prisma.formationInscription.delete({ where: { id: inscription.id } });
      return NextResponse.json({ error: "Erreur FedaPay : " + (txData.message ?? "réponse invalide") }, { status: 502 });
    }

    const tx = txData["v1/transaction"];
    const fedapayId = tx?.id;
    const checkoutUrl: string = tx?.payment_url ?? "";

    if (!fedapayId || !checkoutUrl) {
      console.error("FedaPay réponse incomplète:", JSON.stringify(txData));
      await prisma.formationInscription.delete({ where: { id: inscription.id } });
      return NextResponse.json({ error: "Réponse FedaPay incomplète." }, { status: 502 });
    }

    // Stocker la référence FedaPay dans l'inscription
    await prisma.formationInscription.update({
      where: { id: inscription.id },
      data: { transactionRef: String(fedapayId) },
    });

    return NextResponse.json({ inscriptionId: inscription.id, reference, checkoutUrl });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Données invalides." }, { status: 422 });
    }
    console.error("Inscription error:", err);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
