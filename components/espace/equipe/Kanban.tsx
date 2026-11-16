"use client";

/** « Suivi des Dossiers » : Kanban de l'équipe de montage (À chiffrer, Attente acompte, En production, Terminés). */
import { useEffect, useState } from "react";
import Link from "next/link";
import type { EtatDossier } from "@/lib/dossier";
import { joursAvant, dateFr } from "@/components/espace/elements";

type Carte = { id: string; reference: string; titre: string; etat: EtatDossier; dateLimite: string | null; urgence: string; livraison: string; montant: number; revision: boolean; client: string | null; charge: string | null };

const COLONNES: { id: string; titre: string; point: string; etats: EtatDossier[] }[] = [
  { id: "chiffrer", titre: "À chiffrer", point: "bg-orange-500", etats: ["a_chiffrer"] },
  { id: "acompte", titre: "Attente Acompte", point: "bg-amber-400", etats: ["attente_acompte"] },
  { id: "production", titre: "En Production", point: "bg-su-bleu", etats: ["production", "pause"] },
  { id: "termines", titre: "Terminés", point: "bg-emerald-500", etats: ["termine", "solde"] },
];

export default function Kanban() {
  const [dossiers, setDossiers] = useState<Carte[] | null>(null);
  const [filtre, setFiltre] = useState("");
  const [enAttente, setEnAttente] = useState(false);

  useEffect(() => {
    const charger = () => fetch("/api/equipe/dossiers").then((r) => r.json()).then((d) => { setEnAttente(!!d.enAttente); setDossiers(d.dossiers ?? []); }).catch(() => setDossiers([]));
    charger();
    const t = setInterval(charger, 30_000);
    return () => clearInterval(t);
  }, []);

  const visibles = (dossiers ?? []).filter((d) => !filtre || `${d.reference} ${d.titre} ${d.client ?? ""}`.toLowerCase().includes(filtre.toLowerCase()));
  // En production : révision demandée après solde → remonte dans la colonne production
  const colonne = (d: Carte) => (d.etat === "solde" && d.revision ? "production" : COLONNES.find((c) => c.etats.includes(d.etat))?.id);

  if (enAttente) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-su-lavande bg-white p-8 text-center shadow-sm">
        <i className="fas fa-user-clock text-3xl text-su-bleu" />
        <h1 className="mt-4 text-xl font-bold text-su-nuit">Votre compte monteur est en cours de validation</h1>
        <p className="mt-2 text-sm text-gray-500">La Direction de SHIFT UP étudie votre profil. Vous recevrez un e-mail dès que votre compte sera activé ; vos dossiers apparaîtront alors ici.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 border-b border-su-lavande pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-su-nuit">Suivi des Dossiers</h1>
          <p className="mt-1 text-sm text-gray-500">Gérez les demandes de vos clients en un clin d&apos;œil.</p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input value={filtre} onChange={(e) => setFiltre(e.target.value)} placeholder="Rechercher un dossier, un client…"
            className="w-full rounded-xl border border-su-lavande bg-white px-4 py-2.5 text-sm focus:border-su-bleu focus:outline-none sm:w-64" />
          <Link href="/dashboard/equipe/nouveau" className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl bg-su-nuit px-4 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet">
            <i className="fas fa-plus" />Dossier d&apos;un client
          </Link>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-4">
        {COLONNES.map((c) => {
          const cartes = visibles.filter((d) => colonne(d) === c.id);
          return (
            <section key={c.id} className="flex min-h-[420px] w-[280px] flex-shrink-0 flex-col rounded-2xl border border-su-lavande bg-white/70 p-3 lg:w-auto lg:flex-1">
              <div className="mb-3 flex items-center justify-between px-1">
                <p className="text-sm font-bold text-su-nuit"><span className={`mr-2 inline-block h-2 w-2 rounded-full ${c.point}`} />{c.titre}</p>
                <span className="rounded-md bg-su-brume px-2 py-0.5 text-xs font-semibold text-gray-600">{cartes.length}</span>
              </div>
              <div className="space-y-3">
                {dossiers === null && <div className="h-24 animate-pulse rounded-xl bg-su-brume" />}
                {cartes.map((d) => {
                  const j = joursAvant(d.dateLimite);
                  return (
                    <Link key={d.id} href={`/dashboard/equipe/dossiers/${d.id}`} className="block rounded-xl border border-su-lavande bg-white p-3 shadow-sm transition hover:border-su-ciel hover:shadow-md">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-[10px] text-gray-400">{d.reference}</span>
                        <span className="flex gap-1">
                          {d.etat === "pause" && <span className="animate-pulse rounded bg-red-100 px-1.5 text-[10px] font-bold text-red-700">PAUSE (PIÈCE)</span>}
                          {d.revision && <span className="rounded bg-purple-100 px-1.5 text-[10px] font-bold text-purple-700">RÉVISION</span>}
                          {d.urgence === "express" && <span className="rounded bg-orange-100 px-1.5 text-[10px] font-bold text-orange-700">EXPRESS</span>}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-bold text-su-nuit">{d.titre}</p>
                      <p className="truncate text-[11px] text-gray-500">{d.client}</p>
                      {d.charge && <p className="text-[10px] text-gray-400"><i className="fas fa-user-gear mr-1" />{d.charge}</p>}
                      <div className="mt-2 flex items-center justify-between border-t border-su-lavande pt-2 text-[11px]">
                        <span className={`font-semibold ${j !== null && j <= 3 ? "text-red-600" : "text-gray-600"}`}><i className="fas fa-hourglass-half mr-1" />{dateFr(d.dateLimite)}</span>
                        <span className="font-bold text-su-nuit">{d.montant ? `${Math.round(d.montant).toLocaleString("fr-FR")} F` : "—"}</span>
                      </div>
                      {c.id === "termines" && <p className="mt-1 text-[10px] font-semibold text-gray-400">{d.etat === "solde" ? "Soldé" : "Attente solde"}</p>}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
