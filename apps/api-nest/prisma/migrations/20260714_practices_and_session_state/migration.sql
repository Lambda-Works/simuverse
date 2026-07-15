-- Add practice fields and session checkpoint state
ALTER TYPE "Difficulty" ADD VALUE IF NOT EXISTS 'very_low';
ALTER TYPE "Difficulty" ADD VALUE IF NOT EXISTS 'low';

ALTER TABLE "scenarios"
  ADD COLUMN IF NOT EXISTS "sequence_index" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "agent_key" VARCHAR(50),
  ADD COLUMN IF NOT EXISTS "prior_context" TEXT;

CREATE INDEX IF NOT EXISTS "scenarios_course_id_sequence_index_idx"
  ON "scenarios"("course_id", "sequence_index");

ALTER TABLE "simulation_instances"
  ADD COLUMN IF NOT EXISTS "session_state" JSONB,
  ADD COLUMN IF NOT EXISTS "practice_summary" TEXT;

CREATE INDEX IF NOT EXISTS "simulation_instances_course_id_student_id_idx"
  ON "simulation_instances"("course_id", "student_id");

-- Backfill agent_key for existing scenarios
UPDATE "scenarios"
SET "agent_key" = CONCAT('practica-', "sequence_index")
WHERE "agent_key" IS NULL;
