/**
 * lib/email.ts — Utilitaire d'envoi d'emails via Resend
 *
 * Toutes les notifications transactionnelles de SHIFT UP passent ici.
 */

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.EMAIL_FROM ?? "SHIFT UP <noreply@shiftup.bj>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://shift-up-two.vercel.app";

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
        <tr><td style="background:linear-gradient(135deg,#1E9FD4,#00D4A0);border-radius:16px 16px 0 0;padding:32px;text-align:center;">
          <div style="font-family:'Segoe UI',sans-serif;font-size:28px;font-weight:900;color:#fff;letter-spacing:-0.5px;">SHIFT UP</div>
          <div style="color:rgba(255,255,255,0.8);font-size:12px;letter-spacing:2px;text-transform:uppercase;margin-top:4px;">Excellence • Innovation</div>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#fff;padding:40px 32px;border-radius:0 0 16px 16px;">
          ${content}
          <hr style="border:none;border-top:1px solid #eee;margin:32px 0;" />
          <p style="font-size:12px;color:#999;text-align:center;margin:0;">
            SHIFT UP — Votre partenaire digital au Bénin<br/>
            <a href="${APP_URL}" style="color:#1E9FD4;text-decoration:none;">${APP_URL}</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function btn(label: string, url: string) {
  return `<a href="${url}" style="display:inline-block;background:linear-gradient(135deg,#1E9FD4,#00D4A0);color:#fff;text-decoration:none;padding:14px 28px;border-radius:10px;font-weight:700;font-size:15px;margin:16px 0;">${label}</a>`;
}

// ─── Emails client ────────────────────────────────────────────────────────────

/** Confirmation de réception de la demande */
export async function sendDemandeConfirmation({ to, name, serviceName, prestationId }: {
  to: string; name: string; serviceName: string; prestationId: string;
}) {
  const content = `
    <h2 style="color:#1a2535;font-size:22px;margin:0 0 8px;">Votre demande a bien été reçue ✅</h2>
    <p style="color:#555;margin:0 0 20px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Nous avons bien reçu votre demande pour <strong>${serviceName}</strong>. Notre équipe va l'analyser et vous envoyer un devis personnalisé sous <strong>48h ouvrées</strong>.</p>
    <div style="background:#f0fdf9;border:1px solid #00D4A0;border-radius:10px;padding:16px;margin:20px 0;">
      <p style="margin:0;color:#059669;font-size:14px;"><strong>Référence demande :</strong> ${prestationId.slice(-8).toUpperCase()}</p>
    </div>
    <p style="color:#555;">Vous pouvez suivre l'état de votre demande depuis votre dashboard :</p>
    ${btn("Suivre ma demande →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#555;line-height:1.6;margin-top:20px;">Si vous avez des questions, répondez simplement à cet email.<br/>Merci de votre confiance.</p>
    <p style="color:#333;font-weight:600;">L'équipe SHIFT UP</p>`;
  return resend.emails.send({ from: FROM, to, subject: `Votre demande "${serviceName}" a été reçue — SHIFT UP`, html: baseLayout(content, "Demande reçue") });
}

/** Notification admin : nouvelle demande */
export async function sendNewDemandeAdmin({ clientName, clientEmail, serviceName, brief, prestationId }: {
  clientName: string; clientEmail: string; serviceName: string; brief: string; prestationId: string;
}) {
  const adminEmail = process.env.ADMIN_EMAIL ?? "admin@shiftup.bj";
  const content = `
    <h2 style="color:#1a2535;font-size:22px;margin:0 0 16px;">🔔 Nouvelle demande de prestation</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Client</td><td style="padding:8px 0;font-weight:600;color:#333;">${clientName} (${clientEmail})</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;">Service</td><td style="padding:8px 0;font-weight:600;color:#333;">${serviceName}</td></tr>
      <tr><td style="padding:8px 0;color:#777;font-size:14px;vertical-align:top;">Besoin exprimé</td><td style="padding:8px 0;color:#333;line-height:1.5;">${brief || "Non renseigné"}</td></tr>
    </table>
    ${btn("Traiter la demande →", `${APP_URL}/dashboard/admin/prestations`)}`;
  return resend.emails.send({ from: FROM, to: adminEmail, subject: `[SHIFT UP] Nouvelle demande — ${clientName} — ${serviceName}`, html: baseLayout(content, "Nouvelle demande") });
}

