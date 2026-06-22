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
 * GET /api/courses/:course_id
 * Obtiene un curso específico
 */
router.get('/:course_id', async (req: Request, res: Response) => {
  try {
    const course = await courseService.getCourseById(req.params.course_id);
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
router.post('/', async (req: Request, res: Response) => {
  try {
    const { course_id, title, description, category, modules, ai_config, eval_criteria } = req.body;

    if (!course_id || !title || !category) {
      return res.status(400).json({ error: 'Campos requeridos faltantes' });
    }

    const course = await courseService.createCourse({
      course_id,
      title,
      description,
      category,
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
 * PUT /api/courses/:course_id
 * Actualizar un curso
 */
router.put('/:course_id', async (req: Request, res: Response) => {
  try {
    const updated = await courseService.updateCourse(req.params.course_id, req.body);
    if (!updated) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * DELETE /api/courses/:course_id
 * Desactivar un curso (soft delete)
 */
router.delete('/:course_id', async (req: Request, res: Response) => {
  try {
    const deleted = await courseService.deleteCourse(req.params.course_id);
    if (!deleted) {
      return res.status(404).json({ error: 'Curso no encontrado' });
    }
    res.json({ message: 'Curso desactivado correctamente' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/courses/category/:category
 * Obtiene cursos por categoría
 */
router.get('/category/:category', async (req: Request, res: Response) => {
  try {
    const courses = await courseService.getCoursesByCategory(req.params.category);
    res.json(courses);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
