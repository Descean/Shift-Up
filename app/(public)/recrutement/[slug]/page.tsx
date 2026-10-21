import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OFFRES, getOffre, offreOuverte, formatDateLimite, PIECES } from "@/lib/recrutement/offres";
import CandidatureForm from "./CandidatureForm";

export function generateStaticParams() {
  return OFFRES.map((o) => ({ slug: o.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const o = getOffre(slug);
  if (!o) return {};
  const desc = `${o.diplome} · ${o.experience}. Date limite : ${formatDateLimite(o.dateLimite)}. Candidature en ligne.`;
  return {
    title: `${o.titre} (H/F) — Recrutement`,
    description: desc,
    openGraph: { title: `Recrutement : ${o.titre} (H/F) — SHIFT UP`, description: desc },
  };
}

export const revalidate = 3600;

export default async function OffrePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const o = getOffre(slug);
  if (!o) notFound();
  const ouverte = offreOuverte(o);

  return (
    <div className="min-h-screen">
      <section className="bg-primary pt-28 pb-14 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10">
          <Link href="/recrutement" className="inline-flex items-center gap-2 text-white/70 hover:text-white text-sm mb-6">
            <i className="fas fa-arrow-left text-xs" aria-hidden /> Toutes les offres
          </Link>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="font-syne font-semibold text-xs tracking-wider text-primary bg-accent-200 px-2.5 py-1 rounded-md">{o.code}</span>
            <span className="text-white/70 text-sm">{o.famille} · Bénin · Prise de poste selon le calendrier des chantiers</span>
          </div>
          <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4 leading-tight">{o.titre} (H/F)</h1>
          <p className="text-white/70 text-lg leading-relaxed max-w-3xl">{o.mission}</p>
        </div>
      </section>

      <section className="section-padding bg-paper">
        <div className="container-custom grid lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-8 items-start">
          <aside className="space-y-5 lg:sticky lg:top-24">
            <div className="bg-white border border-gray-200 rounded-2xl p-6 space-y-5">
              <h2 className="text-lg text-primary">Profil exigé</h2>
              {[
                ["Diplôme", o.diplome],
                ["Expérience générale", o.experience],
                ["Expérience spécifique", o.experienceSpecifique],
                ...(o.autres ?? []).map((a) => ["Autre exigence", a]),
              ].map(([k, v], i) => (
                <div key={i}>
                  <p className="text-xs uppercase tracking-wider text-gray-500 mb-1">{k}</p>
                  <p className="text-primary leading-relaxed">{v}</p>
                </div>
              ))}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl p-6">
              <h2 className="text-lg text-primary mb-3">Pièces à charger (PDF lisible)</h2>
              <ul className="space-y-2 text-gray-600">
                {PIECES.map((p) => (
                  <li key={p.type} className="flex gap-2">
                    <i className="fas fa-file-pdf text-accent mt-1 text-sm" aria-hidden />
                    <span>{p.label}{p.obligatoire ? "" : " (facultatif)"} — <span className="text-gray-500">{p.aide}</span></span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-accent-50 border border-accent-100 rounded-2xl p-5">
              <p className="font-syne font-semibold text-primary">Date limite : {formatDateLimite(o.dateLimite)}</p>
              <p className="text-sm text-gray-600 mt-1">Les dossiers sont examinés au fil de l&apos;eau. Seuls les candidats présélectionnés seront contactés.</p>
            </div>
          </aside>

          <div className="bg-white border border-gray-200 rounded-2xl p-6 sm:p-8 min-w-0">
            {ouverte ? (
              <Suspense fallback={null}>
                <CandidatureForm offre={{ code: o.code, slug: o.slug, titre: o.titre }} />
              </Suspense>
            ) : (
              <div className="py-10 text-center">
                <h2 className="text-xl text-primary mb-2">Candidatures closes</h2>
                <p className="text-gray-600">La date limite de dépôt pour ce poste est dépassée.</p>
                <Link href="/recrutement" className="inline-block mt-6 text-accent font-semibold hover:underline">Voir les autres offres →</Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
