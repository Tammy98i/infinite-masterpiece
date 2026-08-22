import { getDb } from '../db/connection.js';
import type { WatchProgress } from '../../src/types.ts';

type SqlRow = Record<string, unknown>;

function rowToProgress(row: SqlRow): WatchProgress {
  return {
    courseId: String(row.course_id),
    episodeId: String(row.episode_id),
    currentTime: Number(row.current_time || 0),
    duration: Number(row.duration || 1),
    completed: Boolean(row.completed),
    updatedAt: Number(row.updated_at || Date.now()),
  };
}

export function listProgress(userId: string): WatchProgress[] {
  return (
    getDb()
      .prepare(`SELECT * FROM video_progress WHERE user_id = ? ORDER BY updated_at DESC`)
      .all(userId) as SqlRow[]
  ).map(rowToProgress);
}

export function saveProgress(userId: string, input: WatchProgress) {
  const completed = input.completed || input.currentTime >= input.duration * 0.95 ? 1 : 0;
  getDb()
    .prepare(
      `INSERT INTO video_progress (user_id, course_id, episode_id, current_time, duration, completed, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(user_id, course_id, episode_id) DO UPDATE SET
         current_time = excluded.current_time,
         duration = excluded.duration,
         completed = excluded.completed,
         updated_at = excluded.updated_at`
    )
    .run(
      userId,
      input.courseId,
      input.episodeId,
      input.currentTime,
      input.duration || 1,
      completed,
      input.updatedAt || Date.now()
    );
  return { ok: true as const };
}
