import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/connection';
import { Category } from '../entities/Category';
import { TechSheet } from '../entities/TechSheet';
import { CourseDocument } from '../entities/CourseDocument';
import { SimulationAssignment } from '../entities/SimulationAssignment';
import { User } from '../entities/User';
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

export default router;
