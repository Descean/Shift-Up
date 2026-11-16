/** Rôles de l'équipe qui traite les dossiers de montage (Kanban, chiffrage, production). */
export const ROLES_EQUIPE = ["ADMIN", "DEVELOPER", "MONTEUR"] as const;
/** Rôles de la Direction (statistiques, tarifs planchers, paiements hors ligne). */
export const ROLES_DIRECTION = ["ADMIN", "DEVELOPER"] as const;

export const estEquipe = (role?: string | null) => !!role && (ROLES_EQUIPE as readonly string[]).includes(role);
export const estDirection = (role?: string | null) => !!role && (ROLES_DIRECTION as readonly string[]).includes(role);
