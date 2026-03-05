
import { supabase } from '../integrations/supabase/client';
import { Course } from '../types';

export const getCourse = async (courseId: string): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('course_id', courseId)
    .single();

  if (error) {
    console.error('Error fetching course:', error);
    return null;
  }

  return data as Course;
};

export const createCourse = async (course: Omit<Course, 'id'>): Promise<Course | null> => {
  const { data, error } = await supabase
    .from('courses')
    .insert([course])
    .single();

  if (error) {
    console.error('Error creating course:', error);
    return null;
  }

  return data as Course;
};
