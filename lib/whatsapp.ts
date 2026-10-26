/**
 * lib/whatsapp.ts — Notifications WhatsApp
 *
 * Deux modes, utilisables ensemble :
 *  1. Liens « clic pour écrire » (wa.me) : gratuits, l'équipe envoie depuis son propre WhatsApp.
 *  2. Envoi automatique par l'API WhatsApp Cloud de Meta, actif seulement si les variables
 *     WHATSAPP_TOKEN et WHATSAPP_PHONE_NUMBER_ID sont définies sur Vercel. Les messages
 *     partent sous forme de modèles approuvés par Meta (voir MODELES_WHATSAPP ci-dessous).
 *     Le client doit avoir accepté de recevoir des messages WhatsApp (PreferenceNotification).
 *
 * Alertes de l'équipe : numéro(s) dans ADMIN_WHATSAPP (séparés par des virgules).
 */
import prisma from "@/lib/prisma";
import { numeroInternational } from "@/lib/whatsapp-lien";
export { lienWhatsApp, numeroInternational } from "@/lib/whatsapp-lien";

const API = (process.env.WHATSAPP_API_URL ?? "https://graph.facebook.com/v21.0").replace(/\/$/, "");
export const whatsappAutomatique = () => Boolean(process.env.WHATSAPP_TOKEN && process.env.WHATSAPP_PHONE_NUMBER_ID);
const LANGUE = process.env.WHATSAPP_LANGUE ?? "fr";
const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");

/**
 * Modèles à créer dans le Gestionnaire WhatsApp de Meta (catégorie « Utilité », langue français).
 * Le texte doit être recopié à l'identique ; {{1}}, {{2}}… sont remplis par le site.
 */
export const MODELES_WHATSAPP = {
  shiftup_devis: { variables: ["nom", "service", "lien"], texte: "Bonjour {{1}}, votre devis pour « {{2}} » est disponible dans votre espace SHIFT UP. Consultez-le ici : {{3}}" },
  shiftup_pieces: { variables: ["nom", "nombre", "avis", "dateLimite", "lien"], texte: "Bonjour {{1}}, il manque encore {{2}} pièce(s) à votre dossier pour l'avis {{3}} (date limite : {{4}}). Déposez-les dans votre espace : {{5}}" },
  shiftup_depot: { variables: ["nom", "avis", "date", "lien"], texte: "Bonjour {{1}}, votre offre pour l'avis {{2}} a été déposée le {{3}}. Le récépissé est dans votre espace : {{4}}" },
  shiftup_rappel_depot: { variables: ["nom", "avis", "dateLimite", "lien"], texte: "Bonjour {{1}}, rappel : votre offre pour l'avis {{2}} doit être déposée au plus tard le {{3}}. Après le dépôt, enregistrez-le ici : {{4}}" },
  shiftup_resultat: { variables: ["nom", "avis", "resultat", "lien"], texte: "Bonjour {{1}}, résultat de l'avis {{2}} : {{3}}. Détails dans votre espace : {{4}}" },
  shiftup_livrable: { variables: ["nom", "service", "lien"], texte: "Bonjour {{1}}, un document est disponible pour « {{2}} » dans votre espace SHIFT UP : {{3}}" },
  shiftup_veille: { variables: ["nom", "nombre", "lien"], texte: "Bonjour {{1}}, {{2}} nouvel(s) avis d'appel d'offres correspondent à vos critères de veille. Consultez-les ici : {{3}}" },
  shiftup_alerte_equipe: { variables: ["titre", "detail", "lien"], texte: "SHIFT UP — {{1}} : {{2}}. Ouvrir : {{3}}" },
} as const;
export type ModeleWhatsApp = keyof typeof MODELES_WHATSAPP;

type Resultat = { ok: boolean; ignore?: string; erreur?: string };

