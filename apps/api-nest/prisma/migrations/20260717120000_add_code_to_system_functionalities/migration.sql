-- AlterTable: Add code column to system_functionalities
ALTER TABLE "system_functionalities" ADD COLUMN "code" VARCHAR(50);

-- Backfill codes for existing rows
UPDATE "system_functionalities" SET "code" = 'users.manage' WHERE "id" = 1;
UPDATE "system_functionalities" SET "code" = 'rbac.manage' WHERE "id" = 2;
UPDATE "system_functionalities" SET "code" = 'courses.manage' WHERE "id" = 3;
UPDATE "system_functionalities" SET "code" = 'reports.read' WHERE "id" = 4;
UPDATE "system_functionalities" SET "code" = 'rbac.manage_extra' WHERE "id" = 5;
UPDATE "system_functionalities" SET "code" = 'scenarios.manage' WHERE "id" = 6;
UPDATE "system_functionalities" SET "code" = 'assignments.manage' WHERE "id" = 7;
UPDATE "system_functionalities" SET "code" = 'companies.manage' WHERE "id" = 8;
UPDATE "system_functionalities" SET "code" = 'reports.read_stats' WHERE "id" = 9;
UPDATE "system_functionalities" SET "code" = 'foundation.manage' WHERE "id" = 10;
UPDATE "system_functionalities" SET "code" = 'endorsers.manage' WHERE "id" = 11;
UPDATE "system_functionalities" SET "code" = 'templates.manage' WHERE "id" = 12;
UPDATE "system_functionalities" SET "code" = 'templates.prompts' WHERE "id" = 13;
UPDATE "system_functionalities" SET "code" = 'techsheets.manage' WHERE "id" = 14;
UPDATE "system_functionalities" SET "code" = 'catalog.manage' WHERE "id" = 15;
UPDATE "system_functionalities" SET "code" = 'documents.manage' WHERE "id" = 16;
UPDATE "system_functionalities" SET "code" = 'teacher_groups.manage' WHERE "id" = 17;
UPDATE "system_functionalities" SET "code" = 'sessions.manage' WHERE "id" = 18;

-- AlterTable: Make code NOT NULL after backfill
ALTER TABLE "system_functionalities" ALTER COLUMN "code" SET NOT NULL;

-- CreateIndex: Unique constraint on code
CREATE UNIQUE INDEX "system_functionalities_code_key" ON "system_functionalities"("code");
