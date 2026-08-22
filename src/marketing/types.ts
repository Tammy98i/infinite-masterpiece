export type UserRole = 
  | 'ADMIN' 
  | 'FOUNDER' 
  | 'LECTURER' 
  | 'MENTOR' 
  | 'CAPTAIN' 
  | 'STUDENT' 
  | 'PREMIUM_STUDENT';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: Date;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  isPublished: boolean;
}

export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  videoUrl?: string;
  durationMinutes: number;
  order: number;
  isPublished: boolean;
  resources: { name: string; url: string; type: 'script' | 'workbook' | 'template' | 'other' }[];
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  completed: boolean;
  lastWatchedPositionSeconds: number;
  updatedAt: Date;
}

export interface Assignment {
  id: string;
  lessonId: string;
  title: string;
  description: string;
  dueDate?: Date;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  userId: string;
  content: string;
  attachmentUrls: string[];
  status: 'PENDING' | 'REVIEWED' | 'APPROVED' | 'NEEDS_REVISION';
  feedback?: string;
  submittedAt: Date;
}

export interface Pod {
  id: string;
  name: string;
  captainId: string; // User ID of the Captain
  createdAt: Date;
}

export interface PodMember {
  id: string;
  podId: string;
  userId: string;
  joinedAt: Date;
}

export interface LiveSession {
  id: string;
  title: string;
  scheduledAt: Date;
  meetingUrl: string;
  recordingUrl?: string;
}

export interface PerformanceReport {
  id: string;
  userId: string;
  weekStarting: Date;
  lessonsWatchedCount: number;
  assignmentsSubmittedCount: number;
  salesOutreachCount: number;
  salesCallsCount: number;
  followUpsCount: number;
  offersSentCount: number;
  blockers: string;
  progressScore: number; // 0-100 based on execution
}
