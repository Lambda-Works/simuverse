import { Course } from '../models/Course.js';

export class CourseService {
  async getAllCourses(isActive = true) {
    return await Course.find({ is_active: isActive }).lean();
  }

  async getCourseById(courseId: string) {
    return await Course.findOne({ course_id: courseId }).lean();
  }

  async createCourse(courseData: any) {
    const course = new Course(courseData);
    return await course.save();
  }

  async updateCourse(courseId: string, updates: any) {
    return await Course.findOneAndUpdate({ course_id: courseId }, updates, { new: true });
  }

  async deleteCourse(courseId: string) {
    return await Course.findOneAndUpdate({ course_id: courseId }, { is_active: false });
  }

  async getCoursesByFamily(family: string) {
    return await Course.find({ family, is_active: true }).lean();
  }

  async getModulesBysCourseId(courseId: string) {
    const course = await Course.findOne({ course_id: courseId });
    return course?.modules || [];
  }
}

export const courseService = new CourseService();
