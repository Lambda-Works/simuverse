import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/connection';
import { MinistryRequirement } from '../entities/MinistryRequirement';
import { KPI } from '../entities/KPI';
import { authMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

// ─────────────────────────────────────────────────────────────────────────────
// REQUISITOS MINISTERIALES
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/ministry/requirements — Lista requisitos (filtro: course_id, status) */
router.get('/requirements', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MinistryRequirement);
    const where: any = {};
    if (req.query.course_id) where.course_id = req.query.course_id as string;
    if (req.query.status) where.status = req.query.status as string;
    const requirements = await repo.find({ where, order: { created_at: 'DESC' } });
    res.json(requirements);
  } catch (error: any) {
    console.error('[Ministry] GET /requirements error:', error.message);
    res.status(500).json({ error: 'Error al obtener requisitos', details: error.message });
  }
});

/** GET /api/ministry/requirements/:id — Requisito específico con sus KPIs */
router.get('/requirements/:id', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MinistryRequirement);
    const requirement = await repo.findOne({ where: { id: req.params.id } });
    if (!requirement) return res.status(404).json({ error: 'Requisito no encontrado' });
    const kpis = await AppDataSource.getRepository(KPI).find({ where: { ministry_requirement_id: req.params.id } });
    res.json({ ...requirement, kpis });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener requisito', details: error.message });
  }
});

/** POST /api/ministry/requirements — Crea registro de archivo subido */
router.post('/requirements', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MinistryRequirement);
    const { course_id, file_name, file_type, file_size_bytes, file_path, raw_text, uploaded_by_id } = req.body;
    if (!course_id || !file_name || !file_path) {
      return res.status(400).json({ error: 'course_id, file_name y file_path son requeridos' });
    }
    const requirement = repo.create({
      course_id,
      uploaded_by_id: uploaded_by_id || (req as any).user?.id || 'system',
      file_name,
      file_type: file_type || 'pdf',
      file_size_bytes: file_size_bytes || 0,
      file_path,
      raw_text: raw_text || null,
      status: 'uploaded'
    });
    res.status(201).json(await repo.save(requirement));
  } catch (error: any) {
    res.status(500).json({ error: 'Error al crear requisito', details: error.message });
  }
});

/** PUT /api/ministry/requirements/:id — Actualiza campos del requisito */
router.put('/requirements/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MinistryRequirement);
    const requirement = await repo.findOne({ where: { id: req.params.id } });
    if (!requirement) return res.status(404).json({ error: 'Requisito no encontrado' });
    const allowed = ['status','raw_text','extracted_content','extracted_kpis','ai_analysis',
      'kpi_count','task_count','error_message','processing_notes','kpis_generated',
      'tasks_generated','is_active','activated_at'];
    allowed.forEach(f => { if (req.body[f] !== undefined) (requirement as any)[f] = req.body[f]; });
    res.json(await repo.save(requirement));
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar requisito', details: error.message });
  }
});

/** POST /api/ministry/requirements/:id/process — Procesa y extrae KPIs del requisito */
router.post('/requirements/:id/process', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MinistryRequirement);
    const requirement = await repo.findOne({ where: { id: req.params.id } });
    if (!requirement) return res.status(404).json({ error: 'Requisito no encontrado' });

    requirement.status = 'processing';
    await repo.save(requirement);

    if (req.body.extracted_kpis && Array.isArray(req.body.extracted_kpis)) {
      const kpiRepo = AppDataSource.getRepository(KPI);
      const savedKpis = [];
      for (const kpiData of req.body.extracted_kpis) {
        savedKpis.push(await kpiRepo.save(kpiRepo.create({
          course_id: requirement.course_id,
          ministry_requirement_id: requirement.id,
          name: kpiData.name,
          description: kpiData.description || '',
          category: kpiData.category || 'general',
          weight: kpiData.weight || 1.0,
          target_value: kpiData.target_value || 100,
          minimum_pass_value: kpiData.minimum_pass_value || 80,
          prompt_instruction: kpiData.prompt_instruction || null,
          trigger_event: kpiData.trigger_event || 'generic',
          is_active: true
        })));
      }
      requirement.kpis_generated = savedKpis.length;
      requirement.tasks_generated = 0;
      requirement.status = 'extracted';
      await repo.save(requirement);
      return res.json({ message: 'KPIs extraídos correctamente', kpis: savedKpis, requirement });
    }

    res.json({ message: 'Procesamiento iniciado', requirement });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al procesar requisito', details: error.message });
  }
});

