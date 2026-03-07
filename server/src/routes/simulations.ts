import { Router, Request, Response } from 'express';
import { simulationService, telemetryService } from '../services/SimulationService.js';
import { courseService } from '../services/CourseService.js';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { aiService, FallbackContext } from '../services/AIService.js';
import { crisisEngine } from '../services/CrisisEngine.js';
import { rulesEngine } from '../services/RulesEngine.js';
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

    // Obtener contenido del escenario para el fallback offline
    const scenarioContent = await getScenarioContentForSim(req.params.simulation_id);
    const fallbackCtx: FallbackContext = {
      scenarioContext: scenarioContent?.context,
      constraints: scenarioContent?.constraints,
      base_role: (course.ai_config as any)?.base_role,
      course_context: (course.ai_config as any)?.course_context,
    };

    // Construir System Prompt dinámico
    const systemPrompt = aiService.buildSystemPrompt({
      base_role: (course.ai_config as any).base_role,
      course_context: (course.ai_config as any).course_context,
      knowledge_base: (course.ai_config as any).knowledge_base || '',
      personality_traits: (course.ai_config as any).personality_traits || [],
      student_history: [],
    });

    // Enviar a IA (con fallback automático si Gemini no está disponible)
    const aiResult = await aiService.sendMessageToGemini(
      message,
      systemPrompt,
      conversationHistory || [],
      fallbackCtx
    );

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
        ai_response_length: aiResult.response.length,
        ai_mode: aiResult.mode,
      },
      responseTime
    );

    res.json({
      simulation_id: req.params.simulation_id,
      user_message: message,
      ai_response: aiResult.response,
      ai_mode: aiResult.mode,
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
    let validation: any = {};
    try {
      validation = await rulesEngine.validate(
        (course as any).family || 'default',
        action_type,
        actionData
      );
    } catch (_) {
      validation = { valid: true, note: 'Regla no evaluable para este tipo de acción' };
    }

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

// ─── Crisis Engine ────────────────────────────────────────────────────────────

/**
 * GET /api/simulations/:simulation_id/crisis
 * Devuelve el evento de crisis activo (o genera uno nuevo).
 */
router.get('/:simulation_id/crisis', async (req: Request, res: Response) => {
  try {
    const sim = await simulationService.getSimulation(req.params.simulation_id);
    if (!sim) return res.status(404).json({ error: 'Simulación no encontrada' });

    const course = await courseService.getCourseById((sim as any).course_id);
    const family = (course as any)?.family || 'default';

    const crisis = crisisEngine.getOrCreateCrisis(req.params.simulation_id, family);
    res.json(crisis);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/simulations/:simulation_id/crisis/respond
 * El alumno responde al evento de crisis: { option_id: string }
 */
router.post('/:simulation_id/crisis/respond', async (req: Request, res: Response) => {
  try {
    const { option_id, user_id, course_id } = req.body;
    if (!option_id) return res.status(400).json({ error: 'option_id requerido' });

    const resolved = crisisEngine.resolvecrisis(req.params.simulation_id, option_id);
    if (!resolved) {
      return res.status(404).json({ error: 'Crisis no encontrada o ya resuelta' });
    }

    // Registrar la decisión en telemetría
    if (user_id && course_id) {
      await telemetryService.logAction(
        req.params.simulation_id,
        user_id,
        course_id,
        `Crisis resuelta: ${resolved.title}`,
        'crisis_resolved',
        {
          crisis_id: resolved.id,
          option_id,
          score: resolved.score,
          severity: resolved.severity,
        }
      );
    }

    res.json(resolved);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ─── Evaluación automática ────────────────────────────────────────────────────

/**
 * POST /api/simulations/:simulation_id/evaluate
 * Genera y guarda la evaluación de la simulación.
 * Usa RulesEngine (offline) + IA (con fallback).
 * Solo docentes y admins pueden disparar esto; el alumno lo ve al completar.
 */
router.post('/:simulation_id/evaluate', authMiddleware, async (req: Request, res: Response) => {
  try {
    const simId = req.params.simulation_id;
    const requester = (req as any).user;

    const sim = await simulationService.getSimulation(simId);
    if (!sim) return res.status(404).json({ error: 'Simulación no encontrada' });

    const course = await courseService.getCourseById((sim as any).course_id);
    if (!course) return res.status(404).json({ error: 'Curso no encontrado' });

    // Obtener logs de telemetría
    const logs = await telemetryService.getSimulationLogs(simId);

    // Criterios de evaluación según categoría del curso
    const family: string = (course as any).category || (course as any).family || 'default';
    const criteriaMap: Record<string, string[]> = {
      administracion: ['precisión_cálculo', 'cumplimiento_normativo', 'gestión_tiempo', 'documentación'],
      rrhh: ['comunicación', 'empatía', 'resolución_conflictos', 'liderazgo'],
      informatica: ['calidad_código', 'resolución_problemas', 'seguridad', 'documentación_técnica'],
      emprendimiento: ['visión_estratégica', 'gestión_riesgo', 'comunicación_cliente', 'adaptabilidad'],
      ventas: ['negociación', 'atención_cliente', 'gestión_objeciones', 'cierre_ventas'],
      legal: ['precisión_normativa', 'redacción_jurídica', 'análisis_riesgo', 'ética_profesional'],
      contable: ['precisión_cálculo', 'cumplimiento_impositivo', 'análisis_financiero', 'documentación'],
      general: ['desempeño_general', 'participación', 'precisión', 'comunicación'],
    };
    const evalCriteria = criteriaMap[family] || ['desempeño_general', 'participación', 'precisión'];

    // Análisis de IA (con fallback heurístico si no hay clave)
    const aiAnalysis = await aiService.analyzStudentPerformance(
      (sim as any).course_id,
      logs,
      evalCriteria
    );

    // Aplicar Rules Engine sobre logs de acciones
    const actionLogs = logs.filter(l => (l.action_type as string) === 'click' || (l.action_type as string) === 'action');
    let rulesScore = 0;
    let rulesCount = 0;
    for (const log of actionLogs) {
      try {
        const r = await rulesEngine.validate(family, (log.metadata as any)?.action_type || 'generic', log.metadata);
        if (typeof (r as any).score === 'number') { rulesScore += (r as any).score; rulesCount++; }
      } catch (_) { /* skip */ }
    }
    const rulesAvg = rulesCount > 0 ? Math.round(rulesScore / rulesCount) : null;

    // Puntaje base combinado (IA + reglas)
    const aiScore = aiAnalysis.overall_score ?? 70;
    const finalScore = rulesAvg !== null
      ? Math.round(aiScore * 0.7 + rulesAvg * 0.3)
      : aiScore;

    // Crisis penalty/bonus
    const crisisLog = logs.find(l => (l.action_type as string) === 'crisis_resolved');
    const crisisScore = (crisisLog?.metadata as any)?.score ?? null;
    const crisisAdjust = crisisScore !== null ? Math.round((crisisScore - 50) * 0.1) : 0;
    const adjustedScore = Math.max(0, Math.min(100, finalScore + crisisAdjust));
    const passed = adjustedScore >= 70;

    // Metodología de cálculo completa — se guarda en criteria_met para el legajo
    const kpiScores: Record<string, number> = {
      ...aiAnalysis.hard_skills,
      ...(aiAnalysis.soft_skills || {}),
      ...(crisisScore !== null ? { crisis_management: crisisScore } : {}),
    };
    const criteriaMetPayload = {
      kpis: kpiScores,
      scoring_methodology: {
        formula: rulesAvg !== null
          ? 'puntaje = (base_ia × 0.7) + (motor_reglas × 0.3) + ajuste_crisis'
          : 'puntaje = base_ia + ajuste_crisis',
        components: {
          base_ia: {
            value: aiScore,
            weight: rulesAvg !== null ? 0.7 : 1.0,
            source: aiAnalysis.ai_mode === 'live' ? 'Gemini AI (en vivo)' : 'Evaluación heurística (offline)',
            description: 'Análisis de participación, precisión de respuestas e interacción con el escenario',
          },
          ...(rulesAvg !== null ? {
            motor_reglas: {
              value: rulesAvg,
              weight: 0.3,
              source: 'RulesEngine offline',
              description: `Validaciones de negocio para familia "${family}" (${rulesCount} acciones evaluadas)`,
            },
          } : {}),
          ...(crisisScore !== null ? {
            crisis_engine: {
              value: crisisScore,
              adjustment: crisisAdjust,
              source: 'Crisis Engine',
              description: `Decisión en evento de crisis (puntaje de opción elegida: ${crisisScore}/100). Ajuste: ${crisisAdjust > 0 ? '+' : ''}${crisisAdjust} pts`,
            },
          } : {}),
        },
        puntaje_base_ia: aiScore,
        puntaje_motor_reglas: rulesAvg,
        puntaje_crisis: crisisScore,
        ajuste_crisis: crisisAdjust,
        puntaje_final: adjustedScore,
        aprobado: passed,
        umbral_aprobacion: 70,
        criterios_evaluados: evalCriteria,
        ai_mode: aiAnalysis.ai_mode ?? 'scripted',
        total_eventos: logs.length,
        evaluado_por: requester?.userId ?? 'sistema',
        evaluado_en: new Date().toISOString(),
      },
      analysis_detail: {
        strengths: aiAnalysis.strengths ?? [],
        areas_to_improve: aiAnalysis.areas_to_improve ?? [],
        recommendations: aiAnalysis.recommendations ?? [],
      },
    };

    const commentsText = [
      `Evaluación generada el ${new Date().toLocaleString('es-AR')}`,
      `Modo IA: ${aiAnalysis.ai_mode === 'live' ? 'Gemini en vivo' : 'Heurístico offline'}`,
      `Fórmula: ${criteriaMetPayload.scoring_methodology.formula}`,
      aiAnalysis.recommendations?.[0] ? `Recomendación: ${aiAnalysis.recommendations[0]}` : '',
    ].filter(Boolean).join(' | ');

    // Guardar en assessments (usando las columnas reales de la tabla)
    await AppDataSource.query(
      `DELETE FROM assessments WHERE simulation_id = ?`,
      [simId]
    );
    await AppDataSource.query(
      `INSERT INTO assessments (id, simulation_id, evaluator_id, criteria_met, comments, grade, evaluated_at)
       VALUES (UUID(), ?, ?, ?, ?, ?, NOW())`,
      [
        simId,
        requester?.userId ?? null,
        JSON.stringify(criteriaMetPayload),
        commentsText,
        adjustedScore,
      ]
    );

    // Actualizar score en la simulación y marcar como completada
    await AppDataSource.query(
      `UPDATE simulations SET score = ?, status = 'completed', completed_at = COALESCE(completed_at, NOW()) WHERE id = ?`,
      [adjustedScore, simId]
    );

    res.json({
      simulation_id: simId,
      score: adjustedScore,
      passed,
      ai_mode: aiAnalysis.ai_mode ?? 'scripted',
      kpis: kpiScores,
      scoring_methodology: criteriaMetPayload.scoring_methodology,
      analysis: aiAnalysis,
    });
  } catch (error: any) {
    console.error('[evaluate]', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
