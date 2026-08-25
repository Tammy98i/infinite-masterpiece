import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Course, Episode, Instructor, Category, UserProfile, WatchProgress, ViewType, Review, LearningPath, OnboardingLevel } from '../types';
import { COURSES, INSTRUCTORS, CATEGORIES, LEARNING_PATHS, SAMPLE_REVIEWS } from '../data/initialData';
import { getRecommendedCourses } from '../utils/recommendations';
import { useUser } from './UserContext';
import type { PlanId } from '../data/plans';
import { catalogApi } from '../api/catalog';
import { adminApi } from '../api/admin';
import { progressApi } from '../api/progress';
import { listApi } from '../api/list';
import { libraryPath, parseLibraryPath } from '../utils/libraryPath';
import { canAddToList, FREE_LIST_LIMIT, hasFullLibraryAccess } from '../utils/access';
import { withMediaCategory, withMediaCourse, withMediaInstructor } from '../lib/catalogMedia';

interface AppContextType {
  courses: Course[];
  instructors: Instructor[];
  categories: Category[];
  learningPaths: LearningPath[];
  reviews: Review[];
  user: UserProfile;
  isGuest: boolean;
  watchProgress: Record<string, WatchProgress>; // key: `${courseId}_${episodeId}`
  myList: string[]; // courseIds
  currentView: ViewType;
  selectedCourseId: string | null;
  selectedEpisodeId: string | null;
  selectedCategoryId: string | null;
  selectedInstructorId: string | null;
  searchQuery: string;
  selectedTag: string | null;
  isAdmin: boolean;
  isLecturer: boolean;
  isAuthModalOpen: boolean;
  isWelcomeOpen: boolean;
  
