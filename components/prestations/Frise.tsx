/**
 * Frise d'une demande : où en est-elle, de la réception au solde.
 * Calculée à partir du statut, des montants et des étapes de réalisation.
 */
type Entree = { status: string; amount: number; amountPaid: number; quote?: { deposit?: number } | null; prestationPhases?: { status: string }[] };

const ETAPES = ["Demande reçue", "Devis", "Acompte", "Réalisation", "Livraison", "Solde", "Clôture"] as const;

/** Index de l'étape en cours (0 à 6) ; 7 = tout est terminé. */
export function etapeCourante(p: Entree): number {
  if (p.status === "TERMINEE") return p.amount > 0 && p.amountPaid < p.amount - 1 ? 5 : 7;
  if (p.status === "EN_ATTENTE") return 1;
  if (p.status === "DEVIS_ENVOYE") return 1;
  if (p.status === "EN_ATTENTE_PAIEMENT") return 2;
  if (p.status === "EN_COURS") return 3;
  if (p.status === "LIVRAISON" || p.status === "REVISION") return p.amount > 0 && p.amountPaid < p.amount - 1 ? 5 : 4;
  return 0;
}

/** Ce que le client doit faire maintenant, ou ce qu'il attend. */
export function prochaineAction(p: Entree): { texte: string; aFaire: boolean } {
  switch (p.status) {
    case "EN_ATTENTE": return { texte: "Nous étudions votre demande : votre devis s'affichera ici dès qu'il sera prêt.", aFaire: false };
    case "DEVIS_ENVOYE": return { texte: "Votre devis est prêt : acceptez-le, demandez une modification ou refusez-le.", aFaire: true };
    case "EN_ATTENTE_PAIEMENT": return { texte: `Payez l'acompte${p.quote?.deposit ? ` (${p.quote.deposit.toLocaleString("fr-FR")} F)` : ""} pour démarrer les travaux.`, aFaire: true };
    case "EN_COURS": return { texte: "Les travaux sont en cours : suivez les étapes ci-dessous.", aFaire: false };
    case "LIVRAISON": return { texte: p.amount > 0 && p.amountPaid < p.amount - 1 ? "Livraison prête : réglez le solde pour télécharger, puis validez." : "Livraison prête : vérifiez les livrables et validez la livraison.", aFaire: true };
    case "REVISION": return { texte: "Nous reprenons les points que vous avez signalés.", aFaire: false };
    case "TERMINEE": return { texte: p.amount > 0 && p.amountPaid < p.amount - 1 ? "Il reste un solde à régler." : "Demande terminée. Merci de votre confiance.", aFaire: p.amount > 0 && p.amountPaid < p.amount - 1 };
    case "ANNULEE": return { texte: "Demande annulée.", aFaire: false };
    default: return { texte: "", aFaire: false };
  }
}

export default function Frise({ p }: { p: Entree }) {
  if (p.status === "ANNULEE") {
    return <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">Cette demande a été annulée.</p>;
  }
  const cur = etapeCourante(p);
  const action = prochaineAction(p);
  return (
    <div className="space-y-3">
      <ol className="flex items-start" aria-label="Avancement de la demande">
        {ETAPES.map((e, i) => {
          const fait = i < cur, enCours = i === cur;
          return (
            <li key={e} className="flex flex-1 flex-col items-center text-center" aria-current={enCours ? "step" : undefined}>
              <div className="flex w-full items-center">
                <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : fait || enCours ? "bg-su-bleu" : "bg-su-lavande"}`} />
                <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-[11px] font-bold ${
                  fait ? "bg-su-nuit text-white" : enCours ? "bg-su-bleu text-white ring-4 ring-su-lavande" : "bg-su-lavande text-su-bleu"}`}>
                  {fait ? <i className="fas fa-check text-[10px]" /> : i + 1}
                </span>
                <span className={`h-0.5 flex-1 ${i === ETAPES.length - 1 ? "bg-transparent" : fait ? "bg-su-bleu" : "bg-su-lavande"}`} />
              </div>
              <span className={`mt-1.5 text-[10px] leading-tight sm:block sm:text-[11px] ${enCours ? "block font-semibold text-su-nuit" : "hidden text-gray-500"}`}>{e}</span>
            </li>
          );
        })}
      </ol>
      {action.texte && (
        <p className={`rounded-xl px-4 py-2.5 text-sm ${action.aFaire ? "bg-su-bleu text-white" : "bg-su-brume text-su-nuit"}`}>
          {action.aFaire && <i className="fas fa-hand-point-right mr-2" />}{action.texte}
        </p>
      )}
    </div>
  );
}
