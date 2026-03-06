import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/connection';
import { Category } from '../entities/Category';
import { TechSheet } from '../entities/TechSheet';
import { CourseDocument } from '../entities/CourseDocument';
import { SimulationAssignment } from '../entities/SimulationAssignment';
import { User } from '../entities/User';
import { Scenario } from '../entities/Scenario';
import { v4 as uuidv4 } from 'uuid';

const router = Router();

// ============================================================
// CATEGORÍAS (antes llamadas "familias" en algunos sistemas)
// El campo courses.category referencia categories.code
// ============================================================

router.get('/categories', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Category);
    const categories = await repo.find({ order: { name: 'ASC' } });
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/categories', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Category);
    const { name, code, description } = req.body;
    if (!name || !code) return res.status(400).json({ error: 'name y code son obligatorios' });
    const existing = await repo.findOne({ where: [{ name }, { code: code.toUpperCase() }] });
    if (existing) return res.status(409).json({ error: 'Categoría con ese nombre o código ya existe' });
    const category = repo.create({ name, code: code.toUpperCase(), description });
    const saved = await repo.save(category);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/categories/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Category);
    const category = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!category) return res.status(404).json({ error: 'Categoría no encontrada' });
    const { name, code, description } = req.body;
    if (name) category.name = name;
    if (code) category.code = code.toUpperCase();
    if (description !== undefined) category.description = description;
    const saved = await repo.save(category);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/categories/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Category);
    const result = await repo.delete(parseInt(req.params.id));
    if (result.affected === 0) return res.status(404).json({ error: 'Categoría no encontrada' });
    res.json({ message: 'Categoría eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================
// FICHAS TÉCNICAS DEL MINISTERIO (tech_sheets)
// Contienen los KPIs y competencias exigidas por el ministerio
// ============================================================

router.get('/tech-sheets', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const sheets = await repo.find({ order: { created_at: 'DESC' } });
    res.json(sheets);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/tech-sheets/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const sheet = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!sheet) return res.status(404).json({ error: 'Ficha técnica no encontrada' });
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/tech-sheets', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const { name, ministry_code, description, competencies, kpi_requirements, context_scenario, uploaded_by } = req.body;
    if (!name) return res.status(400).json({ error: 'name es obligatorio' });
    const sheet = repo.create({ name, ministry_code, description, competencies, kpi_requirements, context_scenario, uploaded_by });
    const saved = await repo.save(sheet);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/tech-sheets/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const sheet = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!sheet) return res.status(404).json({ error: 'Ficha técnica no encontrada' });
    Object.assign(sheet, req.body);
    const saved = await repo.save(sheet);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/tech-sheets/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const result = await repo.delete(parseInt(req.params.id));
    if (result.affected === 0) return res.status(404).json({ error: 'Ficha técnica no encontrada' });
    res.json({ message: 'Ficha técnica eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * POST /tech-sheets/:id/process
 * Marca una ficha técnica como procesada y extrae sus datos con IA
 */
router.post('/tech-sheets/:id/process', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const sheet = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!sheet) return res.status(404).json({ error: 'Ficha técnica no encontrada' });
    // Simulación de procesamiento con IA (aquí se integraría Gemini)
    sheet.processed = true;
    sheet.processed_at = new Date();
    sheet.extracted_data = req.body.extracted_data || {
      kpis: sheet.kpi_requirements || [],
      competencies: sheet.competencies || [],
      processed_at: new Date(),
      note: 'Procesado manualmente'
    };
    const saved = await repo.save(sheet);
    res.json({ message: 'Ficha técnica procesada', sheet: saved });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================
// DOCUMENTOS DE CURSOS (course_documents)
// Documentos que el alumno ve durante la simulación
// ============================================================

router.get('/documents', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CourseDocument);
    const { course_id } = req.query;
    const where: any = {};
    if (course_id) where.course_id = course_id;
    const docs = await repo.find({ where, order: { created_at: 'DESC' } });
    res.json(docs);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.get('/documents/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CourseDocument);
    const doc = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json(doc);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/documents', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CourseDocument);
    const { course_id, document_name, document_type, document_content, uploaded_by } = req.body;
    if (!course_id || !document_name) return res.status(400).json({ error: 'course_id y document_name son obligatorios' });
    const doc = repo.create({ course_id, document_name, document_type: document_type || 'other', document_content, uploaded_by });
    const saved = await repo.save(doc);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/documents/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CourseDocument);
    const doc = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!doc) return res.status(404).json({ error: 'Documento no encontrado' });
    Object.assign(doc, req.body);
    const saved = await repo.save(doc);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/documents/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(CourseDocument);
    const result = await repo.delete(parseInt(req.params.id));
    if (result.affected === 0) return res.status(404).json({ error: 'Documento no encontrado' });
    res.json({ message: 'Documento eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================
// ASIGNACIONES DE SIMULACIONES (simulation_assignments)
// El admin asigna cursos/simulaciones a alumnos
// ============================================================

router.get('/assignments', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SimulationAssignment);
    const { student_id, course_id, status } = req.query;
    const where: any = {};
    if (student_id) where.student_id = student_id;
    if (course_id) where.course_id = course_id;
    if (status) where.status = status;
    const assignments = await repo.find({ where, order: { created_at: 'DESC' } });
    res.json(assignments);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.post('/assignments', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SimulationAssignment);
    const { simulation_id, student_id, course_id, assigned_by, start_date, end_date, max_attempts } = req.body;
    if (!simulation_id || !student_id || !course_id || !assigned_by) {
      return res.status(400).json({ error: 'simulation_id, student_id, course_id y assigned_by son obligatorios' });
    }
    const assignment = repo.create({
      simulation_id,
      student_id,
      course_id,
      assigned_by,
      start_date: start_date ? new Date(start_date) : undefined,
      end_date: end_date ? new Date(end_date) : undefined,
      max_attempts: max_attempts || 1,
      status: 'pending',
      attempts_used: 0
    });
    const saved = await repo.save(assignment);
    res.status(201).json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.put('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SimulationAssignment);
    const assignment = await repo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!assignment) return res.status(404).json({ error: 'Asignación no encontrada' });
    Object.assign(assignment, req.body);
    const saved = await repo.save(assignment);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

router.delete('/assignments/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(SimulationAssignment);
    const result = await repo.delete(parseInt(req.params.id));
    if (result.affected === 0) return res.status(404).json({ error: 'Asignación no encontrada' });
    res.json({ message: 'Asignación eliminada correctamente' });
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================
// USUARIOS / ALUMNOS (para selección en asignaciones)
// ============================================================

router.get('/users', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(User);
    const { role } = req.query;
    const where: any = {};
    if (role) where.role = role;
    const users = await repo.find({ where, order: { name: 'ASC' }, select: ['id', 'name', 'email', 'role', 'created_at'] });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

// ============================================================
// EVALUACIONES
// ============================================================

/**
 * GET /api/evaluations/student/all
 * Lista todas las evaluaciones con datos del alumno y curso
 * Usado por ReportsABM para el panel de reportes
 */
router.get('/evaluations/student/all', async (req: Request, res: Response) => {
  try {
    const { course_id, student_id } = req.query;

    let query = `
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
    `;
    const params: any[] = [];
    const conditions: string[] = [];

    if (student_id) { conditions.push('se.student_id = ?'); params.push(student_id); }
    if (course_id) { conditions.push('sa.course_id = ?'); params.push(course_id); }
    if (conditions.length) query += ' WHERE ' + conditions.join(' AND ');
    query += ' ORDER BY se.evaluated_at DESC';

    const evaluations = await AppDataSource.query(query, params);
    res.json(evaluations);
  } catch (error: any) {
    console.error('[Evaluations] GET /student/all error:', error.message);
    res.status(500).json({ error: 'Error al obtener evaluaciones', details: error.message });
  }
});

/**
 * GET /api/evaluations/:simulation_id
 * Evaluación de una simulación específica
 */
router.get('/evaluations/:simulation_id', async (req: Request, res: Response) => {
  try {
    const evals = await AppDataSource.query(
      `SELECT se.*, u.name AS student_name FROM simulation_evaluations se
       LEFT JOIN users u ON u.id = se.student_id
       WHERE se.simulation_id = ? ORDER BY se.evaluated_at DESC`,
      [req.params.simulation_id]
    );
    res.json(evals);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener evaluación', details: error.message });
  }
});

/**
 * POST /api/evaluations
 * Registra una nueva evaluación de simulación
 */
router.post('/evaluations', async (req: Request, res: Response) => {
  try {
    const { assignment_id, student_id, simulation_id, attempt_number,
      kpi_results, overall_score, overall_feedback, completion_percentage,
      time_spent_seconds, responses } = req.body;

    if (!student_id || !simulation_id) {
      return res.status(400).json({ error: 'student_id y simulation_id son requeridos' });
    }

    const result = await AppDataSource.query(
      `INSERT INTO simulation_evaluations
       (assignment_id, student_id, simulation_id, attempt_number, kpi_results,
        overall_score, overall_feedback, completion_percentage, time_spent_seconds, responses)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [assignment_id || null, student_id, simulation_id, attempt_number || 1,
       JSON.stringify(kpi_results || {}), overall_score || 0, overall_feedback || '',
       completion_percentage || 0, time_spent_seconds || 0, JSON.stringify(responses || {})]
    );
    res.status(201).json({ id: result.insertId, message: 'Evaluación registrada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al registrar evaluación', details: error.message });
  }
});

// ============================================================
// ESCENARIOS DE SIMULACIÓN (scenarios)
// Cada escenario define el contexto, emails, documentos y metas del simulador
// ============================================================

/**
 * GET /api/scenarios
 * Lista escenarios (filtro: ?course_id=&scenario_type=&difficulty=)
 */
router.get('/scenarios', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Scenario);
    const { course_id, scenario_type, difficulty } = req.query as Record<string, string>;
    const where: any = { is_active: true };
    if (course_id) where.course_id = course_id;
    if (scenario_type) where.scenario_type = scenario_type;
    if (difficulty) where.difficulty = difficulty;
    const scenarios = await repo.find({ where, order: { created_at: 'DESC' } });
    res.json(scenarios);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/scenarios/:id
 */
router.get('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const scenario = await AppDataSource.getRepository(Scenario).findOne({ where: { id: req.params.id } });
    if (!scenario) return res.status(404).json({ error: 'Escenario no encontrado' });
    res.json(scenario);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/scenarios
 * Crear nuevo escenario de simulación
 */
router.post('/scenarios', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Scenario);
    const { course_id, title, description, scenario_type, difficulty, content, expected_outcomes } = req.body;
    if (!course_id || !title) return res.status(400).json({ error: 'course_id y title son obligatorios' });
    const scenario = repo.create({
      course_id,
      title,
      description,
      scenario_type: scenario_type || 'practice',
      difficulty: difficulty || 'medium',
      content: content || {},
      expected_outcomes: expected_outcomes || [],
      is_active: true,
    });
    const saved = await repo.save(scenario);
    res.status(201).json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/scenarios/:id
 */
router.put('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Scenario);
    const scenario = await repo.findOne({ where: { id: req.params.id } });
    if (!scenario) return res.status(404).json({ error: 'Escenario no encontrado' });
    Object.assign(scenario, req.body);
    const saved = await repo.save(scenario);
    res.json(saved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/scenarios/:id
 * Desactiva el escenario (soft delete)
 */
router.delete('/scenarios/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(Scenario);
    const scenario = await repo.findOne({ where: { id: req.params.id } });
    if (!scenario) return res.status(404).json({ error: 'Escenario no encontrado' });
    scenario.is_active = false;
    await repo.save(scenario);
    res.json({ message: 'Escenario desactivado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/students/:id/history
 * Historial completo de un alumno:
 * - Sus asignaciones con curso y escenario
 * - Instancias de simulación completadas
 * - Evaluaciones con KPIs detallados
 */
router.get('/students/:id/history', async (req: Request, res: Response) => {
  try {
    const studentId = req.params.id;

    // Datos del alumno
    const [student] = await AppDataSource.query(
      `SELECT id, name, email, role, created_at FROM users WHERE id = ?`,
      [studentId]
    );
    if (!student) return res.status(404).json({ error: 'Alumno no encontrado' });

    // Asignaciones con curso y escenario
    const assignments = await AppDataSource.query(`
      SELECT
        sa.id, sa.simulation_id AS scenario_id, sa.course_id,
        sa.start_date, sa.end_date, sa.max_attempts, sa.attempts_used,
        sa.status AS assignment_status, sa.created_at,
        c.title AS course_title, c.category AS course_category,
        sc.title AS scenario_title, sc.scenario_type, sc.difficulty
      FROM simulation_assignments sa
      LEFT JOIN courses c ON c.id = sa.course_id
      LEFT JOIN scenarios sc ON sc.id = sa.simulation_id
      WHERE sa.student_id = ?
      ORDER BY sa.created_at DESC
    `, [studentId]);

    // Instancias completadas
    const instances = await AppDataSource.query(`
      SELECT si.*, sc.title AS scenario_title
      FROM simulation_instances si
      LEFT JOIN scenarios sc ON sc.id = si.scenario_id
      WHERE si.student_id = ?
      ORDER BY si.started_at DESC
    `, [studentId]);

    // Evaluaciones con detalles
    const evaluations = await AppDataSource.query(`
      SELECT se.*, c.title AS course_title
      FROM simulation_evaluations se
      LEFT JOIN simulation_assignments sa ON sa.id = se.assignment_id
      LEFT JOIN courses c ON c.id = sa.course_id
      WHERE se.student_id = ?
      ORDER BY se.evaluated_at DESC
    `, [studentId]);

    res.json({ student, assignments, instances, evaluations });
  } catch (error: any) {
    console.error('[Students] GET /:id/history error:', error.message);
    res.status(500).json({ error: 'Error al obtener historial', details: error.message });
  }
});

export default router;
