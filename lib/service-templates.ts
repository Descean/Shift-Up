/**
 * lib/service-templates.ts
 *
 * Génère automatiquement les phases d'une prestation selon le domaine du service.
 * Utilisé lors du passage en statut EN_COURS (paiement confirmé).
 */

export interface PhaseTemplate {
  title: string;
  description: string;
  duration: string; // indicatif
  order: number;
}

const templates: Record<string, PhaseTemplate[]> = {
  "Conseil Stratégique": [
    { title: "Diagnostic & Audit", description: "Analyse de votre situation actuelle, entretiens, collecte de données.", duration: "1 semaine", order: 0 },
    { title: "Analyse & Recommandations", description: "Élaboration du rapport d'analyse et des recommandations stratégiques.", duration: "1 semaine", order: 1 },
    { title: "Plan d'action", description: "Rédaction du plan d'action détaillé avec KPIs et jalons.", duration: "3 jours", order: 2 },
    { title: "Présentation & Validation", description: "Restitution des résultats et validation du plan avec votre équipe.", duration: "1 jour", order: 3 },
    { title: "Accompagnement initial", description: "Suivi de la mise en œuvre des premières recommandations.", duration: "2 semaines", order: 4 },
  ],

  "Solutions Numériques": [
    { title: "Découverte & Cadrage", description: "Définition des besoins, rédaction des spécifications fonctionnelles.", duration: "1 semaine", order: 0 },
    { title: "Conception UI/UX", description: "Maquettes, wireframes et prototype interactif pour validation.", duration: "1-2 semaines", order: 1 },
    { title: "Développement", description: "Implémentation des fonctionnalités selon les spécifications validées.", duration: "2-4 semaines", order: 2 },
    { title: "Tests & Qualité", description: "Tests fonctionnels, correctifs et recette client.", duration: "1 semaine", order: 3 },
    { title: "Déploiement & Formation", description: "Mise en production et formation des utilisateurs.", duration: "3 jours", order: 4 },
  ],

  "Formation": [
    { title: "Analyse des besoins", description: "Évaluation du niveau des apprenants et adaptation du programme.", duration: "3 jours", order: 0 },
    { title: "Conception pédagogique", description: "Création des supports, exercices et plan de formation personnalisé.", duration: "1 semaine", order: 1 },
    { title: "Sessions de formation", description: "Déroulement des séances de formation selon le planning.", duration: "Variable", order: 2 },
    { title: "Évaluation & Certification", description: "Tests de validation des acquis et remise des attestations.", duration: "1 jour", order: 3 },
  ],

  "Marketing Digital": [
    { title: "Audit & Benchmark", description: "Analyse de votre présence digitale et de la concurrence.", duration: "1 semaine", order: 0 },
    { title: "Stratégie & Plan de contenu", description: "Élaboration de la stratégie, des personas et du calendrier éditorial.", duration: "1 semaine", order: 1 },
    { title: "Mise en œuvre", description: "Production des contenus, lancement des campagnes et optimisation.", duration: "2-4 semaines", order: 2 },
    { title: "Suivi & Reporting", description: "Analyse des performances et rapport mensuel avec recommandations.", duration: "Récurrent", order: 3 },
  ],

  "Juridique & Finance": [
    { title: "Analyse du dossier", description: "Étude de votre situation et des documents fournis.", duration: "3-5 jours", order: 0 },
    { title: "Rédaction / Conseil", description: "Rédaction des documents ou fourniture du conseil expert.", duration: "1 semaine", order: 1 },
    { title: "Révision & Validation", description: "Révisions selon vos retours et validation finale.", duration: "3 jours", order: 2 },
    { title: "Remise des livrables", description: "Remise des documents finaux signés et archivage.", duration: "1 jour", order: 3 },
  ],

  "Design & Branding": [
    { title: "Brief créatif", description: "Collecte des références, valeurs de marque et contraintes graphiques.", duration: "2 jours", order: 0 },
    { title: "Exploration créative", description: "Présentation de 2-3 directions artistiques distinctes.", duration: "1 semaine", order: 1 },
    { title: "Développement", description: "Développement de la direction retenue en identité complète.", duration: "1-2 semaines", order: 2 },
    { title: "Révisions", description: "Ajustements selon vos retours (2 cycles inclus).", duration: "1 semaine", order: 3 },
    { title: "Livraison des fichiers", description: "Remise de tous les fichiers sources dans les formats requis.", duration: "1 jour", order: 4 },
  ],
};

const defaultTemplate: PhaseTemplate[] = [
  { title: "Lancement", description: "Démarrage du projet et validation des attentes.", duration: "2-3 jours", order: 0 },
  { title: "Réalisation", description: "Exécution du service selon les modalités définies.", duration: "Variable", order: 1 },
  { title: "Livraison", description: "Remise des livrables et validation par le client.", duration: "1-2 jours", order: 2 },
];

export function getPhaseTemplates(sector?: string | null): PhaseTemplate[] {
  if (!sector) return defaultTemplate;
  return templates[sector] ?? defaultTemplate;
}
