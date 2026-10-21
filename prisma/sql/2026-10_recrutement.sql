-- Module Recrutement SHIFT UP — à exécuter une fois dans Supabase > SQL Editor
-- (équivalent : npx prisma db push avec les variables de production)

-- CreateEnum
CREATE TYPE "CandidatureStatut" AS ENUM ('NOUVELLE', 'EN_REVUE', 'PRESELECTIONNEE', 'RETENUE', 'NON_RETENUE');

-- CreateTable
CREATE TABLE "Candidature" (
    "id" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "offreCode" TEXT NOT NULL,
    "offreTitre" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "prenoms" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telephone" TEXT NOT NULL,
    "ville" TEXT NOT NULL,
    "nationalite" TEXT NOT NULL,
    "diplome" TEXT NOT NULL,
    "anneeDiplome" INTEGER NOT NULL,
    "anneesExperience" INTEGER NOT NULL,
    "nbProjetsSimilaires" INTEGER NOT NULL,
    "disponibilite" TEXT NOT NULL,
    "source" TEXT,
    "fichiers" JSONB NOT NULL,
    "statut" "CandidatureStatut" NOT NULL DEFAULT 'NOUVELLE',
    "noteInterne" TEXT,
    "consentement" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Candidature_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidature_reference_key" ON "Candidature"("reference");

-- CreateIndex
CREATE INDEX "Candidature_offreCode_idx" ON "Candidature"("offreCode");

-- CreateIndex
CREATE INDEX "Candidature_email_idx" ON "Candidature"("email");

-- CreateIndex
CREATE INDEX "Candidature_statut_idx" ON "Candidature"("statut");


-- Données personnelles : on bloque l'accès via l'API publique Supabase (PostgREST).
-- Prisma se connecte avec le rôle propriétaire et n'est pas concerné par RLS.
ALTER TABLE "Candidature" ENABLE ROW LEVEL SECURITY;
