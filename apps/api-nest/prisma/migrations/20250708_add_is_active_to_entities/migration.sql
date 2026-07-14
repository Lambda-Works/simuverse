-- Add is_active to entities for soft-delete support
ALTER TABLE "users" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "categories" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "course_documents" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "simulated_companies" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
