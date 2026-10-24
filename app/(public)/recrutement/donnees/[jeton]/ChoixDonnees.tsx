"use client";

import { useState } from "react";
import Link from "next/link";

type Etat = "EN_ATTENTE" | "ACCEPTEE" | "SUPPRIMEES";

export default function ChoixDonnees({ jeton, etatInitial, jusquau, suggestion, dureeMois }: {
  jeton: string; etatInitial: Etat; jusquau: string | null; suggestion: "oui" | "non" | null; dureeMois: number;
}) {
  const [etat, setEtat] = useState<Etat>(etatInitial);
  const [fin, setFin] = useState(jusquau);
  const [confirmeSuppr, setConfirmeSuppr] = useState(suggestion === "non" && etatInitial !== "SUPPRIMEES");
  const [envoi, setEnvoi] = useState(false);
  const [erreur, setErreur] = useState("");

  async function repondre(choix: "oui" | "non") {
    setEnvoi(true); setErreur("");
    try {
      const r = await fetch("/api/recrutement/donnees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ jeton, choix }) });
      const d = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error(d.error ?? "Une erreur est survenue. Réessayez.");
      setEtat(d.etat);
      if (d.jusquau) setFin(new Date(d.jusquau).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" }));
      setConfirmeSuppr(false);
    } catch (e) { setErreur((e as Error).message); }
    setEnvoi(false);
  }

  if (etat === "SUPPRIMEES") {
    return (
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-5" role="status">
        <p className="font-semibold text-primary">Vos données ont été supprimées.</p>
        <p className="text-sm text-gray-600 mt-1 leading-relaxed">Vos pièces et vos coordonnées liées à cette candidature ne sont plus conservées. Vous pouvez postuler à nouveau à tout moment sur la page <Link href="/recrutement" className="text-accent underline">Recrutement</Link>.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {etat === "ACCEPTEE" ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5" role="status">
          <p className="font-semibold text-green-900">Votre dossier est conservé{fin ? ` jusqu'au ${fin}` : ""}.</p>
          <p className="text-sm text-green-900/80 mt-1 leading-relaxed">Nous vous contacterons si un poste correspond à votre profil. Vous pouvez retirer votre accord ci-dessous.</p>
        </div>
      ) : (
        <div className="space-y-2 text-gray-600 leading-relaxed">
          <p>Nous recrutons régulièrement pour des projets de travaux publics. Acceptez-vous que nous gardions votre dossier pendant {dureeMois} mois pour vous proposer un poste mieux adapté à votre profil ?</p>
          <p className="text-sm text-gray-500">Si vous refusez, ou sans réponse dans le délai indiqué dans notre courriel, vos pièces et vos coordonnées sont supprimées.</p>
        </div>
      )}

      {erreur && <p className="text-sm text-red-700" role="alert">{erreur}</p>}

      {confirmeSuppr ? (
        <div className="rounded-xl border border-gray-300 p-5 space-y-3">
          <p className="font-semibold text-primary">Confirmer la suppression de vos données ?</p>
          <p className="text-sm text-gray-600">Cette action est définitive : vos pièces et vos coordonnées seront effacées.</p>
          <div className="flex flex-wrap gap-3">
            <button disabled={envoi} onClick={() => repondre("non")} className="min-h-[44px] px-5 rounded-xl bg-primary text-white font-semibold hover:bg-accent disabled:opacity-60">
              {envoi ? "Suppression…" : "Oui, supprimer mes données"}
            </button>
            <button disabled={envoi} onClick={() => setConfirmeSuppr(false)} className="min-h-[44px] px-5 rounded-xl border border-gray-300 text-primary font-semibold hover:border-primary">Annuler</button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {etat !== "ACCEPTEE" && (
            <button disabled={envoi} onClick={() => repondre("oui")} className={`min-h-[44px] px-5 rounded-xl font-semibold disabled:opacity-60 ${suggestion !== "non" ? "bg-primary text-white hover:bg-accent" : "border border-primary text-primary"}`}>
              {envoi ? "Enregistrement…" : "Oui, gardez mon dossier"}
            </button>
          )}
          <button disabled={envoi} onClick={() => setConfirmeSuppr(true)} className="min-h-[44px] px-5 rounded-xl border border-gray-300 text-primary font-semibold hover:border-primary disabled:opacity-60">
            {etat === "ACCEPTEE" ? "Retirer mon accord et supprimer mes données" : "Non, supprimez mes données"}
          </button>
        </div>
      )}
    </div>
  );
}
