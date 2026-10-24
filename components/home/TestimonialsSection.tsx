/**
 * Bloc « confiance » de l'accueil : témoignages réels (table Testimonial, gérés dans
 * l'admin, publiés avec l'accord écrit du client) + informations légales officielles.
 * Sans témoignage publié, la colonne de gauche présente nos engagements.
 */
import prisma from "@/lib/prisma";
import { ENTREPRISE } from "@/lib/entreprise";

const legalInfo = [
  { label: "Dénomination", value: ENTREPRISE.nom },
  { label: "Forme juridique", value: ENTREPRISE.forme },
  { label: "RCCM", value: ENTREPRISE.rccm },
  { label: "IFU", value: ENTREPRISE.ifu },
  { label: "Siège social", value: ENTREPRISE.ville },
  { label: "Téléphone", value: ENTREPRISE.telephone },
  { label: "E-mail", value: ENTREPRISE.email },
];

const engagements = [
  { icon: "fas fa-file-signature", titre: "Un devis clair avant tout travail", texte: "Périmètre, délai et prix écrits noir sur blanc, validés par vous avant le démarrage." },
  { icon: "fas fa-user-check", titre: "Un interlocuteur unique", texte: "La même personne suit votre dossier du premier échange à la livraison." },
  { icon: "fas fa-lock", titre: "Vos documents restent confidentiels", texte: "Pièces stockées dans un espace privé, accessibles seulement à votre équipe et à la nôtre." },
];

async function temoignages() {
  try {
    return await prisma.testimonial.findMany({ where: { isVisible: true }, orderBy: { date: "desc" }, take: 3 });
  } catch {
    return [];
  }
}

export default async function TestimonialsSection() {
  const liste = await temoignages();
  const featured = liste[0];

  return (
    <section className="bg-white border-y border-primary/10 py-20">
      <div className="container-custom">
        <div className="grid lg:grid-cols-2 gap-16 items-start">
          <div>
            {featured ? (
              <>
                <span className="text-accent text-sm font-semibold uppercase tracking-widest block mb-8">Ils nous font confiance</span>
                <blockquote className="mb-8">
                  <p className="text-3xl sm:text-4xl font-bold text-primary leading-snug mb-6" style={{ fontFamily: "var(--font-cormorant), Georgia, serif", fontStyle: "italic" }}>
                    &ldquo;{featured.content}&rdquo;
                  </p>
                  <footer>
                    <cite className="not-italic text-sm text-primary/65 font-medium">
                      {featured.name} — {featured.role}{featured.company ? `, ${featured.company}` : ""}
                    </cite>
                  </footer>
                </blockquote>
                {liste.length > 1 && (
                  <div className="space-y-4 border-t border-primary/10 pt-8">
                    {liste.slice(1).map((t) => (
                      <div key={t.id} className="pb-4 border-b border-primary/5 last:border-0">
                        <p className="text-primary/70 text-sm italic leading-relaxed">&ldquo;{t.content}&rdquo;</p>
                        <p className="text-primary/65 text-xs mt-1">{t.name} — {t.role}{t.company ? `, ${t.company}` : ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <>
                <span className="text-accent text-sm font-semibold uppercase tracking-widest block mb-8">Nos engagements</span>
                <h2 className="text-3xl sm:text-4xl font-bold text-primary leading-snug mb-8" style={{ fontFamily: "var(--font-cormorant), Georgia, serif" }}>
                  Une entreprise jeune, des règles de travail simples et tenues.
                </h2>
                <div className="space-y-6">
                  {engagements.map((e) => (
                    <div key={e.titre} className="flex gap-4">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center flex-shrink-0">
                        <i className={`${e.icon} text-primary text-sm`} aria-hidden />
                      </div>
                      <div>
                        <p className="font-semibold text-primary">{e.titre}</p>
                        <p className="text-sm text-primary/65 leading-relaxed mt-0.5">{e.texte}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="lg:pt-12">
            <div className="bg-paper border border-primary/8 rounded-2xl p-8">
              <p className="text-xs font-semibold text-primary/65 uppercase tracking-widest mb-6">Informations légales</p>
              <table className="w-full text-sm">
                <tbody>
                  {legalInfo.map((row) => (
                    <tr key={row.label} className="border-b border-primary/6 last:border-0">
                      <td className="py-3 pr-4 text-primary/65 font-medium w-2/5">{row.label}</td>
                      <td className="py-3 text-primary font-semibold">{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-8 pt-6 border-t border-primary/8 space-y-3">
                {[
                  { icon: "fas fa-building", text: "Entreprise immatriculée au RCCM de Cotonou (OHADA)" },
                  { icon: "fas fa-calendar-check", text: `En activité depuis ${ENTREPRISE.anneeCreation}` },
                  { icon: "fas fa-location-dot", text: "Basée à Abomey-Calavi, interventions dans tout le Bénin" },
                ].map((item) => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-primary/65">
                    <i className={`${item.icon} text-accent text-xs w-4`} aria-hidden />
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
