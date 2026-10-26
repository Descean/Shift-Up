-- Assistant WhatsApp : conversations et messages
-- À exécuter une fois dans Supabase > SQL Editor (le script peut être relancé sans erreur).

CREATE TABLE IF NOT EXISTS "ConversationWhatsApp" (
  "id" TEXT NOT NULL,
  "numero" TEXT NOT NULL,
  "nom" TEXT,
  "userId" TEXT,
  "humainJusquau" TIMESTAMP(3),
  "dernierMessageLe" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "dernierRecuLe" TIMESTAMP(3),
  "nonLus" INTEGER NOT NULL DEFAULT 0,
  "etat" JSONB,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ConversationWhatsApp_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "ConversationWhatsApp_numero_key" ON "ConversationWhatsApp"("numero");
CREATE INDEX IF NOT EXISTS "ConversationWhatsApp_dernierMessageLe_idx" ON "ConversationWhatsApp"("dernierMessageLe");

CREATE TABLE IF NOT EXISTS "MessageWhatsApp" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "sens" TEXT NOT NULL,
  "auteur" TEXT NOT NULL,
  "texte" TEXT NOT NULL,
  "waId" TEXT,
  "statut" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MessageWhatsApp_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "MessageWhatsApp_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "ConversationWhatsApp"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS "MessageWhatsApp_waId_key" ON "MessageWhatsApp"("waId");
CREATE INDEX IF NOT EXISTS "MessageWhatsApp_conversationId_createdAt_idx" ON "MessageWhatsApp"("conversationId", "createdAt");
