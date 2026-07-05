-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('student', 'teacher', 'admin', 'ministerio');

-- CreateEnum
CREATE TYPE "SimulationStatus" AS ENUM ('not_started', 'active', 'paused', 'completed', 'abandoned');

-- CreateEnum
CREATE TYPE "SimulationInstanceStatus" AS ENUM ('not_started', 'in_progress', 'paused', 'completed', 'failed', 'submitted_for_review');

-- CreateEnum
CREATE TYPE "ActionType" AS ENUM ('calculation', 'document_upload', 'email_read', 'email_reply', 'message_sent', 'decision_made', 'case_submitted', 'case_approved', 'case_rejected', 'system_event', 'crisis_triggered', 'evaluation_completed');

-- CreateEnum
CREATE TYPE "TelemetryActionType" AS ENUM ('user_input', 'system_action', 'ai_response', 'decision', 'error', 'state_change');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'medium', 'hard');

-- CreateEnum
CREATE TYPE "FileType" AS ENUM ('pdf', 'docx', 'xlsx', 'png', 'jpg', 'txt');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('uploaded', 'processing', 'extracted', 'active', 'archived');

-- CreateEnum
CREATE TYPE "TaskType" AS ENUM ('practice', 'evaluation');

-- CreateEnum
CREATE TYPE "TaskStatus" AS ENUM ('pending', 'in_progress', 'completed', 'archived');

-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('simulation_completed', 'feedback_received', 'kpi_achieved', 'kpi_failed', 'course_assigned', 'evaluation_ready', 'system_alert');

-- CreateEnum
CREATE TYPE "FileUploadType" AS ENUM ('ministry_requirement', 'scenario_resource', 'student_submission');

-- CreateEnum
CREATE TYPE "DocumentType" AS ENUM ('case', 'contract', 'policy', 'legal', 'procedure', 'other');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('communication', 'tools', 'documentation', 'assessment');

-- CreateEnum
CREATE TYPE "FamilyType" AS ENUM ('administration', 'rrhh', 'it', 'entrepreneurship');

-- CreateEnum
CREATE TYPE "PromptGenerationMode" AS ENUM ('template', 'manual', 'guided');

