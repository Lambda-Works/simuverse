import { Router, Request, Response } from 'express';
import { simulationService, telemetryService } from '../services/SimulationService.js';
import { courseService } from '../services/CourseService.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { aiService } from '../services/AIService.js';

const router = Router();

/**
 * POST /api/simulations/start
 * Iniciar una nueva simulación
 */
router.post('/start', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { course_id, scenario_id } = req.body;
    const user_id = (req as any).user?.user_id;

    if (!user_id || !course_id) {
      return res.status(400).json({ error: 'user_id y course_id requeridos' });
    }

    const course = await courseService.getCourseById(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const simulation = await simulationService.createSimulation(user_id, course_id, scenario_id);

    // Log inicial
    await telemetryService.logAction(
      simulation.id,
      user_id,
      course_id,
      'Simulación iniciada',
      'navigation',
      { scenario_id: scenario_id }
    );

    res.status(201).json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulations/:simulation_id
 * Obtener detalles de una simulación
 */
router.get('/:simulation_id', async (req: Request, res: Response) => {
  try {
    const simulation = await simulationService.getSimulation(req.params.simulation_id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulation_id/message
 * Enviar un mensaje en una simulación (interacción con IA)
 */
router.post('/:simulation_id/message', async (req: Request, res: Response) => {
  try {
    const { user_id, course_id, message, conversationHistory } = req.body;
    const startTime = Date.now();

    const simulation = await simulationService.getSimulation(req.params.simulation_id);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    const course = await courseService.getCourseById(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Construir System Prompt dinámico
    const systemPrompt = aiService.buildSystemPrompt({
      base_role: (course.ai_config as any).base_role,
      course_context: (course.ai_config as any).course_context,
      knowledge_base: (course.ai_config as any).knowledge_base || '',
      personality_traits: (course.ai_config as any).personality_traits || [],
      student_history: [], // TODO: Obtener del historial real
    });

    // Enviar a IA
    const aiResponse = await aiService.sendMessageToGemini(message, systemPrompt, conversationHistory || []);

    const responseTime = Date.now() - startTime;

    // Log de la acción
    await telemetryService.logAction(
      req.params.simulation_id,
      user_id,
      course_id,
      message.substring(0, 100),
      'message_sent',
      {
        message_length: message.length,
        ai_response_length: aiResponse.length,
      },
      responseTime
    );

    res.json({
      simulation_id: req.params.simulation_id,
      user_message: message,
      ai_response: aiResponse,
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulation_id/action
 * Registrar una acción (cálculo, archivo, etc.)
 */
router.post('/:simulation_id/action', async (req: Request, res: Response) => {
  try {
    const { user_id, course_id, action_type, actionData } = req.body;
    const startTime = Date.now();

    const course = await courseService.getCourseById(course_id);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Validar con el Rules Engine según el tipo de curso
    // const validation = await rulesEngine.validate(course.family, action_type, actionData);
    const validation = {}; // TODO: Implementar validación con Rules Engine

    const responseTime = Date.now() - startTime;

    // Log de la acción
    await telemetryService.logAction(
      req.params.simulation_id,
      user_id,
      course_id,
      `Acción: ${action_type}`,
      'click',
      {
        action_type: action_type,
        validation_result: validation,
        action_data: actionData,
      },
      responseTime
    );

    res.json({
      simulation_id: req.params.simulation_id,
      validation,
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulation_id/pause
 * Pausar una simulación
 */
router.post('/:simulation_id/pause', async (req: Request, res: Response) => {
  try {
    const paused = await simulationService.pauseSimulation(req.params.simulation_id);
    if (!paused) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(paused);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulation_id/resume
 * Reanudar una simulación
 */
router.post('/:simulation_id/resume', async (req: Request, res: Response) => {
  try {
    const resumed = await simulationService.resumeSimulation(req.params.simulation_id);
    if (!resumed) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(resumed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulation_id/complete
 * Completar una simulación
 */
router.post('/:simulation_id/complete', async (req: Request, res: Response) => {
  try {
    const completed = await simulationService.completeSimulation(req.params.simulation_id);
    if (!completed) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(completed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulations/:simulation_id/logs
 * Obtener todos los logs de una simulación
 */
router.get('/:simulation_id/logs', async (req: Request, res: Response) => {
  try {
    const logs = await telemetryService.getSimulationLogs(req.params.simulation_id);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
