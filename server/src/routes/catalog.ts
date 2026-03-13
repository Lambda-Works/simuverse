import { Router, Request, Response } from 'express';
import multer from 'multer';
import { AppDataSource } from '../database/connection';
import { Category } from '../entities/Category';
import { TechSheet } from '../entities/TechSheet';
import { CourseDocument } from '../entities/CourseDocument';
import { SimulationAssignment } from '../entities/SimulationAssignment';
import { User } from '../entities/User';
import { Scenario } from '../entities/Scenario';
import { TechSheetAnalysisService } from '../services/TechSheetAnalysisService';
import { fileStorageService } from '../services/FileStorageService';
import { v4 as uuidv4 } from 'uuid';
import * as nodemailer from 'nodemailer';

const router = Router();

// Configurar multer para archivos
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'image/png',
      'image/jpeg',
      'text/plain'
    ];
    
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Tipo de archivo no permitido: ${file.mimetype}`));
    }
  }
});

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

/**
 * GET /tech-sheets/valid/list
 * Obtiene solo las fichas técnicas válidas para asociar a cursos
 * Valida: name + (competencies OR kpi_requirements) 
 * Responde solo con id, name, processed
 * NOTA: Este endpoint DEBE estar ANTES de /:id para que se evalúe primero
 */
router.get('/tech-sheets/valid/list', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const sheets = await repo.find({ order: { created_at: 'DESC' } });
    
    // Filtrar solo fichas válidas (con name y al menos competencies o kpi_requirements)
    const validSheets = sheets
      .filter(s => s.name && (s.competencies || s.kpi_requirements))
      .map(s => ({ 
        id: s.id, 
        name: s.name, 
        processed: s.processed,
        has_competencies: !!s.competencies,
        has_kpis: !!s.kpi_requirements
      }));
    
    res.json(validSheets);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

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

/**
 * POST /tech-sheets
 * Crea una nueva ficha técnica
 * Soporta adjuntar archivo (PDF, DOC, DOCX, PNG, JPG, CSV, TXT)
 * 
 * IMPORTANTE: El archivo se guarda en disk, NO en BD
 * BD solo almacena: file_path (ruta relativa), file_name, mime_type, size_bytes
 */
router.post('/tech-sheets', upload.single('file'), async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(TechSheet);
    const { name, course_id, ministry_code, description, competencies, kpi_requirements, context_scenario, uploaded_by } = req.body;
    
    // VALIDACIONES
    if (!name) return res.status(400).json({ error: 'name es obligatorio' });
    
    // ✅ VALIDACIÓN: course_id es OBLIGATORIO
    if (!course_id) {
      return res.status(400).json({ 
        error: 'course_id es OBLIGATORIO. Toda ficha técnica debe estar asociada a un curso.',
        reason: 'Una ficha técnica siempre tiene un curso. Un curso puede no tener ficha, pero una ficha siempre debe tener curso.',
        received: { name, course_id, ministry_code }
      });
    }
    
    // Verificar que el curso exista
    const courseExists = await AppDataSource.query(
      'SELECT id FROM courses WHERE id = ?',
      [course_id]
    );
    if (!courseExists || courseExists.length === 0) {
      return res.status(400).json({ 
        error: `El curso con ID "${course_id}" no existe. Selecciona un curso válido.`,
        course_id: course_id
      });
    }
    
    // ✅ NUEVO: Si hay archivo adjunto, guardarlo en disk
    let fileUrl: string | undefined = undefined;
    let fileInfo = null;

    if (req.file) {
      try {
        fileInfo = await fileStorageService.saveFile(
          req.file.buffer,
          req.file.originalname,
          req.file.mimetype
        );
        // Guardar ruta relativa en BD
        fileUrl = fileInfo.file_path;
        console.log(`✅ Archivo guardado para ficha técnica: ${fileUrl}`);
      } catch (fileErr: any) {
        return res.status(400).json({
          error: 'Error al guardar archivo',
          details: fileErr.message
        });
      }
    }
    
    const sheet = repo.create({ 
      name, 
      course_id,
      ministry_code, 
      description, 
      competencies, 
      kpi_requirements, 
      context_scenario, 
      file_url: fileUrl,
      uploaded_by: uploaded_by || 'system'
    });

    const saved = await repo.save(sheet);
    
    res.status(201).json({
      ...saved,
      file_info: fileInfo ? {
        id: fileInfo.id,
        original_name: fileInfo.original_filename,
        size_bytes: fileInfo.size_bytes,
        mime_type: fileInfo.mime_type,
        stored_at: fileInfo.stored_at
      } : null
    });
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

/**
 * POST /tech-sheets/:id/analyze
 * Analiza la ficha técnica con IA y guarda config en course_config
 * Crea automáticamente tareas para cada KPI
 * 
 * REQUIERE:
 * - course_id asignado
 * - Al menos 1: file_url (PDF/base64), description, o URL manual
 */
router.post('/tech-sheets/:id/analyze', async (req: Request, res: Response) => {
  try {
    const techSheetRepo = AppDataSource.getRepository(TechSheet);
    const analysisService = new TechSheetAnalysisService();
    
    const sheet = await techSheetRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!sheet) return res.status(404).json({ error: 'Ficha técnica no encontrada' });
    
    // ❌ VALIDACIÓN 1: Curso es obligatorio
    if (!sheet.course_id) {
      return res.status(400).json({ error: 'La ficha técnica debe tener un curso asignado' });
    }

    // ❌ VALIDACIÓN 2: Al menos 1 contenido
    const hasContent = sheet.file_url || sheet.description;
    if (!hasContent) {
      return res.status(400).json({ 
        error: 'La ficha técnica debe tener al menos uno de: archivo adjunto, URL o descripción/contenido',
        details: {
          has_file: !!sheet.file_url,
          has_description: !!sheet.description,
          required: 'Al menos 1 contenido'
        }
      });
    }

    // Marcar como procesado
    sheet.processed = true;
    sheet.processed_at = new Date();
    
    // Guardar cambios en tech_sheet
    const savedSheet = await techSheetRepo.save(sheet);

    // Pasar el sheet COMPLETO al servicio para que analice el contenido REAL
    // (file_url, description, etc.)
    const analyzedConfig = await analysisService.analyzeAndSave(
      sheet,
      sheet.course_id
    );

    res.json({ 
      message: 'Ficha técnica analizada con éxito',
      sheet: savedSheet,
      config: analyzedConfig,
      summary: {
        competencies_count: analyzedConfig.competencies.length,
        kpis_count: analyzedConfig.kpis.length,
        tasks_count: analyzedConfig.tasks.length,
        from_content: {
          file: !!sheet.file_url,
          description: !!sheet.description
        }
      }
    });
  } catch (error) {
    console.error('Error analyzing tech sheet:', error);
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * GET /tech-sheets/:id/config
 * Obtiene la configuración analizada para una ficha técnica
 */
router.get('/tech-sheets/:id/config', async (req: Request, res: Response) => {
  try {
    const techSheetRepo = AppDataSource.getRepository(TechSheet);
    const analysisService = new TechSheetAnalysisService();
    
    const sheet = await techSheetRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!sheet) return res.status(404).json({ error: 'Ficha técnica no encontrada' });
    
    if (!sheet.course_id) {
      return res.status(400).json({ error: 'La ficha técnica no tiene curso asignado' });
    }

    const config = await analysisService.getAnalyzedConfig(sheet.course_id);
    
    if (!config) {
      return res.status(404).json({ error: 'Configuración analizada no encontrada. Ejecuta /analyze primero.' });
    }

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

/**
 * PUT /tech-sheets/:id/config
 * Actualiza la configuración analizada (editar competencias, KPIs, tareas, prompts)
 */
router.put('/tech-sheets/:id/config', async (req: Request, res: Response) => {
  try {
    const techSheetRepo = AppDataSource.getRepository(TechSheet);
    const analysisService = new TechSheetAnalysisService();
    
    const sheet = await techSheetRepo.findOne({ where: { id: parseInt(req.params.id) } });
    if (!sheet) return res.status(404).json({ error: 'Ficha técnica no encontrada' });
    
    if (!sheet.course_id) {
      return res.status(400).json({ error: 'La ficha técnica no tiene curso asignado' });
    }

    const { competencies, kpis, tasks, prompts } = req.body;

    const updates: any = {};
    if (competencies) updates.competencies = competencies;
    if (kpis) updates.kpis = kpis;
    if (tasks) updates.tasks = tasks;
    if (prompts) updates.prompts = prompts;

    const updatedConfig = await analysisService.updateAnalyzedConfig(
      sheet.course_id,
      updates
    );

    res.json({
      message: 'Configuración actualizada correctamente',
      config: updatedConfig
    });
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

/**
 * GET /api/students/:id/stats
 * Estadísticas detalladas de un alumno: aciertos, desaciertos, aprobación, KPIs, tiempo
 */
router.get('/students/:id/stats', async (req: Request, res: Response) => {
  try {
    const studentId = req.params.id;
    const [student] = await AppDataSource.query(
      `SELECT id, name, email, role FROM users WHERE id = ?`, [studentId]
    );
    if (!student) return res.status(404).json({ error: 'Alumno no encontrado' });

    // Total instancias
    const [{ total_sessions }] = await AppDataSource.query(
      `SELECT COUNT(*) AS total_sessions FROM simulation_instances WHERE student_id = ?`, [studentId]
    );
    const [{ completed_sessions }] = await AppDataSource.query(
      `SELECT COUNT(*) AS completed_sessions FROM simulation_instances WHERE student_id = ? AND status = 'completed'`, [studentId]
    );
    // Total evaluaciones
    const evaluations = await AppDataSource.query(
      `SELECT se.overall_score, se.kpi_results, se.time_spent_seconds, se.evaluated_at,
              c.title AS course_title, sa.course_id
       FROM simulation_evaluations se
       LEFT JOIN simulation_assignments sa ON sa.id = se.assignment_id
       LEFT JOIN courses c ON c.id = sa.course_id
       WHERE se.student_id = ?
       ORDER BY se.evaluated_at DESC`, [studentId]
    );
    // Chat logs: aciertos/desaciertos
    const chatStats = await AppDataSource.query(
      `SELECT
         COUNT(*) AS total_challenges,
         SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) AS correct,
         SUM(CASE WHEN is_correct = 0 THEN 1 ELSE 0 END) AS incorrect
       FROM simulation_chat_logs scl
       JOIN simulation_instances si ON si.id = scl.simulation_instance_id
       WHERE si.student_id = ? AND scl.is_correct IS NOT NULL`, [studentId]
    );
    const { total_challenges, correct, incorrect } = chatStats[0] || { total_challenges: 0, correct: 0, incorrect: 0 };

    // Stats por curso
    const byCourse = await AppDataSource.query(
      `SELECT c.title AS course_title, c.id AS course_id,
         COUNT(DISTINCT si.id) AS sessions,
         COUNT(se.id) AS evaluations,
         AVG(se.overall_score) AS avg_score,
         MAX(se.overall_score) AS best_score,
         SUM(si.time_spent_seconds) AS total_time_seconds,
         SUM(CASE WHEN se.overall_score >= 70 THEN 1 ELSE 0 END) AS approved_evals
       FROM simulation_assignments sa
       LEFT JOIN courses c ON c.id = sa.course_id
       LEFT JOIN simulation_instances si ON si.student_id = sa.student_id AND si.scenario_id = sa.simulation_id
       LEFT JOIN simulation_evaluations se ON se.student_id = sa.student_id AND se.assignment_id = sa.id
       WHERE sa.student_id = ?
       GROUP BY c.id, c.title`, [studentId]
    );

    // Final exam: evaluation con type 'evaluation' scenario
    const finalExam = await AppDataSource.query(
      `SELECT se.overall_score, se.evaluated_at, sc.title AS scenario_title, sc.scenario_type, c.title AS course_title
       FROM simulation_evaluations se
       LEFT JOIN simulation_assignments sa ON sa.id = se.assignment_id
       LEFT JOIN scenarios sc ON sc.id = sa.simulation_id
       LEFT JOIN courses c ON c.id = sa.course_id
       WHERE se.student_id = ? AND sc.scenario_type = 'evaluation'
       ORDER BY se.evaluated_at DESC LIMIT 1`, [studentId]
    );

    // KPI approval rate
    let totalKpis = 0, approvedKpis = 0;
    for (const ev of evaluations) {
      const kpis = typeof ev.kpi_results === 'string' ? JSON.parse(ev.kpi_results || '{}') : (ev.kpi_results || {});
      for (const v of Object.values(kpis)) {
        totalKpis++;
        if ((v as number) >= 70) approvedKpis++;
      }
    }
    const kpiApprovalRate = totalKpis > 0 ? Math.round((approvedKpis / totalKpis) * 100) : null;

    const avgScore = evaluations.length
      ? evaluations.reduce((s: number, e: any) => s + (e.overall_score || 0), 0) / evaluations.length : 0;
    const totalTime = evaluations.reduce((s: number, e: any) => s + (e.time_spent_seconds || 0), 0);

    res.json({
      student,
      total_sessions: Number(total_sessions),
      completed_sessions: Number(completed_sessions),
      total_evaluations: evaluations.length,
      avg_score: Math.round(avgScore * 10) / 10,
      total_time_minutes: Math.round(totalTime / 60),
      correct_answers: Number(correct),
      incorrect_answers: Number(incorrect),
      total_challenges: Number(total_challenges),
      accuracy_rate: total_challenges > 0 ? Math.round((Number(correct) / Number(total_challenges)) * 100) : null,
      kpi_approval_rate: kpiApprovalRate,
      approved_evaluations: evaluations.filter((e: any) => e.overall_score >= 70).length,
      final_exam: finalExam[0] || null,
      by_course: byCourse,
      evaluations,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener estadísticas', details: error.message });
  }
});

/**
 * GET /api/students/stats/course/:course_id
 * Estadísticas de todos los alumnos de un curso
 */
router.get('/students/stats/course/:course_id', async (req: Request, res: Response) => {
  try {
    const { course_id } = req.params;
    const stats = await AppDataSource.query(`
      SELECT
        u.id AS student_id, u.name, u.email,
        COUNT(DISTINCT si.id) AS total_sessions,
        COUNT(se.id) AS total_evaluations,
        AVG(se.overall_score) AS avg_score,
        MAX(se.overall_score) AS best_score,
        SUM(si.time_spent_seconds) AS total_time_seconds,
        SUM(CASE WHEN se.overall_score >= 70 THEN 1 ELSE 0 END) AS approved_evals,
        MAX(CASE WHEN sc.scenario_type = 'evaluation' THEN se.overall_score END) AS final_exam_score
      FROM simulation_assignments sa
      JOIN users u ON u.id = sa.student_id
      LEFT JOIN simulation_instances si ON si.student_id = sa.student_id AND si.scenario_id = sa.simulation_id
      LEFT JOIN simulation_evaluations se ON se.student_id = sa.student_id AND se.assignment_id = sa.id
      LEFT JOIN scenarios sc ON sc.id = sa.simulation_id
      WHERE sa.course_id = ?
      GROUP BY u.id, u.name, u.email
      ORDER BY avg_score DESC
    `, [course_id]);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener estadísticas del curso', details: error.message });
  }
});

// ============================================================
// VISOR DE SESIONES DE SIMULACIÓN (simulation_chat_logs)
// Solo accesible por admin/teacher/ministerio
// ============================================================

/**
 * GET /api/simulation-sessions/:instance_id
 * Devuelve el log completo de una sesión con metadata
 */
router.get('/simulation-sessions/:instance_id', async (req: Request, res: Response) => {
  try {
    const { instance_id } = req.params;
    const [instance] = await AppDataSource.query(`
      SELECT si.*, u.name AS student_name, u.email AS student_email,
             sc.title AS scenario_title, sc.scenario_type, sc.difficulty,
             c.title AS course_title
      FROM simulation_instances si
      LEFT JOIN users u ON u.id = si.student_id
      LEFT JOIN scenarios sc ON sc.id = si.scenario_id
      LEFT JOIN simulation_assignments sa ON sa.student_id = si.student_id AND sa.simulation_id = si.scenario_id
      LEFT JOIN courses c ON c.id = sa.course_id
      WHERE si.id = ?
      LIMIT 1
    `, [instance_id]);
    if (!instance) return res.status(404).json({ error: 'Sesión no encontrada' });

    const logs = await AppDataSource.query(
      `SELECT * FROM simulation_chat_logs WHERE simulation_instance_id = ? ORDER BY turn_number ASC`,
      [instance_id]
    );

    const [eval_data] = await AppDataSource.query(
      `SELECT * FROM simulation_evaluations WHERE simulation_id = ? ORDER BY evaluated_at DESC LIMIT 1`,
      [instance_id]
    );

    const summary = {
      total_turns: logs.length,
      student_turns: logs.filter((l: any) => l.speaker === 'student').length,
      evaluated_turns: logs.filter((l: any) => l.is_correct !== null).length,
      correct_turns: logs.filter((l: any) => l.is_correct == 1).length,
      incorrect_turns: logs.filter((l: any) => l.is_correct == 0).length,
    };

    res.json({ instance, logs, evaluation: eval_data || null, summary });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener sesión', details: error.message });
  }
});

/**
 * GET /api/simulation-sessions/ref/:ref_number
 * Buscar log por número de referencia (para auditoría)
 */
router.get('/simulation-sessions/ref/:ref_number', async (req: Request, res: Response) => {
  try {
    const [log] = await AppDataSource.query(
      `SELECT scl.*, si.student_id, si.scenario_id,
              u.name AS student_name, sc.title AS scenario_title
       FROM simulation_chat_logs scl
       JOIN simulation_instances si ON si.id = scl.simulation_instance_id
       LEFT JOIN users u ON u.id = si.student_id
       LEFT JOIN scenarios sc ON sc.id = si.scenario_id
       WHERE scl.ref_number = ?`,
      [req.params.ref_number]
    );
    if (!log) return res.status(404).json({ error: 'Referencia no encontrada' });
    res.json(log);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al buscar referencia', details: error.message });
  }
});

/**
 * GET /api/simulation-sessions?student_id=&course_id=
 * Lista todas las sesiones con filtros (para el admin/profesor)
 */
router.get('/simulation-sessions', async (req: Request, res: Response) => {
  try {
    const { student_id, course_id } = req.query;
    const conditions: string[] = [];
    const params: any[] = [];
    if (student_id) { conditions.push('si.student_id = ?'); params.push(student_id); }
    if (course_id) { conditions.push('sa.course_id = ?'); params.push(course_id); }
    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const sessions = await AppDataSource.query(`
      SELECT si.id, si.status, si.score, si.started_at, si.completed_at, si.time_spent_seconds, si.progress_percentage,
             u.name AS student_name, u.email AS student_email, u.id AS student_id,
             sc.title AS scenario_title, sc.scenario_type, sc.difficulty,
             c.title AS course_title, c.id AS course_id,
             (SELECT COUNT(*) FROM simulation_chat_logs scl WHERE scl.simulation_instance_id = si.id) AS total_turns,
             (SELECT COUNT(*) FROM simulation_chat_logs scl WHERE scl.simulation_instance_id = si.id AND scl.is_correct = 0) AS incorrect_turns
      FROM simulation_instances si
      LEFT JOIN users u ON u.id = si.student_id
      LEFT JOIN scenarios sc ON sc.id = si.scenario_id
      LEFT JOIN simulation_assignments sa ON sa.student_id = si.student_id AND sa.simulation_id = si.scenario_id
      LEFT JOIN courses c ON c.id = sa.course_id
      ${whereClause}
      ORDER BY si.started_at DESC
    `, params);
    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al listar sesiones', details: error.message });
  }
});

// ============================================================
// GESTIÓN DE USUARIOS (CRUD completo para admin)
// ============================================================
import bcrypt from 'bcrypt';

/**
 * GET /api/users/all
 * Lista todos los usuarios con datos completos (solo admin)
 */
router.get('/users/all', async (req: Request, res: Response) => {
  try {
    const users = await AppDataSource.query(
      `SELECT id, name, email, role, created_at, updated_at FROM users ORDER BY name ASC`
    );
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
});

/**
 * POST /api/users/create
 * Crear nuevo usuario
 */
router.post('/users/create', async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'name, email y password son obligatorios' });
    const hashed = await bcrypt.hash(password, 10);
    const id = require('crypto').randomUUID();
    await AppDataSource.query(
      `INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)`,
      [id, name, email, hashed, role || 'student']
    );
    res.status(201).json({ id, name, email, role: role || 'student' });
  } catch (error: any) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'El email ya está registrado' });
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
});

/**
 * PUT /api/users/:id
 * Actualizar usuario (name, email, role, password opcional)
 */
router.put('/users/:id', async (req: Request, res: Response) => {
  try {
    const { name, email, role, password } = req.body;
    const fields: string[] = [];
    const params: any[] = [];
    if (name) { fields.push('name = ?'); params.push(name); }
    if (email) { fields.push('email = ?'); params.push(email); }
    if (role) { fields.push('role = ?'); params.push(role); }
    if (password) {
      const hashed = await bcrypt.hash(password, 10);
      fields.push('password = ?'); params.push(hashed);
    }
    if (fields.length === 0) return res.status(400).json({ error: 'No hay campos para actualizar' });
    params.push(req.params.id);
    await AppDataSource.query(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);
    res.json({ message: 'Usuario actualizado' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar usuario', details: error.message });
  }
});

/**
 * DELETE /api/users/:id
 * Eliminar usuario
 */
router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const result = await AppDataSource.query(`DELETE FROM users WHERE id = ?`, [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ message: 'Usuario eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar usuario', details: error.message });
  }
});

// ============================================================
// GESTIÓN DE ROLES
// ============================================================

router.get('/roles', async (req: Request, res: Response) => {
  try {
    const roles = await AppDataSource.query(`SELECT * FROM roles ORDER BY name ASC`);
    res.json(roles);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/roles', async (req: Request, res: Response) => {
  try {
    const { name, description, color } = req.body;
    if (!name) return res.status(400).json({ error: 'name es obligatorio' });
    await AppDataSource.query(`INSERT INTO roles (name, description, color) VALUES (?, ?, ?)`, [name, description || '', color || '#6366f1']);
    res.status(201).json({ message: 'Rol creado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/roles/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, color, is_active } = req.body;
    await AppDataSource.query(
      `UPDATE roles SET name = COALESCE(?, name), description = COALESCE(?, description), color = COALESCE(?, color), is_active = COALESCE(?, is_active) WHERE id = ?`,
      [name || null, description || null, color || null, is_active !== undefined ? is_active : null, req.params.id]
    );
    res.json({ message: 'Rol actualizado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/roles/:id', async (req: Request, res: Response) => {
  try {
    await AppDataSource.query(`DELETE FROM roles WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Rol eliminado' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// GESTIÓN DE FUNCIONALIDADES DEL SISTEMA
