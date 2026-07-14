-- Convert role column from UserRole enum to VARCHAR for dynamic roles
ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE VARCHAR(100);
ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'student';
DROP TYPE IF EXISTS "UserRole";
