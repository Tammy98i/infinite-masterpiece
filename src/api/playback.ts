import { apiRequest } from './auth';

export type PlaybackSessionResponse = {
  sessionId: string;
  playbackUrl: string;
  mode: 'full' | 'preview';
  previewSeconds?: number;
  expiresAt: string;
  courseId: string;
  chapterId: string;
  captionTracks?: Array<{
    src: string;
    label: string;
    srclang: string;
    kind?: 'subtitles' | 'captions';
    default?: boolean;
  }>;
};

export const playbackApi = {
  createSession: (chapterId: string) =>
    apiRequest<PlaybackSessionResponse>(
      `/api/library/chapters/${encodeURIComponent(chapterId)}/playback-session`,
      { method: 'POST', body: '{}' }
    ),
};
