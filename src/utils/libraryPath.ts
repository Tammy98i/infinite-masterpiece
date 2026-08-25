import type { ViewType } from '../types';

export function isVodLibraryPath(pathname: string) {
  return pathname === '/library' || pathname.startsWith('/library/');
}

export function parseLibraryPath(pathname: string): {
  view: ViewType;
  courseId?: string;
  episodeId?: string;
  categoryId?: string;
  instructorId?: string;
} {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  if (parts[0] !== 'library') return { view: 'home' };
  const section = parts[1];
  const a = parts[2] ? decodeURIComponent(parts[2]) : undefined;
  const b = parts[3] ? decodeURIComponent(parts[3]) : undefined;
  if (!section) return { view: 'home' };
  if (section === 'course' && a) return { view: 'course', courseId: a };
  if (section === 'watch' && a && b) return { view: 'watch', courseId: a, episodeId: b };
  if (section === 'category' && a) return { view: 'category', categoryId: a };
  if (section === 'instructor' && a) return { view: 'instructor', instructorId: a };
  if (section === 'search') return { view: 'search' };
  if (section === 'list') return { view: 'mylist' };
  if (section === 'history') return { view: 'history' };
  if (section === 'profile') return { view: 'profile' };
  if (section === 'admin') return { view: 'admin' };
  if (section === 'lecturer') return { view: 'lecturer' };
  if (section === 'shorts') return { view: 'shorts' };
  if (section === 'paths') return { view: 'paths' };
  if (section === 'instructors') return { view: 'instructors' };
  if (section === 'quiz') return { view: 'quiz' };
  return { view: 'home' };
}

export function libraryPath(
  view: ViewType,
  options?: { courseId?: string; episodeId?: string; categoryId?: string; instructorId?: string; query?: string }
) {
  if (view === 'course' && options?.courseId) {
    const base = `/library/course/${encodeURIComponent(options.courseId)}`;
    if (options.episodeId) {
      return `${base}?chapter=${encodeURIComponent(options.episodeId)}`;
    }
    return base;
  }
  if (view === 'watch' && options?.courseId && options.episodeId) {
    return `/library/watch/${encodeURIComponent(options.courseId)}/${encodeURIComponent(options.episodeId)}`;
  }
  if (view === 'category' && options?.categoryId) {
    return `/library/category/${encodeURIComponent(options.categoryId)}`;
  }
  if (view === 'instructor' && options?.instructorId) {
    return `/library/instructor/${encodeURIComponent(options.instructorId)}`;
  }
  if (view === 'search') {
    const q = options?.query?.trim();
    return q ? `/library/search?q=${encodeURIComponent(q)}` : '/library/search';
  }
  const map: Partial<Record<ViewType, string>> = {
    home: '/library',
    search: '/library/search',
    mylist: '/library/list',
    history: '/library/history',
    profile: '/library/profile',
    admin: '/library/admin',
    lecturer: '/library/lecturer',
    shorts: '/library/shorts',
    paths: '/library/paths',
    instructors: '/library/instructors',
    quiz: '/library/quiz',
  };
  return map[view] || '/library';
}
