-- Espace client : notifications / journal des demandes, « Mes entreprises » et coffre de pièces
-- À exécuter une fois dans Supabase > SQL Editor (le script peut être relancé sans erreur).
-- Il n'ajoute que des tables : les tables existantes ne sont pas modifiées.

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "prestationId" TEXT,
  "type" TEXT NOT NULL,
  "titre" TEXT NOT NULL,
  "texte" TEXT,
  "lien" TEXT,
  "lu" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Notification_userId_lu_idx" ON "Notification"("userId", "lu");
CREATE INDEX IF NOT EXISTS "Notification_prestationId_idx" ON "Notification"("prestationId");

CREATE TABLE IF NOT EXISTS "Entreprise" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "nom" TEXT NOT NULL,
  "formeJuridique" TEXT,
  "rccm" TEXT,
  "ifu" TEXT,
  "representant" TEXT,
  "telephone" TEXT,
  "email" TEXT,
  "adresse" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Entreprise_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "Entreprise_userId_idx" ON "Entreprise"("userId");

CREATE TABLE IF NOT EXISTS "PieceEntreprise" (
  "id" TEXT NOT NULL,
  "entrepriseId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "libelle" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "nomFichier" TEXT NOT NULL,
  "dateDelivrance" TIMESTAMP(3),
  "dateExpiration" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PieceEntreprise_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "PieceEntreprise_entrepriseId_type_idx" ON "PieceEntreprise"("entrepriseId", "type");

DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Notification" ADD CONSTRAINT "Notification_prestationId_fkey" FOREIGN KEY ("prestationId") REFERENCES "Prestation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "Entreprise" ADD CONSTRAINT "Entreprise_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN
  ALTER TABLE "PieceEntreprise" ADD CONSTRAINT "PieceEntreprise_entrepriseId_fkey" FOREIGN KEY ("entrepriseId") REFERENCES "Entreprise"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Accès réservé au serveur (comme les autres tables) : sécurité au niveau des lignes activée, aucune règle publique.
ALTER TABLE "Notification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Entreprise" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PieceEntreprise" ENABLE ROW LEVEL SECURITY;
