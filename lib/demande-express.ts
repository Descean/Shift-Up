/**
 * lib/demande-express.ts — Création d'une demande « en une fois » (dossier + consigne), commune à
 * l'espace client (/api/prestations/express) et à la page publique sans compte
 * (ancienne page publique). L'IA lit ensuite le dossier en arrière-plan (lib/ia-devis) et
 * prépare une proposition de devis que le monteur ajuste avant de l'envoyer au client.
 */
import { after } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendNewDemandeAdmin, sendNouveauDossierMonteur } from "@/lib/email";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { envoyer } from "@/lib/prestations";
import { creerAvis, lienDemande } from "@/lib/notifications";
import { analyserEtChiffrer, iaAnalyseDisponible } from "@/lib/ia-devis";
import { lireTarifs, libelleNature } from "@/lib/reglages";
import { infosDossier, proposerDevis } from "@/lib/dossier";
import { SECTEUR_MONTAGE } from "@/lib/montage";
import { prixOffre, trouverDomaine, trouverOffre } from "@/lib/catalogue";

export type DonneesExpress = {
  clientId: string;
  nomClient: string;
  emailClient: string;
  consigne: string;
  fichiers: { url: string; nom: string }[];
  vocal?: string | null;
  entreprise?: { id: string; nom: string } | null;
  /** Nom d'entreprise saisi librement (page publique) */
  entrepriseLibre?: string | null;
  telephone?: string | null;
  origine: "demande express" | "page publique" | "monteur";
  /** Nature du marché, date limite, urgence, livraison (formulaire en 3 étapes) */
  montage?: { nature: string; dateLimite: string; urgence: "standard" | "express"; livraison: "numerique" | "physique" } | null;
  /** Autre service que le montage : domaine et offre du catalogue (date souhaitée dans `montage.dateLimite`) */
  service?: { domaine: string; offre: string | null; echeance: string | null; urgence: "standard" | "express" } | null;
  /** Monteur à qui le dossier est confié d'office (client venu par son lien, ou dossier ouvert par lui) */
  monteurId?: string | null;
  /** Courriels propres à l'appelant (confirmation ou activation du compte) */
  autresEnvois?: (prestationId: string) => Promise<unknown>[];
};

export async function creerDemandeExpress(d: DonneesExpress) {
  const ia = iaAnalyseDisponible();
  // Proposition de départ pour le monteur (grille + plancher), affinée ensuite par la lecture du dossier
  const tarifs = await lireTarifs();
  const dom = d.service ? trouverDomaine(d.service.domaine) : undefined;
  const offre = dom ? trouverOffre(dom, d.service?.offre) : undefined;
  const calendrier = d.montage ?? (d.service?.echeance ? { dateLimite: d.service.echeance, urgence: d.service.urgence, livraison: "numerique" as const } : null);
  const infos = infosDossier({ montage: calendrier ?? {} });
  const intitule = libelleNature(d.montage?.nature) ?? offre?.title ?? (dom ? `${dom.label} — besoin à préciser` : "Montage de dossier");
  const base = proposerDevis(tarifs, infos, intitule, offre);
  const prestation = await prisma.prestation.create({
    data: {
      clientId: d.clientId,
      sector: d.montage ? SECTEUR_MONTAGE : dom?.label ?? "Autre",
      customService: d.montage || dom ? intitule : "Demande en cours d'analyse",
      deadline: calendrier?.dateLimite ?? null,
      brief: d.consigne || null,
      company: d.entreprise?.nom ?? d.entrepriseLibre ?? null,
      phone: d.telephone || null,
      attachments: [...d.fichiers.map((f) => f.url), ...(d.vocal ? [d.vocal] : [])],
      status: "EN_ATTENTE",
      assignedToId: d.monteurId ?? null,
      customFields: {
        origine: d.origine,
        nomDeclare: d.nomClient,
        fichiers: d.fichiers,
        ...(d.vocal ? { consigneVocale: d.vocal } : {}),
        ...(d.entreprise ? { entrepriseId: d.entreprise.id, entrepriseNom: d.entreprise.nom } : {}),
        ...(calendrier ? { montage: calendrier } : {}),
        ...(offre ? { offre: { titre: offre.title, prix: prixOffre(offre), delai: offre.duration ?? null } } : {}),
        analyseIA: { statut: ia ? "en_attente" : "manuel", le: new Date().toISOString(), proposition: { ...base, auto: false } },
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.auditLog.create({
    data: { userId: d.clientId, action: "PRESTATION_CREATED", entity: "Prestation", entityId: prestation.id, details: { origine: d.origine, fichiers: d.fichiers.length, vocal: Boolean(d.vocal) } },
  }).catch(() => {});

  await envoyer(d.origine, [
    ...(d.autresEnvois?.(prestation.id) ?? []),
    sendNewDemandeAdmin({ clientName: d.nomClient, clientEmail: d.emailClient, serviceName: "Demande express (analyse automatique)", brief: d.consigne || "(dossier déposé, voir les fichiers)", prestationId: prestation.id }),
    alerterEquipeWhatsApp("Dossier à chiffrer", `${d.nomClient} — ${intitule}${d.montage ? ` — clôture ${d.montage.dateLimite}${d.montage.urgence === "express" ? " (express)" : ""}` : ""} — ${d.fichiers.length} fichier(s)${d.vocal ? " + vocal" : ""}`),
  ]);
  if (d.monteurId && d.origine !== "monteur") {
    const m = await prisma.user.findUnique({ where: { id: d.monteurId }, select: { name: true, email: true } });
    if (m?.email) await sendNouveauDossierMonteur({ to: m.email, name: m.name ?? "", client: d.nomClient, titre: intitule, prestationId: prestation.id }).catch(() => {});
  }
  await creerAvis({
    userId: d.clientId, prestationId: prestation.id, type: "DEMANDE", titre: "Demande reçue",
    texte: "Notre équipe étudie vos documents. Vous recevrez un devis ici sous peu.",
    lien: lienDemande(prestation.id),
  });

  // Lecture du dossier et proposition de devis, après la réponse au client
  if (ia) after(() => analyserEtChiffrer(prestation.id).then(() => undefined));
  return { id: prestation.id, analyse: ia };
}
