import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RbacService } from '../rbac/rbac.service';

@Injectable()
export class CatalogQueryService {
  constructor(
    private prisma: PrismaService,
    private rbacService: RbacService,
  ) {}

  /**
   * Complex JOIN: evaluations with student name, course title, assignment data
   * Ported from Express: GET /evaluations/student/all
   */
  async findAllEvaluations(filters?: { course_id?: string; student_id?: string }) {
    const conditions: string[] = [];
    const params: any[] = [];

    if (filters?.student_id) {
      conditions.push('se.student_id = $' + (params.length + 1));
      params.push(filters.student_id);
    }
    if (filters?.course_id) {
      conditions.push('sa.course_id = $' + (params.length + 1));
      params.push(filters.course_id);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const query = `
      SELECT
        se.id, se.assignment_id, se.student_id, se.simulation_id,
        se.attempt_number, se.kpi_results, se.overall_score,
        se.overall_feedback, se.completion_percentage, se.time_spent_seconds,
        se.evaluated_at,
        u.name AS student_name, u.email AS student_email,
        c.title AS course_title, c.id AS course_id,
        sa.course_id AS assignment_course_id
      FROM simulation_evaluations se
      LEFT JOIN users u ON u.id = se.student_id
      LEFT JOIN simulation_assignments sa ON sa.id = se.assignment_id
      LEFT JOIN courses c ON c.id = sa.course_id
      ${whereClause}
      ORDER BY se.evaluated_at DESC
    `;

    // Dynamic WHERE requires $queryRawUnsafe; params are bound via placeholders ($1, $2)
    return this.prisma.$queryRawUnsafe(query, ...params);
  }

  /**
   * Evaluations for a specific simulation with student name
   * Ported from Express: GET /evaluations/:simulation_id
   */
  async findEvaluationsBySimulation(simulationId: string) {
    return this.prisma.$queryRaw`
      SELECT se.*, u.name AS student_name
      FROM simulation_evaluations se
      LEFT JOIN users u ON u.id = se.student_id
      WHERE se.simulation_id = ${simulationId}
      ORDER BY se.evaluated_at DESC
    `;
  }

  /**
   * Student history: assignments, instances, evaluations
   * Ported from Express: GET /students/:id/history
   */
  async findStudentHistory(studentId: string) {
    const [student] = await this.prisma.$queryRaw<any[]>`
      SELECT id, name, email, role, created_at FROM users WHERE id = ${studentId}
    `;

    if (!student) return null;

    const assignments = await this.prisma.$queryRaw`
      SELECT
        sa.id, sa.simulation_id AS scenario_id, sa.course_id,
        sa.start_date, sa.end_date, sa.max_attempts, sa.attempts_used,
        sa.status AS assignment_status, sa.created_at,
        c.title AS course_title, c.category AS course_category,
        sc.title AS scenario_title, sc.scenario_type, sc.difficulty
      FROM simulation_assignments sa
      LEFT JOIN courses c ON c.id = sa.course_id
      LEFT JOIN scenarios sc ON sc.id = sa.simulation_id
      WHERE sa.student_id = ${studentId}
      ORDER BY sa.created_at DESC
    `;

    const instances = await this.prisma.$queryRaw`
      SELECT si.*, sc.title AS scenario_title
      FROM simulation_instances si
      LEFT JOIN scenarios sc ON sc.id = si.scenario_id
      WHERE si.student_id = ${studentId}
      ORDER BY si.started_at DESC
    `;

    const evaluations = await this.prisma.$queryRaw`
      SELECT se.*, c.title AS course_title
      FROM simulation_evaluations se
      LEFT JOIN simulation_assignments sa ON sa.id = se.assignment_id
      LEFT JOIN courses c ON c.id = sa.course_id
      WHERE se.student_id = ${studentId}
      ORDER BY se.evaluated_at DESC
    `;

    return { student, assignments, instances, evaluations };
  }

  /**
   * ON CONFLICT upsert for role permissions
   * Ported from Express: PUT /role-permissions
   * Delegated to RbacService for single source of truth
   */
  async upsertRolePermissions(roleName: string, permissions: { functionality_id: number; enabled: boolean | number }[]) {
    return this.rbacService.bulkUpsertRolePermissions(roleName, permissions);
  }

  /**
   * Get role permissions with functionalities
   * Ported from Express: GET /role-permissions
   * Delegated to RbacService for single source of truth
   */
  async getRolePermissions(roleName: string) {
    return this.rbacService.getRolePermissionsFlat(roleName);
  }
}
