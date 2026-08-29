export type AccessLevel = 'free' | 'premium' | 'premium_88' | 'admin_only';
export type PublishStatus = 'draft' | 'pending_review' | 'published' | 'blocked';

export interface Episode {
  id: string;
  title: string;
  description: string;
  duration: number; // in seconds
  videoUrl: string;
  episodeNumber: number;
  isFreeSample?: boolean;
  accessLevel?: AccessLevel;
  /** WebVTT / caption tracks for the player */
  captionTracks?: CaptionTrack[];
}

export interface CaptionTrack {
  src: string;
  label: string;
  srclang: string;
  kind?: 'subtitles' | 'captions';
  default?: boolean;
}

export interface Instructor {
  id: string;
  name: string;
  title: string;
  avatarUrl: string;
  bio: string;
  credentials: string[];
  isFounder?: boolean;
  founderId?: string;
  sortOrder?: number;
  externalLinks?: { label: string; url: string }[];
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  categoryId: string;
  instructorId: string;
  coverImage: string;
  backdropImage: string;
  trailerUrl: string;
  episodes: Episode[];
  tags: string[];
  level: 'למתחילים' | 'מתקדם' | 'לכל הרמות';
  whatYouWillLearn: string[];
  targetAudience: string;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isShort?: boolean; // under 15 mins total or individual short lecture
  rating: number;
  reviewCount: number;
  createdAt: string;
  status?: PublishStatus;
  accessLevel?: AccessLevel;
  resources?: string;
  programWeek?: number;
  /** @deprecated שלב 2 — שאלות למרצה כבויות כרגע */
  questionsEnabled?: boolean;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon: string;
  coverImage?: string;
  sortOrder?: number;
  accessLevel?: AccessLevel;
  leadInstructorIds?: string[];
}

export interface LearningPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  coverImage: string;
  courseIds: string[];
  totalDurationHours: number;
}

export interface WatchProgress {
  courseId: string;
  episodeId: string;
  currentTime: number; // seconds
  duration: number; // seconds
  completed: boolean;
  updatedAt: number;
}

export interface Review {
  id: string;
  courseId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  subscriptionPlan: 'free_trial' | 'monthly' | 'annual' | 'premium_88' | 'none';
  entryTrack?: 'none' | 'brave' | 'hesitant';
  currentPaymentPhase?: number;
  raffleTicketsCount?: number;
  paymentPlanStatus?: string;
  trialEndsAt?: string;
  interests: string[];
  onboardingLevel?: OnboardingLevel;
    isFounder?: boolean;
    staffDesk?: '' | 'content' | 'support' | 'sales' | 'legal' | 'finance' | 'community';
    staffStatus?: 'active' | 'suspended' | 'limited';
    phone?: string;
  }

export type ViewType =
  | 'home'
  | 'category'
  | 'course'
  | 'watch'
  | 'search'
  | 'mylist'
  | 'history'
  | 'profile'
  | 'paths'
  | 'quiz'
  | 'shorts'
  | 'instructors'
  | 'instructor'
  | 'subscription'
  | 'admin'
  | 'lecturer';

export interface MoodRecommendation {
  mood: string;
  label: string;
  icon: string;
  recommendedTags: string[];
  recommendedCourseIds: string[];
}

export type UserRole = 'student' | 'instructor' | 'admin' | 'support' | 'org_manager';
export type OnboardingLevel = 'fearful' | 'hesitant' | 'brave';
export type OnboardingStepType = 'modal' | 'tooltip' | 'checklist' | 'video' | 'banner' | 'sidebar';
export type OnboardingStatus = 'not_started' | 'in_progress' | 'skipped' | 'completed' | 'needs_help' | 'locked' | 'open';
export type OnboardingTrigger =
  | 'first_login'
  | 'first_course_view'
  | 'first_watch'
  | 'first_upload'
  | 'first_course_create'
  | 'inactive_7d'
  | 'course_80pct'
  | 'course_complete';

export interface OnboardingPath {
  id: string;
  name: string;
  description: string;
  targetRole: UserRole;
  difficultyLevel: string;
  isActive: boolean;
  steps?: OnboardingStep[];
}

export interface OnboardingStep {
  stepId?: string;
  id?: string;
  pathId?: string;
  title: string;
  description: string;
  stepOrder: number;
  type: OnboardingStepType;
  videoUrl?: string | null;
  screenzEmbed?: string | null;
  pageUrl?: string | null;
  triggerEvent?: string | null;
  completionCondition?: string | null;
  targetSelector?: string | null;
  isRequired: boolean;
  status?: OnboardingStatus;
  completedAt?: string | null;
  skippedAt?: string | null;
  userStatus?: string;
}

export interface OnboardingBonus {
  id: string;
  title: string;
  description?: string;
  bonusType: string;
  value?: string;
  unlocked?: boolean;
}

export interface UserOnboardingPathProgress {
  pathId: string;
  pathName?: string;
  currentStepId?: string | null;
  onboardingLevel: OnboardingLevel;
  status: OnboardingStatus;
  completionPercentage: number;
  startedAt?: string;
  completedAt?: string | null;
  steps: OnboardingStep[];
  bonuses: OnboardingBonus[];
}

export interface UserOnboardingProgress {
  userId: string;
  paths: UserOnboardingPathProgress[];
}
