-- Remove job board, freelance, and job-seeker profile tables
DROP TABLE IF EXISTS "Application" CASCADE;
DROP TABLE IF EXISTS "Job" CASCADE;
DROP TABLE IF EXISTS "Company" CASCADE;
DROP TABLE IF EXISTS "FreelanceProject" CASCADE;
DROP TABLE IF EXISTS "FreelancerProfile" CASCADE;
DROP TABLE IF EXISTS "Profile" CASCADE;

-- Remap User.roles to new UserRole enum (drop old type, recreate)
ALTER TABLE "User" ALTER COLUMN "roles" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "roles" TYPE text[] USING (
  COALESCE(
    ARRAY(
      SELECT DISTINCT CASE
        WHEN r::text IN ('JOB_SEEKER', 'EMPLOYER', 'FREELANCER') THEN 'FOUNDER'
        WHEN r::text IN ('FOUNDER', 'INVESTOR', 'MENTOR', 'ADMIN') THEN r::text
        ELSE 'FOUNDER'
      END
      FROM unnest(roles) AS r
    ),
    ARRAY[]::text[]
  )
);

DROP TYPE IF EXISTS "UserRole";

CREATE TYPE "UserRole" AS ENUM ('FOUNDER', 'INVESTOR', 'MENTOR', 'ADMIN');

ALTER TABLE "User" ALTER COLUMN "roles" TYPE "UserRole"[] USING (
  COALESCE(
    ARRAY(SELECT u::text::"UserRole" FROM unnest(roles::text[]) AS u),
    ARRAY[]::"UserRole"[]
  )
);

ALTER TABLE "User" ALTER COLUMN "roles" SET DEFAULT ARRAY['FOUNDER']::"UserRole"[];

-- Remap User.accountTypes to new AccountType enum
ALTER TABLE "User" ALTER COLUMN "accountTypes" DROP DEFAULT;

ALTER TABLE "User" ALTER COLUMN "accountTypes" TYPE text[] USING (
  COALESCE(
    ARRAY(
      SELECT DISTINCT CASE
        WHEN r::text IN ('JOB_SEEKER', 'EMPLOYER', 'FREELANCER') THEN 'CO_FOUNDER'
        WHEN r::text IN ('CO_FOUNDER', 'INVESTOR', 'MENTOR') THEN r::text
        ELSE 'CO_FOUNDER'
      END
      FROM unnest(accountTypes) AS r
    ),
    ARRAY[]::text[]
  )
);

DROP TYPE IF EXISTS "AccountType";

CREATE TYPE "AccountType" AS ENUM ('CO_FOUNDER', 'INVESTOR', 'MENTOR');

ALTER TABLE "User" ALTER COLUMN "accountTypes" TYPE "AccountType"[] USING (
  COALESCE(
    ARRAY(SELECT u::text::"AccountType" FROM unnest(accountTypes::text[]) AS u),
    ARRAY[]::"AccountType"[]
  )
);

ALTER TABLE "User" ALTER COLUMN "accountTypes" SET DEFAULT ARRAY[]::"AccountType"[];
