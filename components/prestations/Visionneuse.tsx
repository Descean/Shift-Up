"use client";
/**
 * Lecture d'un livrable dans l'espace : pages en images filigranées (PDF, image) ou texte (Word).
 * Le fichier d'origine n'est pas transmis ; le téléchargement n'est proposé qu'une fois le solde payé.
 */
import { useEffect, useState } from "react";

type Info = { genre: "pdf" | "image" | "word" | "autre"; pages: number; html?: string; solde: boolean };

export default function Visionneuse({ livrableId, titre, lienTelechargement, onFermer }: {
  livrableId: string; titre: string; lienTelechargement?: string | null; onFermer: () => void;
}) {
  const [info, setInfo] = useState<Info | null>(null);
  const [erreur, setErreur] = useState(false);

  useEffect(() => {
    let actif = true;
    fetch(`/api/livrables/${livrableId}/apercu`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (actif) setInfo(d); })
      .catch(() => { if (actif) setErreur(true); });
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer(); };
    document.addEventListener("keydown", echap);
    document.body.style.overflow = "hidden";
    return () => { actif = false; document.removeEventListener("keydown", echap); document.body.style.overflow = ""; };
  }, [livrableId, onFermer]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-su-nuit" role="dialog" aria-modal="true" aria-label={`Lecture : ${titre}`}>
      <div className="flex items-center gap-3 border-b border-white/10 px-4 py-3 text-white">
        <i className="fas fa-file-lines text-su-ciel" />
        <p className="min-w-0 flex-1 truncate text-sm font-semibold">{titre}</p>
        {lienTelechargement ? (
          <a href={lienTelechargement} target="_blank" rel="noopener noreferrer" className="rounded-full bg-su-bleu px-4 py-2 text-xs font-semibold text-white hover:bg-su-cadet">
            <i className="fas fa-download mr-1.5" />Télécharger
          </a>
        ) : (
          <span className="hidden rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-su-lavande sm:inline">Téléchargement après le règlement du solde</span>
        )}
        <button onClick={onFermer} aria-label="Fermer" className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 hover:bg-white/20"><i className="fas fa-xmark" /></button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-5" onContextMenu={(e) => e.preventDefault()}>
        {erreur ? (
          <p className="py-20 text-center text-sm text-su-lavande">Aperçu indisponible pour le moment. Réessayez dans un instant.</p>
        ) : !info ? (
          <div className="flex justify-center py-20"><span className="h-9 w-9 animate-spin rounded-full border-2 border-su-ciel border-t-transparent" /></div>
        ) : info.genre === "word" && info.html ? (
          <div className="relative mx-auto max-w-3xl select-none overflow-hidden rounded-lg bg-white p-6 shadow-xl sm:p-10">
            <div className="prose prose-sm max-w-none text-gray-800 [&_table]:w-full [&_td]:border [&_td]:border-gray-200 [&_td]:p-1.5" dangerouslySetInnerHTML={{ __html: info.html }} />
            {!info.solde && (
              <div aria-hidden="true" className="pointer-events-none absolute inset-0 flex flex-col items-center justify-around overflow-hidden">
                {Array.from({ length: 8 }).map((_, i) => (
                  <span key={i} className="-rotate-[28deg] whitespace-nowrap text-4xl font-black text-su-bleu/15">APERÇU — SHIFT UP · APERÇU — SHIFT UP</span>
                ))}
              </div>
            )}
          </div>
        ) : info.pages > 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
            {Array.from({ length: info.pages }).map((_, i) => (
              // eslint-disable-next-line @next/next/no-img-element -- images générées à la demande, privées et non optimisables
              <img key={i} src={`/api/livrables/${livrableId}/apercu/${i + 1}`} alt={`Page ${i + 1}`} loading={i < 2 ? "eager" : "lazy"} draggable={false}
                className="w-full select-none rounded-md bg-white shadow-xl" />
            ))}
            <p className="text-xs text-su-lavande">Fin de l&apos;aperçu.</p>
          </div>
        ) : (
          <div className="mx-auto max-w-md py-16 text-center text-su-lavande">
            <i className="fas fa-file-circle-question mb-3 block text-3xl text-su-ciel" />
            <p className="text-sm">Ce format ne peut pas être lu dans l&apos;espace.</p>
            <p className="mt-1 text-xs">{lienTelechargement ? "Téléchargez-le pour l'ouvrir." : "Il sera téléchargeable après le règlement du solde. Vous pouvez demander une version PDF à l'équipe dans la discussion."}</p>
          </div>
        )}
      </div>
    </div>
  );
}
