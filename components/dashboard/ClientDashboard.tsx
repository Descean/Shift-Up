"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { StatCard } from "@/components/ui/Card";
import { PrestationStatusBadge } from "@/components/ui/Badge";
import { TitrePoints } from "@/components/site/Gabarit";
import Frise, { prochaineAction } from "@/components/prestations/Frise";
import { bilanPieces, lireMontage, echeance } from "@/lib/montage";

type Phase = { id: string; title: string; progress: number; status: string; order: number };
type Prestation = {
  id: string;
  service: { title: string; domain: string } | null;
  sector: string | null;
  customService: string | null;
  status: string;
  amount: number;
  amountPaid: number;
  globalProgress: number;
  quote: { deposit?: number; total?: number } | null;
  prestationPhases: Phase[];
  livrables: { isAvailable: boolean; verrouille?: boolean }[];
  customFields?: unknown;
  createdAt: string;
};
type Avis = { id: string; titre: string; texte: string | null; lien: string | null; lu: boolean; createdAt: string };

interface ClientDashboardProps {
  user?: { name?: string | null; email?: string | null; affiliationCode?: string };
}

const ACTIFS = ["EN_ATTENTE", "DEVIS_ENVOYE", "EN_ATTENTE_PAIEMENT", "EN_COURS", "LIVRAISON", "REVISION"];
const nom = (p: Prestation) => p.service?.title ?? p.customService ?? p.sector ?? "Prestation";
const lien = (p: Prestation) => `/dashboard/client/prestations?id=${p.id}`;

/** Ce que le client doit faire maintenant, demande par demande (le plus urgent d'abord). */
function actions(prestations: Prestation[]) {
  const liste: { cle: string; texte: string; detail: string; href: string; poids: number }[] = [];
  for (const p of prestations) {
    if (!ACTIFS.includes(p.status) && !(p.status === "TERMINEE" && p.amount > p.amountPaid + 1)) continue;
    const m = lireMontage(p.customFields);
    if (m.pieces.length) {
      const b = bilanPieces(m.pieces);
      if (b.attendues > 0) {
        const e = m.dossier ? echeance(m.dossier.dateLimite) : null;
        liste.push({ cle: `${p.id}-pieces`, texte: `${b.attendues} pièce(s) à déposer${b.aReprendre ? `, dont ${b.aReprendre} à reprendre` : ""}`,
          detail: `${nom(p)}${e ? ` · ${e.libelle}` : ""}`, href: lien(p), poids: e?.niveau === "urgent" || e?.niveau === "depassee" ? 0 : 2 });
      }
    }
    const a = prochaineAction(p);
    if (a.aFaire) {
      const verrou = p.livrables.some((l) => l.verrouille);
      liste.push({ cle: `${p.id}-etape`, texte: verrou && p.status !== "DEVIS_ENVOYE" && p.status !== "EN_ATTENTE_PAIEMENT" ? "Solde à régler pour télécharger vos livrables" : a.texte,
        detail: nom(p), href: lien(p), poids: p.status === "DEVIS_ENVOYE" || p.status === "EN_ATTENTE_PAIEMENT" ? 1 : 3 });
    }
  }
  return liste.sort((x, y) => x.poids - y.poids);
}

