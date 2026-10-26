/**
 * /api/whatsapp/webhook — Webhook de l'API WhatsApp Cloud (Meta)
 *
 * GET  : vérification lors de la configuration (hub.verify_token = WHATSAPP_VERIFY_TOKEN)
 * POST : messages reçus et statuts de remise. Signature vérifiée avec WHATSAPP_APP_SECRET.
 *        On répond 200 tout de suite ; le message est traité juste après (after) pour éviter
 *        que Meta ne renvoie la notification.
 */
import { NextRequest, NextResponse, after } from "next/server";
import { signatureMetaValide } from "@/lib/whatsapp";
import { majStatut, traiterMessage } from "@/lib/whatsapp-assistant";

export const maxDuration = 60;
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams;
  const attendu = process.env.WHATSAPP_VERIFY_TOKEN;
  if (attendu && q.get("hub.mode") === "subscribe" && q.get("hub.verify_token") === attendu) {
    return new NextResponse(q.get("hub.challenge") ?? "", { status: 200, headers: { "Content-Type": "text/plain" } });
  }
  return NextResponse.json({ error: "Vérification refusée." }, { status: 403 });
}

type Valeur = {
  contacts?: { wa_id: string; profile?: { name?: string } }[];
  messages?: {
    id: string; from: string; type: string;
    text?: { body?: string };
    interactive?: { button_reply?: { id: string; title: string }; list_reply?: { id: string; title: string } };
    button?: { payload?: string; text?: string };
    image?: { caption?: string }; document?: { caption?: string; filename?: string }; audio?: unknown; location?: unknown;
  }[];
  statuses?: { id: string; status: string }[];
};

export async function POST(req: NextRequest) {
  const brut = await req.text();
  if (!(await signatureMetaValide(brut, req.headers.get("x-hub-signature-256")))) {
    return NextResponse.json({ error: "Signature invalide." }, { status: 401 });
  }
  let corps: { entry?: { changes?: { value?: Valeur }[] }[] };
  try { corps = JSON.parse(brut); } catch { return NextResponse.json({ ok: true }); }

  const valeurs = (corps.entry ?? []).flatMap((e) => (e.changes ?? []).map((c) => c.value).filter(Boolean)) as Valeur[];
  after(async () => {
    for (const v of valeurs) {
      for (const s of v.statuses ?? []) await majStatut(s.id, s.status).catch((e) => console.error("[webhook] statut", e));
      for (const m of v.messages ?? []) {
        const nom = v.contacts?.find((c) => c.wa_id === m.from)?.profile?.name ?? null;
        const choix = m.interactive?.button_reply ?? m.interactive?.list_reply;
        const texte = m.text?.body ?? choix?.title ?? m.button?.text ?? m.image?.caption ?? m.document?.caption ?? (m.document ? `(document : ${m.document.filename ?? "fichier"})` : `(${m.type})`);
        try {
          await traiterMessage({ numero: m.from, nom, waId: m.id, texte, boutonId: choix?.id ?? m.button?.payload ?? null });
        } catch (e) {
          console.error("[webhook] message", e);
        }
      }
    }
  });
  return NextResponse.json({ ok: true });
}
