"use client";
/**
 * Boutons « Écrire sur WhatsApp » (gratuits) : ouvrent WhatsApp avec un message déjà rédigé.
 */
import { useState } from "react";
import { lienWhatsApp } from "@/lib/whatsapp-lien";
import { dateLimiteFr, enAttenteClient, lireMontage } from "@/lib/montage";

const ESPACE = "https://www.shiftup.bj/dashboard/client/prestations";

export default function WhatsAppRapide({ telephone, nom, service, statut, customFields }: {
  telephone?: string | null; nom: string; service: string; statut: string; customFields?: unknown;
}) {
  const [ouvert, setOuvert] = useState(false);
  const [libre, setLibre] = useState("");
  if (!telephone) return null;
  const m = lireMontage(customFields);
  const manquantes = m.pieces.filter(enAttenteClient);
  const bonjour = `Bonjour ${nom.split(" ")[0] || ""},`.replace(" ,", ",");
  const messages: [string, string][] = [
    ...(statut === "DEVIS_ENVOYE" ? [["Devis disponible", `${bonjour} votre devis pour « ${service} » est disponible dans votre espace SHIFT UP : ${ESPACE}`] as [string, string]] : []),
    ...(manquantes.length ? [[`Pièces à fournir (${manquantes.length})`, `${bonjour} pour votre dossier${m.dossier ? ` (avis ${m.dossier.referenceAvis}, date limite ${dateLimiteFr(m.dossier.dateLimite)})` : ""}, il nous manque encore :\n${manquantes.map((p) => `- ${p.libelle}${p.statut === "A_REPRENDRE" && p.commentaireAdmin ? ` (à reprendre : ${p.commentaireAdmin})` : ""}`).join("\n")}\nVous pouvez les déposer ici : ${ESPACE}`] as [string, string]] : []),
    ...(m.dossier && !m.depot ? [["Rappel de la date limite", `${bonjour} rappel : l'offre pour l'avis ${m.dossier.referenceAvis} doit être déposée au plus tard le ${dateLimiteFr(m.dossier.dateLimite)}.`] as [string, string]] : []),
    ...(m.depot ? [["Offre déposée", `${bonjour} votre offre pour l'avis ${m.dossier?.referenceAvis ?? service} a bien été déposée. Le récépissé est dans votre espace : ${ESPACE}`] as [string, string]] : []),
  ];
  return (
    <div className="mt-2">
      <button onClick={() => setOuvert(!ouvert)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 border border-green-200 rounded-lg px-2.5 py-1 hover:bg-green-50">
        <i className="fab fa-whatsapp" />Écrire sur WhatsApp
      </button>
      {ouvert && (
        <div className="mt-2 border border-green-100 rounded-xl p-2.5 space-y-1.5 bg-green-50/40">
          {messages.map(([l, t]) => (
            <a key={l} href={lienWhatsApp(telephone, t)} target="_blank" rel="noopener noreferrer" className="block text-xs text-green-800 bg-white border border-green-100 rounded-lg px-2.5 py-1.5 hover:bg-green-50">
              <i className="fas fa-paper-plane mr-1.5 text-[10px]" />{l}
            </a>
          ))}
          <div className="flex gap-1.5">
            <input value={libre} onChange={(e) => setLibre(e.target.value)} placeholder="Message libre…" aria-label="Message libre" className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs bg-white focus:outline-none focus:border-accent" />
            <a href={lienWhatsApp(telephone, libre || bonjour)} target="_blank" rel="noopener noreferrer" className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-green-700">Ouvrir</a>
          </div>
        </div>
      )}
    </div>
  );
}
