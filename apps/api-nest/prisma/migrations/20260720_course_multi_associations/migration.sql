-- ── Fix CourseEndorser: the app only ever wrote to the "endorserId" ghost
-- column (added by an old Prisma relation), never to "endorser_id" (used by
-- the unique index). Consolidate before reshaping the table.
UPDATE "course_endorsers" SET "endorser_id" = "endorserId" WHERE "endorserId" IS NOT NULL;

ALTER TABLE "course_endorsers" DROP CONSTRAINT "course_endorsers_endorserId_fkey";
ALTER TABLE "course_endorsers" DROP COLUMN "endorserId";

ALTER TABLE "course_endorsers" DROP CONSTRAINT "course_endorsers_pkey";
DROP INDEX "course_endorsers_course_id_endorser_id_key";
ALTER TABLE "course_endorsers" DROP COLUMN "id";
ALTER TABLE "course_endorsers" ADD CONSTRAINT "course_endorsers_pkey" PRIMARY KEY ("course_id", "endorser_id");

ALTER TABLE "course_endorsers" ADD CONSTRAINT "course_endorsers_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_endorsers" ADD CONSTRAINT "course_endorsers_endorser_id_fkey" FOREIGN KEY ("endorser_id") REFERENCES "endorsers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── New junction tables ──────────────────────────────────────────
CREATE TABLE "course_simulated_companies" (
    "course_id" VARCHAR(36) NOT NULL,
    "simulated_company_id" INTEGER NOT NULL,

    CONSTRAINT "course_simulated_companies_pkey" PRIMARY KEY ("course_id", "simulated_company_id")
);
ALTER TABLE "course_simulated_companies" ADD CONSTRAINT "course_simulated_companies_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_simulated_companies" ADD CONSTRAINT "course_simulated_companies_simulated_company_id_fkey" FOREIGN KEY ("simulated_company_id") REFERENCES "simulated_companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "course_foundation_configs" (
    "course_id" VARCHAR(36) NOT NULL,
    "foundation_config_id" INTEGER NOT NULL,

    CONSTRAINT "course_foundation_configs_pkey" PRIMARY KEY ("course_id", "foundation_config_id")
);
ALTER TABLE "course_foundation_configs" ADD CONSTRAINT "course_foundation_configs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_foundation_configs" ADD CONSTRAINT "course_foundation_configs_foundation_config_id_fkey" FOREIGN KEY ("foundation_config_id") REFERENCES "foundation_config"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Sponsor entity (new) ─────────────────────────────────────────
CREATE TABLE "sponsors" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logo_url" VARCHAR(500),
    "website" VARCHAR(500),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sponsors_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "course_sponsors" (
    "course_id" VARCHAR(36) NOT NULL,
    "sponsor_id" INTEGER NOT NULL,

    CONSTRAINT "course_sponsors_pkey" PRIMARY KEY ("course_id", "sponsor_id")
);
ALTER TABLE "course_sponsors" ADD CONSTRAINT "course_sponsors_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_sponsors" ADD CONSTRAINT "course_sponsors_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "sponsors"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- ── Migrate courses.simulated_company_id (1-to-N) into the junction table, then drop it ──
INSERT INTO "course_simulated_companies" (course_id, simulated_company_id)
SELECT id, simulated_company_id FROM "courses" WHERE simulated_company_id IS NOT NULL
ON CONFLICT DO NOTHING;

ALTER TABLE "courses" DROP COLUMN "simulated_company_id";
