-- Plateforme de montage (maquette client / monteur / Direction) — à exécuter une fois dans le SQL Editor de Supabase.
-- Sans risque pour les données existantes : uniquement des ajouts.

-- 1. Rôle « monteur » (équipe de montage)
ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'MONTEUR';

-- 2. Réglages de la Direction (tarifs planchers, prix de la livraison physique…)
CREATE TABLE IF NOT EXISTS "Reglage" (
  "cle"       TEXT PRIMARY KEY,
  "valeur"    JSONB NOT NULL,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Liens de connexion par e-mail (table standard de next-auth, créée seulement si elle manque)
CREATE TABLE IF NOT EXISTS "VerificationToken" (
  "identifier" TEXT NOT NULL,
  "token"      TEXT NOT NULL,
  "expires"    TIMESTAMP(3) NOT NULL
);
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");

-- 4. Monteurs indépendants : profil (validation par la Direction) et gains sur les paiements de leurs clients
CREATE TABLE IF NOT EXISTS "MonteurProfil" (
  "userId"       TEXT PRIMARY KEY,
  "statut"       TEXT NOT NULL DEFAULT 'EN_ATTENTE',
  "type"         TEXT NOT NULL DEFAULT 'INDEPENDANT',
  "telephone"    TEXT,
  "ville"        TEXT,
  "experience"   TEXT,
  "specialites"  TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "presentation" TEXT,
  "approuveLe"   TIMESTAMP(3),
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS "GainMonteur" (
  "id"           TEXT PRIMARY KEY,
  "monteurId"    TEXT NOT NULL,
  "paymentId"    TEXT NOT NULL,
  "prestationId" TEXT NOT NULL,
  "brut"         DOUBLE PRECISION NOT NULL,
  "commission"   DOUBLE PRECISION NOT NULL,
  "net"          DOUBLE PRECISION NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE UNIQUE INDEX IF NOT EXISTS "GainMonteur_paymentId_key" ON "GainMonteur"("paymentId");
CREATE INDEX IF NOT EXISTS "GainMonteur_monteurId_idx" ON "GainMonteur"("monteurId");

-- 5. Fin des comptes apporteur d'affaires et étudiant : ils deviennent des comptes clients.
--    Leurs données (commandes, commissions, tâches…) restent en base.
INSERT INTO "ClientProfile" ("id", "userId")
  SELECT 'cp_' || substr(md5(random()::text || u."id"), 1, 22), u."id" FROM "User" u
  WHERE u."role" IN ('APPORTEUR', 'ETUDIANT') AND NOT EXISTS (SELECT 1 FROM "ClientProfile" c WHERE c."userId" = u."id");
UPDATE "User" SET "role" = 'CLIENT' WHERE "role" IN ('APPORTEUR', 'ETUDIANT');
