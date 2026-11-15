"use client";
/** Journal d'une demande : tous les avis envoyés au client (demande reçue, devis, paiements, étapes…). */
import { useEffect, useState } from "react";

type Ligne = { id: string; type: string; titre: string; texte: string | null; createdAt: string };

const ICONES: Record<string, string> = {
  DEMANDE: "fa-inbox", DEVIS: "fa-file-invoice", PAIEMENT: "fa-wallet", ETAPE: "fa-list-check", LIVRABLE: "fa-box-open",
  MESSAGE: "fa-comment", PIECES: "fa-folder-open", DEPOT: "fa-paper-plane", RESULTAT: "fa-flag-checkered", STATUT: "fa-circle-info",
};

export default function Journal({ prestationId }: { prestationId: string }) {
  const [lignes, setLignes] = useState<Ligne[] | null>(null);
  useEffect(() => {
    let actif = true;
    fetch(`/api/notifications?prestationId=${prestationId}`).then((r) => r.json()).then((d) => { if (actif) setLignes(d.journal ?? []); }).catch(() => { if (actif) setLignes([]); });
    return () => { actif = false; };
  }, [prestationId]);
  if (!lignes || lignes.length === 0) return null;
  return (
    <ol className="space-y-3 border-l-2 border-su-lavande pl-4">
      {lignes.map((l) => (
        <li key={l.id} className="relative">
          <span className="absolute -left-[27px] top-0 flex h-5 w-5 items-center justify-center rounded-full bg-su-brume text-[9px] text-su-bleu ring-2 ring-white">
            <i className={`fas ${ICONES[l.type] ?? "fa-circle-info"}`} />
          </span>
          <p className="text-sm font-semibold text-su-nuit">{l.titre}</p>
          {l.texte && <p className="text-xs leading-relaxed text-gray-600">{l.texte}</p>}
          <p className="text-[11px] text-gray-400">{new Date(l.createdAt).toLocaleString("fr-FR", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
        </li>
      ))}
    </ol>
  );
}
