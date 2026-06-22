import { Course } from '../types';
import { apiClient } from './ApiClient';

export const getCourse = async (courseId: string): Promise<Course | null> => {
  try {
    const response = await apiClient.get(`/courses/${courseId}`);
    return response.data as Course;
  } catch (error) {
    console.error('Error fetching course:', error);
    return null;
  }
};

export const createCourse = async (course: Omit<Course, 'id'>): Promise<Course | null> => {
  try {
    const response = await apiClient.post('/courses', course);
    return response.data as Course;
  } catch (error) {
    console.error('Error creating course:', error);
    return null;
  }
};
