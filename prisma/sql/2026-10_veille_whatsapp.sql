-- Veille des appels d'offres + préférences WhatsApp
-- À exécuter une fois dans Supabase > SQL Editor (le script peut être relancé sans erreur).

CREATE TABLE IF NOT EXISTS "AvisMarche" (
  "id" TEXT NOT NULL,
  "cle" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "reference" TEXT NOT NULL,
  "objet" TEXT NOT NULL,
  "autorite" TEXT,
  "typeMarche" TEXT,
  "procedure" TEXT,
  "financement" TEXT,
  "lieu" TEXT,
  "datePublication" TIMESTAMP(3),
  "dateLimite" TIMESTAMP(3),
  "lien" TEXT,
  "details" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AvisMarche_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "AvisMarche_cle_key" ON "AvisMarche"("cle");
CREATE INDEX IF NOT EXISTS "AvisMarche_dateLimite_idx" ON "AvisMarche"("dateLimite");
CREATE INDEX IF NOT EXISTS "AvisMarche_createdAt_idx" ON "AvisMarche"("createdAt");

CREATE TABLE IF NOT EXISTS "AbonnementVeille" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "secteurs" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "motsCles" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "exclusions" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "typesMarche" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "zones" TEXT[] DEFAULT ARRAY[]::TEXT[],
  "statut" TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  "actifJusquau" TIMESTAMP(3),
  "dernierEnvoi" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AbonnementVeille_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AbonnementVeille_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AbonnementVeille_userId_key" ON "AbonnementVeille"("userId");
CREATE INDEX IF NOT EXISTS "AbonnementVeille_statut_idx" ON "AbonnementVeille"("statut");

CREATE TABLE IF NOT EXISTS "AlerteVeille" (
  "id" TEXT NOT NULL,
  "abonnementId" TEXT NOT NULL,
  "avisId" TEXT NOT NULL,
  "score" INTEGER NOT NULL DEFAULT 0,
  "envoyeLe" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AlerteVeille_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AlerteVeille_abonnementId_fkey" FOREIGN KEY ("abonnementId") REFERENCES "AbonnementVeille"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AlerteVeille_avisId_fkey" FOREIGN KEY ("avisId") REFERENCES "AvisMarche"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "AlerteVeille_abonnementId_avisId_key" ON "AlerteVeille"("abonnementId", "avisId");
CREATE INDEX IF NOT EXISTS "AlerteVeille_abonnementId_createdAt_idx" ON "AlerteVeille"("abonnementId", "createdAt");

CREATE TABLE IF NOT EXISTS "PreferenceNotification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "whatsapp" BOOLEAN NOT NULL DEFAULT false,
  "numero" TEXT,
  "consentLe" TIMESTAMP(3),
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PreferenceNotification_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "PreferenceNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "PreferenceNotification_userId_key" ON "PreferenceNotification"("userId");
