-- Per-course Google Drive folder for oversized practice files
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "drive_folder_url" TEXT;

-- Link student submissions to a practice session
ALTER TABLE "file_uploads" ADD COLUMN IF NOT EXISTS "simulation_instance_id" VARCHAR(36);

CREATE INDEX IF NOT EXISTS "file_uploads_simulation_instance_id_idx"
  ON "file_uploads"("simulation_instance_id");
