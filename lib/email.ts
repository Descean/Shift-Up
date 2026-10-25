/**
 * lib/email.ts — Utilitaire d'envoi d'emails via Resend
 *
 * Toutes les notifications transactionnelles de SHIFT UP passent ici.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "SHIFT UP <noreply@shiftup.bj>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.shiftup.bj";
/** Adresse(s) qui reçoivent les alertes « prestations » (séparées par des virgules). */
const ADMIN_DEST = (process.env.ADMIN_EMAIL || "jgnancadja@gmail.com").split(",").map((e) => e.trim()).filter(Boolean);
/** Adresse de réponse des courriels envoyés aux clients. */
const REPONSE = "contact@shiftup.bj";

// ─── Templates HTML partagés ─────────────────────────────────────────────────

function baseLayout(content: string, title: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>${title}</title></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#0A2533;border-radius:16px 16px 0 0;padding:32px;text-align:center;">
          <div style="font-family:'Segoe UI',sans-serif;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">SHIFT UP</div>
          <div style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Excellence • Innovation</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:40px 32px;border-radius:0 0 16px 16px;">
          ${content}
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
          <p style="font-size:12px;color:#999;text-align:center;margin:0;">
            SHIFT UP — Votre partenaire digital au Bénin<br/>
            <a href="${APP_URL}" style="color:#2D5B78;text-decoration:none;">${APP_URL}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:#0A2533;color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin:16px 0;">${label}</a>`;
}

// ─── Emails client ────────────────────────────────────────────────────────────

