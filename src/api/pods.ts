import { apiRequest } from './auth';
import type { PodKind, PodMemberStatus, PodRole, PodStatus, PodTaskStatus } from '../lib/pods';

export type PodQuestion = {
  id: string;
  body: string;
  answerBody: string;
  status: 'open' | 'answered';
  createdAt: string;
  answeredAt: string | null;
  firstName: string;
  mine: boolean;
};

export type PodHome = {
  id: string;
  name: string;
  kind: PodKind;
  status: PodStatus;
  currentWeek: number;
  groupNotice: string;
  myRole: PodRole;
  myStatus: PodMemberStatus;
  canSubmit: boolean;
  canJoinMeeting: boolean;
  isCaptain: boolean;
  captain: { id: string; name: string; firstName: string; avatar: string } | null;
  members: Array<{ firstName: string; initial: string; status: PodMemberStatus }>;
  session: { startsAt: string | null; meetingUrl: string; notes: string } | null;
  task: {
    id: string;
    weekIndex: number;
    title: string;
    brief: string;
    dueAt: string | null;
    submittedCount: number;
    memberCount: number;
    mySubmission: {
      id: string | null;
      status: PodTaskStatus;
      body: string;
      linkUrls: string[];
      captainNote: string;
    };
  } | null;
  questions: PodQuestion[];
  captainView: {
    members: Array<{
      userId: string;
      name: string;
      firstName: string;
      email: string;
      memberStatus: PodMemberStatus;
      role: PodRole;
      submissionStatus: PodTaskStatus;
      submissionId: string | null;
      submissionBody: string;
      captainNote: string;
    }>;
  } | null;
};

export type MyPodsState = {
  showNav: boolean;
  eligible: boolean;
  pendingAssignment: boolean;
  pendingKinds: PodKind[];
  ineligibleReason: 'none' | null;
  pods: PodHome[];
};

export type AdminPodRow = {
  id: string;
  name: string;
  kind: PodKind;
  status: PodStatus;
  capacity: number;
  occupied: number;
  currentWeek: number;
  groupNotice: string;
  captain: { id: string; name: string; email: string; avatar: string } | null;
  createdAt: string;
};

export type QueueItem = {
  userId: string;
  name: string;
  email: string;
  kind: PodKind;
  source: 'brave' | 'hesitant' | 'premium_88';
  stamp: string | null;
};

export const podsApi = {
  me: () => apiRequest<MyPodsState>('/api/pod/me'),
  get: (id: string) => apiRequest<{ pod: PodHome }>(`/api/pod/${encodeURIComponent(id)}`),
  submitTask: (podId: string, taskId: string, body: string, linkUrls: string[]) =>
    apiRequest<{ submission: unknown }>(`/api/pod/${encodeURIComponent(podId)}/tasks/${encodeURIComponent(taskId)}/submit`, {
      method: 'POST',
      body: JSON.stringify({ body, linkUrls }),
    }),
  ask: (podId: string, body: string) =>
    apiRequest<{ question: unknown }>(`/api/pod/${encodeURIComponent(podId)}/questions`, {
      method: 'POST',
      body: JSON.stringify({ body }),
    }),
  joinSession: (podId: string) =>
    apiRequest<{ meetingUrl: string }>(`/api/pod/${encodeURIComponent(podId)}/session/join`, { method: 'POST' }),
  saveTask: (podId: string, input: { weekIndex: number; title: string; brief: string; dueAt?: string }) =>
    apiRequest<{ task: unknown }>(`/api/pod/${encodeURIComponent(podId)}/captain/task`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),
  saveSession: (podId: string, input: { startsAt?: string; meetingUrl?: string; notes?: string }) =>
    apiRequest<{ session: unknown }>(`/api/pod/${encodeURIComponent(podId)}/captain/session`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  saveNotice: (podId: string, groupNotice: string) =>
    apiRequest<{ pod: unknown }>(`/api/pod/${encodeURIComponent(podId)}/captain/notice`, {
      method: 'PATCH',
      body: JSON.stringify({ groupNotice }),
    }),
  review: (submissionId: string, status: 'reviewed' | 'stuck', captainNote: string) =>
    apiRequest<{ submission: unknown }>(`/api/pod/submissions/${encodeURIComponent(submissionId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, captainNote }),
    }),
  answer: (questionId: string, answerBody: string) =>
    apiRequest<{ question: unknown }>(`/api/pod/questions/${encodeURIComponent(questionId)}`, {
      method: 'PATCH',
      body: JSON.stringify({ answerBody }),
    }),
  adminList: () => apiRequest<{ pods: AdminPodRow[] }>('/api/admin/pods'),
  queue: () => apiRequest<{ queue: QueueItem[]; libraryOnly: Array<{ userId: string; name: string; email: string; stamp: string }> }>(
    '/api/admin/pods/queue'
  ),
  create: (input: { name: string; kind: PodKind; captainUserId?: string; capacity?: number; currentWeek?: number }) =>
    apiRequest<{ pod: { id: string } }>('/api/admin/pods', { method: 'POST', body: JSON.stringify(input) }),
  update: (id: string, input: { name?: string; status?: PodStatus; capacity?: number; currentWeek?: number }) =>
    apiRequest<{ pod: { id: string } }>(`/api/admin/pods/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(input),
    }),
  setCaptain: (id: string, userId: string) =>
    apiRequest<{ pod: { id: string } }>(`/api/admin/pods/${encodeURIComponent(id)}/captain`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  assign: (id: string, userId: string) =>
    apiRequest<{ created: boolean }>(`/api/admin/pods/${encodeURIComponent(id)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),
  setMemberStatus: (id: string, userId: string, status: 'active' | 'paused' | 'left') =>
    apiRequest<{ member: unknown }>(`/api/admin/pods/${encodeURIComponent(id)}/members/${encodeURIComponent(userId)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};