-- CreateEnum
CREATE TYPE "AssignmentStatus" AS ENUM ('pending', 'in_progress', 'completed', 'expired');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(36) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'student',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_groups" (
    "id" SERIAL NOT NULL,
    "teacher_id" VARCHAR(36) NOT NULL,
    "student_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_groups_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "access_requests" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "student_name" VARCHAR(255) NOT NULL,
    "student_email" VARCHAR(255) NOT NULL,
    "course_name" VARCHAR(255) NOT NULL,
    "reason" TEXT,
    "status" VARCHAR(50) NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "access_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "courses" (
    "id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "categories" JSONB,
    "modules" JSONB,
    "ai_config" JSONB,
    "eval_criteria" JSONB,
    "crisis_events" JSONB,
    "simulated_company_id" INTEGER,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulations" (
    "id" VARCHAR(36) NOT NULL,
    "student_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "status" "SimulationStatus" NOT NULL DEFAULT 'active',
    "current_state" JSONB,
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paused_at" TIMESTAMP(3),
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,
    "score" INTEGER,

    CONSTRAINT "simulations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenarios" (
    "id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "scenario_type" VARCHAR(100),
    "categories" JSONB,
    "difficulty" "Difficulty" NOT NULL DEFAULT 'medium',
    "content" JSONB,
    "expected_outcomes" JSONB,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_instances" (
    "id" VARCHAR(36) NOT NULL,
    "student_id" VARCHAR(36) NOT NULL,
    "scenario_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "status" "SimulationInstanceStatus" NOT NULL DEFAULT 'not_started',
    "progress_percentage" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "feedback" TEXT,
    "time_spent_seconds" INTEGER,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "simulation_instances_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessments" (
    "id" VARCHAR(36) NOT NULL,
    "simulation_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),
    "kpis" JSONB NOT NULL,
    "ai_evaluation" TEXT,
    "recommendation" TEXT,
    "digital_signature" VARCHAR(64),
    "feedback" JSONB,

    CONSTRAINT "assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "practice_logs" (
    "id" VARCHAR(36) NOT NULL,
    "student_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "simulation_instance_id" VARCHAR(36),
    "action_type" "ActionType" NOT NULL,
    "description" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "integrity_hash" VARCHAR(64) NOT NULL,
    "previous_hash" VARCHAR(64),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "timestamp" BIGINT NOT NULL,
    "docenter_notes" TEXT,

    CONSTRAINT "practice_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telemetry_logs" (
    "id" VARCHAR(36) NOT NULL,
    "simulation_id" VARCHAR(36) NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "action" VARCHAR(255) NOT NULL,
    "action_type" "TelemetryActionType" NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_time_ms" INTEGER NOT NULL,
    "metadata" JSONB,
    "integrity_hash" VARCHAR(64) NOT NULL,

    CONSTRAINT "telemetry_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tech_sheets" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "ministry_code" VARCHAR(100),
    "description" TEXT,
    "competencies" JSONB,
    "kpi_requirements" JSONB,
    "context_scenario" TEXT,
    "extracted_data" JSONB,
    "file_url" TEXT,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processed_at" TIMESTAMP(3),
    "uploaded_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tech_sheets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_documents" (
    "id" SERIAL NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "document_name" VARCHAR(200) NOT NULL,
    "document_type" "DocumentType" NOT NULL DEFAULT 'other',
    "document_content" TEXT,
    "file_url" VARCHAR(500),
    "uploaded_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_assignments" (
    "id" SERIAL NOT NULL,
    "simulation_id" VARCHAR(36) NOT NULL,
    "student_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "assigned_by" VARCHAR(36) NOT NULL,
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "max_attempts" INTEGER DEFAULT 1,
    "status" "AssignmentStatus" NOT NULL DEFAULT 'pending',
    "attempts_used" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ministry_requirements" (
    "id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "uploaded_by_id" VARCHAR(36),
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" "FileType" NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "raw_text" TEXT,
    "extracted_content" JSONB,
    "status" "RequirementStatus" NOT NULL DEFAULT 'uploaded',
    "processing_notes" TEXT,
    "kpis_generated" INTEGER NOT NULL DEFAULT 0,
    "tasks_generated" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "activated_at" TIMESTAMP(3),

    CONSTRAINT "ministry_requirements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "kpis" (
    "id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "ministry_requirement_id" VARCHAR(36),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "category" VARCHAR(50) NOT NULL,
    "weight" DECIMAL(5,2) NOT NULL DEFAULT 1.0,
    "target_value" DECIMAL(5,2) NOT NULL,
    "minimum_pass_value" DECIMAL(5,2) NOT NULL DEFAULT 80,
    "thresholds" JSONB NOT NULL,
    "prompt_instruction" TEXT,
    "trigger_event" VARCHAR(100) NOT NULL,
    "success_criteria" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "tasks_count" INTEGER NOT NULL DEFAULT 0,
    "students_achieved" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "kpis_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tasks" (
    "id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "kpi_id" VARCHAR(36) NOT NULL,
    "scenario_id" VARCHAR(36),
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT NOT NULL,
    "type" "TaskType" NOT NULL,
    "sequence_order" INTEGER NOT NULL DEFAULT 0,
    "ai_prompt_config" JSONB,
    "evaluation_criteria" JSONB,
    "status" "TaskStatus" NOT NULL DEFAULT 'pending',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "students_completed" INTEGER NOT NULL DEFAULT 0,
    "average_completion_rate" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "activated_at" TIMESTAMP(3),

    CONSTRAINT "tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" VARCHAR(36) NOT NULL,
    "recipient_id" VARCHAR(36) NOT NULL,
    "actor_id" VARCHAR(36),
    "simulation_instance_id" VARCHAR(36),
    "type" "NotificationType" NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "metadata" JSONB,
    "is_read" BOOLEAN NOT NULL DEFAULT false,
    "read_at" TIMESTAMP(3),
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "file_uploads" (
    "id" VARCHAR(36) NOT NULL,
    "uploaded_by_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36),
    "ministry_requirement_id" VARCHAR(36),
    "file_name" VARCHAR(255) NOT NULL,
    "file_type" VARCHAR(50) NOT NULL,
    "upload_type" "FileUploadType" NOT NULL,
    "file_size_bytes" BIGINT NOT NULL,
    "file_path" VARCHAR(255) NOT NULL,
    "file_hash" VARCHAR(64),
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "file_uploads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_modules" (
    "id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "module_id" VARCHAR(36) NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "course_modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "modules" (
    "id" VARCHAR(36) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "type" "ModuleType" NOT NULL,
    "config" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "modules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_config" (
    "id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "config_data" JSONB NOT NULL,
    "base_role" TEXT,
    "course_context" TEXT,
    "personality_traits" JSONB,
    "knowledge_base_prompt" TEXT,
    "active_modules" JSONB,
    "ui_config" JSONB,
    "ia_config" JSONB,
    "family_type" "FamilyType",
    "calculator_config" JSONB,
    "inbox_config" JSONB,
    "validation_rules" JSONB,
    "metadata" JSONB,
    "tech_sheet_id" INTEGER,
    "prompt_template_id" INTEGER,
    "prompt_generation_mode" "PromptGenerationMode" NOT NULL DEFAULT 'template',
    "prompt_generated_by" VARCHAR(36),
    "prompt_generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "flow_templates" (
    "id" VARCHAR(100) NOT NULL,
    "course_id" VARCHAR(100) NOT NULL,
    "course_code" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "family" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "template_data" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "flow_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(50),
    "base_role" TEXT NOT NULL,
    "course_context" TEXT,
    "personality_traits" JSONB,
    "knowledge_base_prompt" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_by" VARCHAR(36),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "endorsers" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(100),
    "logo_url" VARCHAR(500),
    "description" TEXT,
    "endorsement_type" VARCHAR(100) DEFAULT 'institution',
    "website" VARCHAR(255),
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "endorsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "course_endorsers" (
    "id" SERIAL NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "endorser_id" INTEGER NOT NULL,
    "endorserId" INTEGER,

    CONSTRAINT "course_endorsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "foundation_config" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "short_name" VARCHAR(100),
    "logo_url" VARCHAR(500),
    "address" VARCHAR(255),
    "city" VARCHAR(100) DEFAULT 'Rosario',
    "province" VARCHAR(100) DEFAULT 'Santa Fe',
    "country" VARCHAR(100) DEFAULT 'Argentina',
    "phone" VARCHAR(50),
    "email" VARCHAR(150),
    "website" VARCHAR(255),
    "ministry_aval" TEXT,
    "is_active" BOOLEAN DEFAULT true,
    "created_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(0) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "foundation_config_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "system_functionalities" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "module" VARCHAR(100) NOT NULL,
    "icon" VARCHAR(255),
    "route" VARCHAR(255),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_functionalities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "id" SERIAL NOT NULL,
    "role_name" VARCHAR(255) NOT NULL,
    "functionality_id" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_evaluations" (
    "id" SERIAL NOT NULL,
    "assignment_id" INTEGER,
    "student_id" VARCHAR(36) NOT NULL,
    "simulation_id" VARCHAR(36) NOT NULL,
    "attempt_number" INTEGER NOT NULL DEFAULT 1,
    "kpi_results" JSONB,
    "overall_score" DECIMAL(5,2),
    "overall_feedback" TEXT,
    "completion_percentage" DECIMAL(5,2),
    "time_spent_seconds" INTEGER,
    "responses" JSONB,
    "evaluated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulation_chat_logs" (
    "id" SERIAL NOT NULL,
    "simulation_instance_id" VARCHAR(36) NOT NULL,
    "turn_number" INTEGER NOT NULL,
    "speaker" VARCHAR(50) NOT NULL,
    "message" TEXT NOT NULL,
    "is_correct" BOOLEAN,
    "ref_number" VARCHAR(100),
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulation_chat_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "simulated_companies" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "simulated_companies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_created_at_idx" ON "users"("created_at");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_groups_teacher_id_student_id_key" ON "teacher_groups"("teacher_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "courses_course_id_key" ON "courses"("course_id");

-- CreateIndex
CREATE INDEX "courses_category_idx" ON "courses"("category");

-- CreateIndex
CREATE INDEX "simulations_student_id_idx" ON "simulations"("student_id");

-- CreateIndex
CREATE INDEX "simulations_course_id_idx" ON "simulations"("course_id");

-- CreateIndex
CREATE INDEX "simulations_status_idx" ON "simulations"("status");

-- CreateIndex
CREATE INDEX "simulations_started_at_idx" ON "simulations"("started_at");

-- CreateIndex
CREATE INDEX "assessments_simulation_id_idx" ON "assessments"("simulation_id");

-- CreateIndex
CREATE INDEX "assessments_user_id_idx" ON "assessments"("user_id");

-- CreateIndex
CREATE INDEX "assessments_course_id_idx" ON "assessments"("course_id");

-- CreateIndex
CREATE INDEX "assessments_created_at_idx" ON "assessments"("created_at");

-- CreateIndex
CREATE INDEX "practice_logs_student_id_course_id_idx" ON "practice_logs"("student_id", "course_id");

-- CreateIndex
CREATE INDEX "practice_logs_course_id_created_at_idx" ON "practice_logs"("course_id", "created_at");

-- CreateIndex
CREATE INDEX "practice_logs_student_id_created_at_idx" ON "practice_logs"("student_id", "created_at");

-- CreateIndex
CREATE INDEX "practice_logs_integrity_hash_idx" ON "practice_logs"("integrity_hash");

-- CreateIndex
CREATE INDEX "telemetry_logs_simulation_id_idx" ON "telemetry_logs"("simulation_id");

-- CreateIndex
CREATE INDEX "telemetry_logs_user_id_idx" ON "telemetry_logs"("user_id");

-- CreateIndex
CREATE INDEX "telemetry_logs_course_id_idx" ON "telemetry_logs"("course_id");

-- CreateIndex
CREATE INDEX "telemetry_logs_created_at_idx" ON "telemetry_logs"("created_at");

-- CreateIndex
CREATE INDEX "telemetry_logs_action_type_idx" ON "telemetry_logs"("action_type");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_code_key" ON "categories"("code");

-- CreateIndex
CREATE INDEX "ministry_requirements_course_id_idx" ON "ministry_requirements"("course_id");

-- CreateIndex
CREATE INDEX "ministry_requirements_status_idx" ON "ministry_requirements"("status");

-- CreateIndex
CREATE INDEX "ministry_requirements_created_at_idx" ON "ministry_requirements"("created_at");

-- CreateIndex
CREATE INDEX "kpis_course_id_idx" ON "kpis"("course_id");

-- CreateIndex
CREATE INDEX "kpis_ministry_requirement_id_idx" ON "kpis"("ministry_requirement_id");

-- CreateIndex
CREATE INDEX "kpis_is_active_idx" ON "kpis"("is_active");

-- CreateIndex
CREATE INDEX "tasks_course_id_idx" ON "tasks"("course_id");

-- CreateIndex
CREATE INDEX "tasks_kpi_id_idx" ON "tasks"("kpi_id");

-- CreateIndex
CREATE INDEX "tasks_scenario_id_idx" ON "tasks"("scenario_id");

-- CreateIndex
CREATE INDEX "tasks_type_idx" ON "tasks"("type");

-- CreateIndex
CREATE INDEX "tasks_status_idx" ON "tasks"("status");

-- CreateIndex
CREATE INDEX "notifications_recipient_id_idx" ON "notifications"("recipient_id");

-- CreateIndex
CREATE INDEX "notifications_type_idx" ON "notifications"("type");

-- CreateIndex
CREATE INDEX "notifications_is_read_idx" ON "notifications"("is_read");

-- CreateIndex
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

-- CreateIndex
CREATE INDEX "file_uploads_uploaded_by_id_idx" ON "file_uploads"("uploaded_by_id");

-- CreateIndex
CREATE INDEX "file_uploads_course_id_idx" ON "file_uploads"("course_id");

-- CreateIndex
CREATE INDEX "file_uploads_ministry_requirement_id_idx" ON "file_uploads"("ministry_requirement_id");

-- CreateIndex
CREATE INDEX "file_uploads_created_at_idx" ON "file_uploads"("created_at");

-- CreateIndex
CREATE INDEX "course_modules_course_id_idx" ON "course_modules"("course_id");

-- CreateIndex
CREATE INDEX "course_modules_module_id_idx" ON "course_modules"("module_id");

-- CreateIndex
CREATE INDEX "modules_name_idx" ON "modules"("name");

-- CreateIndex
CREATE UNIQUE INDEX "course_config_course_id_key" ON "course_config"("course_id");

-- CreateIndex
CREATE INDEX "flow_templates_course_id_idx" ON "flow_templates"("course_id");

-- CreateIndex
CREATE INDEX "flow_templates_family_idx" ON "flow_templates"("family");

-- CreateIndex
CREATE INDEX "flow_templates_is_active_idx" ON "flow_templates"("is_active");

-- CreateIndex
CREATE UNIQUE INDEX "course_endorsers_course_id_endorser_id_key" ON "course_endorsers"("course_id", "endorser_id");

-- CreateIndex
CREATE UNIQUE INDEX "role_permissions_role_name_functionality_id_key" ON "role_permissions"("role_name", "functionality_id");

-- CreateIndex
CREATE INDEX "simulation_evaluations_student_id_idx" ON "simulation_evaluations"("student_id");

-- CreateIndex
CREATE INDEX "simulation_evaluations_simulation_id_idx" ON "simulation_evaluations"("simulation_id");

-- CreateIndex
CREATE INDEX "simulation_chat_logs_simulation_instance_id_idx" ON "simulation_chat_logs"("simulation_instance_id");

-- CreateIndex
CREATE INDEX "simulation_chat_logs_ref_number_idx" ON "simulation_chat_logs"("ref_number");

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulations" ADD CONSTRAINT "simulations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_instances" ADD CONSTRAINT "simulation_instances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_instances" ADD CONSTRAINT "simulation_instances_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "simulation_instances" ADD CONSTRAINT "simulation_instances_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessments" ADD CONSTRAINT "assessments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_simulation_instance_id_fkey" FOREIGN KEY ("simulation_instance_id") REFERENCES "simulation_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_logs" ADD CONSTRAINT "telemetry_logs_simulation_id_fkey" FOREIGN KEY ("simulation_id") REFERENCES "simulations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_logs" ADD CONSTRAINT "telemetry_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "telemetry_logs" ADD CONSTRAINT "telemetry_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministry_requirements" ADD CONSTRAINT "ministry_requirements_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ministry_requirements" ADD CONSTRAINT "ministry_requirements_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "kpis" ADD CONSTRAINT "kpis_ministry_requirement_id_fkey" FOREIGN KEY ("ministry_requirement_id") REFERENCES "ministry_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_kpi_id_fkey" FOREIGN KEY ("kpi_id") REFERENCES "kpis"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_scenario_id_fkey" FOREIGN KEY ("scenario_id") REFERENCES "scenarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_recipient_id_fkey" FOREIGN KEY ("recipient_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_simulation_instance_id_fkey" FOREIGN KEY ("simulation_instance_id") REFERENCES "simulation_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_uploaded_by_id_fkey" FOREIGN KEY ("uploaded_by_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_ministry_requirement_id_fkey" FOREIGN KEY ("ministry_requirement_id") REFERENCES "ministry_requirements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_modules" ADD CONSTRAINT "course_modules_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "modules"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_config" ADD CONSTRAINT "course_config_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_config" ADD CONSTRAINT "course_config_tech_sheet_id_fkey" FOREIGN KEY ("tech_sheet_id") REFERENCES "tech_sheets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_config" ADD CONSTRAINT "course_config_prompt_template_id_fkey" FOREIGN KEY ("prompt_template_id") REFERENCES "prompt_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_endorsers" ADD CONSTRAINT "course_endorsers_endorserId_fkey" FOREIGN KEY ("endorserId") REFERENCES "endorsers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

