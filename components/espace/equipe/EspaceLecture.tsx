"use client";

/**
 * Espace de lecture du monteur : les documents du client s'affichent à gauche (PDF et images dans la page,
 * Word converti en texte), et le panneau de droite garde le devis ou les étapes et livrables à portée de main,
 * pour les noter au fil de la lecture.
 */
import { useEffect, useState } from "react";

export type FichierLecture = { url: string; nom: string; groupe: string };

type Genre = "pdf" | "image" | "audio" | "word" | "autre";
const genreDe = (nom: string, url: string): Genre => {
  const n = `${nom} ${url.split("?")[0]}`.toLowerCase();
  if (/\.pdf\b/.test(n)) return "pdf";
  if (/\.(jpe?g|png|webp|gif)\b/.test(n)) return "image";
  if (/\.(webm|m4a|mp3|ogg|wav)\b/.test(n)) return "audio";
  if (/\.docx\b/.test(n)) return "word";
  return "autre";
};

export default function EspaceLecture({ dossierId, titre, fichiers, courant, onChoisir, onFermer, children }: {
  dossierId: string; titre: string; fichiers: FichierLecture[]; courant: string;
  onChoisir: (url: string) => void; onFermer: () => void; children: React.ReactNode;
}) {
  const f = fichiers.find((x) => x.url === courant) ?? fichiers[0];
  const genre = f ? genreDe(f.nom, f.url) : "autre";
  const [word, setWord] = useState<{ url: string; html: string | null } | null>(null);

  useEffect(() => {
    const echap = (e: KeyboardEvent) => { if (e.key === "Escape") onFermer(); };
    document.addEventListener("keydown", echap);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", echap); document.body.style.overflow = ""; };
  }, [onFermer]);

  useEffect(() => {
    if (!f || genre !== "word" || word?.url === f.url) return;
    let actif = true;
    fetch(`/api/equipe/dossiers/${dossierId}/lecture?url=${encodeURIComponent(f.url)}`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((x: { html?: string }) => { if (actif) setWord({ url: f.url, html: x.html ?? null }); })
      .catch(() => { if (actif) setWord({ url: f.url, html: null }); });
    return () => { actif = false; };
  }, [dossierId, f, genre, word?.url]);

  const groupes = [...new Set(fichiers.map((x) => x.groupe))];
  const indice = f ? fichiers.indexOf(f) : -1;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-su-brume" role="dialog" aria-modal="true" aria-label="Espace de lecture du dossier">
      <div className="flex flex-wrap items-center gap-3 border-b border-su-lavande bg-white px-4 py-3">
        <button type="button" onClick={onFermer} className="flex items-center gap-2 text-sm font-semibold text-su-nuit hover:text-su-bleu">
          <i className="fas fa-arrow-left" />Retour à la fiche
        </button>
        <p className="hidden min-w-0 flex-1 truncate text-sm text-gray-500 md:block">{titre}</p>
        <div className="flex min-w-0 flex-1 items-center gap-2 md:flex-none">
          <button type="button" disabled={indice <= 0} onClick={() => onChoisir(fichiers[indice - 1].url)} aria-label="Document précédent"
            className="h-9 w-9 flex-none rounded-lg border border-su-lavande text-su-bleu disabled:opacity-30"><i className="fas fa-chevron-left" /></button>
          <select value={f?.url ?? ""} onChange={(e) => onChoisir(e.target.value)} aria-label="Document affiché"
            className="min-w-0 flex-1 rounded-lg border border-su-lavande bg-white px-3 py-2 text-sm text-su-nuit focus:border-su-bleu focus:outline-none md:w-80">
            {groupes.map((g) => (
              <optgroup key={g} label={g}>
                {fichiers.filter((x) => x.groupe === g).map((x) => <option key={x.url} value={x.url}>{x.nom}</option>)}
              </optgroup>
            ))}
          </select>
          <button type="button" disabled={indice < 0 || indice >= fichiers.length - 1} onClick={() => onChoisir(fichiers[indice + 1].url)} aria-label="Document suivant"
            className="h-9 w-9 flex-none rounded-lg border border-su-lavande text-su-bleu disabled:opacity-30"><i className="fas fa-chevron-right" /></button>
        </div>
        {f && (
          <a href={f.url} target="_blank" rel="noreferrer" className="rounded-lg border border-su-lavande px-3 py-2 text-xs font-semibold text-su-bleu hover:border-su-bleu">
            <i className="fas fa-up-right-from-square mr-1.5" />Ouvrir à part
          </a>
        )}
      </div>

      <div className="grid min-h-0 flex-1 grid-rows-[minmax(0,55vh)_minmax(0,1fr)] lg:grid-cols-[minmax(0,1fr)_420px] lg:grid-rows-1">
        <div className="min-h-0 overflow-hidden border-b border-su-lavande bg-gray-200 lg:border-b-0 lg:border-r">
          {!f ? null : genre === "pdf" ? (
            <iframe key={f.url} src={`${f.url}#view=FitH`} title={f.nom} className="h-full w-full bg-white" />
          ) : genre === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element -- document du client, servi par le stockage
            <div className="h-full overflow-auto p-4"><img src={f.url} alt={f.nom} className="mx-auto max-w-full bg-white shadow" /></div>
          ) : genre === "audio" ? (
            <div className="flex h-full items-center justify-center p-6"><audio controls src={f.url} className="w-full max-w-md" /></div>
          ) : genre === "word" ? (
            <div className="h-full overflow-auto p-4">
              {word?.url !== f.url ? (
                <p className="py-16 text-center text-sm text-gray-500">Ouverture du document…</p>
              ) : word.html ? (
                <article className="mx-auto max-w-3xl bg-white p-8 text-sm leading-relaxed text-gray-800 shadow [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:mt-5 [&_h2]:text-lg [&_h2]:font-bold [&_li]:ml-5 [&_li]:list-disc [&_p]:mb-2 [&_table]:my-3 [&_table]:w-full [&_td]:border [&_td]:border-gray-300 [&_td]:p-1.5"
                  dangerouslySetInnerHTML={{ __html: word.html }} />
              ) : (
                <AutreFichier f={f} />
              )}
            </div>
          ) : (
            <AutreFichier f={f} />
          )}
        </div>

        <aside className="min-h-0 space-y-4 overflow-y-auto p-4">{children}</aside>
      </div>
    </div>
  );
}

function AutreFichier({ f }: { f: FichierLecture }) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 p-6 text-center">
      <i className="fas fa-file-lines text-4xl text-su-clair" />
      <p className="max-w-sm text-sm text-gray-600">Ce type de fichier ({f.nom.split(".").pop()?.toUpperCase()}) ne s&apos;affiche pas dans la page.</p>
      <a href={f.url} target="_blank" rel="noreferrer" className="rounded-lg bg-su-nuit px-4 py-2 text-xs font-semibold text-white">Ouvrir le fichier</a>
    </div>
  );
}
