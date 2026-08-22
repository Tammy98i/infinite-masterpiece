import type {
  OnboardingLevel,
  OnboardingPath,
  OnboardingStep,
  UserOnboardingProgress,
  UserRole,
} from '../types';
import { apiRequest } from './auth';

const BASE = '/api/onboarding';
const ADMIN_BASE = '/api/admin/onboarding';

export const onboardingApi = {
  getPaths: (role: UserRole) => apiRequest<OnboardingPath[]>(`${BASE}/paths?role=${role}`),

  getPath: (id: string) => apiRequest<OnboardingPath>(`${BASE}/path/${id}`),

  start: (userId: string, pathId: string, level: OnboardingLevel) =>
    apiRequest<UserOnboardingProgress>(`${BASE}/start`, {
      method: 'POST',
      body: JSON.stringify({ userId, pathId, level }),
    }),

  completeStep: (userId: string, stepId: string) =>
    apiRequest<UserOnboardingProgress>(`${BASE}/step-complete`, {
      method: 'POST',
      body: JSON.stringify({ userId, stepId }),
    }),

  skipStep: (userId: string, stepId: string) =>
    apiRequest<UserOnboardingProgress>(`${BASE}/step-skip`, {
      method: 'POST',
      body: JSON.stringify({ userId, stepId }),
    }),

  getUserProgress: (userId: string) =>
    apiRequest<UserOnboardingProgress>(`${BASE}/user-progress/${userId}`),

  getTriggerSteps: (userId: string, role: UserRole, trigger: string) =>
    apiRequest<OnboardingStep[]>(
      `${BASE}/trigger-steps?userId=${encodeURIComponent(userId)}&role=${role}&trigger=${trigger}`
    ),
};

export const adminOnboardingApi = {
  getStats: () =>
    apiRequest<{
      totalStarted: number;
      totalCompleted: number;
      completionRate: number;
      bonusesUnlockedCount: number;
      stepsWithMostSkips: { title: string; id: string; skip_count: number }[];
    }>(`${ADMIN_BASE}/stats`),

  getPaths: () => apiRequest<OnboardingPath[]>(`${ADMIN_BASE}/paths`),

  createPath: (data: {
    name: string;
    description?: string;
    targetRole: string;
    difficultyLevel?: string;
  }) => apiRequest<OnboardingPath>(`${ADMIN_BASE}/path`, { method: 'POST', body: JSON.stringify(data) }),

  updatePath: (id: string, data: Partial<OnboardingPath>) =>
    apiRequest<OnboardingPath>(`${ADMIN_BASE}/path/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deletePath: (id: string) => apiRequest<{ ok: boolean }>(`${ADMIN_BASE}/path/${id}`, { method: 'DELETE' }),

  createStep: (pathId: string, data: Partial<OnboardingStep>) =>
    apiRequest<OnboardingStep>(`${ADMIN_BASE}/path/${pathId}/steps`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateStep: (stepId: string, data: Partial<OnboardingStep>) =>
    apiRequest<OnboardingStep>(`${ADMIN_BASE}/steps/${stepId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

export const PATH_IDS = {
  student: 'path-student-basics',
  instructor: 'path-instructor-basics',
} as const;
