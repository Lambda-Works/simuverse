-- Cascade course deletion to its scenarios, simulation instances, practice logs
-- and config, so an admin hard-delete of a course removes the whole subtree.
ALTER TABLE "scenarios" DROP CONSTRAINT "scenarios_course_id_fkey";
ALTER TABLE "scenarios" ADD CONSTRAINT "scenarios_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "simulation_instances" DROP CONSTRAINT "simulation_instances_course_id_fkey";
ALTER TABLE "simulation_instances" ADD CONSTRAINT "simulation_instances_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "practice_logs" DROP CONSTRAINT "practice_logs_course_id_fkey";
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "course_config" DROP CONSTRAINT "course_config_course_id_fkey";
ALTER TABLE "course_config" ADD CONSTRAINT "course_config_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
