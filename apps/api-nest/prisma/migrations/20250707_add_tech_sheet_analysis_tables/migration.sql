-- CreateEnum
CREATE TYPE "TechSheetCompetencyLevel" AS ENUM ('basic', 'intermediate', 'advanced');

-- CreateEnum
CREATE TYPE "TechSheetTaskType" AS ENUM ('practice', 'evaluation');

-- CreateEnum
CREATE TYPE "TechSheetPromptType" AS ENUM ('system', 'evaluation', 'coaching');

-- CreateTable
CREATE TABLE "tech_sheet_competencies" (
    "id" VARCHAR(36) NOT NULL,
    "tech_sheet_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "level" "TechSheetCompetencyLevel" NOT NULL DEFAULT 'basic',
    "category" VARCHAR(100),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_sheet_competencies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_sheet_kpis" (
    "id" VARCHAR(36) NOT NULL,
    "tech_sheet_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100),
    "weight" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "target_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "minimum_pass_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_sheet_kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_sheet_tasks" (
    "id" VARCHAR(36) NOT NULL,
    "tech_sheet_id" INTEGER NOT NULL,
    "kpi_id" VARCHAR(36),
    "type" "TechSheetTaskType" NOT NULL DEFAULT 'evaluation',
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'medium',
    "sequence" INTEGER NOT NULL DEFAULT 0,
    "expected_duration_minutes" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_sheet_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_sheet_prompts" (
    "id" VARCHAR(36) NOT NULL,
    "tech_sheet_id" INTEGER NOT NULL,
    "type" "TechSheetPromptType" NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_sheet_prompts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tech_sheet_competencies_tech_sheet_id_idx" ON "tech_sheet_competencies"("tech_sheet_id");

-- CreateIndex
CREATE INDEX "tech_sheet_kpis_tech_sheet_id_idx" ON "tech_sheet_kpis"("tech_sheet_id");

-- CreateIndex
CREATE INDEX "tech_sheet_tasks_tech_sheet_id_idx" ON "tech_sheet_tasks"("tech_sheet_id");

-- CreateIndex
CREATE INDEX "tech_sheet_tasks_kpi_id_idx" ON "tech_sheet_tasks"("kpi_id");

-- CreateIndex
CREATE UNIQUE INDEX "tech_sheet_prompts_tech_sheet_id_type_key" ON "tech_sheet_prompts"("tech_sheet_id", "type");

-- CreateIndex
CREATE INDEX "tech_sheet_prompts_tech_sheet_id_idx" ON "tech_sheet_prompts"("tech_sheet_id");

-- AddForeignKey
ALTER TABLE "tech_sheet_competencies" ADD CONSTRAINT "tech_sheet_competencies_tech_sheet_id_fkey" FOREIGN KEY ("tech_sheet_id") REFERENCES "tech_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_sheet_kpis" ADD CONSTRAINT "tech_sheet_kpis_tech_sheet_id_fkey" FOREIGN KEY ("tech_sheet_id") REFERENCES "tech_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_sheet_tasks" ADD CONSTRAINT "tech_sheet_tasks_tech_sheet_id_fkey" FOREIGN KEY ("tech_sheet_id") REFERENCES "tech_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_sheet_tasks" ADD CONSTRAINT "tech_sheet_tasks_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "tech_sheet_kpis"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tech_sheet_prompts" ADD CONSTRAINT "tech_sheet_prompts_tech_sheet_id_fkey" FOREIGN KEY ("tech_sheet_id") REFERENCES "tech_sheets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
