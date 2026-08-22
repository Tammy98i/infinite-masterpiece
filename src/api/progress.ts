import type { WatchProgress } from '../types';
import { apiRequest } from './auth';

export const progressApi = {
  list: () => apiRequest<{ progress: WatchProgress[] }>('/api/progress'),
  save: (progress: WatchProgress) =>
    apiRequest<{ ok: true }>('/api/progress', {
      method: 'PUT',
      body: JSON.stringify(progress),
    }),
};
