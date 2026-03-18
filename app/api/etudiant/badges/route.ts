/**
 * GET /api/etudiant/badges
 * Retourne les badges débloqués/verrouillés calculés à partir du profil étudiant.
 */
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// Définition statique des badges — débloqués dynamiquement selon completedTasks
const BADGE_DEFINITIONS = [
  { id: "b-001", title: "Premier Pas",        description: "Première micro-tâche complétée",                    icon: "fa-flag",            color: "from-green-400 to-teal-500",    threshold: 1,  type: "tasks" },
  { id: "b-002", title: "Sérieux",             description: "5 tâches validées avec succès",                    icon: "fa-star",            color: "from-amber-400 to-orange-500",  threshold: 5,  type: "tasks" },
  { id: "b-003", title: "Développeur Junior",  description: "3 tâches de développement validées",               icon: "fa-code",            color: "from-blue-400 to-indigo-500",   threshold: 3,  type: "tasks" },
  { id: "b-004", title: "Créatif",             description: "2 tâches de design ou rédaction validées",          icon: "fa-pen-nib",         color: "from-pink-400 to-rose-500",     threshold: 2,  type: "tasks" },
  { id: "b-005", title: "Expert",              description: "10 tâches validées au total",                      icon: "fa-trophy",          color: "from-yellow-400 to-amber-500",  threshold: 10, type: "tasks" },
  { id: "b-006", title: "Régulier",            description: "Tâche complétée 4 semaines d'affilée",             icon: "fa-calendar-check",  color: "from-purple-400 to-violet-500", threshold: 20, type: "tasks" },
  { id: "b-007", title: "Perfectionniste",     description: "5 tâches validées du premier coup",                icon: "fa-gem",             color: "from-cyan-400 to-blue-500",     threshold: 15, type: "tasks" },
  { id: "b-008", title: "Ambassadeur",         description: "Profil public visible dans l'annuaire des talents", icon: "fa-medal",           color: "from-accent to-secondary",      threshold: 25, type: "tasks" },
];

const REQUIREMENT_LABELS: Record<string, string> = {
  "b-001": "Compléter 1 tâche",
  "b-002": "Compléter 5 tâches",
  "b-003": "Valider 3 tâches de type dev",
  "b-004": "Valider 2 tâches design/rédaction",
  "b-005": "Compléter 10 tâches",
  "b-006": "Actif 4 semaines consécutives",
  "b-007": "Valider 5 tâches sans refus",
  "b-008": "Obtenir 7 autres badges",
};

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  try {
    const profile = await prisma.etudiantProfile.findUnique({
      where: { userId: session.user.id },
      select: { completedTasks: true, badges: true },
    });

    const completedTasks = profile?.completedTasks ?? 0;
    const earnedBadgeIds = new Set(profile?.badges ?? []);

    // Calculer les badges selon completedTasks
    const badges = BADGE_DEFINITIONS.map((def) => {
      const unlocked = completedTasks >= def.threshold || earnedBadgeIds.has(def.id);
      return {
        id: def.id,
        title: def.title,
        description: def.description,
        icon: def.icon,
        color: def.color,
        unlocked,
        requirement: REQUIREMENT_LABELS[def.id] ?? `Compléter ${def.threshold} tâches`,
      };
    });

    return NextResponse.json({ badges, completedTasks });
  } catch (error) {
    console.error("GET /api/etudiant/badges error:", error);
    return NextResponse.json({ error: "Erreur serveur." }, { status: 500 });
  }
}
