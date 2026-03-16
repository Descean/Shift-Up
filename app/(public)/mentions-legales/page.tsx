/**
 * app/(public)/mentions-legales/page.tsx — Mentions Légales de SHIFT UP
 *
 * Page obligatoire selon :
 *  - Article 16 de la Loi n°2017-20 portant Code du Numérique en République du Bénin
 *    → Tout éditeur d'un service de communication au public en ligne doit rendre
 *      accessibles ses mentions légales.
 *  - Articles L.111-1 et suivants du Code de la consommation (UEMOA/OHADA)
 *    → Identification claire du professionnel avant toute relation commerciale.
 *
 * ─── INFORMATIONS OBLIGATOIRES ───────────────────────────────────────────────
 *
 * 1. Identité de l'éditeur (personne morale) :
 *    - Raison sociale, forme juridique, capital
 *    - RCCM (Registre de Commerce et du Crédit Mobilier)
 *    - N° IFU (Identifiant Fiscal Unique)
 *    - Siège social
 *    - Représentant légal
 *    - Contact
 *
 * 2. Hébergeur :
 *    - Nom, adresse, contact de l'hébergeur
 *
 * 3. Directeur de la publication :
 *    - Nom et qualité du responsable éditorial
 *
 * 4. Propriété intellectuelle :
 *    - Droits sur les contenus, marques, logos
 *
 * 5. Responsabilité :
 *    - Limite de responsabilité pour les liens externes
 *
 * ─── INSTRUCTION POUR L'ADMINISTRATEUR ──────────────────────────────────────
 * Les champs marqués [À COMPLÉTER] doivent être remplis avec les vraies
 * informations de l'entreprise SHIFT UP (RCCM, IFU, capital social, etc.)
 * avant la mise en production du site.
 */

import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Mentions Légales | SHIFT UP",
  description: "Mentions légales de SHIFT UP — Cabinet de conseil stratégique et solutions numériques au Bénin.",
  robots: { index: true, follow: true },
};

// ─── Contenu des sections de mentions légales ─────────────────────────────────

