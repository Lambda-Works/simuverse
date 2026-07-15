-- Auth: Firebase uid + nullable password
ALTER TABLE "users" ALTER COLUMN "password_hash" DROP NOT NULL;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "firebase_uid" VARCHAR(128);
CREATE UNIQUE INDEX IF NOT EXISTS "users_firebase_uid_key" ON "users"("firebase_uid");

-- Course password + teachers + enrollment attempts
ALTER TABLE "courses" ADD COLUMN IF NOT EXISTS "password_hash" VARCHAR(255);

CREATE TABLE IF NOT EXISTS "course_teachers" (
    "id" SERIAL NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "teacher_id" VARCHAR(36) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "course_teachers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "course_teachers_course_id_teacher_id_key" ON "course_teachers"("course_id", "teacher_id");
CREATE INDEX IF NOT EXISTS "course_teachers_teacher_id_idx" ON "course_teachers"("teacher_id");

ALTER TABLE "course_teachers" DROP CONSTRAINT IF EXISTS "course_teachers_course_id_fkey";
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "course_teachers" DROP CONSTRAINT IF EXISTS "course_teachers_teacher_id_fkey";
ALTER TABLE "course_teachers" ADD CONSTRAINT "course_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE IF NOT EXISTS "enrollment_attempts" (
    "id" SERIAL NOT NULL,
    "student_id" VARCHAR(36) NOT NULL,
    "course_id" VARCHAR(36) NOT NULL,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "enrollment_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "enrollment_attempts_student_id_course_id_created_at_idx" ON "enrollment_attempts"("student_id", "course_id", "created_at");
ALTER TABLE "enrollment_attempts" DROP CONSTRAINT IF EXISTS "enrollment_attempts_student_id_fkey";
ALTER TABLE "enrollment_attempts" ADD CONSTRAINT "enrollment_attempts_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "enrollment_attempts" DROP CONSTRAINT IF EXISTS "enrollment_attempts_course_id_fkey";
ALTER TABLE "enrollment_attempts" ADD CONSTRAINT "enrollment_attempts_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Terms & Conditions
CREATE TABLE IF NOT EXISTS "terms_versions" (
    "id" SERIAL NOT NULL,
    "version" VARCHAR(50) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "terms_versions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "terms_versions_version_key" ON "terms_versions"("version");

CREATE TABLE IF NOT EXISTS "user_terms_acceptances" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(36) NOT NULL,
    "terms_version_id" INTEGER NOT NULL,
    "accepted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_terms_acceptances_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_terms_acceptances_user_id_terms_version_id_key" ON "user_terms_acceptances"("user_id", "terms_version_id");
CREATE INDEX IF NOT EXISTS "user_terms_acceptances_user_id_idx" ON "user_terms_acceptances"("user_id");
ALTER TABLE "user_terms_acceptances" DROP CONSTRAINT IF EXISTS "user_terms_acceptances_user_id_fkey";
ALTER TABLE "user_terms_acceptances" ADD CONSTRAINT "user_terms_acceptances_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_terms_acceptances" DROP CONSTRAINT IF EXISTS "user_terms_acceptances_terms_version_id_fkey";
ALTER TABLE "user_terms_acceptances" ADD CONSTRAINT "user_terms_acceptances_terms_version_id_fkey" FOREIGN KEY ("terms_version_id") REFERENCES "terms_versions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Drop access_requests (replaced by self-enrollment)
DROP TABLE IF EXISTS "access_requests";
