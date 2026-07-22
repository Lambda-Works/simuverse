-- AlterTable
ALTER TABLE "sponsors" ADD COLUMN "logo_file_id" VARCHAR(36);

-- AddForeignKey
ALTER TABLE "sponsors" ADD CONSTRAINT "sponsors_logo_file_id_fkey" FOREIGN KEY ("logo_file_id") REFERENCES "file_uploads"("id") ON DELETE SET NULL ON UPDATE CASCADE;
