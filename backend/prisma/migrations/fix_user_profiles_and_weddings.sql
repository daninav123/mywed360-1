-- Fix user_profiles: remove old email columns, add planiviaEmail
ALTER TABLE user_profiles 
  DROP COLUMN IF EXISTS "myWed360Email",
  DROP COLUMN IF EXISTS "maLoveEmail",
  ADD COLUMN IF NOT EXISTS "planiviaEmail" VARCHAR(255) UNIQUE;

-- Fix weddings: make weddingDate nullable and add missing fields
ALTER TABLE weddings 
  ALTER COLUMN "weddingDate" DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS "celebrationCity" VARCHAR(255);

-- Create index for planiviaEmail
CREATE INDEX IF NOT EXISTS "user_profiles_planiviaEmail_idx" ON user_profiles("planiviaEmail");

-- Drop old indexes
DROP INDEX IF EXISTS "user_profiles_myWed360Email_idx";
DROP INDEX IF EXISTS "user_profiles_maLoveEmail_idx";
