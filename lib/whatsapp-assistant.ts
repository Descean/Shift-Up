/**
 * lib/whatsapp-assistant.ts — Assistant WhatsApp de SHIFT UP
 *
 * Reçoit les messages transmis par Meta (voir /api/whatsapp/webhook) et répond :
 *   MENU       liste des choix
 *   DOSSIERS   état des demandes du client (devis, pièces, date limite, dépôt, résultat)
 *   PIÈCES     pièces encore attendues, avec le lien de dépôt
 *   AVIS       avis signalés par la veille (abonnés) ou derniers avis ouverts ; « avis forage » pour chercher
 *   DEVIS      demander un montage de dossier
 *   VEILLE     s'abonner à la veille
 *   ÉQUIPE     passer la main à un membre de l'équipe (l'assistant se tait 24 h)
 *   STOP       ne plus recevoir de messages WhatsApp
 * Autre question : réponse rédigée par l'IA si une clé est configurée (lib/ia.ts), sinon le menu.
 * Le client est reconnu par son numéro (préférence WhatsApp, téléphone du compte ou d'une demande).
 */
import prisma from "@/lib/prisma";
import { envoyerBoutons, envoyerListe, envoyerTexte, marquerLu, alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { numeroInternational } from "@/lib/whatsapp-lien";
import { iaDisponible, repondreIA } from "@/lib/ia";
import { bilanPieces, dateLimiteFr, echeance, enAttenteClient, lireMontage, RESULTATS } from "@/lib/montage";
import { sendSuiviAdmin } from "@/lib/email";

const APP_URL = (process.env.NEXT_PUBLIC_APP_URL ?? "https://www.shiftup.bj").replace(/\/$/, "");
const HEURES_EQUIPE = 24;
const STATUTS: Record<string, string> = {
  EN_ATTENTE: "demande reçue, devis en préparation", DEVIS_ENVOYE: "devis à consulter", EN_ATTENTE_PAIEMENT: "acompte à régler",
  EN_COURS: "en cours", LIVRAISON: "livrables prêts", REVISION: "en révision", TERMINEE: "terminée", ANNULEE: "annulée",
};

export type MessageEntrant = { numero: string; nom?: string | null; waId: string; texte: string; boutonId?: string | null };

// ─── Envoi + journal ─────────────────────────────────────────────────────────

async function journaliser(conversationId: string, auteur: "ASSISTANT" | "EQUIPE", texte: string, waId?: string, statut?: string) {
  await prisma.messageWhatsApp.create({ data: { conversationId, sens: "ENVOYE", auteur, texte, waId: waId ?? null, statut: statut ?? null } });
  await prisma.conversationWhatsApp.update({ where: { id: conversationId }, data: { dernierMessageLe: new Date() } });
}

async function texte(conv: { id: string; numero: string }, t: string) {
  const r = await envoyerTexte(conv.numero, t);
  await journaliser(conv.id, "ASSISTANT", t, r.id, r.ok ? "sent" : "failed");
}

async function boutons(conv: { id: string; numero: string }, t: string, b: { id: string; titre: string }[]) {
  const r = await envoyerBoutons(conv.numero, t, b);
  await journaliser(conv.id, "ASSISTANT", `${t}\n[${b.map((x) => x.titre).join(" | ")}]`, r.id, r.ok ? "sent" : "failed");
}

async function menu(conv: { id: string; numero: string }, intro: string) {
  const lignes = [
    { id: "DOSSIERS", titre: "Mes dossiers", description: "Devis, pièces, date limite, dépôt, résultat" },
    { id: "PIECES", titre: "Pièces à fournir", description: "Ce qui manque encore à vos dossiers" },
    { id: "AVIS", titre: "Avis d'appels d'offres", description: "Les avis qui vous correspondent" },
    { id: "DEVIS", titre: "Monter un dossier", description: "Confier un appel d'offres à SHIFT UP" },
    { id: "VEILLE", titre: "Veille des marchés", description: "Recevoir les avis chaque matin" },
    { id: "EQUIPE", titre: "Parler à l'équipe", description: "Un conseiller vous répond" },
  ];
  const r = await envoyerListe(conv.numero, intro, "Voir le menu", lignes);
  await journaliser(conv.id, "ASSISTANT", `${intro}\n[menu : ${lignes.map((l) => l.titre).join(", ")}]`, r.id, r.ok ? "sent" : "failed");
}

// ─── Reconnaissance du client ────────────────────────────────────────────────

async function trouverClient(numeroWa: string) {
  // Les anciens numéros béninois à 8 chiffres sont comparés aussi sous leur forme actuelle (préfixe 01)
  const numero = numeroInternational(numeroWa) ?? numeroWa;
  const plus = `+${numero}`;
  const pref = await prisma.preferenceNotification.findFirst({ where: { numero: plus }, select: { userId: true } }).catch(() => null);
  if (pref) return pref.userId;
  const huit = numero.slice(-8);
  const local = numero.startsWith("229") ? numero.slice(3) : numero;
  const u = await prisma.user.findFirst({
    where: { OR: [{ phone: { in: [numero, plus, local, `+229 ${local}`] } }, { phone: { endsWith: huit } }] },
    select: { id: true }, orderBy: { createdAt: "asc" },
  });
  if (u) return u.id;
  const p = await prisma.prestation.findFirst({ where: { OR: [{ phone: { in: [numero, plus, local] } }, { phone: { endsWith: huit } }] }, select: { clientId: true }, orderBy: { createdAt: "desc" } });
  return p?.clientId ?? null;
}

// ─── Réponses ────────────────────────────────────────────────────────────────

async function resumeDossiers(userId: string) {
  const ps = await prisma.prestation.findMany({
    where: { clientId: userId, status: { notIn: ["ANNULEE"] } }, orderBy: { createdAt: "desc" }, take: 8,
    include: { service: { select: { title: true } } },
  });
  const actives = ps.filter((p) => p.status !== "TERMINEE" || lireMontage(p.customFields).resultat?.statut === "EN_ATTENTE").slice(0, 5);
  if (!actives.length) return null;
  return actives.map((p) => {
    const m = lireMontage(p.customFields);
    const nom = m.dossier ? `${m.dossier.referenceAvis} — ${m.dossier.intitule.slice(0, 60)}` : (p.service?.title ?? p.customService ?? p.sector ?? "Prestation");
    const infos = [STATUTS[p.status] ?? p.status];
    if (m.dossier && !m.depot) infos.push(`dépôt ${echeance(m.dossier.dateLimite).libelle.toLowerCase()} (${dateLimiteFr(m.dossier.dateLimite)})`);
    const att = m.pieces.length ? bilanPieces(m.pieces).attendues : 0;
    if (att && !m.depot) infos.push(`${att} pièce(s) à fournir`);
    if (m.depot) infos.push("offre déposée");
    if (m.resultat && m.resultat.statut !== "EN_ATTENTE") infos.push(RESULTATS[m.resultat.statut].toLowerCase());
    if (p.amount > 0 && p.amountPaid < p.amount - 1 && ["EN_COURS", "LIVRAISON", "REVISION"].includes(p.status)) infos.push(`reste à payer ${Math.round(p.amount - p.amountPaid).toLocaleString("fr-FR")} F`);
    return `• *${nom}*\n  ${infos.join(" · ")}`;
  }).join("\n\n");
}

async function piecesManquantes(userId: string) {
  const ps = await prisma.prestation.findMany({ where: { clientId: userId, status: { notIn: ["ANNULEE", "TERMINEE"] } }, orderBy: { createdAt: "desc" }, take: 10 });
  const blocs = ps.flatMap((p) => {
    const m = lireMontage(p.customFields);
    const att = m.pieces.filter(enAttenteClient);
    if (!att.length || m.depot) return [];
    return [`*${m.dossier?.referenceAvis ?? "Dossier"}*${m.dossier ? ` (date limite ${dateLimiteFr(m.dossier.dateLimite)})` : ""}\n${att.slice(0, 15).map((x) => `- ${x.libelle}${x.statut === "A_REPRENDRE" && x.commentaireAdmin ? ` _(à reprendre : ${x.commentaireAdmin})_` : ""}`).join("\n")}${att.length > 15 ? `\n… et ${att.length - 15} autre(s)` : ""}`];
  });
  return blocs.length ? blocs.join("\n\n") : null;
}

const ouverts = () => ({ OR: [{ dateLimite: { gt: new Date() } }, { dateLimite: null, datePublication: { gte: new Date(Date.now() - 30 * 86_400_000) } }] });
const ligneAvis = (a: { reference: string; objet: string; autorite: string | null; dateLimite: Date | null; id: string }) =>
  `• ${a.objet.slice(0, 140)}\n  ${a.reference}${a.autorite ? ` — ${a.autorite.slice(0, 60)}` : ""}${a.dateLimite ? `\n  Date limite : ${a.dateLimite.toLocaleString("fr-FR", { timeZone: "Africa/Porto-Novo", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}\n  Monter ce dossier : ${APP_URL}/dashboard/client/nouvelle-demande?avis=${a.id}`;

async function avisPour(userId: string | null, recherche: string | null) {
  if (recherche) {
    const mots = recherche.split(/\s+/).filter((m) => m.length >= 3).slice(0, 4);
    const r = await prisma.avisMarche.findMany({
      where: { AND: [ouverts(), ...mots.map((m) => ({ OR: [{ objet: { contains: m, mode: "insensitive" as const } }, { autorite: { contains: m, mode: "insensitive" as const } }, { reference: { contains: m, mode: "insensitive" as const } }] }))] },
      orderBy: { dateLimite: "asc" }, take: 5,
    });
    return { titre: `Avis ouverts pour « ${recherche} »`, liste: r };
  }
  const ab = userId ? await prisma.abonnementVeille.findUnique({ where: { userId } }) : null;
  if (ab && ab.statut === "ACTIF") {
    const al = await prisma.alerteVeille.findMany({ where: { abonnementId: ab.id, avis: ouverts() }, include: { avis: true }, orderBy: { createdAt: "desc" }, take: 5 });
    return { titre: "Les derniers avis de votre veille", liste: al.map((x) => x.avis), abonne: true };
  }
  const r = await prisma.avisMarche.findMany({ where: ouverts(), orderBy: { createdAt: "desc" }, take: 5 });
  return { titre: "Derniers avis publiés", liste: r, abonne: false };
}

const SYSTEME_IA = `Tu es l'assistant WhatsApp de SHIFT UP, cabinet béninois (Abomey-Calavi) qui monte les dossiers de soumission aux appels d'offres publics et privés au Bénin (marchés publics SIGMaP, bailleurs : Banque mondiale, BAD, AFD, UE, ONG), propose une veille des appels d'offres, des formations au montage de dossiers et de l'assistance comptable, fiscale et administrative.
Règles : réponds en français, simplement, en 6 lignes au plus, sur le ton d'un conseiller courtois. N'invente jamais un avis, une date, un montant, un tarif ni un engagement : si tu ne sais pas, propose d'écrire ÉQUIPE pour parler à un conseiller. Pour demander un montage, indique ${APP_URL}/services/souscrire?service=montage-dossier. Tu peux rappeler les mots MENU, DOSSIERS, PIÈCES, AVIS, ÉQUIPE.`;

// ─── Traitement d'un message reçu ────────────────────────────────────────────

const normal = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").trim().toLowerCase();

export async function traiterMessage(m: MessageEntrant) {
  const numero = m.numero.replace(/\D/g, ""); // identifiant WhatsApp de l'expéditeur, tel quel
  if (await prisma.messageWhatsApp.findUnique({ where: { waId: m.waId } })) return { doublon: true };

  let conv = await prisma.conversationWhatsApp.findUnique({ where: { numero } });
  const nouveau = !conv;
  if (!conv) conv = await prisma.conversationWhatsApp.create({ data: { numero, nom: m.nom ?? null, userId: await trouverClient(numero) } });
  else if (!conv.userId) conv = await prisma.conversationWhatsApp.update({ where: { id: conv.id }, data: { userId: await trouverClient(numero) } });

  await prisma.messageWhatsApp.create({ data: { conversationId: conv.id, sens: "RECU", auteur: "CLIENT", texte: m.texte.slice(0, 4000) || "(message sans texte)", waId: m.waId } });
  conv = await prisma.conversationWhatsApp.update({
    where: { id: conv.id },
    data: { dernierRecuLe: new Date(), dernierMessageLe: new Date(), nonLus: { increment: 1 }, ...(m.nom && !conv.nom ? { nom: m.nom } : {}) },
  });
  await marquerLu(m.waId);

  const choix = normal(m.boutonId ?? m.texte);
  const prenom = (m.nom ?? "").split(" ")[0];

  // STOP fonctionne toujours, même quand l'équipe a pris la main
  if (/^(stop|arret|desabonner|desinscrire)\b/.test(choix)) {
    if (conv.userId) await prisma.preferenceNotification.updateMany({ where: { userId: conv.userId }, data: { whatsapp: false, consentLe: null } });
    await texte(conv, "C'est noté : vous ne recevrez plus de notifications WhatsApp de SHIFT UP. Vous pouvez nous écrire ici à tout moment.");
    return { action: "stop" };
  }
  if (conv.humainJusquau && conv.humainJusquau > new Date()) return { action: "equipe-en-cours" };

  const userId = conv.userId;
  const sansCompte = `Je ne trouve pas de compte SHIFT UP lié à ce numéro. Indiquez-le dans votre profil (rubrique « Notifications WhatsApp ») sur ${APP_URL}/dashboard/client/profil, ou écrivez ÉQUIPE.`;

  if (nouveau || /^(menu|bonjour|bonsoir|salut|hello|hi|start|aide|help|0)$/.test(choix)) {
    await menu(conv, `${prenom ? `Bonjour ${prenom}` : "Bonjour"}, je suis l'assistant de SHIFT UP. Que souhaitez-vous faire ?`);
    return { action: "menu" };
  }

  if (choix === "dossiers" || choix === "1" || /^mes dossiers?/.test(choix)) {
    if (!userId) { await texte(conv, sansCompte); return { action: "sans-compte" }; }
    const r = await resumeDossiers(userId);
    await boutons(conv, r ? `Vos dossiers en cours :\n\n${r}\n\nDétails : ${APP_URL}/dashboard/client/prestations` : "Vous n'avez pas de dossier en cours.", [{ id: "PIECES", titre: "Pièces à fournir" }, { id: "DEVIS", titre: "Monter un dossier" }, { id: "EQUIPE", titre: "Parler à l'équipe" }]);
    return { action: "dossiers" };
  }

  if (choix === "pieces" || choix === "2" || /^pieces?\b/.test(choix)) {
    if (!userId) { await texte(conv, sansCompte); return { action: "sans-compte" }; }
    const r = await piecesManquantes(userId);
    await texte(conv, r ? `Pièces encore attendues :\n\n${r}\n\nDéposez-les ici : ${APP_URL}/dashboard/client/prestations\nVous n'avez pas une pièce ? Écrivez ÉQUIPE.` : "Aucune pièce en attente pour vos dossiers. Merci !");
    return { action: "pieces" };
  }

  const recherche = choix.match(/^(?:avis|chercher|recherche|cherche)\s+(.{3,60})$/)?.[1] ?? null;
  if (choix === "avis" || choix === "3" || recherche) {
    const r = await avisPour(userId, recherche ? m.texte.trim().split(/\s+/).slice(1).join(" ") : null);
    const corps = r.liste.length ? r.liste.map(ligneAvis).join("\n\n") : "Aucun avis ouvert ne correspond pour le moment.";
    const pied = recherche ? "" : r.abonne ? "\n\nToute votre veille : " + `${APP_URL}/dashboard/client/veille` : `\n\nRecevez chaque matin les avis de vos secteurs : ${APP_URL}/dashboard/client/veille\nPour chercher : écrivez « avis » suivi d'un mot (ex. avis forage).`;
    await texte(conv, `${r.titre} :\n\n${corps}${pied}`);
    return { action: "avis" };
  }

  if (choix === "devis" || choix === "4" || /montage|monter un dossier|soumission|soumissionner/.test(choix)) {
    await boutons(conv, `Pour nous confier un appel d'offres, remplissez la fiche (référence de l'avis, date limite, entreprise) et joignez le DAO :\n${APP_URL}/services/souscrire?service=montage-dossier\n\nNous vous envoyons le devis sous 48 h, puis la liste des pièces à fournir.`, [{ id: "EQUIPE", titre: "Parler à l'équipe" }, { id: "MENU", titre: "Menu" }]);
    return { action: "devis" };
  }

  if (choix === "veille" || choix === "5") {
    await texte(conv, `La veille SHIFT UP vous envoie chaque matin les avis du Bénin qui correspondent à vos secteurs (portail national, SBEE, Banque mondiale, Nations unies, Enabel, GIZ, BOAD…). Choisissez vos critères ici :\n${APP_URL}/dashboard/client/veille`);
    return { action: "veille" };
  }

  if (choix === "equipe" || choix === "6" || /conseiller|humain|quelqu.un|agent|appel(ez|er)[- ]moi/.test(choix)) {
    const jusqua = new Date(Date.now() + HEURES_EQUIPE * 3600_000);
    await prisma.conversationWhatsApp.update({ where: { id: conv.id }, data: { humainJusquau: jusqua } });
    await texte(conv, "Un membre de l'équipe SHIFT UP va vous répondre ici dès que possible (du lundi au samedi). Vous pouvez déjà décrire votre besoin.");
    const nom = m.nom ?? numero;
    await Promise.allSettled([
      alerterEquipeWhatsApp("Client à rappeler sur WhatsApp", `${nom} (+${numero})`, "/dashboard/admin/whatsapp"),
      sendSuiviAdmin({ clientName: nom, clientEmail: "contact@shiftup.bj", serviceName: "Assistant WhatsApp", prestationId: conv.id, titre: "Un client demande à parler à l'équipe sur WhatsApp", lignes: [["Numéro", `+${numero}`], ["Dernier message", m.texte.slice(0, 500)]] }),
    ]);
    return { action: "equipe" };
  }

  // Question libre
  if (iaDisponible()) {
    const derniers = await prisma.messageWhatsApp.findMany({ where: { conversationId: conv.id }, orderBy: { createdAt: "desc" }, take: 8 });
    const contexte = userId ? await resumeDossiers(userId) : null;
    const historique = derniers.reverse().map((x) => ({ role: x.sens === "RECU" ? ("user" as const) : ("assistant" as const), content: x.texte }));
    const systeme = `${SYSTEME_IA}${contexte ? `\n\nDossiers de ce client (ne pas inventer au-delà) :\n${contexte}` : "\n\nCe numéro n'est lié à aucun compte client."}`;
    const r = await repondreIA(systeme, fusionner(historique));
    if (r) {
      await boutons(conv, r, [{ id: "MENU", titre: "Menu" }, { id: "EQUIPE", titre: "Parler à l'équipe" }]);
      return { action: "ia" };
    }
  }
  await menu(conv, "Je n'ai pas bien compris. Choisissez une option, ou écrivez ÉQUIPE pour parler à un conseiller.");
  return { action: "incompris" };
}

/** L'API des modèles exige une alternance utilisateur/assistant qui commence par l'utilisateur. */
function fusionner(t: { role: "user" | "assistant"; content: string }[]) {
  const r: typeof t = [];
  for (const x of t) {
    if (r.length && r[r.length - 1].role === x.role) r[r.length - 1].content += `\n${x.content}`;
    else r.push({ ...x });
  }
  while (r.length && r[0].role !== "user") r.shift();
  return r.length ? r : [{ role: "user" as const, content: "Bonjour" }];
}

/** Statuts de remise (sent, delivered, read, failed) transmis par Meta. */
export async function majStatut(waId: string, statut: string) {
  await prisma.messageWhatsApp.updateMany({ where: { waId }, data: { statut } });
}

/** Réponse de l'équipe depuis la boîte de réception (fenêtre de 24 h). */
export async function repondreEquipe(conversationId: string, t: string, heures = HEURES_EQUIPE) {
  const conv = await prisma.conversationWhatsApp.findUniqueOrThrow({ where: { id: conversationId } });
  if (!conv.dernierRecuLe || Date.now() - conv.dernierRecuLe.getTime() > 24 * 3600_000) {
    return { ok: false as const, erreur: "Le client n'a pas écrit depuis plus de 24 h : WhatsApp n'autorise qu'un message modèle. Utilisez le bouton « Écrire sur WhatsApp » de la fiche prestation." };
  }
  const r = await envoyerTexte(conv.numero, t);
  await journaliser(conv.id, "EQUIPE", t, r.id, r.ok ? "sent" : "failed");
  await prisma.conversationWhatsApp.update({ where: { id: conv.id }, data: { humainJusquau: new Date(Date.now() + heures * 3600_000), nonLus: 0 } });
  return r.ok ? { ok: true as const } : { ok: false as const, erreur: `Envoi refusé par WhatsApp : ${r.erreur}` };
}
