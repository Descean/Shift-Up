-- Recrutement : notification des candidats non retenus + choix de conservation des données
-- À exécuter une fois dans Supabase > SQL Editor (le script peut être relancé sans erreur).

DO $$ BEGIN
  CREATE TYPE "ConservationDonnees" AS ENUM ('EN_ATTENTE', 'ACCEPTEE', 'REFUSEE', 'EXPIREE');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Candidature"
  ADD COLUMN IF NOT EXISTS "motifsNonRetenu" TEXT[] DEFAULT ARRAY[]::TEXT[],
  ADD COLUMN IF NOT EXISTS "commentaireNonRetenu" TEXT,
  ADD COLUMN IF NOT EXISTS "notifieLe" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "relanceLe" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "conservation" "ConservationDonnees",
  ADD COLUMN IF NOT EXISTS "conservationLe" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "conservationJusquau" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "jetonDonnees" TEXT,
  ADD COLUMN IF NOT EXISTS "donneesSupprimeesLe" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "Candidature_jetonDonnees_key" ON "Candidature"("jetonDonnees");
CREATE INDEX IF NOT EXISTS "Candidature_conservation_idx" ON "Candidature"("conservation");