export default function ClientDashboard({ user }: ClientDashboardProps) {
  const [prestations, setPrestations] = useState<Prestation[]>([]);
  const [avis, setAvis]               = useState<Avis[]>([]);
  const [loading, setLoading]         = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/prestations").then((r) => r.json()).then((d) => setPrestations(d.prestations ?? [])).catch(() => {}),
      fetch("/api/notifications").then((r) => r.json()).then((d) => setAvis(d.avis ?? [])).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const enCours   = prestations.filter((p) => ACTIFS.includes(p.status));
  const terminees = prestations.filter((p) => p.status === "TERMINEE");
  const solde     = prestations.filter((p) => p.status !== "ANNULEE").reduce((s, p) => s + Math.max(0, p.amount - p.amountPaid), 0);
  const aFaire    = actions(prestations);
  // Demande mise en avant : celle en réalisation, sinon la plus récente encore ouverte
  const current   = enCours.find((p) => ["EN_COURS", "LIVRAISON", "REVISION"].includes(p.status)) ?? enCours[0] ?? null;
  const phases    = current ? [...current.prestationPhases].sort((a, b) => a.order - b.order) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <span className="w-8 h-8 border-2 border-su-bleu border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <TitrePoints as="h1" taille="text-[28px]">Mon espace client</TitrePoints>
          <p className="mt-1 text-gray-500 text-sm">Vos demandes, vos paiements et vos échanges avec l&apos;équipe.</p>
        </div>
        <Link href="/dashboard/client/nouvelle-demande" className="inline-flex items-center gap-2 self-start rounded-full bg-su-bleu px-5 py-2.5 text-sm font-semibold text-white hover:bg-su-cadet">
          <i className="fas fa-plus" />Nouvelle demande
        </Link>
      </motion.div>

      {/* À faire maintenant */}
      <section className="rounded-2xl border border-su-lavande bg-white p-5">
        <h2 className="mb-3 font-syne text-lg font-bold text-su-nuit">À faire maintenant</h2>
        {aFaire.length === 0 ? (
          <p className="text-sm text-gray-500">
            {enCours.length ? "Rien à faire de votre côté pour le moment : nous avançons sur vos demandes." : "Aucune demande en cours."}
            {" "}<Link href="/dashboard/client/nouvelle-demande" className="font-semibold text-su-bleu underline">Faire une demande</Link>
          </p>
        ) : (
          <ul className="space-y-2">
            {aFaire.map((a) => (
              <li key={a.cle}>
                <Link href={a.href} className="flex items-center gap-3 rounded-xl bg-su-brume px-4 py-3 transition-colors hover:bg-su-lavande">
                  <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-su-bleu text-white"><i className="fas fa-arrow-right text-xs" /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-su-nuit">{a.texte}</span>
                    <span className="block truncate text-xs text-gray-500">{a.detail}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        <StatCard label="Demandes en cours" value={String(enCours.length)} icon={<i className="fas fa-briefcase" />} color="accent" />
        <StatCard label="Demandes terminées" value={String(terminees.length)} icon={<i className="fas fa-check-circle" />} color="secondary" />
        <StatCard label="Solde à régler" value={`${Math.round(solde).toLocaleString("fr-FR")} F`} icon={<i className="fas fa-wallet" />} color="primary" />
        <StatCard label="Total des demandes" value={String(prestations.length)} icon={<i className="fas fa-layer-group" />} color="accent" />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {!current ? (
            <div className="bg-white rounded-2xl border border-su-lavande p-10 text-center text-gray-500">
              <i className="fas fa-briefcase text-3xl mb-3 block text-su-clair" />
              <p className="font-medium">Aucune demande en cours</p>
              <Link href="/services" className="mt-4 inline-block text-su-bleu text-sm font-semibold underline">Découvrir nos services</Link>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-su-lavande p-6 space-y-5">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm text-gray-500 mb-1">Demande suivie</p>
                  <h2 className="font-syne font-bold text-xl text-su-nuit">{nom(current)}</h2>
                </div>
                <PrestationStatusBadge status={current.status} />
              </div>

              <Frise p={current} />

              {phases.length > 0 && (
                <div className="space-y-2.5">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium text-gray-700">Avancement des travaux</span>
                    <span className="text-sm font-bold text-su-bleu">{current.globalProgress} %</span>
                  </div>
                  <div className="progress-bar h-2.5"><div className="progress-fill" style={{ width: `${current.globalProgress}%` }} /></div>
                  {phases.map((ph, i) => (
                    <div key={ph.id} className={`flex items-center gap-3 rounded-xl p-3 ${ph.status === "IN_PROGRESS" ? "border border-su-clair bg-su-brume" : "bg-gray-50"}`}>
                      <span className={`flex h-7 w-7 flex-none items-center justify-center rounded-full text-xs font-bold ${
                        ph.status === "DONE" ? "bg-su-nuit text-white" : ph.status === "IN_PROGRESS" ? "bg-su-bleu text-white" : "bg-gray-200 text-gray-500"}`}>
                        {ph.status === "DONE" ? <i className="fas fa-check text-[10px]" /> : i + 1}
                      </span>
                      <span className={`flex-1 truncate text-sm ${ph.status === "DONE" ? "text-gray-500" : ph.status === "IN_PROGRESS" ? "font-semibold text-su-nuit" : "text-gray-500"}`}>{ph.title}</span>
                      <span className="text-xs font-semibold text-gray-500">{ph.progress} %</span>
                    </div>
                  ))}
                </div>
              )}

              <Link href={lien(current)} className="inline-flex items-center gap-2 text-sm font-semibold text-su-bleu">
                Ouvrir la fiche de la demande <i className="fas fa-arrow-right text-xs" />
              </Link>
            </div>
          )}
        </div>

        <div className="space-y-5">
          {/* Dernières nouvelles */}
          <div className="bg-white rounded-2xl border border-su-lavande p-5">
            <h3 className="font-syne font-bold text-su-nuit mb-3">Dernières nouvelles</h3>
            {avis.length === 0 ? (
              <p className="text-sm text-gray-500">Les nouvelles de vos demandes (devis, paiements, étapes, livrables) apparaîtront ici.</p>
            ) : (
              <ul className="space-y-3">
                {avis.slice(0, 5).map((a) => (
                  <li key={a.id}>
                    <Link href={a.lien ?? "/dashboard/client/prestations"} className="block">
                      <span className={`block text-sm ${a.lu ? "text-gray-700" : "font-semibold text-su-nuit"}`}>{a.titre}</span>
                      {a.texte && <span className="block line-clamp-2 text-xs text-gray-500">{a.texte}</span>}
                      <span className="block text-[11px] text-gray-400">{new Date(a.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {user?.affiliationCode && (
            <div className="bg-su-nuit rounded-2xl p-5">
              <h3 className="font-syne font-bold text-white mb-3 flex items-center gap-2">
                <i className="fas fa-share-nodes text-su-ciel" />Mon code d&apos;affiliation
              </h3>
              <div className="bg-white/10 rounded-xl px-4 py-3 flex items-center justify-between mb-3">
                <span className="text-white font-mono font-bold tracking-widest">{user.affiliationCode}</span>
                <button onClick={() => navigator.clipboard.writeText(user.affiliationCode!)} aria-label="Copier le code" className="text-su-ciel hover:text-white transition-colors">
                  <i className="fas fa-copy" />
                </button>
              </div>
              <p className="text-su-lavande text-xs">Partagez ce code et gagnez des commissions sur chaque nouveau client.</p>
            </div>
          )}

          <div className="bg-white rounded-2xl border border-su-lavande p-5">
            <h3 className="font-syne font-bold text-su-nuit mb-3">Raccourcis</h3>
            <div className="space-y-1">
              {[
                { icon: "fas fa-building", label: "Mes entreprises et leurs pièces", href: "/dashboard/client/entreprises" },
                { icon: "fas fa-file-invoice", label: "Mes factures", href: "/dashboard/client/factures" },
                { icon: "fas fa-binoculars", label: "Veille des marchés", href: "/dashboard/client/veille" },
              ].map((a) => (
                <Link key={a.label} href={a.href} className="flex items-center gap-3 p-3 rounded-xl hover:bg-su-brume text-gray-700 hover:text-su-bleu transition-colors text-sm">
                  <i className={`${a.icon} w-4 text-su-bleu`} />{a.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
