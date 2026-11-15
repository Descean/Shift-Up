/**
 * lib/demande-express.ts — Création d'une demande « en une fois » (dossier + consigne), commune à
 * l'espace client (/api/prestations/express) et à la page publique sans compte
 * (/api/prestations/publique/express). L'IA lit ensuite le dossier en arrière-plan (lib/ia-devis).
 */
import { after } from "next/server";
import type { Prisma } from "@prisma/client";
import prisma from "@/lib/prisma";
import { sendNewDemandeAdmin } from "@/lib/email";
import { alerterEquipeWhatsApp } from "@/lib/whatsapp";
import { envoyer } from "@/lib/prestations";
import { creerAvis, lienDemande } from "@/lib/notifications";
import { analyserEtChiffrer, iaAnalyseDisponible } from "@/lib/ia-devis";

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
  origine: "demande express" | "page publique";
  /** Courriels propres à l'appelant (confirmation ou activation du compte) */
  autresEnvois?: (prestationId: string) => Promise<unknown>[];
};

export async function creerDemandeExpress(d: DonneesExpress) {
  const ia = iaAnalyseDisponible();
  const prestation = await prisma.prestation.create({
    data: {
      clientId: d.clientId,
      sector: "Autre",
      customService: "Demande en cours d'analyse",
      brief: d.consigne || null,
      company: d.entreprise?.nom ?? d.entrepriseLibre ?? null,
      phone: d.telephone || null,
      attachments: [...d.fichiers.map((f) => f.url), ...(d.vocal ? [d.vocal] : [])],
      status: "EN_ATTENTE",
      customFields: {
        origine: d.origine,
        nomDeclare: d.nomClient,
        fichiers: d.fichiers,
        ...(d.vocal ? { consigneVocale: d.vocal } : {}),
        ...(d.entreprise ? { entrepriseId: d.entreprise.id, entrepriseNom: d.entreprise.nom } : {}),
        analyseIA: { statut: ia ? "en_attente" : "manuel", le: new Date().toISOString() },
      } as Prisma.InputJsonValue,
    },
  });

  await prisma.auditLog.create({
    data: { userId: d.clientId, action: "PRESTATION_CREATED", entity: "Prestation", entityId: prestation.id, details: { origine: d.origine, fichiers: d.fichiers.length, vocal: Boolean(d.vocal) } },
  }).catch(() => {});

  await envoyer(d.origine, [
    ...(d.autresEnvois?.(prestation.id) ?? []),
    sendNewDemandeAdmin({ clientName: d.nomClient, clientEmail: d.emailClient, serviceName: "Demande express (analyse automatique)", brief: d.consigne || "(dossier déposé, voir les fichiers)", prestationId: prestation.id }),
    alerterEquipeWhatsApp("Nouvelle demande", `${d.nomClient} — ${d.fichiers.length} fichier(s)${d.vocal ? " + vocal" : ""}`),
  ]);
  await creerAvis({
    userId: d.clientId, prestationId: prestation.id, type: "DEMANDE", titre: "Demande reçue",
    texte: ia ? "Nous lisons votre dossier : votre devis arrive dans quelques minutes." : "Notre équipe étudie votre dossier : vous recevrez le devis dès qu'il sera prêt.",
    lien: lienDemande(prestation.id),
  });

  // Lecture du dossier et devis automatique, après la réponse au visiteur
  if (ia) after(() => analyserEtChiffrer(prestation.id).then(() => undefined));
  return { id: prestation.id, analyse: ia };
}