/** PUT /api/ministry/requirements/:id/activate — Activa un requisito */
router.put('/requirements/:id/activate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MinistryRequirement);
    const requirement = await repo.findOne({ where: { id: req.params.id } });
    if (!requirement) return res.status(404).json({ error: 'Requisito no encontrado' });
    requirement.status = 'active';
    requirement.activated_at = new Date();
    requirement.is_active = true;
    res.json(await repo.save(requirement));
  } catch (error: any) {
    res.status(500).json({ error: 'Error al activar requisito', details: error.message });
  }
});

/** DELETE /api/ministry/requirements/:id — Archiva (soft delete) un requisito */
router.delete('/requirements/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(MinistryRequirement);
    const requirement = await repo.findOne({ where: { id: req.params.id } });
    if (!requirement) return res.status(404).json({ error: 'Requisito no encontrado' });
    requirement.status = 'archived';
    requirement.is_active = false;
    await repo.save(requirement);
    res.json({ message: 'Requisito archivado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al archivar requisito', details: error.message });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// KPIs
// ─────────────────────────────────────────────────────────────────────────────

/** GET /api/ministry/kpis — Lista KPIs (filtro: course_id, ministry_requirement_id, active) */
router.get('/kpis', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(KPI);
    const where: any = {};
    if (req.query.course_id) where.course_id = req.query.course_id as string;
    if (req.query.ministry_requirement_id) where.ministry_requirement_id = req.query.ministry_requirement_id as string;
    if (req.query.active !== undefined) where.is_active = req.query.active === 'true';
    res.json(await repo.find({ where, order: { created_at: 'DESC' } }));
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener KPIs', details: error.message });
  }
});

/** GET /api/ministry/kpis/:id — Obtiene un KPI específico */
router.get('/kpis/:id', async (req: Request, res: Response) => {
  try {
    const kpi = await AppDataSource.getRepository(KPI).findOne({ where: { id: req.params.id } });
    if (!kpi) return res.status(404).json({ error: 'KPI no encontrado' });
    res.json(kpi);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener KPI', details: error.message });
  }
});

/** POST /api/ministry/kpis — Crea un KPI manualmente */
router.post('/kpis', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(KPI);
    const { course_id, ministry_requirement_id, name, description, category,
      weight, target_value, minimum_pass_value, thresholds, prompt_instruction,
      trigger_event, success_criteria } = req.body;
    if (!course_id || !name) return res.status(400).json({ error: 'course_id y name son requeridos' });
    res.status(201).json(await repo.save(repo.create({
      course_id, ministry_requirement_id: ministry_requirement_id || null,
      name, description: description || '', category: category || 'general',
      weight: weight || 1.0, target_value: target_value || 100,
      minimum_pass_value: minimum_pass_value || 80,
      thresholds: thresholds || { excellent: 95, good: 85, acceptable: 75, poor: 0 },
      prompt_instruction: prompt_instruction || null,
      trigger_event: trigger_event || 'generic',
      success_criteria: success_criteria || null, is_active: true
    })));
  } catch (error: any) {
    res.status(500).json({ error: 'Error al crear KPI', details: error.message });
  }
});

/** PUT /api/ministry/kpis/:id — Actualiza un KPI */
router.put('/kpis/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(KPI);
    const kpi = await repo.findOne({ where: { id: req.params.id } });
    if (!kpi) return res.status(404).json({ error: 'KPI no encontrado' });
    const allowed = ['name','description','category','weight','target_value',
      'minimum_pass_value','thresholds','prompt_instruction','trigger_event','success_criteria','is_active'];
    allowed.forEach(f => { if (req.body[f] !== undefined) (kpi as any)[f] = req.body[f]; });
    res.json(await repo.save(kpi));
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar KPI', details: error.message });
  }
});

/** DELETE /api/ministry/kpis/:id — Desactiva un KPI */
router.delete('/kpis/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(KPI);
    const kpi = await repo.findOne({ where: { id: req.params.id } });
    if (!kpi) return res.status(404).json({ error: 'KPI no encontrado' });
    kpi.is_active = false;
    await repo.save(kpi);
    res.json({ message: 'KPI desactivado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar KPI', details: error.message });
  }
});

/** GET /api/ministry/health */
router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', module: 'ministry', endpoints: ['requirements', 'kpis'] });
});

export default router;