/** Notification client : devis envoyé */
export async function sendDevisClient({ to, name, serviceName, depositAmount, prestationId }: {
  to: string; name: string; serviceName: string; depositAmount: number; prestationId: string;
}) {
  const content = `
    <h2 style="color:#1a2535;font-size:22px;margin:0 0 8px;">Votre devis est prêt 📋</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Notre équipe a analysé votre demande pour <strong>${serviceName}</strong> et vous a préparé un devis détaillé accompagné d'un plan de réalisation.</p>
    <div style="background:#eff6ff;border:1px solid #3b82f6;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0 0 6px;color:#1d4ed8;font-weight:700;">Acompte requis pour démarrer</p>
      <p style="margin:0;color:#1d4ed8;font-size:24px;font-weight:900;">${depositAmount.toLocaleString("fr-FR")} XOF</p>
    </div>
    <p style="color:#555;">Consultez votre devis et lancez l'exécution en payant l'acompte :</p>
    ${btn("Voir mon devis →", `${APP_URL}/dashboard/client/prestations`)}
    <p style="color:#888;font-size:13px;margin-top:16px;">Le devis est valable 7 jours. Passé ce délai, merci de nous recontacter.</p>`;
  return resend.emails.send({ from: FROM, to, subject: `Votre devis "${serviceName}" est disponible — SHIFT UP`, html: baseLayout(content, "Devis disponible") });
}

/** Notification client : livrable disponible */
export async function sendLivrableClient({ to, name, livrableTitle, serviceName }: {
  to: string; name: string; livrableTitle: string; serviceName: string;
}) {
  const content = `
    <h2 style="color:#1a2535;font-size:22px;margin:0 0 8px;">Un livrable est disponible 📦</h2>
    <p style="color:#555;margin:0 0 16px;">Bonjour <strong>${name}</strong>,</p>
    <p style="color:#555;line-height:1.6;">Un nouveau livrable <strong>"${livrableTitle}"</strong> est disponible pour votre projet <strong>${serviceName}</strong>.</p>
    ${btn("Accéder au livrable →", `${APP_URL}/dashboard/client/suivi`)}
    <p style="color:#555;line-height:1.6;margin-top:16px;">N'hésitez pas à nous faire part de vos retours depuis votre dashboard.</p>`;
  return resend.emails.send({ from: FROM, to, subject: `Livrable disponible — ${serviceName} — SHIFT UP`, html: baseLayout(content, "Livrable disponible") });
}

/** Notification admin : observation client sur un livrable */
export async function sendObservationAdmin({ to, clientName, serviceName, livrableTitle, observation, voiceNoteUrl, prestationId }: {
  to: string; clientName: string; serviceName: string; livrableTitle: string; observation: string; voiceNoteUrl?: string | null; prestationId: string;
}) {
  const voiceSection = voiceNoteUrl
    ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin:16px 0;"><p style="margin:0 0 4px;color:#166534;font-weight:600;font-size:13px;">🎙️ Note vocale jointe</p><a href="${voiceNoteUrl}" style="color:#1E9FD4;word-break:break-all;font-size:13px;">${voiceNoteUrl}</a></div>`
    : "";
  const content = `
    <h2 style="color:#1a2535;font-size:20px;margin:0 0 8px;">📋 Nouvelle observation client</h2>
    <p style="color:#555;margin:0 0 16px;">Le client <strong>${clientName}</strong> a soumis une observation sur son projet <strong>${serviceName}</strong>.</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:0 0 16px;">
      <p style="margin:0 0 6px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Livrable concerné</p>
      <p style="margin:0;color:#1a2535;font-weight:700;">${livrableTitle}</p>
    </div>
    <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:16px 20px;margin:0 0 16px;">
      <p style="margin:0 0 6px;color:#9a3412;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Observation</p>
      <p style="margin:0;color:#333;white-space:pre-wrap;line-height:1.6;">${observation}</p>
    </div>
    ${voiceSection}
    ${btn("Voir dans les messages →", `${APP_URL}/dashboard/admin/messages`)}`;
  return resend.emails.send({ from: FROM, to, subject: `Observation client — ${serviceName} — SHIFT UP`, html: baseLayout(content, "Observation client") });
}

/** Création auto-compte pour visiteur non inscrit */
export async function sendAutoAccountEmail({ to, name, password, serviceName, prestationId }: {
  to: string; name: string; password: string; serviceName: string; prestationId: string;
}) {
  const content = `
    <h2 style="color:#1a2535;font-size:22px;margin:0 0 8px;">Bienvenue sur SHIFT UP 🎉</h2>
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
