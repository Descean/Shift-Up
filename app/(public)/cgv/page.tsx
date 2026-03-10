/**
 * app/(public)/cgv/page.tsx — Conditions Générales de Vente
 *
 * Page statique (Server Component) présentant les CGV de SHIFT UP.
 *
 * Structure :
 *  - `sections` : tableau de 12 articles (id, titre, contenu) couvrant :
 *    objet, identification du prestataire, description des services, formation
 *    du contrat, tarifs & modalités de paiement (acompte 40% / solde 60%),
 *    exécution, livraison, annulation, responsabilité, données personnelles,
 *    droit applicable (droit béninois + OHADA), dispositions diverses.
 *  - La sidebar est sticky sur desktop avec la table des matières.
 *  - Les ancres (#objet, #prestataire, etc.) permettent la navigation directe.
 *
 * Droit applicable :
 *  - Droit béninois et droit OHADA (Organisation pour l'Harmonisation
 *    en Afrique du Droit des Affaires).
 *  - Juridiction compétente : Tribunal de Commerce de Cotonou.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Conditions Générales de Vente | SHIFT UP",
  description:
    "Conditions générales de vente et d'utilisation des services SHIFT UP — Cabinet de conseil stratégique et solutions numériques au Bénin.",
};

const sections = [
  {
    id: "objet",
    title: "Article 1 — Objet",
    content: `Les présentes Conditions Générales de Vente (CGV) régissent l'ensemble des relations commerciales entre SHIFT UP (ci-après "le Prestataire") et tout client ou utilisateur (ci-après "le Client") ayant recours à ses services, que ce soit en ligne via le site shiftup.bj ou lors d'une prestation hors ligne.

Toute commande de service implique l'acceptation pleine et entière des présentes CGV. En cas de contradiction entre les CGV et tout autre document, les CGV prévalent, sauf accord écrit contraire des parties.`,
  },
  {
    id: "prestataire",
    title: "Article 2 — Identification du Prestataire",
    content: `**Raison sociale** : SHIFT UP
**Forme juridique** : Entreprise individuelle / Cabinet de conseil
**RCCM** : RB/ABC/25 A 124734
**IFU** : 0202113434116
**Siège social** : Abomey-Calavi, Atlantique, République du Bénin
**Dirigeant** : Jean-Eudes MÈTOGBÉ GNANCADJA
**Email** : shiftup.eudes@gmail.com
**Téléphone** : (+229) 01 95 03 50 99
**Site web** : https://shiftup.bj`,
  },
  {
    id: "services",
    title: "Article 3 — Description des services",
    content: `SHIFT UP propose les services suivants, regroupés en six domaines :

1. **Conseil Stratégique** : diagnostic, business plan, stratégie de croissance.
2. **Solutions Numériques** : développement web, applications mobiles, intégration IA.
3. **Formation & Coaching** : formations en présentiel, coaching dirigeant, e-learning.
4. **Marketing Digital** : stratégie, gestion réseaux sociaux, SEO et publicité.
5. **Juridique & Fiscal** : création d'entreprise, conformité OHADA, rédaction de contrats.
6. **Finance & Comptabilité** : plan financier, levée de fonds, externalisation comptable.

Les caractéristiques détaillées de chaque service sont disponibles sur la page Services du site. SHIFT UP se réserve le droit de modifier son offre de services à tout moment.`,
  },
  {
    id: "commande",
    title: "Article 4 — Formation du contrat",
    content: `La relation contractuelle est formée par :

1. **La demande** : le Client soumet sa demande via le formulaire en ligne, par email ou lors d'un rendez-vous.
2. **Le devis** : SHIFT UP établit un devis personnalisé précisant la nature de la prestation, le délai et le montant.
3. **L'acceptation** : le Client retourne le devis signé (ou accepte par email explicite).
4. **L'acompte** : le versement de l'acompte (40% du montant total) vaut confirmation définitive de la commande et déclenche le démarrage de la prestation.

Toute commande n'est définitivement validée qu'à réception de l'acompte. SHIFT UP se réserve le droit de refuser toute commande sans obligation de justification.`,
  },
  {
    id: "tarifs",
    title: "Article 5 — Tarifs et modalités de paiement",
    content: `**Prix** : Les tarifs affichés sur le site sont indicatifs et exprimés en Francs CFA (FCFA) hors taxes. Un devis personnalisé est établi pour chaque prestation.

**Acompte** : 40% du montant total de la prestation est exigible à la signature du devis, avant tout démarrage de travaux.

**Solde** : Le solde (60%) est dû à la livraison finale du service, avant remise des livrables définitifs.

**Modes de paiement acceptés** :
- MTN Mobile Money (Bénin)
- Moov Money (Bénin)
- Carte bancaire Visa / Mastercard (via Stripe)
- Virement bancaire (sur demande pour montants supérieurs à 500 000 FCFA)

**Factures** : Une facture officielle avec IFU et RCCM est émise pour chaque paiement.

**Retard de paiement** : Tout retard de paiement supérieur à 15 jours après échéance peut entraîner la suspension de la prestation et des pénalités de retard de 1% par mois de retard.`,
  },
  {
    id: "execution",
    title: "Article 6 — Exécution des prestations",
    content: `**Délais** : Les délais indiqués dans le devis sont donnés à titre indicatif et peuvent varier en fonction de la complexité du projet et de la réactivité du Client.

**Obligations du Client** : Le Client s'engage à fournir en temps utile toutes les informations, documents et accès nécessaires à la bonne exécution de la prestation. Tout retard imputable au Client peut entraîner un report des délais de livraison sans pénalité pour SHIFT UP.

**Suivi** : Le Client dispose d'un espace personnel sur shiftup.bj lui permettant de suivre l'avancement de ses prestations en temps réel.

**Révisions** : Sauf mention contraire dans le devis, chaque prestation inclut un nombre limité de révisions (précisé dans le devis). Les révisions supplémentaires feront l'objet d'une facturation complémentaire.`,
  },
  {
    id: "livraison",
    title: "Article 7 — Livraison et réception",
    content: `**Livraison** : Les livrables sont remis par voie électronique (email, espace client, lien sécurisé) ou en présentiel selon la nature de la prestation.

**Réception** : Le Client dispose de 7 jours calendaires à compter de la livraison pour signaler tout manquement ou non-conformité. Passé ce délai, la prestation est réputée acceptée.

**Transfert de propriété** : Les livrables (documents, codes sources, designs) sont transférés au Client uniquement après règlement intégral du solde dû.

**Droits de propriété intellectuelle** : Les créations originales réalisées par SHIFT UP dans le cadre d'une prestation appartiennent au Client après paiement complet. SHIFT UP conserve le droit de mentionner la prestation dans son portfolio (sauf accord de confidentialité spécifique).`,
  },
  {
    id: "annulation",
    title: "Article 8 — Annulation et remboursement",
    content: `**Annulation par le Client avant démarrage** : Si le Client annule sa commande avant le démarrage de la prestation, l'acompte versé est retenu par SHIFT UP à titre d'indemnité de réservation.

**Annulation par le Client en cours de prestation** : Les sommes versées correspondant aux travaux réalisés sont dues et acquises. Un décompte des travaux effectués sera établi.

**Annulation par SHIFT UP** : En cas d'annulation par SHIFT UP (cas de force majeure, impossibilité d'exécution), l'acompte versé est intégralement remboursé. Aucune indemnité supplémentaire ne pourra être réclamée.

**Droit de rétractation** : Conformément aux dispositions du droit béninois, le droit de rétractation de 14 jours ne s'applique pas aux services ayant déjà été intégralement exécutés avec l'accord du Client.`,
  },
  {
    id: "responsabilite",
    title: "Article 9 — Responsabilité",
    content: `**Obligation de moyens** : SHIFT UP est soumis à une obligation de moyens. Elle s'engage à mettre en œuvre tous les moyens nécessaires pour la bonne exécution de ses missions, sans pouvoir garantir un résultat spécifique.

**Limitation** : La responsabilité de SHIFT UP est limitée au montant des honoraires perçus pour la prestation concernée. SHIFT UP ne saurait être tenue responsable des dommages indirects, pertes de bénéfices ou manques à gagner.

**Force majeure** : SHIFT UP ne pourra être tenue responsable des retards ou inexécutions causés par des événements indépendants de sa volonté (catastrophes naturelles, coupures internet, pannes de fournisseurs, troubles civils, etc.).

**Confidentialité** : SHIFT UP s'engage à maintenir la confidentialité de toutes les informations transmises par le Client dans le cadre de la prestation.`,
  },
  {
    id: "donnees",
    title: "Article 10 — Données personnelles",
    content: `Le traitement des données personnelles collectées dans le cadre de la relation commerciale est régi par notre Politique de Confidentialité, disponible sur shiftup.bj/confidentialite.

Conformément aux lois applicables, vous disposez d'un droit d'accès, de rectification et de suppression de vos données. Pour exercer ces droits, contactez-nous à shiftup.eudes@gmail.com.`,
  },
  {
    id: "droit",
    title: "Article 11 — Droit applicable et litiges",
    content: `Les présentes CGV sont régies par le droit béninois et le droit OHADA en vigueur.

**Règlement amiable** : En cas de litige, les parties s'engagent à chercher une solution amiable avant tout recours judiciaire. Le Client peut adresser une réclamation écrite à shiftup.eudes@gmail.com. SHIFT UP s'engage à répondre dans un délai de 15 jours ouvrables.

**Juridiction compétente** : À défaut de règlement amiable, tout litige sera soumis à la compétence exclusive des tribunaux d'Abomey-Calavi ou de Cotonou, République du Bénin.`,
  },
  {
    id: "divers",
    title: "Article 12 — Dispositions diverses",
    content: `**Intégralité** : Les présentes CGV constituent l'intégralité de l'accord entre les parties concernant leur objet.

**Divisibilité** : Si l'une des dispositions des présentes CGV est jugée invalide ou inapplicable, les autres dispositions restent pleinement en vigueur.

**Non-renonciation** : Le fait pour SHIFT UP de ne pas se prévaloir d'un manquement du Client à l'une quelconque de ses obligations ne saurait être interprété comme une renonciation à l'obligation en cause.

**Modification** : SHIFT UP se réserve le droit de modifier les présentes CGV à tout moment. Les CGV applicables sont celles en vigueur au moment de la confirmation de la commande.`,
  },
];

export default function CGVPage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
            <i className="fas fa-file-contract" />
            Cadre contractuel
          </span>
          <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4">
            Conditions Générales <span className="gradient-text">de Vente</span>
          </h1>
          <p className="text-white/60 text-lg">
            Les présentes CGV définissent les droits et obligations de SHIFT UP et de ses clients dans le cadre des prestations de services.
          </p>
          <p className="text-white/40 text-sm mt-4">
            En vigueur depuis le 1er mars 2026 — Version 1.0
          </p>
        </div>
      </section>

      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid lg:grid-cols-4 gap-8">
            {/* Table of contents */}
            <aside className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-card p-5 sticky top-24">
                <h3 className="font-syne font-bold text-primary text-sm mb-4 uppercase tracking-widest">
                  Sommaire
                </h3>
                <nav className="space-y-1">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-xs text-gray-500 hover:text-accent py-1.5 px-2 rounded-lg hover:bg-accent/5 transition-colors"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>
              </div>
            </aside>

            {/* Content */}
            <div className="lg:col-span-3 space-y-5">
              <div className="bg-secondary/5 border border-secondary/20 rounded-2xl p-5 flex gap-4">
                <i className="fas fa-circle-check text-secondary text-xl flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  En créant un compte, en passant une commande ou en utilisant les services de SHIFT UP, vous reconnaissez avoir lu, compris et accepté les présentes Conditions Générales de Vente dans leur intégralité.
                </p>
              </div>

              {sections.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-2xl shadow-card p-6 md:p-8 scroll-mt-24"
                >
                  <h2 className="font-syne font-bold text-xl text-primary mb-5 pb-3 border-b border-gray-100">
                    {section.title}
                  </h2>
                  <div className="space-y-3">
                    {section.content.split("\n\n").map((para, i) =>
                      para.split("\n").map((line, j) => {
                        if (line.trim() === "") return null;
                        if (line.startsWith("- ")) {
                          return (
                            <div key={`${i}-${j}`} className="flex items-start gap-2">
                              <i className="fas fa-chevron-right text-accent text-xs mt-1.5 flex-shrink-0" />
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "$1")}
                              </p>
                            </div>
                          );
                        }
                        return (
                          <p key={`${i}-${j}`} className="text-gray-600 text-sm leading-relaxed">
                            {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                          </p>
                        );
                      })
                    )}
                  </div>
                </div>
              ))}

              {/* Contact */}
              <div className="bg-primary rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-white font-semibold">Vous avez des questions sur ces conditions ?</p>
                  <p className="text-white/50 text-sm mt-0.5">Notre équipe est disponible pour vous éclairer.</p>
                </div>
                <div className="flex gap-3 flex-shrink-0">
                  <Link
                    href="/contact"
                    className="bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Nous contacter
                  </Link>
                  <a
                    href="mailto:shiftup.eudes@gmail.com"
                    className="bg-white/10 hover:bg-white/20 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors"
                  >
                    Email direct
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