// ============================================================

router.get('/functionalities', async (req: Request, res: Response) => {
  try {
    const funcs = await AppDataSource.query(`SELECT * FROM system_functionalities ORDER BY module ASC, name ASC`);
    res.json(funcs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/functionalities', async (req: Request, res: Response) => {
  try {
    const { name, description, module, icon, route } = req.body;
    if (!name) return res.status(400).json({ error: 'name es obligatorio' });
    const result = await AppDataSource.query(
      `INSERT INTO system_functionalities (name, description, module, icon, route) VALUES (?, ?, ?, ?, ?)`,
      [name, description || '', module || 'other', icon || '', route || '']
    );
    res.status(201).json({ id: result.insertId, name });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/functionalities/:id', async (req: Request, res: Response) => {
  try {
    const { name, description, module, icon, route, is_active } = req.body;
    await AppDataSource.query(
      `UPDATE system_functionalities SET name = COALESCE(?, name), description = COALESCE(?, description), module = COALESCE(?, module), icon = COALESCE(?, icon), route = COALESCE(?, route), is_active = COALESCE(?, is_active) WHERE id = ?`,
      [name || null, description || null, module || null, icon || null, route || null, is_active !== undefined ? is_active : null, req.params.id]
    );
    res.json({ message: 'Funcionalidad actualizada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/functionalities/:id', async (req: Request, res: Response) => {
  try {
    await AppDataSource.query(`DELETE FROM system_functionalities WHERE id = ?`, [req.params.id]);
    res.json({ message: 'Funcionalidad eliminada' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// PERMISOS POR ROL
// ============================================================

/**
 * GET /api/role-permissions?role_name=X
 * Obtiene todos los permisos de un rol (funcionalidades + habilitado/no)
 */
router.get('/role-permissions', async (req: Request, res: Response) => {
  try {
    const { role_name } = req.query;
    if (!role_name) return res.status(400).json({ error: 'role_name es requerido' });
    const perms = await AppDataSource.query(`
      SELECT sf.id AS functionality_id, sf.name, sf.description, sf.module, sf.icon,
             COALESCE(rp.enabled, 0) AS enabled
      FROM system_functionalities sf
      LEFT JOIN role_permissions rp ON rp.functionality_id = sf.id AND rp.role_name = ?
      WHERE sf.is_active = 1
      ORDER BY sf.module ASC, sf.name ASC
    `, [role_name]);
    res.json(perms);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/role-permissions
 * Actualiza permisos de un rol en batch
 * Body: { role_name, permissions: [{ functionality_id, enabled }] }
 */
router.put('/role-permissions', async (req: Request, res: Response) => {
  try {
    const { role_name, permissions } = req.body;
    if (!role_name || !Array.isArray(permissions)) return res.status(400).json({ error: 'role_name y permissions[] son requeridos' });
    for (const p of permissions) {
      await AppDataSource.query(
        `INSERT INTO role_permissions (role_name, functionality_id, enabled) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE enabled = ?`,
        [role_name, p.functionality_id, p.enabled ? 1 : 0, p.enabled ? 1 : 0]
      );
    }
    res.json({ message: `Permisos de rol '${role_name}' actualizados (${permissions.length} items)` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SOLICITUD DE ACCESO (nuevos alumnos sin asignaciones) ==========

/**
 * POST /api/request-access
 * Un alumno recién registrado sin cursos asignados solicita acceso al simulador.
 * Envía un email a centrosadoskyregistracion@gmail.com con los datos del usuario.
 */
router.post('/request-access', async (req: Request, res: Response) => {
  try {
    const { nombre, apellido, dni, celular, email, user_id } = req.body;
    if (!nombre || !apellido || !dni || !celular || !email) {
      return res.status(400).json({ error: 'Todos los campos son obligatorios: nombre, apellido, dni, celular, email' });
    }

    // Registrar la solicitud en la BD
    await AppDataSource.query(
      `INSERT IGNORE INTO access_requests (user_id, nombre, apellido, dni, celular, email, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
      [user_id || null, nombre, apellido, dni, celular, email]
    );

    // Configurar transporte SMTP (usa Gmail con contraseña de aplicación)
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_FROM || 'notificaciones.simuverse@gmail.com',
        pass: process.env.MAIL_PASS || '',
      },
    });

    const mailOptions = {
      from: `"SimuVerse - Solicitudes" <${process.env.MAIL_FROM || 'notificaciones.simuverse@gmail.com'}>`,
      to: 'centrosadoskyregistracion@gmail.com',
      subject: `📋 Nueva solicitud de acceso al Simulador - ${nombre} ${apellido}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9fafb; padding: 24px; border-radius: 12px;">
          <div style="background: #1e40af; color: white; padding: 20px; border-radius: 8px; margin-bottom: 24px;">
            <h2 style="margin: 0;">📋 Nueva Solicitud de Acceso</h2>
            <p style="margin: 4px 0 0; opacity: 0.85;">SimuVerse - Sistema de Simulaciones Educativas</p>
          </div>
          <div style="background: white; padding: 20px; border-radius: 8px; border: 1px solid #e5e7eb;">
            <h3 style="color: #374151; margin-top: 0;">Datos del Solicitante</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr><td style="padding: 8px; font-weight: bold; color: #6b7280; width: 140px;">Nombre:</td><td style="padding: 8px; color: #111827;">${nombre}</td></tr>
              <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Apellido:</td><td style="padding: 8px; color: #111827;">${apellido}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">DNI:</td><td style="padding: 8px; color: #111827;">${dni}</td></tr>
              <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Celular:</td><td style="padding: 8px; color: #111827;">${celular}</td></tr>
              <tr><td style="padding: 8px; font-weight: bold; color: #6b7280;">Email:</td><td style="padding: 8px; color: #111827;"><a href="mailto:${email}">${email}</a></td></tr>
              <tr style="background: #f9fafb;"><td style="padding: 8px; font-weight: bold; color: #6b7280;">Fecha:</td><td style="padding: 8px; color: #111827;">${new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</td></tr>
            </table>
          </div>
          <p style="color: #6b7280; font-size: 13px; margin-top: 16px; text-align: center;">Este mensaje fue generado automáticamente por SimuVerse 3.0</p>
        </div>
      `,
    };

    let emailSent = false;
    try {
      await transporter.sendMail(mailOptions);
      emailSent = true;
    } catch (mailErr: any) {
      console.warn('⚠️  Email no pudo enviarse (configurar MAIL_FROM y MAIL_PASS en .env):', mailErr.message);
    }

    res.json({
      message: 'Solicitud registrada correctamente.',
      email_sent: emailSent,
      note: emailSent ? 'Se envió una notificación al equipo de administración.' : 'Solicitud guardada. El equipo la revisará a la brevedad.',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== GLOBAL STATS (Dashboard estadístico) ==========
router.get('/global-stats', async (req: Request, res: Response) => {
  try {
    const [usersRow, simStats, weekStats, courseStats, pendingReqs, topStudents] = await Promise.all([
      AppDataSource.query(`SELECT role, COUNT(*) as count FROM users GROUP BY role`),
      AppDataSource.query(`SELECT COUNT(*) as total, AVG(overall_score) as avg_score, AVG(time_spent_seconds/60) as avg_min, SUM(CASE WHEN overall_score >= 70 THEN 1 ELSE 0 END) as approved FROM simulation_evaluations`),
      AppDataSource.query(`SELECT COUNT(*) as cnt FROM simulation_evaluations WHERE evaluated_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)`),
      AppDataSource.query(`SELECT c.title, COUNT(*) as uses, ROUND(AVG(se.overall_score),1) as avg_score FROM simulation_evaluations se LEFT JOIN simulation_assignments sa ON sa.id = se.assignment_id LEFT JOIN courses c ON c.id = sa.course_id WHERE c.title IS NOT NULL GROUP BY c.id, c.title ORDER BY uses DESC LIMIT 5`),
      AppDataSource.query(`SELECT COUNT(*) as cnt FROM access_requests WHERE status = 'pending'`),
      AppDataSource.query(`SELECT u.name, ROUND(AVG(se.overall_score),1) as avg_score, COUNT(*) as sims FROM simulation_evaluations se JOIN users u ON u.id = se.student_id GROUP BY se.student_id, u.name ORDER BY avg_score DESC LIMIT 5`),
    ]);
    const ev = simStats[0];
    res.json({
      users: usersRow,
      total_evaluations: Number(ev.total || 0),
      avg_score: Number(ev.avg_score || 0).toFixed(1),
      avg_minutes: Math.round(Number(ev.avg_min || 0)),
      approval_rate: ev.total > 0 ? Math.round((ev.approved / ev.total) * 100) : 0,
      completed_this_week: Number(weekStats[0].cnt || 0),
      top_courses: courseStats,
      pending_access_requests: Number(pendingReqs[0].cnt || 0),
      top_students: topStudents,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== ACCESS REQUESTS MANAGEMENT ==========
router.get('/access-requests', async (req: Request, res: Response) => {
  try {
    const status = (req.query.status as string) || 'all';
    const query = status !== 'all'
      ? `SELECT * FROM access_requests WHERE status = ? ORDER BY created_at DESC`
      : `SELECT * FROM access_requests ORDER BY created_at DESC`;
    const rows = await AppDataSource.query(query, status !== 'all' ? [status] : []);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/access-requests/:id', async (req: Request, res: Response) => {
  try {
    const { action, admin_notes } = req.body;
    const rows = await AppDataSource.query('SELECT * FROM access_requests WHERE id = ?', [req.params.id]);
    if (!rows.length) return res.status(404).json({ error: 'Solicitud no encontrada' });
    const r = rows[0];
    const newStatus = action === 'approve' ? 'processed' : 'rejected';
    await AppDataSource.query('UPDATE access_requests SET status=?, admin_notes=?, processed_at=NOW() WHERE id=?', [newStatus, admin_notes || null, req.params.id]);
    const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.MAIL_FROM || '', pass: process.env.MAIL_PASS || '' } });
    const approved = action === 'approve';
    let emailSent = false;
    try {
      await transporter.sendMail({
        from: `"SimuVerse" <${process.env.MAIL_FROM || 'notificaciones.simuverse@gmail.com'}>`,
        to: r.email,
        subject: approved ? '✅ Tu solicitud de acceso fue aprobada - SimuVerse' : 'Actualización de tu solicitud - SimuVerse',
        html: approved
          ? `<div style="font-family:Arial,sans-serif;max-width:600px;padding:24px;background:#f0fdf4;border-radius:12px;"><div style="background:#16a34a;color:white;padding:20px;border-radius:8px;margin-bottom:16px;"><h2 style="margin:0">✅ ¡Acceso Aprobado!</h2></div><p>Hola <strong>${r.nombre}</strong>, tu solicitud fue aprobada. Ya podés ingresar al simulador.</p>${admin_notes ? `<p><em>${admin_notes}</em></p>` : ''}</div>`
          : `<div style="font-family:Arial,sans-serif;max-width:600px;padding:24px;background:#fff7f7;border-radius:12px;"><div style="background:#dc2626;color:white;padding:20px;border-radius:8px;margin-bottom:16px;"><h2 style="margin:0">Solicitud revisada</h2></div><p>Hola <strong>${r.nombre}</strong>, tu solicitud fue revisada. Contactá a centrosadoskyregistracion@gmail.com para más información.</p>${admin_notes ? `<p><em>${admin_notes}</em></p>` : ''}</div>`,
      });
      emailSent = true;
    } catch (e: any) { console.warn('Email no enviado:', e.message); }
    res.json({ message: `Solicitud ${approved ? 'aprobada' : 'rechazada'}`, email_sent: emailSent });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== CERTIFICATES ==========
router.get('/certificates/:instance_id', async (req: Request, res: Response) => {
  try {
    const { instance_id } = req.params;
    const rows = await AppDataSource.query(`
      SELECT si.*, u.name as student_name, u.email as student_email,
        sc.title as scenario_title, sc.eval_criteria,
        c.title as course_title, c.category as course_category,
        c.eval_criteria as course_eval_criteria,
        c.tech_sheet_id as course_tech_sheet_id
      FROM simulation_instances si
      LEFT JOIN users u ON u.id = si.student_id
      LEFT JOIN scenarios sc ON sc.id = si.scenario_id
      LEFT JOIN simulation_assignments sa ON sa.student_id = si.student_id AND sa.simulation_id = si.scenario_id
      LEFT JOIN courses c ON c.id = sa.course_id
      WHERE si.id = ?
    `, [instance_id]);
    if (!rows.length) return res.status(404).json({ error: 'Sesión no encontrada' });
    const inst = rows[0];
    const evals = await AppDataSource.query(`
      SELECT se.* FROM simulation_evaluations se
      LEFT JOIN simulation_assignments sa ON sa.id = se.assignment_id
      WHERE sa.student_id = ? AND sa.simulation_id = ?
      ORDER BY se.evaluated_at DESC LIMIT 1
    `, [inst.student_id, inst.scenario_id]);
    const evaluation = evals[0] || null;
    if (!evaluation || Number(evaluation.overall_score) < 70) {
      return res.status(403).json({ error: 'El alumno no ha aprobado esta simulación (puntaje mínimo: 70)' });
    }
    let kpiResults: Record<string, number> = {};
    try { kpiResults = typeof evaluation.kpi_results === 'string' ? JSON.parse(evaluation.kpi_results) : (evaluation.kpi_results || {}); } catch {}

    // Criterios del docente: priorizar del curso, fallback al escenario
    let evalCriteria: string[] = [];
    try {
      const raw = inst.course_eval_criteria || inst.eval_criteria;
      evalCriteria = typeof raw === 'string' ? JSON.parse(raw) : (raw || []);
    } catch {}

    // KPIs ministeriales: si el curso tiene ficha técnica vinculada
    let ministryKPIs: Array<{ name: string; description: string; category: string }> = [];
    let ministrySheetName = '';
    let ministryCode = '';
    if (inst.course_tech_sheet_id) {
      try {
        const sheets = await AppDataSource.query(
          'SELECT name, ministry_code, kpi_requirements, extracted_data FROM tech_sheets WHERE id = ?',
          [inst.course_tech_sheet_id]
        );
        if (sheets.length) {
          const sheet = sheets[0];
          ministrySheetName = sheet.name || '';
          ministryCode = sheet.ministry_code || '';
          // kpi_requirements contiene los KPIs formales de la ficha
          let kpis: any[] = [];
          try { kpis = typeof sheet.kpi_requirements === 'string' ? JSON.parse(sheet.kpi_requirements) : (sheet.kpi_requirements || []); } catch {}
          // Fallback: usar eval_criteria extraídos por IA si no hay kpi_requirements
          if (!kpis.length && sheet.extracted_data) {
            try {
              const ed = typeof sheet.extracted_data === 'string' ? JSON.parse(sheet.extracted_data) : sheet.extracted_data;
              kpis = (ed?.eval_criteria || []).map((c: string) => ({ name: c, description: '', category: 'ministerial' }));
            } catch {}
          }
          ministryKPIs = kpis;
        }
      } catch {}
    }

    res.json({
      certificate_id: `CERT-${instance_id.substring(0, 8).toUpperCase()}`,
      student_name: inst.student_name,
      student_email: inst.student_email,
      course_title: inst.course_title || inst.scenario_title || 'Simulación',
      scenario_title: inst.scenario_title,
      course_category: inst.course_category,
      overall_score: Number(evaluation.overall_score),
      kpi_results: kpiResults,
      eval_criteria: evalCriteria,
      // Datos ministeriales (ficha técnica)
      ministry_sheet_name: ministrySheetName,
      ministry_code: ministryCode,
      ministry_kpis: ministryKPIs,
      completed_at: inst.completed_at || evaluation.evaluated_at,
      time_spent_minutes: Math.round((inst.time_spent_seconds || 0) / 60),
      instance_id,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== TEACHER GROUPS ==========
router.get('/teacher-groups', async (req: Request, res: Response) => {
  try {
    const { teacher_id } = req.query;
    const query = teacher_id
      ? `SELECT tg.*, t.name as teacher_name, t.email as teacher_email, s.name as student_name, s.email as student_email FROM teacher_groups tg LEFT JOIN users t ON t.id = tg.teacher_id LEFT JOIN users s ON s.id = tg.student_id WHERE tg.teacher_id = ? ORDER BY s.name`
      : `SELECT tg.*, t.name as teacher_name, t.email as teacher_email, s.name as student_name, s.email as student_email FROM teacher_groups tg LEFT JOIN users t ON t.id = tg.teacher_id LEFT JOIN users s ON s.id = tg.student_id ORDER BY t.name, s.name`;
    const rows = await AppDataSource.query(query, teacher_id ? [teacher_id] : []);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/teacher-groups', async (req: Request, res: Response) => {
  try {
    const { teacher_id, student_id } = req.body;
    if (!teacher_id || !student_id) return res.status(400).json({ error: 'teacher_id y student_id requeridos' });
    await AppDataSource.query('INSERT IGNORE INTO teacher_groups (teacher_id, student_id) VALUES (?, ?)', [teacher_id, student_id]);
    res.json({ message: 'Alumno agregado al grupo del docente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/teacher-groups/:id', async (req: Request, res: Response) => {
  try {
    await AppDataSource.query('DELETE FROM teacher_groups WHERE id = ?', [req.params.id]);
    res.json({ message: 'Eliminado del grupo' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== STUDENT REVIEW (auto-revisión del alumno) ==========
router.get('/student-review/:instance_id', async (req: Request, res: Response) => {
  try {
    const { instance_id } = req.params;
    const { student_id } = req.query;
    const inst = await AppDataSource.query('SELECT * FROM simulation_instances WHERE id = ?', [instance_id]);
    if (!inst.length) return res.status(404).json({ error: 'Sesión no encontrada' });
    if (student_id && inst[0].student_id !== student_id) return res.status(403).json({ error: 'Sin acceso' });
    const [logs, evals, scenario] = await Promise.all([
      AppDataSource.query('SELECT * FROM simulation_chat_logs WHERE simulation_instance_id = ? ORDER BY turn_number ASC', [instance_id]),
      AppDataSource.query(`SELECT se.* FROM simulation_evaluations se JOIN simulation_assignments sa ON sa.id = se.assignment_id WHERE sa.student_id = ? AND sa.simulation_id = ? ORDER BY se.evaluated_at DESC LIMIT 1`, [inst[0].student_id, inst[0].scenario_id]),
      AppDataSource.query('SELECT title, eval_criteria FROM scenarios WHERE id = ?', [inst[0].scenario_id]),
    ]);
    res.json({ instance: inst[0], logs, evaluation: evals[0] || null, scenario: scenario[0] || null });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== STUDENT ASSIGNMENTS (enriquecido con intentos y fechas) ==========
router.get('/student-assignments/:student_id', async (req: Request, res: Response) => {
  try {
    const rows = await AppDataSource.query(`
      SELECT sa.id, sa.simulation_id, sa.student_id, sa.course_id,
        sa.start_date, sa.end_date, sa.max_attempts, sa.attempts_used,
        sa.status, sa.created_at,
        (sa.max_attempts - sa.attempts_used) as attempts_remaining,
        c.title as course_title, c.description as course_description,
        c.category as course_category, c.modules as course_modules,
        se.overall_score, se.evaluated_at, se.kpi_results, se.assignment_id as eval_assignment_id,
        CASE
          WHEN sa.end_date IS NOT NULL AND sa.end_date < NOW() AND sa.status != 'completed' THEN 'expired'
          WHEN sa.start_date IS NOT NULL AND sa.start_date > NOW() THEN 'upcoming'
          WHEN sa.status = 'completed' THEN 'completed'
          ELSE 'active'
        END as calendar_status,
        si.id as instance_id
      FROM simulation_assignments sa
      LEFT JOIN courses c ON c.id = sa.course_id
      LEFT JOIN simulation_evaluations se ON se.student_id = sa.student_id AND se.assignment_id = sa.id
      LEFT JOIN simulation_instances si ON si.student_id = sa.student_id AND si.scenario_id = sa.simulation_id
      WHERE sa.student_id = ?
      ORDER BY FIELD(sa.status,'in_progress','active','pending','completed'), sa.end_date ASC
    `, [req.params.student_id]);
    res.json(rows);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ========== SIMULATED COMPANIES ==========
router.get('/simulated-companies', async (req: Request, res: Response) => {
  try {
    const rows = await AppDataSource.query('SELECT * FROM simulated_companies ORDER BY name ASC');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/simulated-companies', async (req: Request, res: Response) => {
  try {
    const { name, short_name, description, industry, logo_url, is_fictional, city, country, website } = req.body;
    if (!name) return res.status(400).json({ error: 'name requerido' });
    const result = await AppDataSource.query(
      'INSERT INTO simulated_companies (name, short_name, description, industry, logo_url, is_fictional, city, country, website) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, short_name || null, description || null, industry || null, logo_url || null, is_fictional ? 1 : 0, city || null, country || 'Argentina', website || null]
    );
    const rows = await AppDataSource.query('SELECT * FROM simulated_companies WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/simulated-companies/:id', async (req: Request, res: Response) => {
  try {
    const { name, short_name, description, industry, logo_url, is_fictional, city, country, website } = req.body;
    await AppDataSource.query(
      'UPDATE simulated_companies SET name=?, short_name=?, description=?, industry=?, logo_url=?, is_fictional=?, city=?, country=?, website=?, updated_at=NOW() WHERE id=?',
      [name, short_name || null, description || null, industry || null, logo_url || null, is_fictional ? 1 : 0, city || null, country || 'Argentina', website || null, req.params.id]
    );
    const rows = await AppDataSource.query('SELECT * FROM simulated_companies WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/simulated-companies/:id', async (req: Request, res: Response) => {
  try {
    await AppDataSource.query('DELETE FROM simulated_companies WHERE id = ?', [req.params.id]);
    res.json({ message: 'Empresa eliminada' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========== FOUNDATION CONFIG ==========
router.get('/foundation-config', async (req: Request, res: Response) => {
  try {
    const rows = await AppDataSource.query('SELECT * FROM foundation_config ORDER BY id ASC');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/foundation-config', async (req: Request, res: Response) => {
  try {
    const { name, short_name, logo_url, address, city, province, country, phone, email, website, ministry_aval } = req.body;
    if (!name) return res.status(400).json({ error: 'name requerido' });
    const result = await AppDataSource.query(
      'INSERT INTO foundation_config (name, short_name, logo_url, address, city, province, country, phone, email, website, ministry_aval) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [name, short_name || null, logo_url || null, address || null, city || 'Rosario', province || 'Santa Fe', country || 'Argentina', phone || null, email || null, website || null, ministry_aval || null]
    );
    const rows = await AppDataSource.query('SELECT * FROM foundation_config WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/foundation-config/:id', async (req: Request, res: Response) => {
  try {
    const { name, short_name, logo_url, address, city, province, country, phone, email, website, ministry_aval, is_active } = req.body;
    await AppDataSource.query(
      'UPDATE foundation_config SET name=?, short_name=?, logo_url=?, address=?, city=?, province=?, country=?, phone=?, email=?, website=?, ministry_aval=?, is_active=?, updated_at=NOW() WHERE id=?',
      [name, short_name || null, logo_url || null, address || null, city || 'Rosario', province || 'Santa Fe', country || 'Argentina', phone || null, email || null, website || null, ministry_aval || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]
    );
    const rows = await AppDataSource.query('SELECT * FROM foundation_config WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========== ENDORSERS (AVALADORES) ==========
router.get('/endorsers', async (req: Request, res: Response) => {
  try {
    const rows = await AppDataSource.query('SELECT * FROM endorsers WHERE is_active = 1 ORDER BY name ASC');
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/endorsers', async (req: Request, res: Response) => {
  try {
    const { name, short_name, logo_url, description, endorsement_type, website } = req.body;
    if (!name) return res.status(400).json({ error: 'name requerido' });
    const result = await AppDataSource.query(
      'INSERT INTO endorsers (name, short_name, logo_url, description, endorsement_type, website) VALUES (?, ?, ?, ?, ?, ?)',
      [name, short_name || null, logo_url || null, description || null, endorsement_type || 'institution', website || null]
    );
    const rows = await AppDataSource.query('SELECT * FROM endorsers WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.put('/endorsers/:id', async (req: Request, res: Response) => {
  try {
    const { name, short_name, logo_url, description, endorsement_type, website, is_active } = req.body;
    await AppDataSource.query(
      'UPDATE endorsers SET name=?, short_name=?, logo_url=?, description=?, endorsement_type=?, website=?, is_active=?, updated_at=NOW() WHERE id=?',
      [name, short_name || null, logo_url || null, description || null, endorsement_type || 'institution', website || null, is_active !== undefined ? (is_active ? 1 : 0) : 1, req.params.id]
    );
    const rows = await AppDataSource.query('SELECT * FROM endorsers WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/endorsers/:id', async (req: Request, res: Response) => {
  try {
    await AppDataSource.query('UPDATE endorsers SET is_active = 0 WHERE id = ?', [req.params.id]);
    res.json({ message: 'Avalador desactivado' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

// ========== COURSE ENDORSERS (vincular avaladores a cursos) ==========
router.get('/course-endorsers/:course_id', async (req: Request, res: Response) => {
  try {
    const rows = await AppDataSource.query(
      'SELECT ce.*, e.name, e.short_name, e.logo_url, e.endorsement_type, e.website FROM course_endorsers ce JOIN endorsers e ON e.id = ce.endorser_id WHERE ce.course_id = ?',
      [req.params.course_id]
    );
    res.json(rows);
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.post('/course-endorsers', async (req: Request, res: Response) => {
  try {
    const { course_id, endorser_id } = req.body;
    if (!course_id || !endorser_id) return res.status(400).json({ error: 'course_id y endorser_id requeridos' });
    await AppDataSource.query('INSERT IGNORE INTO course_endorsers (course_id, endorser_id) VALUES (?, ?)', [course_id, endorser_id]);
    res.status(201).json({ message: 'Avalador vinculado' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

router.delete('/course-endorsers', async (req: Request, res: Response) => {
  try {
    const { course_id, endorser_id } = req.body;
    await AppDataSource.query('DELETE FROM course_endorsers WHERE course_id = ? AND endorser_id = ?', [course_id, endorser_id]);
    res.json({ message: 'Vínculo eliminado' });
  } catch (e: any) { res.status(500).json({ error: e.message }); }
});

/**
 * GET /tech-sheets/files/download/:filePath
 * Descarga un archivo adjunto a una ficha técnica
 * 
 * Ejemplo: /tech-sheets/files/download/tech-sheets/uuid.pdf
 */
router.get('/files/download/:filePath(*)', async (req: Request, res: Response) => {
  try {
    const filePath = req.params.filePath;
    
    // Validaciones de seguridad
    if (!filePath || filePath.includes('..')) {
      return res.status(400).json({ error: 'Invalid file path' });
    }

    // Leer archivo
    const fileBuffer = await fileStorageService.readFile(filePath);
    const fileStats = await fileStorageService.getFileInfo(filePath);

    // Determinar MIME type
    const ext = filePath.split('.').pop()?.toLowerCase();
    const mimeType = fileStorageService.getMimeType(ext || '') || 'application/octet-stream';

    // Retornar archivo
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Length', fileStats.size);
    res.setHeader('Content-Disposition', `attachment; filename="${filePath.split('/').pop()}"`);
    res.send(fileBuffer);
  } catch (error: any) {
    console.error('Error downloading file:', error.message);
    res.status(404).json({ error: 'Archivo no encontrado', details: error.message });
  }
});

export default router;

