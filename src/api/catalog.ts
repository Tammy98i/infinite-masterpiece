import type { Category, Course, Instructor } from '../types';
import { apiRequest } from './auth';

export const catalogApi = {
  get: () =>
    apiRequest<{
      courses: Course[];
      instructors: Instructor[];
      categories: Category[];
      weeklyPopularIds?: string[];
    }>('/api/catalog'),
  founder: (founderId: string) =>
    apiRequest<{ instructor: Instructor | null; courses: Course[] }>(
      `/api/catalog/founders/${encodeURIComponent(founderId)}`
    ),
};
