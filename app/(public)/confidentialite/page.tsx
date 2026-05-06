/**
 * app/(public)/confidentialite/page.tsx — Politique de Confidentialité
 *
 * Page statique (Server Component) présentant la politique de protection
 * des données personnelles de SHIFT UP.
 *
 * Structure :
 *  - `sections` : tableau d'articles (id, titre, contenu) utilisés pour
 *    générer à la fois la table des matières (sidebar) et le corps de la page.
 *  - La sidebar est sticky sur desktop → reste visible pendant le scroll.
 *  - Les ancres (#collecte, #finalites, etc.) correspondent aux `id` des sections.
 *
 * ─── CONFORMITÉ LÉGALE ────────────────────────────────────────────────────────
 *  - Loi n°2017-20 portant Code du Numérique en République du Bénin
 *    (Articles 68 à 90 sur la protection des données personnelles)
 *  - Règlement n°C/REG.21/11/22 de la CEDEAO sur la protection des données
 *  - RGPD (Règlement UE 2016/679) — bonne pratique internationale
 *  - Base légale : contrat (Art. 71 CDN), consentement (Art. 72 CDN),
 *    intérêt légitime (Art. 73 CDN), obligation légale
 *
 * ─── AJOUTS OBLIGATOIRES (Code du Numérique Bénin) ──────────────────────────
 *  - Identité du Responsable de Traitement (Art. 68 CDN)
 *  - Délégué à la Protection des Données — DPO (Art. 75 CDN)
 *  - Durées de conservation par catégorie de données (Art. 76 CDN)
 *  - Droits des personnes : accès, rectification, effacement, portabilité (Art. 80 CDN)
 *  - Transferts internationaux de données (Art. 88 CDN — vers Vercel/Supabase USA)
 *  - Procédure de réclamation auprès de l'APDP (Art. 90 CDN)
 *    APDP = Autorité de Protection des Données à Caractère Personnel (Bénin)
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politique de Confidentialité | SHIFT UP",
  description: "Politique de confidentialité et protection des données personnelles de SHIFT UP — conforme au Code du Numérique béninois (Loi n°2017-20).",
};

/**
 * sections — Tableau de toutes les sections de la politique de confidentialité.
 *
 * Chaque section est rendue par la fonction renderContent() qui transforme
 * le Markdown simplifié (**, -, ##) en JSX.
 *
 * L'ordre des sections respecte les exigences de l'Article 69 du Code du
 * Numérique qui liste les informations obligatoires de la politique de
 * confidentialité :
 *  1. Identité du responsable (section "responsable")
 *  2. Données collectées
 *  3. Finalités
 *  4. Base légale
 *  5. Destinataires
 *  6. Durées de conservation
 *  7. Droits des personnes
 *  8. Transferts internationaux
 *  9. Cookies
 * 10. Contact DPO + réclamation APDP
 */
