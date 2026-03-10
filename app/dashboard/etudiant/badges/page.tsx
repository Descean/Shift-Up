/**
 * app/dashboard/etudiant/badges/page.tsx — Badges & achievements (étudiant)
 *
 * Affiche les badges obtenus et verrouillés de l'étudiant.
 * Les badges récompensent des jalons : nombre de tâches validées,
 * premières contributions, régularité, etc.
 *
 * Données : actuellement mockées.
 * TODO: charger depuis GET /api/etudiant/badges (à créer),
 *       qui calcule les badges débloqués à partir de etudiantProfile.completedTasks.
 */

"use client";

import { motion } from "framer-motion";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Badge {
  id: string;
  title: string;
  description: string;
  icon: string;           // classe Font Awesome
  color: string;          // classes Tailwind pour le fond de l'icône
  unlocked: boolean;
  unlockedAt?: string;    // date de débloquage
  requirement: string;    // condition pour débloquer
}

// ─── Données mock ─────────────────────────────────────────────────────────────

const badges: Badge[] = [
  {
    id: "b-001",
    title: "Premier Pas",
    description: "Première micro-tâche complétée",
    icon: "fa-flag",
    color: "from-green-400 to-teal-500",
    unlocked: true,
    unlockedAt: "05/11/2025",
    requirement: "Compléter 1 tâche",
  },
  {
    id: "b-002",
    title: "Sérieux",
    description: "5 tâches validées avec succès",
    icon: "fa-star",
    color: "from-amber-400 to-orange-500",
    unlocked: true,
    unlockedAt: "20/11/2025",
    requirement: "Compléter 5 tâches",
  },
  {
    id: "b-003",
    title: "Développeur Junior",
    description: "3 tâches de développement validées",
    icon: "fa-code",
    color: "from-blue-400 to-indigo-500",
    unlocked: true,
    unlockedAt: "28/11/2025",
    requirement: "Valider 3 tâches de type dev",
  },
  {
    id: "b-004",
    title: "Créatif",
    description: "2 tâches de design ou rédaction validées",
    icon: "fa-pen-nib",
    color: "from-pink-400 to-rose-500",
    unlocked: false,
    requirement: "Valider 2 tâches design/rédaction",
  },
  {
    id: "b-005",
    title: "Expert",
    description: "10 tâches validées au total",
    icon: "fa-trophy",
    color: "from-yellow-400 to-amber-500",
    unlocked: false,
    requirement: "Compléter 10 tâches",
  },
  {
    id: "b-006",
    title: "Régulier",
    description: "Tâche complétée 4 semaines d'affilée",
    icon: "fa-calendar-check",
    color: "from-purple-400 to-violet-500",
    unlocked: false,
    requirement: "Actif 4 semaines consécutives",
  },
  {
    id: "b-007",
    title: "Perfectionniste",
    description: "5 tâches validées du premier coup (sans refus)",
    icon: "fa-gem",
    color: "from-cyan-400 to-blue-500",
    unlocked: false,
    requirement: "Valider 5 tâches sans refus",
  },
  {
    id: "b-008",
    title: "Ambassadeur",
    description: "Profil public visible dans l'annuaire des talents",
    icon: "fa-medal",
    color: "from-accent to-secondary",
    unlocked: false,
    requirement: "Obtenir 7 autres badges",
  },
];

// ─── Composant principal ───────────────────────────────────────────────────────

export default function EtudiantBadgesPage() {
  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const totalCount    = badges.length;
  const progress      = Math.round((unlockedCount / totalCount) * 100);

  return (
    <div className="space-y-6 max-w-4xl">

      {/* ── En-tête ─────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-syne font-black text-2xl text-primary">Mes Badges</h1>
        <p className="text-gray-500 text-sm">Vos récompenses et accomplissements</p>
      </motion.div>

      {/* ── Barre de progression globale ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="bg-white rounded-2xl shadow-card p-6"
      >
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700">
            Progression — {unlockedCount}/{totalCount} badges débloqués
          </p>
          <span className="font-syne font-bold text-accent">{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <motion.div
            className="h-3 rounded-full bg-gradient-to-r from-accent to-secondary"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </motion.div>

      {/* ── Grille des badges ────────────────────────────────────────────── */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {badges.map((badge, i) => (
          <motion.div
            key={badge.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className={`bg-white rounded-2xl shadow-card p-5 flex flex-col items-center text-center transition-all ${
              badge.unlocked ? "" : "opacity-50 grayscale"
            }`}
          >
            {/* Icône du badge */}
            <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center mb-4 ${
              badge.unlocked ? "shadow-lg" : ""
            }`}>
              {badge.unlocked ? (
                <i className={`fas ${badge.icon} text-white text-2xl`} />
              ) : (
                // Badge verrouillé : cadenas à la place de l'icône
                <i className="fas fa-lock text-white text-xl" />
              )}
            </div>

            <h3 className="font-syne font-bold text-primary text-sm mb-1">{badge.title}</h3>
            <p className="text-xs text-gray-500 mb-3">{badge.description}</p>

            {badge.unlocked ? (
              // Date de débloquage
              <span className="text-xs text-green-600 font-semibold bg-green-50 px-3 py-1 rounded-full">
                <i className="fas fa-check mr-1" />
                Obtenu le {badge.unlockedAt}
              </span>
            ) : (
              // Condition de débloquage
              <span className="text-xs text-gray-400 bg-gray-50 px-3 py-1 rounded-full">
                <i className="fas fa-lock mr-1" />
                {badge.requirement}
              </span>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );
}
