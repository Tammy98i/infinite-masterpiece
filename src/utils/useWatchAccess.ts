import { useApp } from '../context/AppContext';

export function useWatchAccess() {
  const { courses, setView } = useApp();

  const goWatch = (courseId: string, episodeId?: string, source = 'play') => {
    void source;
    const course = courses.find((c) => c.id === courseId);
    const episode = course?.episodes.find((e) => e.id === episodeId) || course?.episodes[0];
    if (!episode || !course) return;
    setView('watch', { courseId, episodeId: episode.id });
  };

  return { goWatch };
}
