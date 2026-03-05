import { Router, Request, Response } from 'express';
import { simulationService, telemetryService } from '../services/SimulationService.js';
import { courseService } from '../services/CourseService.js';
import { aiService } from '../services/AIService.js';
import { rulesEngine } from '../services/RulesEngine.js';

const router = Router();

/**
 * POST /api/simulations/start
 * Iniciar una nueva simulación
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, scenarioId } = req.body;

    if (!userId || !courseId) {
      return res.status(400).json({ error: 'userId y courseId requeridos' });
    }

    const course = await courseService.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    const simulation = await simulationService.createSimulation(userId, courseId, scenarioId);

    // Log inicial
    await telemetryService.logAction(
      simulation._id.toString(),
      userId,
      courseId,
      'Simulación iniciada',
      'navigation',
      { scenario_id: scenarioId }
    );

    res.status(201).json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulations/:simulationId
 * Obtener detalles de una simulación
 */
router.get('/:simulationId', async (req: Request, res: Response) => {
  try {
    const simulation = await simulationService.getSimulation(req.params.simulationId);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(simulation);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulationId/message
 * Enviar un mensaje en una simulación (interacción con IA)
 */
router.post('/:simulationId/message', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, message, conversationHistory } = req.body;
    const startTime = Date.now();

    const simulation = await simulationService.getSimulation(req.params.simulationId);
    if (!simulation) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }

    const course = await courseService.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Construir System Prompt dinámico
    const systemPrompt = aiService.buildSystemPrompt({
      base_role: course.ai_config.base_role,
      course_context: course.ai_config.course_context,
      knowledge_base: course.ai_config.knowledge_base || '',
      personality_traits: course.ai_config.personality_traits || [],
      student_history: [], // TODO: Obtener del historial real
    });

    // Enviar a IA
    const aiResponse = await aiService.sendMessageToGemini(message, systemPrompt, conversationHistory || []);

    const responseTime = Date.now() - startTime;

    // Log de la acción
    await telemetryService.logAction(
      req.params.simulationId,
      userId,
      courseId,
      message.substring(0, 100),
      'message_sent',
      {
        message_length: message.length,
        ai_response_length: aiResponse.length,
      },
      responseTime
    );

    res.json({
      simulation_id: req.params.simulationId,
      user_message: message,
      ai_response: aiResponse,
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulationId/action
 * Registrar una acción (cálculo, archivo, etc.)
 */
router.post('/:simulationId/action', async (req: Request, res: Response) => {
  try {
    const { userId, courseId, actionType, actionData } = req.body;
    const startTime = Date.now();

    const course = await courseService.getCourseById(courseId);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }

    // Validar con el Rules Engine según el tipo de curso
    const validation = await rulesEngine.validate(course.family, actionType, actionData);

    const responseTime = Date.now() - startTime;

    // Log de la acción
    await telemetryService.logAction(
      req.params.simulationId,
      userId,
      courseId,
      `Acción: ${actionType}`,
      'click',
      {
        action_type: actionType,
        validation_result: validation,
        action_data: actionData,
      },
      responseTime
    );

    res.json({
      simulation_id: req.params.simulationId,
      validation,
      response_time_ms: responseTime,
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulationId/pause
 * Pausar una simulación
 */
router.post('/:simulationId/pause', async (req: Request, res: Response) => {
  try {
    const paused = await simulationService.pauseSimulation(req.params.simulationId);
    if (!paused) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(paused);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulationId/resume
 * Reanudar una simulación
 */
router.post('/:simulationId/resume', async (req: Request, res: Response) => {
  try {
    const resumed = await simulationService.resumeSimulation(req.params.simulationId);
    if (!resumed) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(resumed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulationId/complete
 * Completar una simulación
 */
router.post('/:simulationId/complete', async (req: Request, res: Response) => {
  try {
    const completed = await simulationService.completeSimulation(req.params.simulationId);
    if (!completed) {
      return res.status(404).json({ error: 'Simulación no encontrada' });
    }
    res.json(completed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulations/:simulationId/logs
 * Obtener todos los logs de una simulación
 */
router.get('/:simulationId/logs', async (req: Request, res: Response) => {
  try {
    const logs = await telemetryService.getSimulationLogs(req.params.simulationId);
    res.json(logs);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