const sections = [
  {
    id: "responsable",
    title: "1. Responsable du traitement",
    content: `Conformément à l'**Article 68 de la Loi n°2017-20 portant Code du Numérique** en République du Bénin, le responsable du traitement de vos données personnelles est :

**SHIFT UP** — Entreprise individuelle (Établissement — Personne physique)
Propriétaire-exploitant : La Direction SHIFT UP
RCCM : RB/ABC/25 A 124734 — IFU : 0202113434116
Siège : Maison Léopold TCHIBOZO, Tankpe, Abomey-Calavi, Atlantique, Bénin
Email : contact@shiftup.bj — Tél : (+229) 01 95 03 50 99

**Délégué à la Protection des Données (DPO)** :
Conformément à l'Article 75 du Code du Numérique, SHIFT UP a désigné un DPO joignable à l'adresse : **dpo@shiftup.bj**
Pour toute question relative à vos données ou pour exercer vos droits, contactez directement le DPO.`,
  },
  {
    id: "collecte",
    title: "2. Données collectées",
    content: `Dans le cadre de nos services, SHIFT UP collecte les données personnelles suivantes :

**Données d'identification** : nom, prénom, adresse email, numéro de téléphone.

**Données professionnelles** : raison sociale, secteur d'activité, poste occupé, numéro IFU (pour les apporteurs d'affaires).

**Données de navigation** : adresse IP, pages visitées, durée des sessions, navigateur et système d'exploitation (via cookies et outils d'analyse).

**Données transactionnelles** : historique des prestations, montants réglés, modes de paiement utilisés.

**Données de communication** : messages envoyés via notre formulaire de contact, échanges avec notre chatbot IA.`,
  },
  {
    id: "finalites",
    title: "2. Finalités du traitement",
    content: `Vos données sont collectées et traitées pour les finalités suivantes :

- **Exécution des prestations** : gestion de votre espace client, suivi de vos projets, facturation.
- **Communication** : réponse à vos demandes, envoi d'informations relatives à vos prestations.
- **Amélioration des services** : analyse des comportements de navigation pour optimiser notre site.
- **Marketing** : envoi de notre newsletter (avec votre consentement explicite).
- **Obligations légales** : conservation des données comptables et fiscales conformément à la législation béninoise.
- **Sécurité** : détection et prévention des fraudes et accès non autorisés.`,
  },
  {
    id: "base-legale",
    title: "3. Base légale du traitement",
    content: `Le traitement de vos données repose sur les bases légales suivantes :

- **Exécution du contrat** : pour les données nécessaires à la fourniture de nos services.
- **Consentement** : pour la newsletter, les cookies non essentiels et les communications marketing.
- **Intérêt légitime** : pour l'analyse de navigation et la sécurité de notre plateforme.
- **Obligation légale** : pour la conservation des données comptables et fiscales.`,
  },
  {
    id: "conservation",
    title: "4. Durée de conservation",
    content: `Nous conservons vos données pour les durées suivantes :

- **Données de compte** : durée de votre relation contractuelle avec SHIFT UP, plus 3 ans après la résiliation.
- **Données comptables et fiscales** : 10 ans conformément au Code Général des Impôts du Bénin.
- **Données de navigation** : 13 mois maximum.
- **Logs de sécurité** : 6 mois.
- **Données de newsletter** : jusqu'à votre désinscription.

À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.`,
  },
  {
    id: "partage",
    title: "5. Partage des données",
    content: `SHIFT UP ne vend jamais vos données personnelles à des tiers. Vos données peuvent être partagées avec :

**Prestataires techniques** (sous-traitants) :
- Supabase (hébergement base de données, USA) — adhère aux clauses contractuelles types RGPD.
- Vercel (hébergement web, USA) — certifié SOC 2 Type 2.
- Google (analytics, IA) — adhère au Data Privacy Framework.
- FedaPay (paiements mobile money, Bénin).
- Stripe (paiements carte bancaire, USA) — certifié PCI-DSS.

Ces prestataires n'utilisent vos données que pour les finalités pour lesquelles ils ont été mandatés.

**Autorités légales** : en cas d'obligation légale ou de réquisition judiciaire.`,
  },
  {
    id: "droits",
    title: "6. Vos droits",
    content: `Conformément aux lois applicables en matière de protection des données, vous disposez des droits suivants :

- **Droit d'accès** : obtenir une copie des données vous concernant.
- **Droit de rectification** : corriger des données inexactes ou incomplètes.
- **Droit à l'effacement** : demander la suppression de vos données (sous réserve des obligations légales).
- **Droit à la portabilité** : recevoir vos données dans un format structuré et lisible.
- **Droit d'opposition** : vous opposer au traitement de vos données à des fins de marketing.
- **Droit de retrait du consentement** : à tout moment, pour les traitements fondés sur votre consentement.

Pour exercer ces droits, contactez-nous à : **contact@shiftup.bj** ou par courrier à notre siège social (Abomey-Calavi, Atlantique, Bénin).

Nous nous engageons à répondre dans un délai maximum de **30 jours**.`,
  },
  {
    id: "durees",
    title: "7. Durées de conservation",
    content: `Conformément à l'**Article 76 du Code du Numérique béninois**, vos données sont conservées uniquement le temps nécessaire aux finalités pour lesquelles elles ont été collectées :

**Compte utilisateur** : Pendant la durée de la relation contractuelle + 3 ans après la clôture du compte.

**Données de prestations et factures** : 10 ans à compter de la dernière opération (obligation comptable et fiscale — droit béninois).

**Données de navigation (cookies analytiques)** : 13 mois maximum.

**Données de contact** : 3 ans à compter du dernier contact, sauf demande d'effacement.

**Logs de sécurité (audit logs)** : 12 mois glissants.

**Tokens de réinitialisation de mot de passe** : 1 heure (expiration automatique).

À l'expiration de ces délais, vos données sont supprimées ou anonymisées de manière irréversible.`,
  },
  {
    id: "transferts",
    title: "8. Transferts internationaux de données",
    content: `Conformément à l'**Article 88 du Code du Numérique béninois**, nous vous informons que certaines de vos données sont transférées hors du Bénin auprès de nos prestataires techniques :

**Vercel Inc.** (États-Unis) — Hébergement de l'application web.
Garantie : Vercel est certifié SOC 2 Type II et GDPR-compliant. Les transferts vers les États-Unis sont encadrés par les clauses contractuelles types de la Commission Européenne.

**Supabase Inc.** (Singapour/États-Unis) — Base de données et stockage de fichiers.
Garantie : Supabase est certifié SOC 2 Type II. Vos données sont chiffrées en transit (TLS) et au repos (AES-256).

**Google LLC** (États-Unis) — Google Analytics (uniquement si vous avez consenti aux cookies analytiques).
Garantie : Google est soumis au cadre de protection des données UE–États-Unis (EU-U.S. Data Privacy Framework).

Ces transferts sont nécessaires à la fourniture de nos services. Vous pouvez retirer votre consentement aux cookies analytiques à tout moment via notre bannière de gestion des cookies.`,
  },
  {
    id: "cookies",
    title: "9. Politique de cookies",
    content: `Notre site utilise des cookies. Conformément à l'**Article 72 du Code du Numérique béninois**, les cookies non essentiels ne sont déposés qu'avec votre consentement explicite.

**Cookies essentiels** (toujours actifs — aucun consentement requis) :
- next-auth.session-token : Cookie de session sécurisé (HttpOnly, Secure, SameSite)
- next-auth.csrf-token : Protection contre les attaques CSRF
- shiftup-cookie-consent : Mémorise vos préférences de cookies (1 an)

**Cookies analytiques** (uniquement avec votre consentement) :
- Google Analytics 4 (_ga, _ga_*) : Mesure d'audience anonymisée — durée max 13 mois.
Activés via le Consent Mode v2 de Google : aucune donnée n'est collectée avant votre accord.

Vous pouvez modifier vos préférences à tout moment en cliquant sur "Gérer mes cookies" en bas de chaque page, ou en supprimant les cookies de votre navigateur.`,
  },
  {
    id: "securite",
    title: "10. Sécurité des données",
    content: `SHIFT UP met en œuvre les mesures techniques et organisationnelles suivantes pour protéger vos données :

- Chiffrement des données en transit (HTTPS/TLS 1.3) et au repos (AES-256).
- Authentification sécurisée avec tokens JWT httpOnly et refresh tokens.
- Hachage des mots de passe avec bcrypt (coût 12).
- Accès aux données restreint selon le principe du moindre privilège.
- Journalisation des accès et actions critiques (audit logs).
- Sauvegardes automatiques quotidiennes chiffrées via Supabase.
- Tests de sécurité réguliers.

En cas de violation de données susceptible d'engendrer un risque élevé pour vos droits, nous nous engageons à vous en informer dans les meilleurs délais.`,
  },
  {
    id: "contact-dpo",
    title: "12. Contact DPO & Réclamation APDP",
    content: `**Délégué à la Protection des Données (DPO)** :
Pour exercer vos droits (accès, rectification, effacement, portabilité, opposition) ou pour toute question relative à vos données personnelles, contactez notre DPO :

Email : **dpo@shiftup.bj**
Délai de réponse : **30 jours maximum** (conformément à l'Art. 82 CDN)

**Réclamation auprès de l'Autorité de Contrôle** :
Conformément à l'**Article 90 du Code du Numérique béninois**, si vous estimez que le traitement de vos données porte atteinte à vos droits, vous avez le droit de déposer une réclamation auprès de :

**APDP — Autorité de Protection des Données à Caractère Personnel du Bénin**
Organe de contrôle institué par la Loi n°2017-20
Site officiel : www.apdp.bj (en cours de déploiement)
Email : contact@apdp.bj

Cette réclamation peut être déposée sans préjudice de tout recours juridictionnel.`,
  },
  {
    id: "modifications",
    title: "13. Modifications de la politique",
    content: `SHIFT UP se réserve le droit de modifier la présente politique de confidentialité à tout moment, notamment pour se conformer à l'évolution de la réglementation applicable.

En cas de modification substantielle, vous serez informé par email ou via une notification sur notre site au moins 15 jours avant l'entrée en vigueur des modifications.

La date de dernière mise à jour figure en bas de cette page. L'utilisation continue de notre site après notification vaut acceptation des modifications.`,
  },
];

