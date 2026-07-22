-- Cascade user deletion to SimulationInstance and PracticeLogs, so hard-deleting
-- a user doesn't leave orphaned FK violations.
ALTER TABLE "simulation_instances" DROP CONSTRAINT "simulation_instances_student_id_fkey";
ALTER TABLE "simulation_instances" ADD CONSTRAINT "simulation_instances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "practice_logs" DROP CONSTRAINT "practice_logs_student_id_fkey";
ALTER TABLE "practice_logs" ADD CONSTRAINT "practice_logs_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
