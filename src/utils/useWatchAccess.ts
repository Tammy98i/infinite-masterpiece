import { useApp } from '../context/AppContext';
import { usePaywall } from '../context/PaywallContext';
import { canPreviewEpisode, canWatchEpisode } from './access';

export function useWatchAccess() {
  const { courses, setView, user } = useApp();
  const { openPaywall } = usePaywall();

  const goWatch = (courseId: string, episodeId?: string, source = 'play') => {
    const course = courses.find((c) => c.id === courseId);
    const episode =
      course?.episodes.find((e) => e.id === episodeId) || course?.episodes[0];
    if (!episode || !course) return;

    if (!canWatchEpisode(episode, user, course) && !canPreviewEpisode(episode, user, course)) {
      openPaywall({
        source,
        courseId: course.id,
        courseTitle: course.title,
      });
      return;
    }

    setView('watch', { courseId, episodeId: episode.id });
  };

  return { goWatch };
}