  // Actions
  setView: (view: ViewType, options?: { courseId?: string; episodeId?: string; categoryId?: string; instructorId?: string; tag?: string }) => void;
  setSearchQuery: (query: string) => void;
  setSelectedTag: (tag: string | null) => void;
  toggleMyList: (courseId: string) => void;
  isInMyList: (courseId: string) => boolean;
  updateProgress: (courseId: string, episodeId: string, currentTime: number, duration: number) => void;
  getCourseProgress: (courseId: string) => number; // percentage 0-100
  getContinueWatchingList: () => Array<{ course: Course; episode: Episode; progress: WatchProgress }>;
  getWatchHistory: () => Array<{ course: Course; episode: Episode; progress: WatchProgress }>;
  getMyLectures: () => Course[];
  getRecommendedForUser: () => Course[];
  hasActiveSubscription: () => boolean;
  login: (email: string, password: string) => Promise<import('../api/auth').AuthUserPayload>;
  register: (name: string, email: string, password: string) => Promise<import('../api/auth').AuthUserPayload>;
  logout: () => void;
  startTrialOrSubscribe: (plan: PlanId) => void;
  cancelSubscription: () => void;
  reloadCatalog: () => Promise<void>;
  catalogStatus: 'loading' | 'ready' | 'error';
  weeklyPopularIds: string[];
  addNewCourse: (courseData: Partial<Course>, episodesData: Array<Partial<Episode>>) => void;
  setAuthModalOpen: (open: boolean) => void;
  setWelcomeOpen: (open: boolean) => void;
  updateUserInterests: (interests: string[]) => void;
  updateOnboardingLevel: (level: OnboardingLevel) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    isGuest,
    isAuthModalOpen,
    isWelcomeOpen,
    login,
    register,
    logout,
    startTrialOrSubscribe,
    cancelSubscription,
    setAuthModalOpen,
    setWelcomeOpen,
    updateUserInterests,
    updateOnboardingLevel,
    hasActiveSubscription,
  } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const boot = parseLibraryPath(location.pathname);

  const [courses, setCourses] = useState<Course[]>(COURSES);
  const [instructors, setInstructors] = useState<Instructor[]>(INSTRUCTORS);
  const [categories, setCategories] = useState<Category[]>(CATEGORIES);
  const [weeklyPopularIds, setWeeklyPopularIds] = useState<string[]>([]);
  const [learningPaths] = useState<LearningPath[]>(LEARNING_PATHS);
  const [reviews] = useState<Review[]>(SAMPLE_REVIEWS);

  const [watchProgress, setWatchProgress] = useState<Record<string, WatchProgress>>(() => {
    const saved = localStorage.getItem('mc_progress');
    return saved ? JSON.parse(saved) : {};
  });

  const [myList, setMyList] = useState<string[]>(() => {
    const saved = localStorage.getItem('mc_mylist');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentView, setCurrentView] = useState<ViewType>(boot.view);
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(boot.courseId || null);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string | null>(boot.episodeId || null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(boot.categoryId || null);
  const [selectedInstructorId, setSelectedInstructorId] = useState<string | null>(boot.instructorId || null);
  const [searchQuery, setSearchQueryState] = useState(() =>
    new URLSearchParams(location.search).get('q') || ''
  );
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [catalogStatus, setCatalogStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const isAdmin = user.role === 'admin';
  const isLecturer = user.role === 'instructor';

  const reloadCatalog = async () => {
    setCatalogStatus('loading');
    try {
      const data = await catalogApi.get();
      setCourses(data.courses.map(withMediaCourse));
      setInstructors(data.instructors.map(withMediaInstructor));
      setCategories(data.categories.map(withMediaCategory));
      setWeeklyPopularIds(data.weeklyPopularIds || []);
      setCatalogStatus('ready');
    } catch {
      setCatalogStatus(COURSES.length > 0 ? 'ready' : 'error');
    }
  };

  const lastFlush = useRef(0);

  useEffect(() => {
    void reloadCatalog();
  }, []);

  useEffect(() => {
    const parsed = parseLibraryPath(location.pathname);
    setCurrentView(parsed.view);
    if (parsed.courseId) setSelectedCourseId(parsed.courseId);
    if (parsed.episodeId) setSelectedEpisodeId(parsed.episodeId);
    if (parsed.categoryId) setSelectedCategoryId(parsed.categoryId);
    if (parsed.instructorId) setSelectedInstructorId(parsed.instructorId);
    if (parsed.view === 'search') {
      setSearchQueryState(new URLSearchParams(location.search).get('q') || '');
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    if (isGuest) return;
    void progressApi
      .list()
      .then(({ progress }) => {
        setWatchProgress((prev) => {
          const next = { ...prev };
          for (const item of progress) {
            const key = `${item.courseId}_${item.episodeId}`;
            if (!next[key] || item.updatedAt >= next[key].updatedAt) next[key] = item;
          }
          return next;
        });
      })
      .catch(() => undefined);
  }, [user.id, isGuest]);

  useEffect(() => {
    if (isGuest) return;
    void listApi
      .get()
      .then(({ courseIds }) => {
        setMyList((prev) => {
          const merged = Array.from(new Set([...courseIds, ...prev]));
          const unlimited = user.role === 'admin' || hasFullLibraryAccess(user);
          const next = unlimited ? merged : merged.slice(0, FREE_LIST_LIMIT);
          if (next.length && next.join('\0') !== courseIds.join('\0')) {
            void listApi.save(next).catch(() => undefined);
          }
          return next;
        });
      })
      .catch(() => undefined);
  }, [user.id, isGuest]);

  useEffect(() => {
    localStorage.setItem('mc_progress', JSON.stringify(watchProgress));
  }, [watchProgress]);

  useEffect(() => {
    localStorage.setItem('mc_mylist', JSON.stringify(myList));
  }, [myList]);

  const setView = (
    view: ViewType,
    options?: { courseId?: string; episodeId?: string; categoryId?: string; instructorId?: string; tag?: string }
  ) => {
    const courseId = options?.courseId !== undefined ? options.courseId : selectedCourseId;
    const episodeId = options?.episodeId !== undefined ? options.episodeId : selectedEpisodeId;
    const categoryId = options?.categoryId !== undefined ? options.categoryId : selectedCategoryId;
    const instructorId = options?.instructorId !== undefined ? options.instructorId : selectedInstructorId;
    const path = libraryPath(view, {
      courseId: courseId || undefined,
      episodeId: episodeId || undefined,
      categoryId: categoryId || undefined,
      instructorId: instructorId || undefined,
      query: view === 'search' ? searchQuery : undefined,
    });
    if (`${location.pathname}${location.search}` !== path) navigate(path);
    setCurrentView(view);
    if (options?.courseId !== undefined) setSelectedCourseId(options.courseId);
    if (options?.episodeId !== undefined) setSelectedEpisodeId(options.episodeId);
    if (options?.categoryId !== undefined) setSelectedCategoryId(options.categoryId);
    if (options?.instructorId !== undefined) setSelectedInstructorId(options.instructorId);
    if (options?.tag !== undefined) setSelectedTag(options.tag);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const setSearchQuery = (query: string) => {
    setSearchQueryState(query);
    if (currentView !== 'search' && !query.trim()) return;
    const path = libraryPath('search', { query });
    if (`${location.pathname}${location.search}` !== path) navigate(path, { replace: true });
  };

  const toggleMyList = (courseId: string) => {
    setMyList((prev) => {
      if (prev.includes(courseId)) {
        const next = prev.filter((id) => id !== courseId);
        if (!isGuest) void listApi.save(next).catch(() => undefined);
        return next;
      }
      if (!canAddToList(user, prev.length)) return prev;
      const next = [...prev, courseId];
      if (!isGuest) void listApi.save(next).catch(() => undefined);
      return next;
    });
  };

  const isInMyList = (courseId: string) => myList.includes(courseId);

  const updateProgress = (courseId: string, episodeId: string, currentTime: number, duration: number) => {
    const key = `${courseId}_${episodeId}`;
    const completed = duration > 0 && (currentTime >= duration * 0.9 || currentTime >= duration - 15);
    const entry: WatchProgress = {
      courseId,
      episodeId,
      currentTime,
      duration: duration || 1,
      completed,
      updatedAt: Date.now(),
    };
    setWatchProgress((prev) => ({ ...prev, [key]: entry }));
    if (isGuest) return;
    const now = Date.now();
    if (!completed && now - lastFlush.current < 5000) return;
    lastFlush.current = now;
    void progressApi.save(entry).catch(() => undefined);
  };

  const getCourseProgress = (courseId: string) => {
    const course = courses.find((c) => c.id === courseId);
    if (!course || course.episodes.length === 0) return 0;

    let completedEpisodes = 0;
    let partialProgress = 0;

    course.episodes.forEach((ep) => {
      const prog = watchProgress[`${courseId}_${ep.id}`];
      if (prog?.completed) {
        completedEpisodes += 1;
      } else if (prog && prog.duration > 0) {
        partialProgress += prog.currentTime / prog.duration;
      }
    });

    const total = completedEpisodes + partialProgress;
    return Math.min(100, Math.round((total / course.episodes.length) * 100));
  };

  const getContinueWatchingList = () => {
    const list: Array<{ course: Course; episode: Episode; progress: WatchProgress }> = [];
    const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));

    const sortedProgress = (Object.values(watchProgress) as WatchProgress[])
      .filter((p) => {
        if (p.completed) return false;
        if (p.currentTime < 30) return false;
        const ratio = p.currentTime / Math.max(1, p.duration);
        return ratio < 0.9;
      })
      .sort((a, b) => b.updatedAt - a.updatedAt);

    const seenCourses = new Set<string>();

    for (const prog of sortedProgress) {
      if (seenCourses.has(prog.courseId)) continue;
      const course = courseMap.get(prog.courseId);
      if (!course) continue;
      const episode = course.episodes.find((e) => e.id === prog.episodeId);
      if (!episode) continue;

      seenCourses.add(prog.courseId);
      list.push({ course, episode, progress: prog });
      if (list.length >= 8) break;
    }

    return list;
  };

  const getWatchHistory = () => {
    const courseMap = new Map<string, Course>(courses.map((c) => [c.id, c]));
    return (Object.values(watchProgress) as WatchProgress[])
      .sort((a, b) => b.updatedAt - a.updatedAt)
      .flatMap((progress) => {
        const course = courseMap.get(progress.courseId);
        if (!course) return [];
        const episode = course.episodes.find((e) => e.id === progress.episodeId);
        if (!episode) return [];
        return [{ course, episode, progress }];
      });
  };

  const getMyLectures = () => {
    const seen = new Set<string>();
    const list: Course[] = [];
    for (const item of getWatchHistory()) {
      if (seen.has(item.course.id)) continue;
      seen.add(item.course.id);
      list.push(item.course);
    }
    return list;
  };

  const getRecommendedForUser = () => getRecommendedCourses(courses, user.interests);

  const addNewCourse = (courseData: Partial<Course>, episodesData: Array<Partial<Episode>>) => {
    void adminApi
      .createCourse({
        title: courseData.title || 'קורס חדש',
        subtitle: courseData.subtitle,
        description: courseData.description,
        categoryId: courseData.categoryId,
        instructorId: courseData.instructorId,
        coverImage: courseData.coverImage,
        backdropImage: courseData.backdropImage,
        tags: courseData.tags,
        level: courseData.level,
        status: 'published',
        accessLevel: 'premium',
        isNew: true,
        episodes: episodesData.map((ep, idx) => ({
          title: ep.title || `פרק ${idx + 1}`,
          description: ep.description,
          duration: Number(ep.duration) || 600,
          videoUrl: ep.videoUrl,
          accessLevel: idx === 0 ? 'free' : 'premium',
        })),
      })
      .then(() => reloadCatalog())
      .catch(() => undefined);
    window.dispatchEvent(new CustomEvent('onboarding-trigger', { detail: 'first_course_create' }));
  };

  return (
    <AppContext.Provider
      value={{
        courses,
        instructors,
        categories,
        learningPaths,
        reviews,
        user,
        isGuest,
        watchProgress,
        myList,
        currentView,
        selectedCourseId,
        selectedEpisodeId,
        selectedCategoryId,
        selectedInstructorId,
        searchQuery,
        selectedTag,
        isAdmin,
        isLecturer,
        isAuthModalOpen,
        isWelcomeOpen,
        setView,
        setSearchQuery,
        setSelectedTag,
        toggleMyList,
        isInMyList,
        updateProgress,
        getCourseProgress,
        getContinueWatchingList,
        getWatchHistory,
        getMyLectures,
        getRecommendedForUser,
        hasActiveSubscription,
        login,
        register,
        logout,
        startTrialOrSubscribe,
        cancelSubscription,
        reloadCatalog,
        catalogStatus,
        weeklyPopularIds,
        addNewCourse,
        setAuthModalOpen,
        setWelcomeOpen,
        updateUserInterests,
        updateOnboardingLevel,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
