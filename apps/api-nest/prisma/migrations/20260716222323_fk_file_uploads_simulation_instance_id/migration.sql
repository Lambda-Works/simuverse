-- AlterTable
ALTER TABLE "terms_versions" ALTER COLUMN "updated_at" DROP DEFAULT;

-- AddForeignKey
ALTER TABLE "file_uploads" ADD CONSTRAINT "file_uploads_simulation_instance_id_fkey" FOREIGN KEY ("simulation_instance_id") REFERENCES "simulation_instances"("id") ON DELETE SET NULL ON UPDATE CASCADE;
