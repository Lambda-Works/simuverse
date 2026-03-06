import { AppDataSource } from '../database/connection.js';
import { Course } from '../entities/Course.js';

export class CourseService {
  private courseRepository = AppDataSource.getRepository(Course);

  async getAllCourses(is_active = true) {
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
}

export const courseService = new CourseService();

