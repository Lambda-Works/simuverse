import { Router, Request, Response } from 'express';
import { PromptGenerationService } from '../services/PromptGenerationService';

const router = Router();
const promptService = new PromptGenerationService();

// POST: Asignar plantilla a curso
router.post('/:courseId/assign-template', async (req: Request, res: Response) => {
  try {
    const { templateId } = req.body;
    if (!templateId) {
      res.status(400).json({ error: 'Template ID is required' });
      return;
    }
    const config = await promptService.assignTemplateToConfig(
      req.params.courseId,
      templateId
    );
    res.json(config);
  } catch (error) {
    console.error('Error assigning template:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST: Generar prompt con IA
router.post('/:courseId/generate', async (req: Request, res: Response) => {
  try {
    const {
      selectedKPIIds,
      selectedTaskIds,
      aiRole,
      situations
    } = req.body;

    if (!selectedKPIIds || !selectedTaskIds || !aiRole) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const generatedPrompt = await promptService.generatePromptWithAI(
      req.params.courseId,
      selectedKPIIds,
      selectedTaskIds,
      aiRole,
      situations || ''
    );

    res.json({ success: true, prompt: generatedPrompt });
  } catch (error) {
    console.error('Error generating prompt:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// POST: Guardar prompt (manual o generado)
router.post('/:courseId/save', async (req: Request, res: Response) => {
  try {
    const { promptData } = req.body;
    if (!promptData || !promptData.generation_mode) {
      res.status(400).json({ error: 'Invalid prompt data' });
      return;
    }
    const config = await promptService.savePrompt(
      req.params.courseId,
      promptData
    );
    res.json({ success: true, config });
  } catch (error) {
    console.error('Error saving prompt:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

// GET: Obtener configuración de prompt actual
router.get('/:courseId', async (req: Request, res: Response) => {
  try {
    const config = await promptService.getPromptConfig(req.params.courseId);
    res.json(config || null);
  } catch (error) {
    console.error('Error getting prompt config:', error);
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
