-- Teaser-only protection for startup ideas (public summary vs full description)
CREATE TYPE "IdeaProtection" AS ENUM ('FULL_PUBLIC', 'TEASER_ONLY');

ALTER TABLE "StartupIdea" ADD COLUMN IF NOT EXISTS "protectionMode" "IdeaProtection" NOT NULL DEFAULT 'FULL_PUBLIC';
ALTER TABLE "StartupIdea" ADD COLUMN IF NOT EXISTS "publicTeaser" TEXT;
