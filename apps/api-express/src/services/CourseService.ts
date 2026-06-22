import { AppDataSource } from '../database/connection.js';
import { Course } from '../entities/Course.js';

export class CourseService {
  private courseRepository = AppDataSource.getRepository(Course);

  async getAllCourses(is_active?: boolean) {
    if (is_active === undefined) {
      // Si no se especifica, devolver todos los cursos (activos e inactivos)
      return await this.courseRepository.find();
    }
    // Si se especifica explícitamente, filtrar por is_active
    return await this.courseRepository.find({
      where: { is_active }
    });
  }

  async getCourseById(course_id: string) {
    return await this.courseRepository.findOne({
      where: { id: course_id }
    });
  }

  async createCourse(courseData: any) {
    const course = this.courseRepository.create(courseData);
    return await this.courseRepository.save(course);
  }

  async updateCourse(course_id: string, updates: any) {
    await this.courseRepository.update(course_id, updates);
    return await this.getCourseById(course_id);
  }

  async deleteCourse(course_id: string) {
    return await this.courseRepository.update(course_id, { is_active: false });
  }

  async getCoursesByCategory(category: string) {
    return await this.courseRepository.find({ where: { category, is_active: true } });
  }

  async getModulesBysCourseId(course_id: string) {
    const course = await this.getCourseById(course_id);
    return course?.modules || [];
  }

  /**
   * Obtiene información de dependencias de un curso
   * Revisa si el curso tiene registros en otras tablas antes de eliminarlo
   */
  async checkCourseDependencies(courseId: string) {
    const connection = AppDataSource;
    const queryRunner = connection.createQueryRunner();

    try {
      const dependencies: Record<string, number> = {};

      // Buscar dependencias en cada tabla que tiene FK a courses
      const tables = [
        { table: 'course_config', column: 'course_id' },
        { table: 'course_modules', column: 'course_id' },
        { table: 'scenarios', column: 'course_id' },
        { table: 'simulations', column: 'course_id' },
      ];

      for (const { table, column } of tables) {
        const result = await queryRunner.query(
          `SELECT COUNT(*) as count FROM ?? WHERE ?? = ?`,
          [table, column, courseId]
        );
        if (result && result[0] && result[0].count > 0) {
          dependencies[table] = result[0].count;
        }
      }

      return dependencies;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Valida si un curso tiene asignaciones de simulaciones activas a estudiantes
   * Si tiene asignaciones, NO se puede eliminar (solo desactivar)
   */
  async checkActiveAssignments(courseId: string) {
    const connection = AppDataSource;
    const queryRunner = connection.createQueryRunner();

    try {
      // Buscar asignaciones de simulaciones que NO están completadas
      const result = await queryRunner.query(
        `SELECT COUNT(*) as count FROM simulation_assignments 
         WHERE course_id = ? AND status IN ('pending', 'in_progress')`,
        [courseId]
      );

      const activeAssignments = result && result[0] ? result[0].count : 0;

      if (activeAssignments > 0) {
        // También obtener info sobre las asignaciones completadas
        const completedResult = await queryRunner.query(
          `SELECT COUNT(*) as count FROM simulation_assignments 
           WHERE course_id = ? AND status = 'completed'`,
          [courseId]
        );
        const completedAssignments = completedResult && completedResult[0] ? completedResult[0].count : 0;

        return {
          canDelete: false,
          activeCount: activeAssignments,
          completedCount: completedAssignments,
          totalAssignments: activeAssignments + completedAssignments,
          reason: `El curso tiene ${activeAssignments} asignación(es) activa(s) y ${completedAssignments} completada(s). No puede eliminarse, solo desactivarse.`
        };
      }

      return {
        canDelete: true,
        activeCount: 0,
        completedCount: 0,
        totalAssignments: 0,
        reason: 'Sin asignaciones activas'
      };
    } finally {
      await queryRunner.release();
    }
  }
}

export const courseService = new CourseService();