const sections = [
  {
    id: "editeur",
    title: "1. Éditeur du site",
    content: `Le présent site internet accessible à l'adresse **https://shiftup.bj** est édité par :

**Nom commercial** : SHIFT UP
**Forme juridique** : Entreprise individuelle (Établissement — Personne physique)
**Régime fiscal** : Micro et petites entreprises
**Propriétaire-exploitant** : La Direction SHIFT UP
**N° RCCM** : RB/ABC/25 A 124734 (Greffe du Tribunal de Commerce de Cotonou — 30/05/2025)
**N° IFU** : 0202113434116 (Centre des impôts : CIPE 3 AB-CAL)
**Siège social** : Maison Léopold TCHIBOZO, Tankpe, Abomey-Calavi, Département de l'Atlantique, République du Bénin
**Email** : shiftup.eudes@gmail.com
**Téléphone** : (+229) 01 95 03 50 99
**Activité exercée** : Activités juridiques, comptables et de conseil de gestion ; Bureau d'études ; Édition de logiciels et solutions numériques ; Conseil en transformation numérique ; Formation et Coaching ; Marketing et communication ; Gestion de projets ; Analyses de données et Business Intelligence`,
  },
  {
    id: "directeur-publication",
    title: "2. Directeur de la publication",
    content: `Le directeur de la publication est :

**La Direction SHIFT UP**, Propriétaire-exploitant.

Conformément à l'Article 16 de la Loi n°2017-20 portant Code du Numérique en République du Bénin, le directeur de la publication est responsable du contenu éditorial diffusé sur ce site.`,
  },
  {
    id: "hebergeur",
    title: "3. Hébergeur du site",
    content: `Le site est hébergé par :

**Vercel Inc.**
440 N Barranca Ave #4133
Covina, CA 91723, États-Unis
Email : support@vercel.com
Site : https://vercel.com

**Base de données** hébergée par :
**Supabase Inc.**
970 Toa Payoh North, #07-04 Singapore 318992
Site : https://supabase.com

Ces prestataires disposent de certifications de conformité aux normes de sécurité internationales (ISO 27001, SOC 2 Type II).`,
  },
  {
    id: "propriete-intellectuelle",
    title: "4. Propriété intellectuelle",
    content: `L'ensemble des éléments constitutifs de ce site (textes, graphismes, logotypes, icônes, images, sons, logiciels) sont la propriété exclusive de SHIFT UP ou de ses partenaires, et sont protégés par les dispositions des lois nationales et internationales relatives à la propriété intellectuelle.

Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable de SHIFT UP.

**Marque** : La marque "SHIFT UP" et son logotype sont des marques commerciales déposées ou en cours de dépôt. Toute utilisation non autorisée est interdite.

**Crédits** : Icônes Font Awesome (fontawesome.com) — Polices Google Fonts (Syne, Space Grotesk).`,
  },
  {
    id: "donnees-personnelles",
    title: "5. Données personnelles",
    content: `Le traitement des données personnelles des utilisateurs est régi par notre **Politique de Confidentialité**, accessible à l'adresse : [/confidentialite](/confidentialite).

SHIFT UP est responsable du traitement des données personnelles collectées sur ce site conformément à :
- La **Loi n°2017-20** portant Code du Numérique en République du Bénin (Articles 68 à 90)
- Le **Règlement n°C/REG.21/11/22 de la CEDEAO** sur la protection des données personnelles

**Délégué à la Protection des Données (DPO)** :
Pour toute question relative à vos données personnelles ou pour exercer vos droits (accès, rectification, effacement, portabilité), contactez notre DPO à l'adresse : **dpo@shiftup.bj**`,
  },
  {
    id: "cookies",
    title: "6. Cookies",
    content: `Ce site utilise des cookies. Lors de votre première visite, une bannière vous informe de l'utilisation de cookies non essentiels et vous permet d'accepter ou de refuser leur dépôt.

**Cookies essentiels** (toujours actifs) : Nécessaires au fonctionnement du site (session, sécurité CSRF). Aucun consentement requis.

**Cookies analytiques** (sur consentement) : Google Analytics 4 — mesure d'audience anonymisée. Activé uniquement après votre accord explicite.

Vous pouvez modifier vos préférences à tout moment en cliquant sur "Gérer mes cookies" en bas de page.

Conformité : **Code du Numérique Bénin, Articles 70 à 76**.`,
  },
  {
    id: "responsabilite",
    title: "7. Limitation de responsabilité",
    content: `SHIFT UP s'efforce d'assurer l'exactitude et la mise à jour des informations diffusées sur ce site. Toutefois, SHIFT UP ne peut garantir l'exactitude, la complétude ou la pertinence de ces informations.

SHIFT UP décline toute responsabilité :
- Pour toute interruption du site liée à des opérations de maintenance
- Pour les dommages résultant d'intrusions frauduleuses de tiers
- Pour le contenu des sites tiers vers lesquels des liens hypertextes sont établis

La présence de liens hypertextes sur ce site vers d'autres sites ne constitue pas une validation de ces sites ou de leur contenu.`,
  },
  {
    id: "droit-applicable",
    title: "8. Droit applicable et juridiction",
    content: `Les présentes mentions légales sont régies par le droit béninois.

En cas de litige relatif à l'interprétation ou à l'exécution des présentes, les parties s'engagent à rechercher une solution amiable. À défaut, les tribunaux compétents du **Tribunal de Commerce de Cotonou** seront seuls compétents.

**Références légales** :
- Loi n°2017-20 du 20 avril 2018 portant Code du Numérique en République du Bénin
- Loi n°2004-05 du 14 octobre 2004 relative aux communications électroniques
- Acte Uniforme OHADA relatif aux sociétés commerciales
- Règlement de l'UEMOA sur le commerce électronique`,
  },
  {
    id: "contact",
    title: "9. Contact",
    content: `Pour toute question relative aux présentes mentions légales, vous pouvez nous contacter :

**Par email** : shiftup.eudes@gmail.com
**Par téléphone** : (+229) 01 95 03 50 99
**Par courrier** : SHIFT UP — Abomey-Calavi, Atlantique, République du Bénin
**Via notre formulaire** : [/contact](/contact)

**Délégué à la Protection des Données (DPO)** : dpo@shiftup.bj

*Dernière mise à jour : Mars 2026*`,
  },
];

// ─── Rendu du contenu Markdown simplifié ─────────────────────────────────────

/**
 * renderContent — Convertit les balises Markdown basiques en HTML/JSX.
 * Traite : **gras**, liens [texte](url), retours à la ligne, listes à puces.
 */
