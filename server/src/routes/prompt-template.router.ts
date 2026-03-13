import { Router, Request, Response } from 'express';
import { PromptTemplateService } from '../services/PromptTemplateService';

const router = Router();
const service = new PromptTemplateService();

// GET: Obtener todas las plantillas activas
router.get('/', async (req: Request, res: Response) => {
  try {
    const templates = await service.getAllTemplates();
    res.json(templates);
  } catch (error) {
    console.error('Error getting templates:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET: Obtener plantillas por categoría (DEBE IR ANTES DE /:id)
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const templates = await service.getTemplatesByCategory(req.params.category);
    res.json(templates);
  } catch (error) {
    console.error('Error getting templates by category:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST: Duplicar plantilla (DEBE IR ANTES DE /:id)
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  try {
    const { name } = req.body;
    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }
    const template = await service.duplicateTemplate(
      parseInt(req.params.id),
      name,
      (req as any).user?.id
    );
    res.status(201).json(template);
  } catch (error) {
    console.error('Error duplicating template:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET: Obtener plantilla específica
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const template = await service.getTemplateById(parseInt(req.params.id));
    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }
    res.json(template);
  } catch (error) {
    console.error('Error getting template:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST: Crear plantilla
router.post('/', async (req: Request, res: Response) => {
  try {
    const template = await service.createTemplate({
      ...req.body,
      created_by: (req as any).user?.id
    });
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// PUT: Actualizar plantilla
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const template = await service.updateTemplate(
      parseInt(req.params.id),
      req.body
    );
    res.json(template);
  } catch (error) {
    console.error('Error updating template:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// DELETE: Desactivar plantilla
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    await service.deactivateTemplate(parseInt(req.params.id));
    res.json({ success: true, message: 'Template deactivated' });
  } catch (error) {
    console.error('Error deactivating template:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
