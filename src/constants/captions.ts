import type { CaptionTrack } from '../types';

const PLACEHOLDER_PATHS = ['he-placeholder.vtt', 'he-sample.vtt', '/captions/episodes/'];

/** Per-episode stub path (generated via npm run a11y:generate-captions). */
export function captionTracksForEpisode(episodeId: string): CaptionTrack[] {
  return [
    {
      src: `/captions/episodes/${episodeId}.vtt`,
      label: 'עברית',
      srclang: 'he',
      kind: 'subtitles',
      default: true,
    },
  ];
}

/** Fallback when episode id is unknown. */
export const DEFAULT_HEBREW_CAPTION_TRACKS: CaptionTrack[] = [
  {
    src: '/captions/he-placeholder.vtt',
    label: 'עברית',
    srclang: 'he',
    kind: 'subtitles',
    default: true,
  },
];

export function defaultCaptionTracks(episodeId?: string): CaptionTrack[] {
  if (episodeId) return captionTracksForEpisode(episodeId);
  return DEFAULT_HEBREW_CAPTION_TRACKS.map((t) => ({ ...t }));
}

export function captionTracksFromVttUrl(src: string | undefined, episodeId?: string): CaptionTrack[] {
  const trimmed = src?.trim();
  if (!trimmed) return defaultCaptionTracks(episodeId);
  return [
    {
      src: trimmed,
      label: 'עברית',
      srclang: 'he',
      kind: 'subtitles',
      default: true,
    },
  ];
}

export function vttUrlFromCaptionTracks(tracks: CaptionTrack[] | undefined): string {
  const custom = tracks?.find(
    (t) => t.src && !PLACEHOLDER_PATHS.some((p) => t.src.includes(p))
  );
  return custom?.src || tracks?.[0]?.src || '';
}

export function isPlaceholderCaptionTrack(src: string | undefined): boolean {
  if (!src) return true;
  return PLACEHOLDER_PATHS.some((p) => src.includes(p));
}