function renderContent(text: string): React.ReactNode {
  return text.split("\n").map((line, i) => {
    // Ligne vide → espace
    if (!line.trim()) return <br key={i} />;

    // Gras : remplace **texte** par <strong>texte</strong>
    const boldProcessed = line.replace(/\*\*(.+?)\*\*/g, (_, t) => `<strong>${t}</strong>`);
    // Liens : remplace [texte](url) par <a href="url">texte</a>
    const linkProcessed = boldProcessed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (_, label, href) => `<LINK:${href}:${label}>`
    );

    // Rendu ligne par ligne
    const parts = linkProcessed.split(/(<LINK:[^>]+>|<strong>[^<]+<\/strong>)/);
    const rendered = parts.map((part, j) => {
      if (part.startsWith("<LINK:")) {
        const [, href, label] = part.match(/<LINK:([^:]+):([^>]+)>/) || [];
        return href ? (
          <Link key={j} href={href} className="text-accent hover:underline">
            {label}
          </Link>
        ) : null;
      }
      if (part.startsWith("<strong>")) {
        const innerText = part.replace(/<\/?strong>/g, "");
        return <strong key={j}>{innerText}</strong>;
      }
      return part;
    });

    // Ligne de liste à puces
    if (line.startsWith("- ")) {
      return (
        <li key={i} className="ml-4 list-disc text-gray-600 text-sm">
          {rendered}
        </li>
      );
    }

    return (
      <p key={i} className="text-gray-600 text-sm leading-relaxed">
        {rendered}
      </p>
    );
  });
}

// ─── Composant page ───────────────────────────────────────────────────────────

export default function MentionsLegalesPage() {
  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="bg-primary pt-28 pb-14">
        <div className="container-custom">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-2 bg-accent/15 text-accent px-3 py-1.5 rounded-full text-xs font-medium">
              <i className="fas fa-scale-balanced" />
              Informations légales
            </span>
          </div>
          <h1 className="font-syne font-black text-4xl text-white mb-3">
            Mentions Légales
          </h1>
          <p className="text-white/60 max-w-xl">
            Conformément à la Loi n°2017-20 portant Code du Numérique en République du Bénin,
            SHIFT UP vous informe des éléments légaux relatifs à ce site.
          </p>
        </div>
      </section>

      {/* ── Contenu principal ──────────────────────────────────────────── */}
      <section className="section-padding">
        <div className="container-custom">
          <div className="grid lg:grid-cols-4 gap-10">

            {/* ── Sidebar — Table des matières sticky ───────────────────── */}
            <aside className="lg:col-span-1">
              <div className="sticky top-24 bg-white rounded-2xl shadow-card p-5">
                <p className="font-syne font-bold text-primary text-sm mb-4">
                  <i className="fas fa-list-ul mr-2 text-accent" />
                  Sommaire
                </p>
                <nav className="space-y-1.5">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="block text-xs text-gray-500 hover:text-accent transition-colors py-1 pl-2 border-l-2 border-transparent hover:border-accent"
                    >
                      {s.title}
                    </a>
                  ))}
                </nav>

                {/* Avertissement champs à compléter */}
                <div className="mt-5 bg-amber-50 rounded-xl p-3 text-xs text-amber-700">
                  <i className="fas fa-triangle-exclamation mr-1" />
                  Les champs <strong>[À COMPLÉTER]</strong> doivent être renseignés avec les vraies informations
                  de l'entreprise avant la mise en production.
                </div>
              </div>
            </aside>

            {/* ── Corps des mentions légales ────────────────────────────── */}
            <main className="lg:col-span-3 space-y-6">
              {sections.map((section) => (
                <div
                  key={section.id}
                  id={section.id}
                  className="bg-white rounded-2xl shadow-card p-6 scroll-mt-28"
                >
                  <h2 className="font-syne font-bold text-primary text-lg mb-4 pb-3 border-b border-gray-100">
                    {section.title}
                  </h2>
                  <div className="space-y-1.5">
                    {renderContent(section.content)}
                  </div>
                </div>
              ))}

              {/* ── Liens de navigation ─────────────────────────────────── */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Link
                  href="/confidentialite"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <i className="fas fa-shield-halved text-xs" />
                  Politique de confidentialité
                </Link>
                <Link
                  href="/cgv"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <i className="fas fa-file-contract text-xs" />
                  Conditions Générales de Vente
                </Link>
                <Link
                  href="/contact"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <i className="fas fa-envelope text-xs" />
                  Nous contacter
                </Link>
              </div>
            </main>
          </div>
        </div>
      </section>
    </div>
  );
}
