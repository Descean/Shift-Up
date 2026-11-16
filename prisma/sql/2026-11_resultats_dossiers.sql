-- Résultats des dossiers déposés (suivi automatique par Tendo)
-- À exécuter une fois dans Supabase > SQL Editor (le script peut être relancé sans erreur).
-- Il n'ajoute qu'une table : les tables existantes ne sont pas modifiées.

CREATE TABLE IF NOT EXISTS "Soumission" (
  "id" TEXT NOT NULL,
  "prestationId" TEXT,
  "entrepriseId" TEXT,
  "entrepriseNom" TEXT NOT NULL,
  "entrepriseSigle" TEXT,
  "reference" TEXT,
  "autorite" TEXT NOT NULL,
  "objet" TEXT NOT NULL,
  "lots" TEXT,
  "dateDepot" TIMESTAMP(3) NOT NULL,
  "validiteJours" INTEGER NOT NULL DEFAULT 90,
  "montantOffre" DOUBLE PRECISION,
  "resultat" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  "attributaire" TEXT,
  "montantAttribue" DOUBLE PRECISION,
  "preuveUrl" TEXT,
  "detecteParTendo" BOOLEAN NOT NULL DEFAULT false,
  "resultatAt" TIMESTAMP(3),
  "derniereVerification" TIMESTAMP(3),
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Soumission_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Soumission_resultat_idx" ON "Soumission"("resultat");

DO $$ BEGIN
  ALTER TABLE "Soumission" ADD CONSTRAINT "Soumission_prestationId_fkey"
    FOREIGN KEY ("prestationId") REFERENCES "Prestation"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Soumission" ADD CONSTRAINT "Soumission_entrepriseId_fkey"
    FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
