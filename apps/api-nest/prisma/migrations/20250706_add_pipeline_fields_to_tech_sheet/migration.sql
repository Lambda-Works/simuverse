-- AlterTable
ALTER TABLE "tech_sheets" ADD COLUMN "pipeline_status" VARCHAR(50);
ALTER TABLE "tech_sheets" ADD COLUMN "pipeline_output" JSONB;
