import type { CaptionTrack, Category, Course, Instructor } from '../types';
import { mediaUrl } from './apiBase';

export function withMediaCaptions(tracks: CaptionTrack[] | undefined): CaptionTrack[] | undefined {
  if (!tracks) return tracks;
  return tracks.map((track) => ({ ...track, src: mediaUrl(track.src) }));
}

export function withMediaCourse(course: Course): Course {
  return {
    ...course,
    coverImage: mediaUrl(course.coverImage),
    backdropImage: mediaUrl(course.backdropImage),
    trailerUrl: mediaUrl(course.trailerUrl),
    resources: course.resources ? mediaUrl(course.resources) : course.resources,
    episodes: course.episodes.map((ep) => ({
      ...ep,
      videoUrl: mediaUrl(ep.videoUrl),
      captionTracks: withMediaCaptions(ep.captionTracks),
    })),
  };
}

export function withMediaInstructor(instructor: Instructor): Instructor {
  return { ...instructor, avatarUrl: mediaUrl(instructor.avatarUrl) };
}

export function withMediaCategory(category: Category): Category {
  return {
    ...category,
    coverImage: category.coverImage ? mediaUrl(category.coverImage) : category.coverImage,
  };
}