export default function ConfidentialitePage() {
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <section className="bg-primary pt-28 pb-16 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-gradient opacity-50" />
        <div className="container-custom relative z-10 max-w-3xl">
          <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-4 py-2 rounded-full text-sm font-medium mb-6">
            <i className="fas fa-shield-halved" />
            Protection des données
          </span>
          <h1 className="font-syne font-black text-4xl sm:text-5xl text-white mb-4">
            Politique de <span className="gradient-text">Confidentialité</span>
          </h1>
          <p className="text-white/60 text-lg">
            SHIFT UP s'engage à protéger vos données personnelles conformément aux législations applicables.
          </p>
          <p className="text-white/40 text-sm mt-4">
            Dernière mise à jour : 1er mars 2026
          </p>
        </div>
      </section>

      <section className="section-padding bg-paper">
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
            <div className="lg:col-span-3 space-y-6">
              <div className="bg-accent/5 border border-accent/20 rounded-2xl p-5 flex gap-4">
                <i className="fas fa-circle-info text-accent text-xl flex-shrink-0 mt-0.5" />
                <p className="text-sm text-gray-600 leading-relaxed">
                  Cette politique de confidentialité s'applique à l'ensemble des services proposés par SHIFT UP, incluant le site web shiftup.bj, l'espace client et les API associées. En utilisant nos services, vous reconnaissez avoir pris connaissance de cette politique.
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
                    {section.content.split("\n\n").map((para, i) => {
                      if (para.startsWith("**") && para.includes("**\n")) {
                        const [header, ...rest] = para.split("\n");
                        return (
                          <div key={i}>
                            <p className="font-semibold text-primary mb-1 text-sm">
                              {header.replace(/\*\*/g, "")}
                            </p>
                            {rest.map((line, j) => (
                              <p key={j} className="text-gray-600 text-sm leading-relaxed">
                                {line}
                              </p>
                            ))}
                          </div>
                        );
                      }
                      return para.split("\n").map((line, j) => {
                        if (line.startsWith("- ")) {
                          return (
                            <div key={j} className="flex items-start gap-2">
                              <i className="fas fa-chevron-right text-accent text-xs mt-1.5 flex-shrink-0" />
                              <p className="text-gray-600 text-sm leading-relaxed">
                                {line.replace("- ", "").replace(/\*\*(.*?)\*\*/g, "$1")}
                              </p>
                            </div>
                          );
                        }
                        if (line.trim() === "") return null;
                        return (
                          <p key={j} className="text-gray-600 text-sm leading-relaxed">
                            {line.replace(/\*\*(.*?)\*\*/g, "$1")}
                          </p>
                        );
                      });
                    })}
                  </div>
                </div>
              ))}

              {/* Contact CTA */}
              <div className="bg-primary rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-5">
                <div className="w-12 h-12 bg-accent/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <i className="fas fa-envelope text-accent text-xl" />
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-white font-semibold">Une question sur vos données ?</p>
                  <p className="text-white/50 text-sm mt-0.5">Contactez-nous, nous répondons sous 48h.</p>
                </div>
                <Link
                  href="/contact"
                  className="bg-accent hover:bg-accent/90 text-white text-sm font-semibold px-6 py-2.5 rounded-xl transition-colors flex-shrink-0"
                >
                  Nous contacter
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