/** Confirmation de réception de la demande */
export async function sendDemandeConfirmation({ to, name, serviceName, prestationId, piecesAFournir = 0 }: {
  to: string; name: string; serviceName: string; prestationId: string; piecesAFournir?: number;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Votre demande a bien été reçue ✅</h2>
    <p style="color:#555;margin:0 0 20px;">Bonjour <strong>${esc(name)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Nous avons bien reçu votre demande pour <strong>${esc(serviceName)}</strong>. Notre équipe va l'analyser et vous envoyer un devis personnalisé sous <strong>48h ouvrées</strong>.</p>
    <div style="background:#EFF4F7;border:1px solid #BACFDC;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#2D5B78;font-size:14px;"><strong>Référence demande :</strong> ${prestationId.slice(-8).toUpperCase()}</p>
    </div>
    ${blocPieces(piecesAFournir)}
    <p style="color:#555;">Vous pouvez suivre l'état de votre demande depuis votre dashboard :</p>
    ${btn("Suivre ma demande →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#555;line-height:1.6;margin-top:20px;">Si vous avez des questions, répondez simplement à cet email.<br/>Merci de votre confiance.</p>
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `Votre demande "${serviceName}" a été reçue — SHIFT UP`, html: baseLayout(content, "Demande reçue") });
}

/** Notification admin : nouvelle demande */
export async function sendNewDemandeAdmin({ clientName, clientEmail, serviceName, brief, prestationId, urgence = null, conflits = [] }: {
  clientName: string; clientEmail: string; serviceName: string; brief: string; prestationId: string; urgence?: string | null; conflits?: string[];
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 16px;">🔔 Nouvelle demande de prestation</h2>
    ${urgence ? `<div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:12px 16px;margin:0 0 16px;color:#991b1b;font-weight:700;">⚠ Dépôt de l'offre : ${esc(urgence)}</div>` : ""}
    ${conflits.length ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px 16px;margin:0 0 16px;color:#9a3412;"><strong>Même avis déjà suivi pour :</strong><ul style="margin:6px 0 0;padding-left:18px;">${conflits.map((c) => `<li>${esc(c)}</li>`).join("")}</ul><p style="margin:6px 0 0;font-size:13px;">Vérifiez les lots : deux offres liées sur un même lot peuvent être écartées.</p></div>` : ""}
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Client</td><td style="padding:8px 0;font-weight:600;color:#333;">${esc(clientName)} (${esc(clientEmail)})</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Service</td><td style="padding:8px 0;font-weight:600;color:#333;">${esc(serviceName)}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Référence</td><td style="padding:8px 0;color:#333;">${esc(prestationId.slice(-8).toUpperCase())}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;vertical-align:top;">Besoin exprimé</td><td style="padding:8px 0;color:#333;line-height:1.5;white-space:pre-wrap;">${esc(brief || "Non renseigné")}</td></tr>
    </table>
    ${btn("Traiter la demande →", `${APP_URL}/dashboard/admin/prestations`)}`;
  return resend.emails.send({ from: FROM, to: ADMIN_DEST, replyTo: clientEmail, subject: `[SHIFT UP] ${urgence ? `URGENT (${urgence}) — ` : ""}${conflits.length ? "MÊME AVIS — " : ""}Nouvelle demande — ${clientName} — ${serviceName}`, html: baseLayout(content, "Nouvelle demande") });
}

/** Notification client : devis envoyé */
export async function sendDevisClient({ to, name, serviceName, depositAmount, prestationId }: {
  to: string; name: string; serviceName: string; depositAmount: number; prestationId: string;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Votre devis est prêt 📋</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(name)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Notre équipe a analysé votre demande pour <strong>${esc(serviceName)}</strong> et vous a préparé un devis détaillé accompagné d'un plan de réalisation.</p>
    <div style="background:#eff6ff;border:1px solid #3b82f6;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#2D5B78;font-weight:700;">Acompte requis pour démarrer</p>
      <p style="margin:0;color:#2D5B78;font-size:24px;font-weight:900;">${depositAmount.toLocaleString("fr-FR")} XOF</p>
    </div>
    <p style="color:#555;">Consultez votre devis : vous pouvez l'accepter et payer l'acompte, demander une modification ou le refuser.</p>
    ${btn("Voir mon devis →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#888;font-size:13px;margin-top:16px;">Le devis est valable 7 jours. Passé ce délai, merci de nous recontacter.</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `Votre devis "${serviceName}" est disponible — SHIFT UP`, html: baseLayout(content, "Devis disponible") });
}

/** Notification client : livrable disponible */
export async function sendLivrableClient({ to, name, livrableTitle, serviceName, apresSolde = false }: {
  to: string; name: string; livrableTitle: string; serviceName: string; apresSolde?: boolean;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Un livrable est disponible 📦</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(name)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Un nouveau livrable <strong>"${esc(livrableTitle)}"</strong> est disponible pour votre projet <strong>${esc(serviceName)}</strong>.</p>
    ${apresSolde ? `<p style="color:#555;line-height:1.6;">Il sera téléchargeable dès le règlement du solde, depuis votre espace client.</p>` : ""}
    ${btn(apresSolde ? "Voir et régler le solde →" : "Accéder au livrable →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#555;line-height:1.6;margin-top:16px;">N'hésitez pas à nous faire part de vos retours depuis votre dashboard.</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `Livrable disponible — ${serviceName} — SHIFT UP`, html: baseLayout(content, "Livrable disponible") });
}

/** Notification admin : observation client sur un livrable */
export async function sendObservationAdmin({ to, clientName, serviceName, livrableTitle, observation, voiceNoteUrl, prestationId }: {
  to: string; clientName: string; serviceName: string; livrableTitle: string; observation: string; voiceNoteUrl?: string | null; prestationId: string;
}) {
  const voiceSection = voiceNoteUrl
    ? `<div style="background:#EFF4F7;border:1px solid #BACFDC;border-radius:8px;padding:12px 16px;margin:16px 0;"><p style="margin:0 0 4px;color:#0A2533;font-weight:600;font-size:13px;">🎙️ Note vocale jointe</p><a href="${voiceNoteUrl}" style="color:#2D5B78;word-break:break-all;font-size:13px;">${voiceNoteUrl}</a></div>`
    : "";
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 8px;">📋 Nouvelle observation client</h2>
    <p style="color:#555;margin:0 0 16px;">Le client <strong>${esc(clientName)}</strong> a soumis une observation sur son projet <strong>${esc(serviceName)}</strong>.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:0 0 16px;">
      <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Livrable concerné</p>
      <p style="margin:0;color:#0A2533;font-weight:700;">${esc(livrableTitle)}</p>
    </div>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:0 0 16px;">
      <p style="margin:0 0 6px;color:#9a3412;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Observation</p>
      <p style="margin:0;color:#333;white-space:pre-wrap;line-height:1.6;">${esc(observation)}</p>
    </div>
    ${voiceSection}
    ${btn("Voir dans les messages →", `${APP_URL}/dashboard/admin/messages`)}`;
  return resend.emails.send({ from: FROM, to, subject: `Observation client — ${serviceName} — SHIFT UP`, html: baseLayout(content, "Observation client") });
}

/** Destinataires des alertes prestations (utilisé aussi par les routes). */
export function destinatairesAdmin() {
  return ADMIN_DEST;
}

/** Demande déposée sans compte : lien pour créer le mot de passe de l'espace client. */
export async function sendActivationCompte({ to, name, serviceName, prestationId, lien, piecesAFournir = 0 }: {
  to: string; name: string; serviceName: string; prestationId: string; lien: string; piecesAFournir?: number;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Votre demande a bien été reçue ✅</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(name)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Nous avons bien reçu votre demande pour <strong>${esc(serviceName)}</strong> (référence <strong>${esc(prestationId.slice(-8).toUpperCase())}</strong>). Vous recevrez notre devis sous <strong>48 h ouvrées</strong>.</p>
    <p style="color:#555;line-height:1.6;">Un espace client a été ouvert à votre nom : vous y suivrez le devis, les paiements et les livrables. Choisissez votre mot de passe pour l'activer :</p>
    ${btn("Activer mon espace client →", lien)}
    <p style="color:#888;font-size:13px;margin-top:8px;">Ce lien est valable 7 jours. Passé ce délai, utilisez « Mot de passe oublié » sur la page de connexion.</p>
    ${blocPieces(piecesAFournir)}
    <p style="color:#555;line-height:1.6;margin-top:16px;">Pour toute question, répondez simplement à ce courriel.</p>
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `Votre demande "${serviceName}" a été reçue — SHIFT UP`, html: baseLayout(content, "Demande reçue") });
}

function blocPieces(n: number) {
  if (!n) return "";
  return `<div style="background:#EFF4F7;border:1px solid #BACFDC;border-radius:10px;padding:16px;margin:20px 0;color:#0A2533;line-height:1.6;">
      <strong>Pièces à fournir :</strong> ${n} document(s) sont listés dans votre espace client (DAO, pièces administratives, financières et techniques).
      Déposez dès maintenant ceux dont vous disposez : le montage pourra commencer plus vite.</div>`;
}

function liste(items: string[]) {
  return `<ul style="margin:0 0 16px;padding-left:20px;color:#333;line-height:1.7;">${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
}

/** Alerte admin : le client a déposé des pièces (envoyée quand il clique « Prévenir SHIFT UP »). */
export async function sendPiecesDeposeesAdmin({ clientName, clientEmail, serviceName, prestationId, recues, indisponibles, message }: {
  clientName: string; clientEmail: string; serviceName: string; prestationId: string;
  recues: string[]; indisponibles: { libelle: string; commentaire?: string | null }[]; message?: string | null;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 12px;">📎 Pièces déposées par le client</h2>
    <p style="color:#555;margin:0 0 12px;">Client : <strong>${esc(clientName)}</strong> (${esc(clientEmail)})<br/>Prestation : <strong>${esc(serviceName)}</strong> — réf. ${esc(prestationId.slice(-8).toUpperCase())}</p>
    ${recues.length ? `<p style="margin:0 0 6px;color:#0A2533;font-weight:700;">À vérifier (${recues.length})</p>${liste(recues.map((r) => esc(r)))}` : ""}
    ${indisponibles.length ? `<p style="margin:0 0 6px;color:#9a3412;font-weight:700;">Signalées non disponibles (${indisponibles.length})</p>${liste(indisponibles.map((i) => `${esc(i.libelle)}${i.commentaire ? ` — <em>${esc(i.commentaire)}</em>` : ""}`))}` : ""}
    ${message ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:0 0 16px;"><p style="margin:0 0 6px;color:#9a3412;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Message du client</p><p style="margin:0;color:#333;white-space:pre-wrap;line-height:1.6;">${esc(message)}</p></div>` : ""}
    ${btn("Vérifier les pièces →", `${APP_URL}/dashboard/admin/prestations`)}`;
  return resend.emails.send({ from: FROM, to: ADMIN_DEST, replyTo: clientEmail, subject: `[SHIFT UP] Pièces déposées — ${clientName} — ${serviceName}`, html: baseLayout(content, "Pièces déposées") });
}

/** Client : point sur les pièces (à fournir, à reprendre), envoyé par l'admin. */
export async function sendPiecesClient({ to, name, serviceName, aFournir, aReprendre, message, dateLimite }: {
  to: string; name: string; serviceName: string; aFournir: string[]; aReprendre: { libelle: string; commentaire?: string | null }[];
  message?: string | null; dateLimite?: string | null;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Pièces à fournir pour votre dossier</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(name)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Pour avancer sur <strong>${esc(serviceName)}</strong>, nous avons besoin des documents ci-dessous.${dateLimite ? ` Date limite de dépôt de l'offre : <strong>${esc(dateLimite)}</strong>.` : ""}</p>
    ${message ? `<p style="color:#333;line-height:1.6;white-space:pre-wrap;background:#f8fafc;border-radius:10px;padding:14px 18px;">${esc(message)}</p>` : ""}
    ${aReprendre.length ? `<p style="margin:0 0 6px;color:#9a3412;font-weight:700;">À reprendre (${aReprendre.length})</p>${liste(aReprendre.map((i) => `${esc(i.libelle)}${i.commentaire ? ` — <em>${esc(i.commentaire)}</em>` : ""}`))}` : ""}
    ${aFournir.length ? `<p style="margin:0 0 6px;color:#0A2533;font-weight:700;">Encore à fournir (${aFournir.length})</p>${liste(aFournir.map((a) => esc(a)))}` : ""}
    <p style="color:#555;line-height:1.6;">Déposez-les directement dans votre espace client. Si vous n'avez pas une pièce, indiquez-le : nous vous dirons comment l'obtenir ou la remplacer.</p>
    ${btn("Déposer mes pièces →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `Pièces à fournir — ${serviceName} — SHIFT UP`, html: baseLayout(content, "Pièces à fournir") });
}

// ─── Montage de dossiers : dépôt, résultat, rappels ──────────────────────────

const ref = (id: string) => esc(id.slice(-8).toUpperCase());

/** Client : SHIFT UP a déposé l'offre (récépissé joint au lien). */
export async function sendDepotClient({ to, name, serviceName, avis, deposeLe, numero, lienRecepisse }: {
  to: string; name: string; serviceName: string; avis: string; deposeLe: string; numero?: string | null; lienRecepisse?: string | null;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Votre offre a été déposée ✅</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(name)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">L'offre pour l'avis <strong>${esc(avis)}</strong> a été déposée le <strong>${esc(deposeLe)}</strong>${numero ? ` (récépissé n° <strong>${esc(numero)}</strong>)` : ""}.</p>
    ${lienRecepisse ? `<p style="color:#555;line-height:1.6;">Le récépissé est disponible dans votre espace client.</p>` : ""}
    <p style="color:#555;line-height:1.6;">Dès que vous recevez le résultat (lettre, publication ou PV d'ouverture), indiquez-le dans votre espace : nous vous aiderons pour la suite, y compris en cas de recours.</p>
    ${btn("Voir le suivi →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `Offre déposée — ${serviceName} — SHIFT UP`, html: baseLayout(content, "Offre déposée") });
}

/** Admin : le client a déclaré avoir déposé l'offre lui-même, ou a saisi le résultat. */
export async function sendSuiviAdmin({ clientName, clientEmail, serviceName, prestationId, titre, lignes }: {
  clientName: string; clientEmail: string; serviceName: string; prestationId: string; titre: string; lignes: [string, string | null | undefined][];
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 12px;">${esc(titre)}</h2>
    <p style="color:#555;margin:0 0 12px;">Client : <strong>${esc(clientName)}</strong> (${esc(clientEmail)})<br/>Prestation : <strong>${esc(serviceName)}</strong> — réf. ${ref(prestationId)}</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 12px;">
      ${lignes.filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 0;color:#777;font-size:14px;vertical-align:top;width:40%;">${esc(k)}</td><td style="padding:6px 0;color:#333;white-space:pre-wrap;">${esc(v)}</td></tr>`).join("")}
    </table>
    ${btn("Ouvrir la prestation →", `${APP_URL}/dashboard/admin/prestations`)}`;
  return resend.emails.send({ from: FROM, to: ADMIN_DEST, replyTo: clientEmail, subject: `[SHIFT UP] ${titre} — ${clientName} — ${serviceName}`, html: baseLayout(content, titre) });
}

/** Client : résultat enregistré par SHIFT UP. */
export async function sendResultatClient({ to, name, avis, libelle, details }: {
  to: string; name: string; avis: string; libelle: string; details: [string, string | null | undefined][];
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Résultat : ${esc(libelle)}</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(name)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Voici le résultat enregistré pour l'avis <strong>${esc(avis)}</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:0 0 12px;">
      ${details.filter(([, v]) => v).map(([k, v]) => `<tr><td style="padding:6px 0;color:#777;font-size:14px;vertical-align:top;width:40%;">${esc(k)}</td><td style="padding:6px 0;color:#333;white-space:pre-wrap;">${esc(v)}</td></tr>`).join("")}
    </table>
    ${btn("Voir le suivi →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#555;line-height:1.6;">Une question sur ce résultat ? Répondez simplement à ce courriel.</p>
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `Résultat de l'appel d'offres ${avis} — SHIFT UP`, html: baseLayout(content, "Résultat") });
}

/** Client : rappel automatique (pièces manquantes, dépôt à faire, résultat à communiquer). */
export async function sendRappelClient({ to, name, sujet, titre, paragraphes, items = [] }: {
  to: string; name: string; sujet: string; titre: string; paragraphes: string[]; items?: string[];
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">${esc(titre)}</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(name)}</strong>,</p>
    ${paragraphes.map((x) => `<p style="color:#555;line-height:1.6;">${esc(x)}</p>`).join("")}
    ${items.length ? liste(items.map((i) => esc(i))) : ""}
    ${btn("Ouvrir mon espace →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: REPONSE, subject: `${sujet} — SHIFT UP`, html: baseLayout(content, titre) });
}

export type LigneRappel = { client: string; avis: string; objet: string; limite: string; echeance: string; pieces: string };

/** Admin : point quotidien des dossiers à déposer. */
export async function sendPointDepotsAdmin({ aDeposer, nonConfirmes, resultats }: { aDeposer: LigneRappel[]; nonConfirmes: LigneRappel[]; resultats: LigneRappel[] }) {
  const tableau = (titre: string, couleur: string, lignes: LigneRappel[]) => !lignes.length ? "" : `
    <p style="margin:20px 0 8px;color:${couleur};font-weight:700;">${esc(titre)} (${lignes.length})</p>
    <table style="width:100%;border-collapse:collapse;font-size:13px;">
      <tr style="background:#f4f6f9;"><th style="text-align:left;padding:6px;">Délai</th><th style="text-align:left;padding:6px;">Client / avis</th><th style="text-align:left;padding:6px;">Pièces</th></tr>
      ${lignes.map((l) => `<tr style="border-bottom:1px solid #eee;"><td style="padding:6px;font-weight:700;white-space:nowrap;vertical-align:top;">${esc(l.echeance)}</td><td style="padding:6px;vertical-align:top;"><strong>${esc(l.client)}</strong><br/>${esc(l.avis)} — ${esc(l.objet)}<br/><span style="color:#777;">${esc(l.limite)}</span></td><td style="padding:6px;vertical-align:top;white-space:nowrap;">${esc(l.pieces)}</td></tr>`).join("")}
    </table>`;
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 8px;">📅 Point des dépôts d'offres</h2>
    ${tableau("Offres à déposer sous 3 jours", "#991b1b", aDeposer)}
    ${tableau("Date limite passée sans dépôt enregistré", "#9a3412", nonConfirmes)}
    ${tableau("Résultats à obtenir (dépôt depuis plus de 3 semaines)", "#0A2533", resultats)}
    ${btn("Ouvrir les prestations →", `${APP_URL}/dashboard/admin/prestations`)}`;
  const n = aDeposer.length;
  return resend.emails.send({ from: FROM, to: ADMIN_DEST, subject: `[SHIFT UP] ${n ? `${n} offre(s) à déposer sous 3 jours` : "Suivi des dépôts d'offres"}`, html: baseLayout(content, "Point des dépôts") });
}

const LIBELLES_DECISION: Record<string, string> = {
  accepter_devis: "Devis accepté",
  modifier_devis: "Modification du devis demandée",
  refuser_devis: "Devis refusé",
  demander_revision: "Révision demandée",
  valider_livraison: "Livraison validée",
};

/** Alerte admin : décision du client (devis, livraison). */
export async function sendDecisionClientAdmin({ clientName, clientEmail, serviceName, action, commentaire, prestationId }: {
  clientName: string; clientEmail: string; serviceName: string; action: string; commentaire?: string | null; prestationId: string;
}) {
  const libelle = LIBELLES_DECISION[action] ?? action;
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 12px;">${esc(libelle)}</h2>
    <p style="color:#555;margin:0 0 12px;">Client : <strong>${esc(clientName)}</strong> (${esc(clientEmail)})<br/>Prestation : <strong>${esc(serviceName)}</strong> — réf. ${esc(prestationId.slice(-8).toUpperCase())}</p>
    ${commentaire ? `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:0 0 16px;"><p style="margin:0 0 6px;color:#9a3412;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Commentaire du client</p><p style="margin:0;color:#333;white-space:pre-wrap;line-height:1.6;">${esc(commentaire)}</p></div>` : ""}
    ${btn("Ouvrir la prestation →", `${APP_URL}/dashboard/admin/prestations`)}`;
  return resend.emails.send({ from: FROM, to: ADMIN_DEST, replyTo: clientEmail, subject: `[SHIFT UP] ${libelle} — ${clientName} — ${serviceName}`, html: baseLayout(content, libelle) });
}

/** Alerte admin : paiement reçu. */
export async function sendPaiementAdmin({ clientName, clientEmail, serviceName, montant, total, paye, prestationId }: {
  clientName: string; clientEmail: string; serviceName: string; montant: number; total: number; paye: number; prestationId: string;
}) {
  const f = (n: number) => Math.round(n).toLocaleString("fr-FR");
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 12px;">💰 Paiement reçu : ${f(montant)} XOF</h2>
    <p style="color:#555;margin:0 0 12px;">Client : <strong>${esc(clientName)}</strong> (${esc(clientEmail)})<br/>Prestation : <strong>${esc(serviceName)}</strong> — réf. ${esc(prestationId.slice(-8).toUpperCase())}</p>
    <p style="color:#555;margin:0 0 12px;">Déjà payé : <strong>${f(paye)} XOF</strong> sur ${f(total)} XOF${paye >= total ? " — <strong>soldé</strong>" : ` — reste ${f(total - paye)} XOF`}.</p>
    ${btn("Ouvrir la prestation →", `${APP_URL}/dashboard/admin/prestations`)}`;
  return resend.emails.send({ from: FROM, to: ADMIN_DEST, replyTo: clientEmail, subject: `[SHIFT UP] Paiement reçu — ${clientName} — ${f(montant)} XOF`, html: baseLayout(content, "Paiement reçu") });
}

// ─── Emails formations ────────────────────────────────────────────────────────

/** Reçu-billet envoyé au participant après paiement confirmé */
export async function sendFormationReceipt({ to, prenom, nom, formation, dateDebut, dateFin, lieu, prixFCFA, reference, methodePaiement }: {
  to: string; prenom: string; nom: string; formation: string;
  dateDebut: string; dateFin: string; lieu: string;
  prixFCFA: number; reference: string; methodePaiement: string;
}) {
  const content = `
    <div style="text-align:center;margin-bottom:28px;">
      <div style="display:inline-block;background:#0A2533;border-radius:16px;padding:20px 32px;">
        <div style="font-size:13px;font-weight:700;color:rgba(255,255,255,0.8);letter-spacing:2px;text-transform:uppercase;margin-bottom:6px;">BILLET D'ENTRÉE OFFICIEL</div>
        <div style="font-size:22px;font-weight:900;color:#fff;letter-spacing:-0.5px;">${formation}</div>
      </div>
    </div>
    <div style="background:#EFF4F7;border:2px solid #BACFDC;border-radius:12px;padding:20px 24px;margin-bottom:20px;text-align:center;">
      <div style="font-size:11px;color:#2D5B78;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Numéro de billet</div>
      <div style="font-size:26px;font-weight:900;color:#0A2533;letter-spacing:2px;font-family:monospace;">${reference}</div>
      <div style="font-size:12px;color:#6b7280;margin-top:4px;">Présentez ce billet à l'accueil le jour J</div>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px;">
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#777;font-size:14px;width:40%;">Participant</td>
        <td style="padding:10px 0;font-weight:700;color:#0A2533;font-size:14px;">${prenom} ${nom}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#777;font-size:14px;">Formation</td>
        <td style="padding:10px 0;font-weight:700;color:#0A2533;font-size:14px;">${formation}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#777;font-size:14px;">Dates</td>
        <td style="padding:10px 0;font-weight:700;color:#0A2533;font-size:14px;">${dateDebut} → ${dateFin}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#777;font-size:14px;">Lieu</td>
        <td style="padding:10px 0;font-weight:700;color:#0A2533;font-size:14px;">${lieu}</td>
      </tr>
      <tr style="border-bottom:1px solid #f0f0f0;">
        <td style="padding:10px 0;color:#777;font-size:14px;">Montant payé</td>
        <td style="padding:10px 0;font-weight:700;color:#2D5B78;font-size:14px;">${prixFCFA.toLocaleString("fr-FR")} FCFA ✅</td>
      </tr>
      <tr>
        <td style="padding:10px 0;color:#777;font-size:14px;">Mode de paiement</td>
        <td style="padding:10px 0;font-weight:600;color:#0A2533;font-size:14px;">${methodePaiement}</td>
      </tr>
    </table>
    <div style="background:#fffbeb;border:1px solid #fbbf24;border-radius:10px;padding:16px 20px;margin-bottom:20px;">
      <p style="margin:0 0 6px;color:#92400e;font-weight:700;font-size:14px;">📋 Que faire maintenant ?</p>
      <p style="margin:0 0 4px;color:#78350f;font-size:13px;line-height:1.6;">1. Conservez cet email — il vous servira de billet d'entrée.</p>
      <p style="margin:0 0 4px;color:#78350f;font-size:13px;line-height:1.6;">2. Le lieu exact vous sera communiqué <strong>3 jours avant</strong> la formation.</p>
      <p style="margin:0;color:#78350f;font-size:13px;line-height:1.6;">3. Pour toute question : <a href="mailto:contact@shiftup.bj" style="color:#2D5B78;">contact@shiftup.bj</a></p>
    </div>
    <p style="color:#333;font-weight:600;margin:0;">À très bientôt — L'équipe SHIFT UP</p>`;
  return resend.emails.send({
    from: FROM,
    to,
    subject: `✅ Votre billet pour "${formation}" — Réf. ${reference}`,
    html: baseLayout(content, "Billet de formation"),
  });
}

/** Notification admin : nouvelle inscription formation confirmée */
export async function sendFormationInscriptionAdmin({ prenom, nom, email, telephone, formation, reference, structure, secteur, methodePaiement }: {
  prenom: string; nom: string; email: string; telephone: string;
  formation: string; reference: string; structure: string; secteur: string; methodePaiement: string;
}) {
  const supportEmail = "contact@shiftup.bj";
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 16px;">🎓 Nouvelle inscription confirmée — ${formation}</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#777;font-size:14px;width:35%;">Référence</td><td style="padding:8px 0;font-weight:700;color:#0A2533;font-family:monospace;">${reference}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Participant</td><td style="padding:8px 0;font-weight:600;color:#333;">${prenom} ${nom}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Email</td><td style="padding:8px 0;color:#333;">${email}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Téléphone</td><td style="padding:8px 0;color:#333;">${telephone}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Structure</td><td style="padding:8px 0;color:#333;">${structure}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Secteur</td><td style="padding:8px 0;color:#333;">${secteur}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Paiement</td><td style="padding:8px 0;font-weight:600;color:#2D5B78;">${methodePaiement} ✅</td></tr>
    </table>
    ${btn("Voir les inscriptions →", `${APP_URL}/dashboard/admin/formations`)}`;
  return resend.emails.send({
    from: FROM,
    to: supportEmail,
    subject: `[SHIFT UP] Inscription confirmée — ${prenom} ${nom} — ${formation}`,
    html: baseLayout(content, "Nouvelle inscription formation"),
  });
}

/** Création auto-compte pour visiteur non inscrit */
export async function sendAutoAccountEmail({ to, name, password, serviceName, prestationId }: {
  to: string; name: string; password: string; serviceName: string; prestationId: string;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Bienvenue sur SHIFT UP 🎉</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Votre demande pour <strong>${serviceName}</strong> a bien été enregistrée. Nous avons créé un compte client pour vous afin que vous puissiez suivre l'avancement de votre projet.</p>
    <div style="background:#fef9ec;border:1px solid #f59e0b;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 8px;color:#92400e;font-weight:700;">Vos identifiants de connexion</p>
      <p style="margin:0 0 4px;color:#333;font-size:14px;"><strong>Email :</strong> ${to}</p>
      <p style="margin:0;color:#333;font-size:14px;"><strong>Mot de passe temporaire :</strong> <code style="background:#fff;padding:2px 6px;border-radius:4px;font-size:13px;">${password}</code></p>
    </div>
    <p style="color:#555;">Connectez-vous pour suivre votre demande et changer votre mot de passe :</p>
    ${btn("Accéder à mon espace →", `${APP_URL}/login`)}
    <p style="color:#e11d48;font-size:13px;margin-top:12px;">⚠️ Pour votre sécurité, changez ce mot de passe dès votre première connexion.</p>`;
  return resend.emails.send({ from: FROM, to, subject: "Votre compte SHIFT UP a été créé — Accédez à votre espace", html: baseLayout(content, "Compte créé") });
}

// ─── Emails services apporteurs ────────────────────────────────────────────────

/** Confirmation au prospect : sa demande pour un service apporteur a été reçue */
export async function sendApporteurServiceLeadClient({ to, name, serviceTitle }: {
  to: string; name: string; serviceTitle: string;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Votre demande a bien été reçue ✅</h2>
    <p style="color:#555;margin:0 0 20px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Votre demande pour <strong>"${serviceTitle}"</strong> a bien été transmise au prestataire partenaire SHIFT UP. Il vous contactera très prochainement pour finaliser les modalités et le paiement.</p>
    <p style="color:#555;line-height:1.6;margin-top:16px;">Merci de votre confiance.</p>
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, subject: `Votre demande "${serviceTitle}" a été reçue — SHIFT UP`, html: baseLayout(content, "Demande reçue") });
}

/** Notification interne à l'apporteur : nouvelle demande sur un de ses services */
export async function sendApporteurServiceLeadOwner({ to, apporteurName, serviceTitle, clientName, clientEmail, clientPhone, brief }: {
  to: string; apporteurName: string; serviceTitle: string; clientName: string; clientEmail: string; clientPhone?: string | null; brief?: string | null;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Nouvelle demande sur votre service 🔔</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${apporteurName}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Vous avez reçu une nouvelle demande pour <strong>"${serviceTitle}"</strong>.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:8px 0;color:#777;font-size:14px;width:35%;">Client</td><td style="padding:8px 0;font-weight:600;color:#333;">${clientName}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Email</td><td style="padding:8px 0;color:#333;">${clientEmail}</td></tr>
      ${clientPhone ? `<tr><td style="padding:8px 0;color:#777;font-size:14px;">Téléphone</td><td style="padding:8px 0;color:#333;">${clientPhone}</td></tr>` : ""}
      ${brief ? `<tr><td style="padding:8px 0;color:#777;font-size:14px;vertical-align:top;">Besoin exprimé</td><td style="padding:8px 0;color:#333;line-height:1.5;">${brief}</td></tr>` : ""}
    </table>
    <p style="color:#555;">Rendez-vous dans "Mes Services" pour fixer le tarif définitif et générer le lien de paiement.</p>
    ${btn("Gérer mes services →", `${APP_URL}/dashboard/apporteur/mes-services`)}`;
  return resend.emails.send({ from: FROM, to, subject: `Nouvelle demande — ${serviceTitle} — SHIFT UP`, html: baseLayout(content, "Nouvelle demande") });
}

/** Livraison du service au client (document final) */
export async function sendApporteurServiceDelivered({ to, name, serviceTitle, documentUrl }: {
  to: string; name: string; serviceTitle: string; documentUrl: string;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Votre commande est livrée 📦</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Le prestataire a livré votre commande <strong>"${serviceTitle}"</strong>. Vous pouvez y accéder dès maintenant :</p>
    ${btn("Accéder au document →", documentUrl)}
    <p style="color:#555;line-height:1.6;margin-top:16px;">Merci de votre confiance en SHIFT UP.</p>`;
  return resend.emails.send({ from: FROM, to, subject: `Votre commande "${serviceTitle}" est livrée — SHIFT UP`, html: baseLayout(content, "Commande livrée") });
}

// ─── Recrutement (SHIFT UP cabinet de recrutement) ───────────────────────────

function esc(s: string | number | null | undefined) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

/** Accusé de réception envoyé au candidat. */
export async function sendCandidatureAccuse({ to, prenoms, poste, reference }: {
  to: string; prenoms: string; poste: string; reference: string;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:22px;margin:0 0 8px;">Candidature reçue</h2>
    <p style="color:#555;margin:0 0 20px;">Bonjour <strong>${esc(prenoms)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Nous avons bien reçu votre candidature au poste de <strong>${esc(poste)}</strong>. Votre dossier sera examiné avec attention ; seuls les candidats présélectionnés seront contactés.</p>
    <div style="background:#EFF4F7;border:1px solid #BACFDC;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#0A2533;font-size:14px;"><strong>Votre référence :</strong> ${esc(reference)}</p>
    </div>
    <p style="color:#555;line-height:1.6;font-size:14px;">Merci de rappeler cette référence dans tout échange avec SHIFT UP : <a href="mailto:contact@shiftup.bj" style="color:#2D5B78;">contact@shiftup.bj</a></p>`;
  return resend.emails.send({ from: FROM, to, subject: `Candidature reçue — ${poste} — Réf. ${reference}`, html: baseLayout(content, "Candidature reçue") });
}

/** Notification au cabinet avec le dossier complet (pièces jointes ou liens). */
export async function sendCandidatureAdmin({ to, candidature, attachments, liens }: {
  to: string | string[];
  candidature: {
    reference: string; poste: string; nom: string; prenoms: string; email: string; telephone: string;
    ville: string; nationalite: string; diplome: string; anneeDiplome: number; anneesExperience: number;
    nbProjetsSimilaires: number; disponibilite: string; source?: string | null;
  };
  attachments: { filename: string; content: Buffer }[];
  liens: { label: string; url: string }[];
}) {
  const c = candidature;
  const row = (k: string, v: string | number) =>
    `<tr><td style="padding:7px 0;color:#777;font-size:14px;width:45%;">${k}</td><td style="padding:7px 0;font-weight:600;color:#0A2533;font-size:14px;">${esc(v)}</td></tr>`;
  const liensHtml = liens.length
    ? `<p style="color:#555;font-size:14px;margin:20px 0 6px;"><strong>Pièces (liens valables 7 jours) :</strong></p><ul style="margin:0;padding-left:18px;">${liens.map((l) => `<li style="margin:4px 0;"><a href="${l.url}" style="color:#2D5B78;">${esc(l.label)}</a></li>`).join("")}</ul>`
    : `<p style="color:#555;font-size:14px;margin:20px 0 0;">Les ${attachments.length} pièce(s) du dossier sont jointes à cet e-mail.</p>`;
  const content = `
    <h2 style="color:#0A2533;font-size:20px;margin:0 0 4px;">Nouvelle candidature — ${esc(c.poste)}</h2>
    <p style="color:#777;margin:0 0 16px;font-size:13px;">Réf. ${esc(c.reference)}${c.source ? ` · source : ${esc(c.source)}` : ""}</p>
    <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #eee;">
      ${row("Nom et prénoms", `${c.nom} ${c.prenoms}`)}
      ${row("E-mail", c.email)}
      ${row("Téléphone", c.telephone)}
      ${row("Ville / nationalité", `${c.ville} · ${c.nationalite}`)}
      ${row("Diplôme", `${c.diplome} (${c.anneeDiplome})`)}
      ${row("Années d'expérience", c.anneesExperience)}
      ${row("Projets similaires", c.nbProjetsSimilaires)}
      ${row("Disponibilité", c.disponibilite)}
    </table>
    ${liensHtml}
    ${btn("Voir dans l'espace admin", `${APP_URL}/dashboard/admin/recrutement`)}`;
  return resend.emails.send({
    from: FROM,
    to,
    replyTo: c.email,
    subject: `[Recrutement ${c.poste}] ${c.nom} ${c.prenoms} — ${c.reference}`,
    html: baseLayout(content, "Nouvelle candidature"),
    attachments,
  });
}

// ─── Recrutement : candidats non retenus ─────────────────────────────────────

const dateFr = (d: Date) => d.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Africa/Porto-Novo" });

function blocDonnees(lien: string, dateLimite: Date) {
  return `
    <div style="background:#EFF4F7;border:1px solid #BACFDC;border-radius:10px;padding:20px;margin:24px 0;">
      <p style="margin:0 0 8px;color:#0A2533;font-size:15px;font-weight:700;">Pouvons-nous garder votre dossier ?</p>
      <p style="margin:0 0 4px;color:#555;font-size:14px;line-height:1.6;">Nous recrutons régulièrement pour des projets de travaux publics. Avec votre accord, nous conservons votre dossier pendant 24 mois pour vous proposer un poste qui correspond mieux à votre profil. Sans accord, il est supprimé.</p>
      <p style="margin:12px 0 0;">
        <a href="${lien}?choix=oui" style="display:inline-block;background:#0A2533;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:700;font-size:14px;margin:4px 8px 4px 0;">Oui, gardez mon dossier</a>
        <a href="${lien}?choix=non" style="display:inline-block;background:#fff;color:#0A2533;text-decoration:none;padding:11px 20px;border-radius:10px;font-weight:700;font-size:14px;border:1px solid #0A2533;margin:4px 0;">Non, supprimez mes données</a>
      </p>
      <p style="margin:12px 0 0;color:#777;font-size:12px;line-height:1.5;">Sans réponse de votre part avant le <strong>${dateFr(dateLimite)}</strong>, vos pièces et vos coordonnées seront supprimées. Vous pourrez changer d'avis à tout moment avec ce même lien.</p>
    </div>`;
}

/** Courriel de non-sélection avec les motifs et le choix de conservation des données. */
export async function sendNonRetenuCandidat({ to, prenoms, poste, reference, motifs, commentaire, lien, dateLimite }: {
  to: string; prenoms: string; poste: string; reference: string; motifs: string[]; commentaire?: string | null; lien: string; dateLimite: Date;
}) {
  const liste = motifs.length
    ? `<p style="color:#555;line-height:1.6;margin:16px 0 6px;">Votre dossier n'a pas été retenu pour ${motifs.length > 1 ? "les raisons suivantes" : "la raison suivante"} :</p>
       <ul style="margin:0 0 8px;padding-left:20px;color:#333;line-height:1.6;">${motifs.map((m) => `<li style="margin:4px 0;">${esc(m)}</li>`).join("")}</ul>`
    : "";
  const content = `
    <h2 style="color:#0A2533;font-size:21px;margin:0 0 8px;">Suite donnée à votre candidature</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(prenoms)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Merci de l'intérêt que vous avez porté au poste de <strong>${esc(poste)}</strong> (réf. ${esc(reference)}). Nous avons étudié votre dossier avec attention et nous ne pouvons pas y donner une suite favorable pour ce recrutement.</p>
    ${liste}
    ${commentaire ? `<p style="color:#555;line-height:1.6;margin:12px 0 0;">${esc(commentaire).replace(/\n/g, "<br/>")}</p>` : ""}
    ${blocDonnees(lien, dateLimite)}
    <p style="color:#555;line-height:1.6;font-size:14px;">Pour toute question, répondez à ce courriel ou écrivez à <a href="mailto:contact@shiftup.bj" style="color:#2D5B78;">contact@shiftup.bj</a> en rappelant votre référence.</p>
    <p style="color:#333;font-weight:600;margin-top:20px;">Le service recrutement de SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: "contact@shiftup.bj", subject: `Votre candidature — ${poste} — Réf. ${reference}`, html: baseLayout(content, "Suite donnée à votre candidature") });
}

/** Relance : le candidat n'a pas encore indiqué s'il accepte la conservation de son dossier. */
export async function sendRelanceDonneesCandidat({ to, prenoms, poste, reference, lien, dateLimite }: {
  to: string; prenoms: string; poste: string; reference: string; lien: string; dateLimite: Date;
}) {
  const content = `
    <h2 style="color:#0A2533;font-size:21px;margin:0 0 8px;">Votre dossier de candidature</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(prenoms)}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Nous vous avons écrit au sujet de votre candidature au poste de <strong>${esc(poste)}</strong> (réf. ${esc(reference)}). Vous ne nous avez pas encore dit si nous pouvons garder votre dossier pour un prochain recrutement.</p>
    ${blocDonnees(lien, dateLimite)}
    <p style="color:#333;font-weight:600;margin-top:20px;">Le service recrutement de SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: "contact@shiftup.bj", subject: `Rappel : conservation de votre dossier — Réf. ${reference}`, html: baseLayout(content, "Votre dossier de candidature") });
}

/** Accusé du choix du candidat. */
export async function sendConfirmationDonneesCandidat({ to, prenoms, reference, choix, jusquau, lien }: {
  to: string; prenoms: string; reference: string; choix: "ACCEPTEE" | "REFUSEE"; jusquau?: Date | null; lien: string;
}) {
  const corps = choix === "ACCEPTEE"
    ? `<p style="color:#555;line-height:1.6;">Votre dossier (réf. ${esc(reference)}) est conservé jusqu'au <strong>${jusquau ? dateFr(jusquau) : "—"}</strong>. Nous vous contacterons si un poste correspond à votre profil.</p>
       <p style="color:#555;line-height:1.6;font-size:14px;">Vous pouvez retirer votre accord à tout moment : <a href="${lien}" style="color:#2D5B78;">gérer mon dossier</a>.</p>`
    : `<p style="color:#555;line-height:1.6;">Comme vous l'avez demandé, vos pièces et vos coordonnées liées à la candidature réf. ${esc(reference)} ont été supprimées de nos systèmes.</p>`;
  const content = `
    <h2 style="color:#0A2533;font-size:21px;margin:0 0 8px;">${choix === "ACCEPTEE" ? "Votre dossier est conservé" : "Vos données ont été supprimées"}</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${esc(prenoms)}</strong>,</p>
    ${corps}
    <p style="color:#333;font-weight:600;margin-top:20px;">Le service recrutement de SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, replyTo: "contact@shiftup.bj", subject: choix === "ACCEPTEE" ? `Dossier conservé — Réf. ${reference}` : `Données supprimées — Réf. ${reference}`, html: baseLayout(content, "Votre dossier de candidature") });
}
