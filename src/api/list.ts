import { apiRequest } from './auth';

export const listApi = {
  get: () => apiRequest<{ courseIds: string[] }>('/api/list'),
  save: (courseIds: string[]) =>
    apiRequest<{ courseIds: string[] }>('/api/list', {
      method: 'PUT',
      body: JSON.stringify({ courseIds }),
    }),
};
