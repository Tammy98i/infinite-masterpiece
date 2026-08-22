import type { Course, Instructor } from '../types';
import type { CoursePayload } from './admin';
import { apiRequest } from './auth';

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info';

export interface LecturerApplication {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  field: string;
  links: string;
  proposedLecture: string;
  audience: string;
  valueToUser: string;
  experience: string;
  sampleVideo: string;
  status: ApplicationStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface LecturerOverview {
  lecturerId: string | null;
  courses: number;
  published: number;
  pending: number;
  drafts: number;
  episodes: number;
  views: number;
  uniqueViewers: number;
  completions: number;
  completionRate: number;
  saves: number;
  avgWatchMinutes: number;
  totalWatchHours: number;
  paywallHits: number;
  upgrades: number;
  referredLeads: number;
  referredUsers: number;
  isFounder: boolean;
  viewsByDay: Array<{ date: string; views: number }>;
  topContent: Array<{ id: string; title: string; views: number; completions: number }>;
  recentStatuses: Array<{ id: string; title: string; status: string; coverImage: string }>;
}

export interface LecturerProfile {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatarUrl: string;
  isFounder: boolean;
  expertise: string[];
}

export interface LecturerQuestion {
  id: string;
  courseId: string;
  courseTitle: string;
  userId: string;
  userName: string;
  question: string;
  answer: string;
  status: 'open' | 'answered' | 'escalated' | 'hidden';
  createdAt: string;
  answeredAt: string | null;
}

export interface LecturerTeamMessage {
  id: string;
  lecturerUserId: string;
  fromAdminId: string;
  fromAdminName: string;
  subject: string;
  body: string;
  readAt: string | null;
  createdAt: string;
}

export const lecturerApi = {
  application: () => apiRequest<{ application: LecturerApplication | null }>('/api/lecturer/application'),
  submitApplication: (payload: {
    fullName: string;
    phone: string;
    email: string;
    field: string;
    links?: string;
    proposedLecture: string;
    audience?: string;
    valueToUser?: string;
    experience?: string;
    sampleVideo?: string;
  }) =>
    apiRequest<{ application: LecturerApplication }>('/api/lecturer/application', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  overview: () => apiRequest<LecturerOverview>('/api/lecturer/overview'),
  profile: () => apiRequest<{ profile: LecturerProfile }>('/api/lecturer/profile'),
  updateProfile: (payload: {
    name?: string;
    title?: string;
    bio?: string;
    avatarUrl?: string;
    expertise?: string[];
  }) =>
    apiRequest<{ profile: LecturerProfile }>('/api/lecturer/profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  courses: () => apiRequest<{ courses: Course[] }>('/api/lecturer/courses'),
  createCourse: (payload: CoursePayload) =>
    apiRequest<{ course: Course }>('/api/lecturer/courses', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  updateCourse: (id: string, payload: CoursePayload) =>
    apiRequest<{ course: Course }>(`/api/lecturer/courses/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  submitCourse: (id: string) =>
    apiRequest<{ course: Course }>(`/api/lecturer/courses/${id}/submit`, { method: 'POST' }),
  team: () => apiRequest<{ members: Instructor[] }>('/api/lecturer/team'),
  addTeamMember: (payload: { name: string; title: string; bio: string; avatarUrl: string }) =>
    apiRequest<{ founder: Instructor }>('/api/lecturer/team', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  questions: () => apiRequest<{ questions: LecturerQuestion[] }>('/api/lecturer/questions'),
  answerQuestion: (id: string, payload: { answer?: string; status?: 'answered' | 'escalated' }) =>
    apiRequest<{ question: LecturerQuestion }>(`/api/lecturer/questions/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  messages: () => apiRequest<{ messages: LecturerTeamMessage[] }>('/api/lecturer/messages'),
  markMessageRead: (id: string) =>
    apiRequest<{ message: LecturerTeamMessage }>(`/api/lecturer/messages/${encodeURIComponent(id)}/read`, {
      method: 'POST',
    }),
};
