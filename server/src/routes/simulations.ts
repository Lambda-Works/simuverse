import { Router, Request, Response } from 'express';
import { simulationService, telemetryService } from '../services/SimulationService.js';
import { courseService } from '../services/CourseService.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { aiService } from '../services/AIService.js';
import { AppDataSource } from '../database/connection';

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

// ─── Helper: get scenario content for a simulation ───────────────────────────
async function getScenarioContentForSim(simulation_id: string): Promise<any | null> {
  // Get the simulation to find its course_id
  const [simRows]: any = await AppDataSource.query(
    'SELECT id, course_id FROM simulations WHERE id = ? LIMIT 1',
    [simulation_id]
  );
  if (!simRows) return null;

  const course_id = simRows.course_id;

  // Try to find a scenario for this course via simulation_assignments
  // Note: in simulation_assignments, simulation_id stores the scenario UUID
  const [assignRow]: any = await AppDataSource.query(
    `SELECT sa.simulation_id as scenario_id
     FROM simulation_assignments sa
     WHERE sa.course_id = ?
     LIMIT 1`,
    [course_id]
  );

  let scenarioContent = null;

  if (assignRow?.scenario_id) {
    const [scRow]: any = await AppDataSource.query(
      'SELECT content FROM scenarios WHERE id = ? LIMIT 1',
      [assignRow.scenario_id]
    );
    if (scRow?.content) {
      scenarioContent = typeof scRow.content === 'string'
        ? JSON.parse(scRow.content)
        : scRow.content;
    }
  }

  // Fallback: first scenario for the course
  if (!scenarioContent) {
    const [scRow]: any = await AppDataSource.query(
      'SELECT content FROM scenarios WHERE course_id = ? ORDER BY created_at ASC LIMIT 1',
      [course_id]
    );
    if (scRow?.content) {
      scenarioContent = typeof scRow.content === 'string'
        ? JSON.parse(scRow.content)
        : scRow.content;
    }
  }

  return scenarioContent;
}

/**
 * GET /api/simulations/:simulation_id/emails
 * Devuelve los emails pre-cargados del escenario asignado a la simulación
 */
router.get('/:simulation_id/emails', async (req: Request, res: Response) => {
  try {
    const content = await getScenarioContentForSim(req.params.simulation_id);
    const initialEmails: any[] = content?.initial_emails || [];

    // Normalizar a la forma que espera el frontend
    const emails = initialEmails.map((e: any, i: number) => ({
      id: `email-${i + 1}`,
      from: e.from || 'Sistema',
      subject: e.subject || '(Sin asunto)',
      body: e.body || '',
      timestamp: new Date(Date.now() - (initialEmails.length - i) * 3600000),
      unread: true,
    }));

    res.json(emails);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulations/:simulation_id/documents
 * Devuelve los documentos pre-cargados del escenario asignado a la simulación
 */
router.get('/:simulation_id/documents', async (req: Request, res: Response) => {
  try {
    const content = await getScenarioContentForSim(req.params.simulation_id);
    const docs: any[] = content?.documents || [];

    const documents = docs.map((d: any, i: number) => ({
      id: `doc-${i + 1}`,
      name: d.name || `Documento ${i + 1}`,
      type: d.type || 'texto',
      content: d.content || '',
    }));

    res.json(documents);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/simulations/:simulation_id/spreadsheet
 * Devuelve la hoja de cálculo pre-cargada del escenario (si existe)
 */
router.get('/:simulation_id/spreadsheet', async (req: Request, res: Response) => {
  try {
    const content = await getScenarioContentForSim(req.params.simulation_id);
    const spreadsheet = content?.spreadsheet || null;
    res.json(spreadsheet);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
