import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CatalogQueryService {
  constructor(private prisma: PrismaService) {}

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
   */
  async upsertRolePermissions(roleName: string, permissions: { functionality_id: number; enabled: boolean | number }[]) {
    const results = [];
    
    for (const p of permissions) {
      const isEnabled = Boolean(p.enabled); // Convert 0/1 from frontend to proper boolean
      
      const result = await this.prisma.rolePermission.upsert({
        where: {
          role_name_functionality_id: {
            role_name: roleName,
            functionality_id: p.functionality_id
          }
        },
        update: { enabled: isEnabled },
        create: {
          role_name: roleName,
          functionality_id: p.functionality_id,
          enabled: isEnabled
        }
      });
      results.push(result);
    }

    return { updated: results.length };
  }

  /**
   * Get role permissions with functionalities
   * Ported from Express: GET /role-permissions
   */
  async getRolePermissions(roleName: string) {
    return this.prisma.$queryRaw`
      SELECT sf.id AS functionality_id, sf.name, sf.description, sf.module, sf.icon,
             COALESCE(rp.enabled, false) AS enabled
      FROM system_functionalities sf
      LEFT JOIN role_permissions rp ON rp.functionality_id = sf.id AND rp.role_name = ${roleName}
      WHERE sf.is_active = true
      ORDER BY sf.module ASC, sf.name ASC
    `;
  }
}
