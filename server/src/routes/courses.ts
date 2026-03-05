import { Router, Request, Response } from 'express';
import { courseService } from '../services/CourseService.js';
import { promptInjectionFilter } from '../middleware/security.js';

const router = Router();

/**
 * GET /api/courses
 * Obtiene todos los cursos activos
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const courses = await courseService.getAllCourses(true);
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/courses/:courseId
 * Obtiene un curso específico
 */
router.get('/:courseId', async (req: Request, res: Response) => {
  try {
    const course = await courseService.getCourseById(req.params.courseId);
    if (!course) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(course);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/courses
 * Crear un nuevo curso (solo para admins)
 */
router.post('/', promptInjectionFilter, async (req: Request, res: Response) => {
  try {
    const { course_id, title, description, family, modules, ai_config, eval_criteria } = req.body;

    if (!course_id || !title || !family) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const course = await courseService.createCourse({
      course_id,
      title,
      description,
      family,
      modules: modules || [],
      ai_config: ai_config || {},
      eval_criteria: eval_criteria || [],
      is_active: true,
    });

    res.status(201).json(course);
  } catch (error: any) {
    if (error.code === 11000) {
      return res.status(400).json({ error: 'El ID del curso ya existe' });
    }
    res.status(500).json({ error: error.message });
  }
});

/**
 * PUT /api/courses/:courseId
 * Actualizar un curso
 */
router.put('/:courseId', async (req: Request, res: Response) => {
  try {
    const updated = await courseService.updateCourse(req.params.courseId, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/courses/:courseId
 * Desactivar un curso (soft delete)
 */
router.delete('/:courseId', async (req: Request, res: Response) => {
  try {
    const deleted = await courseService.deleteCourse(req.params.courseId);
    if (!deleted) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json({ message: 'Curso desactivado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/courses/family/:family
 * Obtiene cursos por familia
 */
router.get('/family/:family', async (req: Request, res: Response) => {
  try {
    const courses = await courseService.getCoursesByFamily(req.params.family);
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
