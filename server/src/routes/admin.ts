import { Router, Request, Response } from 'express';
import { authMiddleware } from '../middleware/AuthMiddleware.js';
import { roleMiddleware } from '../middleware/RoleMiddleware.js';
import { ConfigService } from '../services/ConfigService';
import { ScenarioService } from '../services/ScenarioService';
import { PracticeLogsService } from '../services/PracticeLogsService';
import { SimulationInstanceService } from '../services/SimulationInstanceService';
import { CourseService } from '../services/CourseService';
import { AppDataSource } from '../database/connection';
import { Course } from '../entities/Course';

const router = Router();

// Protect all admin routes
router.use(AuthMiddleware.verify);
router.use(RoleMiddleware.requireRole('admin'));

// ========== COURSE CONFIGURATION ==========

/**
 * GET /admin/courses/:course_id/config
 * Get course configuration (JSON)
 */
router.get('/courses/:course_id/config', async (req: Request, res: Response) => {
  try {
    const config = await ConfigService.getOrCreateConfig(req.params.course_id);
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * PUT /admin/courses/:course_id/config
 * Update course configuration (JSON editor)
 */
router.put('/courses/:course_id/config', async (req: Request, res: Response) => {
  try {
    const config = await ConfigService.updateConfig(req.params.course_id, req.body);
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * POST /admin/courses/:course_id/config/export
 * Export configuration as JSON file
 */
router.post('/courses/:course_id/config/export', async (req: Request, res: Response) => {
  try {
    const config = await ConfigService.exportConfig(req.params.course_id);
    res.json({
      data: config,
      exportedAt: new Date().toISOString(),
    });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * POST /admin/courses/:course_id/config/import
 * Import configuration from JSON
 */
router.post('/courses/:course_id/config/import', async (req: Request, res: Response) => {
  try {
    const config = await ConfigService.importConfig(req.params.course_id, req.body);
    res.json(config);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ========== SCENARIO MANAGEMENT ==========

/**
 * GET /admin/courses/:course_id/scenarios
 * Get all scenarios for a course
 */
router.get('/courses/:course_id/scenarios', async (req: Request, res: Response) => {
  try {
    const scenarios = await ScenarioService.getScenariosByCourse(req.params.course_id);
    res.json(scenarios);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * POST /admin/courses/:course_id/scenarios
 * Create new scenario
 */
router.post('/courses/:course_id/scenarios', async (req: Request, res: Response) => {
  try {
    const scenario = await ScenarioService.createScenario(req.params.course_id, req.body);
    res.status(201).json(scenario);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * GET /admin/scenarios/:scenario_id
 * Get scenario details
 */
router.get('/scenarios/:scenario_id', async (req: Request, res: Response) => {
  try {
    const scenario = await ScenarioService.getScenario(parseInt(req.params.scenario_id));
    if (!scenario) {
      return res.status(404).json({ error: 'Scenario not found' });
    }
    res.json(scenario);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * PUT /admin/scenarios/:scenario_id
 * Update scenario
 */
router.put('/scenarios/:scenario_id', async (req: Request, res: Response) => {
  try {
    const scenario = await ScenarioService.updateScenario(
      parseInt(req.params.scenario_id),
      req.body
    );
    res.json(scenario);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /admin/scenarios/:scenario_id
 * Deactivate scenario (soft delete)
 */
router.delete('/scenarios/:scenario_id', async (req: Request, res: Response) => {
  try {
    const scenario = await ScenarioService.deactivateScenario(parseInt(req.params.scenario_id));
    res.json(scenario);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * GET /admin/scenarios/:scenario_id/stats
 * Get scenario statistics
 */
router.get('/scenarios/:scenario_id/stats', async (req: Request, res: Response) => {
  try {
    const stats = await ScenarioService.getScenarioStats(parseInt(req.params.scenario_id));
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * POST /admin/scenarios/:scenario_id/clone
 * Clone scenario to another course
 */
router.post('/scenarios/:scenario_id/clone', async (req: Request, res: Response) => {
  try {
    const { targetCourseId, newName } = req.body;
    const cloned = await ScenarioService.cloneScenario(
      parseInt(req.params.scenario_id),
      targetCourseId,
      newName
    );
    res.json(cloned);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ========== PRACTICE LOGS (MINISTRY AUDIT) ==========

/**
 * GET /admin/logs/course/:course_id
 * Get all logs for a course with filtering
 */
router.get('/logs/course/:course_id', async (req: Request, res: Response) => {
  try {
    const { action_type, startDate, endDate, student_id } = req.query;

    const filters: any = {};
    if (action_type) filters.action_type = action_type;
    if (student_id) filters.student_id = student_id;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);

    const logs = await PracticeLogsService.getLogsForCourse(req.params.course_id, filters);
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * GET /admin/logs/student/:student_id/course/:course_id
 * Get all logs for a specific student
 */
router.get('/logs/student/:student_id/course/:course_id', async (req: Request, res: Response) => {
  try {
    const logs = await PracticeLogsService.getLogsForStudent(
      req.params.student_id,
      req.params.course_id,
      parseInt(req.query.limit as string) || 100
    );
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * GET /admin/logs/verify/:student_id/course/:course_id
 * Verify integrity of logs (cryptographic validation)
 */
router.get('/logs/verify/:student_id/course/:course_id', async (req: Request, res: Response) => {
  try {
    const verification = await PracticeLogsService.verifyLogIntegrity(
      req.params.student_id,
      req.params.course_id
    );
    res.json(verification);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * GET /admin/logs/student/:student_id/course/:course_id/stats
 * Get student statistics for a course
 */
router.get(
  '/logs/student/:student_id/course/:course_id/stats',
  async (req: Request, res: Response) => {
    try {
      const stats = await PracticeLogsService.getStudentStats(
        req.params.student_id,
        req.params.course_id
      );
      res.json(stats);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

/**
 * GET /admin/logs/student/:student_id/course/:course_id/export/csv
 * Export logs as CSV for Ministry inspection
 */
router.get(
  '/logs/student/:student_id/course/:course_id/export/csv',
  async (req: Request, res: Response) => {
    try {
      const csv = await PracticeLogsService.exportLogsAsCSV(
        req.params.student_id,
        req.params.course_id
      );

      res.header('Content-Type', 'text/csv');
      res.header(
        'Content-Disposition',
        `attachment; filename=student-logs-${req.params.student_id}.csv`
      );
      res.send(csv);
    } catch (error) {
      res.status(400).json({ error: (error as Error).message });
    }
  }
);

/**
 * GET /admin/logs/simulation/:simulation_instance_id
 * Get logs for a specific simulation instance
 */
router.get('/logs/simulation/:simulation_instance_id', async (req: Request, res: Response) => {
  try {
    const logs = await PracticeLogsService.getLogsForSimulation(
      parseInt(req.params.simulation_instance_id)
    );
    res.json(logs);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ========== SIMULATION MANAGEMENT ==========

/**
 * GET /admin/courses/:course_id/statistics
 * Get course simulation statistics
 */
router.get('/courses/:course_id/statistics', async (req: Request, res: Response) => {
  try {
    const stats = await SimulationInstanceService.getCourseStatistics(req.params.course_id);
    res.json(stats);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * GET /admin/simulations/:simulation_id
 * Get simulation instance details
 */
router.get('/simulations/:simulation_id', async (req: Request, res: Response) => {
  try {
    const simulation = await SimulationInstanceService.getSimulation(
      parseInt(req.params.simulation_id)
    );
    if (!simulation) {
      return res.status(404).json({ error: 'Simulation not found' });
    }
    res.json(simulation);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * POST /admin/simulations/:simulation_id/review
 * Submit simulation for review (teacher review)
 */
router.post('/simulations/:simulation_id/review', async (req: Request, res: Response) => {
  try {
    const simulation = await SimulationInstanceService.submitForReview(
      parseInt(req.params.simulation_id)
    );
    res.json(simulation);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

// ========== COURSE MANAGEMENT ==========

/**
 * GET /admin/courses
 * Get all courses
 */
router.get('/courses', async (req: Request, res: Response) => {
  try {
    const courses = await CourseService.getAllCourses();
    res.json(courses);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * POST /admin/courses
 * Create new course
 */
router.post('/courses', async (req: Request, res: Response) => {
  try {
    const course = await CourseService.createCourse(req.body);
    res.status(201).json(course);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * PUT /admin/courses/:course_id
 * Update course
 */
router.put('/courses/:course_id', async (req: Request, res: Response) => {
  try {
    const course = await CourseService.updateCourse(req.params.course_id, req.body);
    res.json(course);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

/**
 * DELETE /admin/courses/:course_id
 * Delete course
 */
router.delete('/courses/:course_id', async (req: Request, res: Response) => {
  try {
    await AppDataSource.getRepository(Course).delete(req.params.course_id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

export default router;
