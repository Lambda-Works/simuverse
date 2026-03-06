import { Router, Request, Response } from 'express';
import { AppDataSource } from '../database/connection';
import { FlowTemplate } from '../entities/FlowTemplate';
import { authMiddleware } from '../middleware/AuthMiddleware';

const router = Router();

/**
 * GET /api/templates
 * Lista todas las plantillas de flujo (filtro: family, course_id, active)
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(FlowTemplate);
    const where: any = {};
    if (req.query.family) where.family = req.query.family as string;
    if (req.query.course_id) where.course_id = req.query.course_id as string;
    if (req.query.active !== undefined) where.is_active = req.query.active !== 'false';
    else where.is_active = true;

    const templates = await repo.find({ where, order: { family: 'ASC', title: 'ASC' } });
    // Parsear template_data de JSON string a objeto
    const parsed = templates.map(t => {
      try { return { ...t, template_data: JSON.parse(t.template_data) }; }
      catch { return t; }
    });
    res.json(parsed);
  } catch (error: any) {
    console.error('[Templates] GET / error:', error.message);
    res.status(500).json({ error: 'Error al obtener plantillas', details: error.message });
  }
});

/**
 * GET /api/templates/:id
 * Obtiene una plantilla específica
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await AppDataSource.getRepository(FlowTemplate).findOne({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    try { return res.json({ ...template, template_data: JSON.parse(template.template_data) }); }
    catch { return res.json(template); }
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener plantilla', details: error.message });
  }
});

/**
 * POST /api/templates
 * Crea o importa una plantilla de flujo
 */
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(FlowTemplate);
    const { id, course_id, course_code, title, family, description, version, template_data } = req.body;

    if (!id || !course_id || !title || !template_data) {
      return res.status(400).json({ error: 'id, course_id, title y template_data son requeridos' });
    }

    // Verificar si ya existe
    const existing = await repo.findOne({ where: { id } });
    if (existing) return res.status(409).json({ error: 'Ya existe una plantilla con ese id', id });

    const dataStr = typeof template_data === 'string' ? template_data : JSON.stringify(template_data);
    const template = repo.create({
      id,
      course_id,
      course_code: course_code || id,
      title,
      family: family || 'administracion',
      description: description || null,
      version: version || '1.0',
      template_data: dataStr,
      is_active: true,
      created_by: (req as any).user?.id || null
    });
    const saved = await repo.save(template);
    res.status(201).json({ ...saved, template_data: JSON.parse(saved.template_data) });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al crear plantilla', details: error.message });
  }
});

/**
 * PUT /api/templates/:id
 * Actualiza una plantilla existente
 */
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(FlowTemplate);
    const template = await repo.findOne({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const allowed = ['title', 'family', 'description', 'version', 'is_active'];
    allowed.forEach(f => { if (req.body[f] !== undefined) (template as any)[f] = req.body[f]; });

    if (req.body.template_data !== undefined) {
      template.template_data = typeof req.body.template_data === 'string'
        ? req.body.template_data
        : JSON.stringify(req.body.template_data);
    }

    const updated = await repo.save(template);
    res.json({ ...updated, template_data: JSON.parse(updated.template_data) });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar plantilla', details: error.message });
  }
});

/**
 * POST /api/templates/:id/duplicate
 * Duplica una plantilla con un nuevo ID
 */
router.post('/:id/duplicate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(FlowTemplate);
    const original = await repo.findOne({ where: { id: req.params.id } });
    if (!original) return res.status(404).json({ error: 'Plantilla no encontrada' });

    const newId = req.body.new_id || `${original.id}-copia-${Date.now()}`;
    const copy = repo.create({
      ...original,
      id: newId,
      course_code: req.body.course_code || `${original.course_code}-COPIA`,
      title: req.body.title || `${original.title} (Copia)`,
      created_by: (req as any).user?.id || null,
      created_at: undefined,
      updated_at: undefined
    });
    const saved = await repo.save(copy);
    res.status(201).json({ ...saved, template_data: JSON.parse(saved.template_data) });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al duplicar plantilla', details: error.message });
  }
});

/**
 * DELETE /api/templates/:id
 * Desactiva (soft delete) una plantilla
 */
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(FlowTemplate);
    const template = await repo.findOne({ where: { id: req.params.id } });
    if (!template) return res.status(404).json({ error: 'Plantilla no encontrada' });
    template.is_active = false;
    await repo.save(template);
    res.json({ message: 'Plantilla desactivada correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar plantilla', details: error.message });
  }
});

/**
 * POST /api/templates/bulk-import
 * Importa múltiples plantillas de una vez (útil para cargar las plantillas estáticas del sistema)
 */
router.post('/bulk-import', authMiddleware, async (req: Request, res: Response) => {
  try {
    const repo = AppDataSource.getRepository(FlowTemplate);
    const templates: any[] = req.body.templates || [];
    if (!Array.isArray(templates) || templates.length === 0) {
      return res.status(400).json({ error: 'Se requiere un array de plantillas' });
    }

    const results = { created: 0, updated: 0, errors: [] as string[] };
    for (const t of templates) {
      try {
        const dataStr = typeof t.template_data === 'string' ? t.template_data : JSON.stringify(t);
        const existing = await repo.findOne({ where: { id: t.id } });
        if (existing) {
          existing.title = t.title || existing.title;
          existing.family = t.family || existing.family;
          existing.version = t.version || existing.version;
          existing.template_data = dataStr;
          await repo.save(existing);
          results.updated++;
        } else {
          await repo.save(repo.create({
            id: t.id, course_id: t.course_id, course_code: t.course_code || t.id,
            title: t.title, family: t.family || 'administracion',
            description: t.description || null, version: t.version || '1.0',
            template_data: dataStr, is_active: true,
            created_by: (req as any).user?.id || null
          }));
          results.created++;
        }
      } catch (e: any) {
        results.errors.push(`${t.id}: ${e.message}`);
      }
    }
    res.json(results);
  } catch (error: any) {
    res.status(500).json({ error: 'Error en importación masiva', details: error.message });
  }
});

export default router;
