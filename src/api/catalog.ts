import type { Category, Course, Instructor } from '../types';
import { apiRequest } from './auth';
import { withMediaCategory, withMediaCourse, withMediaInstructor } from '../lib/catalogMedia';

export const catalogApi = {
  get: async () => {
    const data = await apiRequest<{
      courses: Course[];
      instructors: Instructor[];
      categories: Category[];
      weeklyPopularIds?: string[];
    }>('/api/catalog');
    return {
      ...data,
      courses: data.courses.map(withMediaCourse),
      instructors: data.instructors.map(withMediaInstructor),
      categories: data.categories.map(withMediaCategory),
    };
  },
  founder: async (founderId: string) => {
    const data = await apiRequest<{ instructor: Instructor | null; courses: Course[] }>(
      `/api/catalog/founders/${encodeURIComponent(founderId)}`
    );
    return {
      instructor: data.instructor ? withMediaInstructor(data.instructor) : null,
      courses: data.courses.map(withMediaCourse),
    };
  },
};
