import { randomUUID } from 'crypto';
import type { AuthUser } from './authService.js';
import { getCourseById, getEpisodeById } from './catalogService.js';
import {
  GUEST_ACCESS_USER,
  PREVIEW_SECONDS,
  canPreviewEpisode,
  canWatchEpisode,
} from './accessService.js';

const SESSION_TTL_MS = 2 * 60 * 60 * 1000;

type PlaybackSession = {
  id: string;
  episodeId: string;
  userId: string | null;
  playbackUrl: string;
  mode: 'full' | 'preview';
  previewSeconds?: number;
  expiresAt: number;
};

const sessions = new Map<string, PlaybackSession>();

function pruneSessions() {
  const now = Date.now();
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}

export function createPlaybackSession(episodeId: string, user: AuthUser | null) {
  pruneSessions();
  const found = getEpisodeById(episodeId);
  if (!found) {
    throw Object.assign(new Error('הפרק לא נמצא'), { status: 404 });
  }
  const { episode, course } = found;
  if (course.status && course.status !== 'published' && user?.role !== 'admin') {
    throw Object.assign(new Error('הפרק לא נמצא'), { status: 404 });
  }
  if (!episode.videoUrl) {
    throw Object.assign(new Error('מקור הווידאו אינו זמין'), { status: 404 });
  }

  const accessUser = user || GUEST_ACCESS_USER;
  const full = canWatchEpisode(episode, accessUser, course);
  const preview = canPreviewEpisode(episode, accessUser, course);
  if (!full && !preview) {
    throw Object.assign(new Error('הפרק דורש גישה מלאה לספרייה'), { status: 403 });
  }

  const id = randomUUID();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const session: PlaybackSession = {
    id,
    episodeId: episode.id,
    userId: user?.id || null,
    playbackUrl: episode.videoUrl,
    mode: full ? 'full' : 'preview',
    previewSeconds: full ? undefined : PREVIEW_SECONDS,
    expiresAt,
  };
  sessions.set(id, session);

  return {
    sessionId: id,
    playbackUrl: episode.videoUrl,
    mode: session.mode,
    previewSeconds: session.previewSeconds,
    expiresAt: new Date(expiresAt).toISOString(),
    courseId: course.id,
    chapterId: episode.id,
    captionTracks: episode.captionTracks || [],
  };
}
