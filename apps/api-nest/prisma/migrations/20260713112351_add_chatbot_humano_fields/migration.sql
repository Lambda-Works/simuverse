-- AlterTable
ALTER TABLE "course_config" ADD COLUMN     "chatbot_humano_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "language" VARCHAR(30),
ADD COLUMN     "role_behavior" TEXT,
ADD COLUMN     "tone" VARCHAR(50);