/** Envoi d'un modèle à un numéro (API Cloud). Sans configuration, ne fait rien. */
export async function envoyerModele(numero: string, modele: ModeleWhatsApp, valeurs: string[]): Promise<Resultat> {
  if (!whatsappAutomatique()) return { ok: false, ignore: "non configuré" };
  const to = numeroInternational(numero);
  if (!to) return { ok: false, ignore: "numéro invalide" };
  try {
    const r = await fetch(`${API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp", to, type: "template",
        template: {
          name: modele, language: { code: LANGUE },
          components: [{ type: "body", parameters: valeurs.map((v) => ({ type: "text", text: (v || "—").replace(/\s+/g, " ").slice(0, 900) })) }],
        },
      }),
      signal: AbortSignal.timeout(15000),
    });
    if (!r.ok) {
      const e = await r.text().catch(() => "");
      console.error("[whatsapp]", modele, r.status, e.slice(0, 500));
      return { ok: false, erreur: `HTTP ${r.status}` };
    }
    return { ok: true };
  } catch (e) {
    console.error("[whatsapp]", modele, e);
    return { ok: false, erreur: (e as Error).message };
  }
}

/** Préférence WhatsApp d'un utilisateur (null si la table n'existe pas encore ou s'il n'a pas accepté). */
export async function numeroWhatsAppAccepte(userId: string): Promise<string | null> {
  try {
    const p = await prisma.preferenceNotification.findUnique({ where: { userId } });
    return p?.whatsapp && p.numero ? p.numero : null;
  } catch {
    return null;
  }
}

/** Notifie un client sur WhatsApp s'il l'a accepté et si l'envoi automatique est configuré. */
export async function notifierClientWhatsApp(userId: string, modele: ModeleWhatsApp, valeurs: string[]): Promise<Resultat> {
  if (!whatsappAutomatique()) return { ok: false, ignore: "non configuré" };
  const numero = await numeroWhatsAppAccepte(userId);
  if (!numero) return { ok: false, ignore: "pas d'accord du client" };
  return envoyerModele(numero, modele, valeurs);
}

/** Alerte l'équipe SHIFT UP (numéros ADMIN_WHATSAPP). */
export async function alerterEquipeWhatsApp(titre: string, detail: string, chemin = "/dashboard/admin/prestations") {
  const numeros = (process.env.ADMIN_WHATSAPP ?? "").split(",").map((x) => x.trim()).filter(Boolean);
  if (!whatsappAutomatique() || !numeros.length) return [];
  return Promise.all(numeros.map((n) => envoyerModele(n, "shiftup_alerte_equipe", [titre, detail, `${APP_URL}${chemin}`])));
}

export const lienEspaceClient = (chemin = "/dashboard/client/prestations") => `${APP_URL}${chemin}`;

// ─── Messages libres (fenêtre de 24 h après un message du client) ────────────

type Envoi = { ok: boolean; id?: string; erreur?: string };

async function appelMessages(corps: Record<string, unknown>): Promise<Envoi> {
  if (!whatsappAutomatique()) return { ok: false, erreur: "non configuré" };
  try {
    const r = await fetch(`${API}/${process.env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.WHATSAPP_TOKEN}`, "Content-Type": "application/json" },
      body: JSON.stringify({ messaging_product: "whatsapp", ...corps }),
      signal: AbortSignal.timeout(15000),
    });
    const d = (await r.json().catch(() => ({}))) as { messages?: { id: string }[]; error?: { message?: string } };
    if (!r.ok) { console.error("[whatsapp] envoi", r.status, JSON.stringify(d).slice(0, 400)); return { ok: false, erreur: d.error?.message ?? `HTTP ${r.status}` }; }
    return { ok: true, id: d.messages?.[0]?.id };
  } catch (e) {
    return { ok: false, erreur: (e as Error).message };
  }
}

const court = (t: string, n: number) => (t.length > n ? `${t.slice(0, n - 1)}…` : t);
/** Réponse dans une conversation : on écrit exactement au numéro WhatsApp qui a envoyé le message. */
const exact = (numero: string) => numero.replace(/\D/g, "");

export function envoyerTexte(numero: string, texte: string) {
  return appelMessages({ to: exact(numero), type: "text", text: { body: court(texte, 4000), preview_url: true } });
}

/** Jusqu'à 3 boutons (titre de 20 caractères au plus). */
export function envoyerBoutons(numero: string, texte: string, boutons: { id: string; titre: string }[]) {
  return appelMessages({
    to: exact(numero), type: "interactive",
    interactive: { type: "button", body: { text: court(texte, 1000) }, action: { buttons: boutons.slice(0, 3).map((b) => ({ type: "reply", reply: { id: b.id, title: court(b.titre, 20) } })) } },
  });
}

/** Liste déroulante : 10 lignes au plus. */
export function envoyerListe(numero: string, texte: string, bouton: string, lignes: { id: string; titre: string; description?: string }[]) {
  return appelMessages({
    to: exact(numero), type: "interactive",
    interactive: {
      type: "list", body: { text: court(texte, 1000) },
      action: { button: court(bouton, 20), sections: [{ title: "SHIFT UP", rows: lignes.slice(0, 10).map((l) => ({ id: l.id, title: court(l.titre, 24), ...(l.description ? { description: court(l.description, 72) } : {}) })) }] },
    },
  });
}

export function marquerLu(waId: string) {
  return appelMessages({ status: "read", message_id: waId });
}

/** Signature Meta (en-tête X-Hub-Signature-256) ; vérifiée si WHATSAPP_APP_SECRET est défini. */
export async function signatureMetaValide(brut: string, entete: string | null) {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret) return true;
  if (!entete?.startsWith("sha256=")) return false;
  const { createHmac, timingSafeEqual } = await import("crypto");
  const attendu = Buffer.from(`sha256=${createHmac("sha256", secret).update(brut).digest("hex")}`);
  const recu = Buffer.from(entete);
  return attendu.length === recu.length && timingSafeEqual(attendu, recu);
}
