/**
 * Legajo del Alumno — rutas de acceso restringido
 *
 * Acceso permitido:
 *   - admin    → siempre
 *   - teacher  → solo si tiene "Historia del Alumno" habilitado en role_permissions
 *   - ministerio → idem teacher
 *   - Cualquier otro rol → 403
 *
 * El administrador tiene acceso completo siempre, por diseño del sistema.
 */
import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { AppDataSource } from '../database/connection';

const router = Router();

// ─── Helper: verificar acceso al legajo ──────────────────────────────────────

async function canAccessLegajo(role: string): Promise<boolean> {
  // Administrador siempre tiene acceso total
  if (role === 'admin') return true;
  // Solo teacher y ministerio pueden tener permiso habilitado
  if (role !== 'teacher' && role !== 'ministerio') return false;

  // Verificar en role_permissions si el rol tiene habilitada la funcionalidad
  // "Historia del Alumno" (nombre canónico en system_functionalities)
  const [perm]: any = await AppDataSource.query(
    `SELECT rp.enabled
     FROM role_permissions rp
     JOIN system_functionalities sf ON sf.id = rp.functionality_id
     WHERE rp.role_name = ?
       AND (sf.name = 'Historia del Alumno' OR sf.name = 'Legajo del Alumno')
       AND rp.enabled = 1
     LIMIT 1`,
    [role]
  );
  return !!perm;
}

// ─── Asegurar que la funcionalidad "Legajo del Alumno" exista en el catálogo ──

async function ensureLegajoFunctionality(): Promise<void> {
  const [existing]: any = await AppDataSource.query(
    `SELECT id FROM system_functionalities WHERE name = 'Legajo del Alumno' LIMIT 1`
  );
  if (!existing) {
    await AppDataSource.query(
      `INSERT INTO system_functionalities (name, description, module, icon, route, is_active)
       VALUES ('Legajo del Alumno', 'Ver el legajo completo de un alumno: evaluaciones, puntajes y metodología de cálculo', 'reports', 'FileText', '/student-ledger', 1)`
    );
    // Habilitarlo por defecto para admin (siempre tiene acceso) y teacher
    await AppDataSource.query(
      `INSERT IGNORE INTO role_permissions (role_name, functionality_id, enabled)
       SELECT 'teacher', id, 1 FROM system_functionalities WHERE name = 'Legajo del Alumno'`
    );
    await AppDataSource.query(
      `INSERT IGNORE INTO role_permissions (role_name, functionality_id, enabled)
       SELECT 'ministerio', id, 0 FROM system_functionalities WHERE name = 'Legajo del Alumno'`
    );
  }
}

// ─── GET /api/legajo/students — lista de alumnos con resumen ─────────────────

router.get('/students', authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureLegajoFunctionality();
    const requester = (req as any).user;
    if (!(await canAccessLegajo(requester?.role))) {
      return res.status(403).json({ error: 'Acceso denegado. Su rol no tiene permiso para ver legajos.' });
    }

    // Obtener todos los alumnos con resumen de su actividad
    const students: any[] = await AppDataSource.query(
      `SELECT
         u.id,
         u.name,
         u.email,
         u.role,
         u.created_at,
         COUNT(DISTINCT s.id)            AS total_simulations,
         COUNT(DISTINCT CASE WHEN s.status = 'completed' THEN s.id END) AS completed_simulations,
         COUNT(DISTINCT a.id)            AS total_evaluations,
         MAX(a.grade)                    AS best_score,
         AVG(a.grade)                    AS avg_score,
         MAX(s.started_at)               AS last_activity
       FROM users u
       LEFT JOIN simulations s ON s.student_id = u.id
       LEFT JOIN assessments a ON a.simulation_id = s.id
       WHERE u.role = 'student'
       GROUP BY u.id, u.name, u.email, u.role, u.created_at
       ORDER BY last_activity DESC`
    );

    res.json(students);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── GET /api/legajo/:userId — legajo completo de un alumno ─────────────────

router.get('/:userId', authMiddleware, async (req: Request, res: Response) => {
  try {
    await ensureLegajoFunctionality();
    const requester = (req as any).user;
    if (!(await canAccessLegajo(requester?.role))) {
      return res.status(403).json({ error: 'Acceso denegado. Su rol no tiene permiso para ver legajos.' });
    }

    const { userId } = req.params;

    // Información del alumno
    const [student]: any = await AppDataSource.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = ? AND role = 'student' LIMIT 1`,
      [userId]
    );
    if (!student) return res.status(404).json({ error: 'Alumno no encontrado' });

    // Simulaciones con evaluaciones y datos del curso
    const simulations: any[] = await AppDataSource.query(
      `SELECT
         s.id                   AS simulation_id,
         s.status,
         s.started_at,
         s.completed_at,
         s.score                AS sim_score,
         s.updated_at,
         c.id                   AS course_id,
         c.title                AS course_title,
         c.category             AS course_category,
         a.id                   AS assessment_id,
         a.grade                AS score,
         a.criteria_met,
         a.comments             AS assessment_comments,
         a.evaluated_at,
         a.evaluator_id,
         eval_user.name         AS evaluator_name,
         (SELECT COUNT(*) FROM telemetry_logs tl WHERE tl.simulation_id = s.id) AS total_logs,
         (SELECT COUNT(*) FROM telemetry_logs tl WHERE tl.simulation_id = s.id AND tl.action = 'message_sent') AS messages_sent
       FROM simulations s
       JOIN courses c ON c.id = s.course_id
       LEFT JOIN assessments a ON a.simulation_id = s.id
       LEFT JOIN users eval_user ON eval_user.id = a.evaluator_id
       WHERE s.student_id = ?
       ORDER BY s.started_at DESC`,
      [userId]
    );

    // Parsear criteria_met (JSON almacenado como texto)
    const simsWithParsed = simulations.map(sim => {
      let criteriaMetParsed: any = null;
      if (sim.criteria_met) {
        try {
          criteriaMetParsed = typeof sim.criteria_met === 'string'
            ? JSON.parse(sim.criteria_met)
            : sim.criteria_met;
        } catch (_) {}
      }
      return {
        ...sim,
        criteria_met: criteriaMetParsed,
        score: sim.score !== null ? Number(sim.score) : null,
        passed: sim.score !== null ? Number(sim.score) >= 70 : null,
      };
    });

    // Estadísticas del alumno
    const evaluated = simsWithParsed.filter(s => s.score !== null);
    const passed    = evaluated.filter(s => s.passed);
    const scores    = evaluated.map(s => s.score as number);

    const stats = {
      total_simulations:    simulations.length,
      completed_simulations: simulations.filter(s => s.status === 'completed').length,
      total_evaluations:    evaluated.length,
      passed_evaluations:   passed.length,
      failed_evaluations:   evaluated.length - passed.length,
      avg_score:            scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null,
      best_score:           scores.length ? Math.max(...scores) : null,
      worst_score:          scores.length ? Math.min(...scores) : null,
      approval_rate:        evaluated.length ? Math.round((passed.length / evaluated.length) * 100) : null,
    };

    res.json({
      student,
      stats,
      simulations: simsWithParsed,
      accessed_by: {
        userId: requester?.userId,
        role: requester?.role,
        at: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[legajo]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
