import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import {
  createCourse,
  createFounder,
  getCourseById,
  setCourseStatus,
  updateCourse,
  type CourseInput,
} from './catalogService.js';
import type { Course } from '../../src/types.ts';
import { publicMediaUrl } from '../config/env.js';

type SqlRow = Record<string, unknown>;

export type ApplicationStatus = 'pending' | 'approved' | 'rejected' | 'more_info';

export interface LecturerApplication {
  id: string;
  userId: string;
  fullName: string;
  phone: string;
  email: string;
  field: string;
  links: string;
  proposedLecture: string;
  audience: string;
  valueToUser: string;
  experience: string;
  sampleVideo: string;
  status: ApplicationStatus;
  adminNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationInput {
  fullName: string;
  phone: string;
  email: string;
  field: string;
  links?: string;
  proposedLecture: string;
  audience?: string;
  valueToUser?: string;
  experience?: string;
  sampleVideo?: string;
}

function rowToApp(row: SqlRow): LecturerApplication {
  return {
    id: String(row.id),
    userId: String(row.user_id),
    fullName: String(row.full_name),
    phone: String(row.phone),
    email: String(row.email),
    field: String(row.field),
    links: String(row.links || ''),
    proposedLecture: String(row.proposed_lecture),
    audience: String(row.audience || ''),
    valueToUser: String(row.value_to_user || ''),
    experience: String(row.experience || ''),
    sampleVideo: String(row.sample_video || ''),
    status: String(row.status) as ApplicationStatus,
    adminNote: String(row.admin_note || ''),
    createdAt: String(row.created_at || ''),
    updatedAt: String(row.updated_at || ''),
  };
}

export function getApplicationForUser(userId: string) {
  const row = getDb()
    .prepare(`SELECT * FROM lecturer_applications WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
    .get(userId) as SqlRow | undefined;
  return row ? rowToApp(row) : null;
}

export function listApplications() {
  return (getDb()
    .prepare(`SELECT * FROM lecturer_applications ORDER BY created_at DESC`)
    .all() as SqlRow[]).map(rowToApp);
}

export function submitApplication(userId: string, input: ApplicationInput) {
  const existing = getApplicationForUser(userId);
  if (existing && (existing.status === 'pending' || existing.status === 'approved')) {
    throw Object.assign(new Error('כבר יש בקשה פתוחה או שאושרתם כמרצים'), { status: 409 });
  }

  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const email = input.email.trim().toLowerCase();
  const field = input.field.trim();
  const proposedLecture = input.proposedLecture.trim();
  if (!fullName || !phone || !email.includes('@') || !field || !proposedLecture) {
    throw Object.assign(new Error('נא למלא שם, טלפון, אימייל, תחום והרצאה מוצעת'), { status: 400 });
  }

  const now = new Date().toISOString();
  if (existing && (existing.status === 'more_info' || existing.status === 'rejected')) {
    getDb()
      .prepare(
        `UPDATE lecturer_applications SET
          full_name = ?, phone = ?, email = ?, field = ?, links = ?, proposed_lecture = ?,
          audience = ?, value_to_user = ?, experience = ?, sample_video = ?,
          status = 'pending', admin_note = '', updated_at = ?
         WHERE id = ?`
      )
      .run(
        fullName,
        phone,
        email,
        field,
        input.links || '',
        proposedLecture,
        input.audience || '',
        input.valueToUser || '',
        input.experience || '',
        input.sampleVideo || '',
        now,
        existing.id
      );
    return getApplicationForUser(userId);
  }

  const id = `app-${randomUUID()}`;
  getDb()
    .prepare(
      `INSERT INTO lecturer_applications (
        id, user_id, full_name, phone, email, field, links, proposed_lecture,
        audience, value_to_user, experience, sample_video, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)`
    )
    .run(
      id,
      userId,
      fullName,
      phone,
      email,
      field,
      input.links || '',
      proposedLecture,
      input.audience || '',
      input.valueToUser || '',
      input.experience || '',
      input.sampleVideo || '',
      now,
      now
    );
  return getApplicationForUser(userId);
}

export function ensureLecturerForUser(userId: string, name: string, title = '') {
  const db = getDb();
  const existing = db.prepare(`SELECT * FROM lecturers WHERE user_id = ?`).get(userId) as SqlRow | undefined;
  if (existing) {
    const userFounder = db.prepare(`SELECT is_founder FROM users WHERE id = ?`).get(userId) as
      | { is_founder?: number }
      | undefined;
    if (userFounder && Number(userFounder.is_founder) === 1 && Number(existing.is_founder) !== 1) {
      db.prepare(`UPDATE lecturers SET is_founder = 1 WHERE id = ?`).run(String(existing.id));
    }
    return String(existing.id);
  }
  const userFounder = db.prepare(`SELECT is_founder FROM users WHERE id = ?`).get(userId) as
    | { is_founder?: number }
    | undefined;
  const isFounder = Number(userFounder?.is_founder) === 1 ? 1 : 0;
  const id = `inst-${userId}`;
  db.prepare(
    `INSERT INTO lecturers (id, name, title, avatar_url, bio, credentials, user_id, is_founder)
     VALUES (?, ?, ?, '', '', '[]', ?, ?)`
  ).run(id, name, title || 'מרצה', userId, isFounder);
  return id;
}

/** Keep lecturers.is_founder in sync with users.is_founder for team page visibility. */
export function syncLecturerFounderFlag(userId: string, isFounder: boolean, name: string) {
  const db = getDb();
  const existing = db.prepare(`SELECT id, founder_id FROM lecturers WHERE user_id = ?`).get(userId) as
    | { id: string; founder_id?: string | null }
    | undefined;
  if (existing) {
    if (isFounder) {
      const founderId = existing.founder_id || `founder-${existing.id.replace(/^inst-/, '').slice(0, 12)}`;
      db.prepare(`UPDATE lecturers SET is_founder = 1, founder_id = COALESCE(NULLIF(founder_id, ''), ?) WHERE id = ?`).run(
        founderId,
        existing.id
      );
    } else {
      db.prepare(`UPDATE lecturers SET is_founder = 0 WHERE id = ?`).run(existing.id);
    }
    return existing.id;
  }
  if (!isFounder) return null;
  const id = ensureLecturerForUser(userId, name);
  const founderId = `founder-${userId.replace(/^user-/, '').slice(0, 12)}`;
  db.prepare(`UPDATE lecturers SET is_founder = 1, founder_id = ? WHERE id = ?`).run(founderId, id);
  return id;
}

export function reviewApplication(
  applicationId: string,
  action: 'approved' | 'rejected' | 'more_info',
  adminNote = ''
) {
  const row = getDb()
    .prepare(`SELECT * FROM lecturer_applications WHERE id = ?`)
    .get(applicationId) as SqlRow | undefined;
  if (!row) throw Object.assign(new Error('הבקשה לא נמצאה'), { status: 404 });

  const now = new Date().toISOString();
  getDb()
    .prepare(`UPDATE lecturer_applications SET status = ?, admin_note = ?, updated_at = ? WHERE id = ?`)
    .run(action, adminNote, now, applicationId);

  if (action === 'approved') {
    const userId = String(row.user_id);
    getDb().prepare(`UPDATE users SET role = 'lecturer' WHERE id = ?`).run(userId);
    ensureLecturerForUser(userId, String(row.full_name), String(row.field || ''));
  }

  const updated = getDb()
    .prepare(`SELECT * FROM lecturer_applications WHERE id = ?`)
    .get(applicationId) as SqlRow;
  return rowToApp(updated);
}

export function resolveLecturerReferralId(raw: unknown) {
  const id = String(raw || '').trim();
  if (!/^[a-zA-Z0-9_-]{1,80}$/.test(id)) return '';
  const row = getDb().prepare(`SELECT id FROM lecturers WHERE id = ?`).get(id) as { id: string } | undefined;
  return row?.id || '';
}

export function getLecturerIdForUser(userId: string, role: string) {
  if (role === 'admin') return null;
  const row = getDb().prepare(`SELECT id FROM lecturers WHERE user_id = ?`).get(userId) as
    | { id: string }
    | undefined;
  return row?.id || null;
}

export function lecturerOverview(userId: string, role: string) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) {
    return {
      lecturerId: null,
      courses: 0,
      published: 0,
      pending: 0,
      drafts: 0,
      episodes: 0,
      views: 0,
      uniqueViewers: 0,
      completions: 0,
      completionRate: 0,
      saves: 0,
      avgWatchMinutes: 0,
      totalWatchHours: 0,
      paywallHits: 0,
      upgrades: 0,
      referredLeads: 0,
      referredUsers: 0,
      isFounder: false,
      viewsByDay: [] as Array<{ date: string; views: number }>,
      topContent: [] as Array<{ id: string; title: string; views: number; completions: number }>,
      recentStatuses: [] as Array<{ id: string; title: string; status: string; coverImage: string }>,
    };
  }
  const db = getDb();
  const count = (sql: string) => (db.prepare(sql).get(lecturerId) as { c: number }).c;
  const eventCount = (event: string) =>
    (
      db
        .prepare(
          `SELECT COUNT(*) as c FROM analytics_events
           WHERE event = ?
             AND json_extract(properties, '$.courseId') IN (SELECT id FROM courses WHERE lecturer_id = ?)`
        )
        .get(event, lecturerId) as { c: number }
    ).c;
  const views = eventCount('video_view_started');
  const completions = eventCount('video_completed');
  const uniqueViewers = Number(
    (
      db
        .prepare(
          `SELECT COUNT(DISTINCT user_id) as c FROM video_progress
           WHERE course_id IN (SELECT id FROM courses WHERE lecturer_id = ?)`
        )
        .get(lecturerId) as { c: number }
    ).c || 0
  );
  const watchSeconds = Number(
    (
      db
        .prepare(
          `SELECT COALESCE(SUM(current_time), 0) as s FROM video_progress
           WHERE course_id IN (SELECT id FROM courses WHERE lecturer_id = ?)`
        )
        .get(lecturerId) as { s: number }
    ).s || 0
  );
  const viewsByDay = (
    db
      .prepare(
        `SELECT substr(created_at, 1, 10) as day, COUNT(*) as c
         FROM analytics_events
         WHERE event = 'video_view_started'
           AND created_at >= datetime('now', '-13 days')
           AND json_extract(properties, '$.courseId') IN (SELECT id FROM courses WHERE lecturer_id = ?)
         GROUP BY day
         ORDER BY day ASC`
      )
      .all(lecturerId) as Array<{ day: string; c: number }>
  ).map((row) => ({ date: row.day, views: Number(row.c || 0) }));

  const topContent = (
    db
      .prepare(
        `SELECT c.id as id, c.title as title,
                (SELECT COUNT(*) FROM analytics_events e
                 WHERE e.event = 'video_view_started'
                   AND json_extract(e.properties, '$.courseId') = c.id) as views,
                (SELECT COUNT(*) FROM analytics_events e
                 WHERE e.event = 'video_completed'
                   AND json_extract(e.properties, '$.courseId') = c.id) as completions
         FROM courses c
         WHERE c.lecturer_id = ?
         ORDER BY views DESC
         LIMIT 5`
      )
      .all(lecturerId) as Array<{ id: string; title: string; views: number; completions: number }>
  ).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    views: Number(row.views || 0),
    completions: Number(row.completions || 0),
  }));

  const recentStatuses = (
    db
      .prepare(
        `SELECT id, title, status, cover_image
         FROM courses WHERE lecturer_id = ?
         ORDER BY updated_at DESC LIMIT 8`
      )
      .all(lecturerId) as Array<{ id: string; title: string; status: string; cover_image: string }>
  ).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: String(row.status || 'draft'),
    coverImage: publicMediaUrl(String(row.cover_image || '')),
  }));

  return {
    lecturerId,
    courses: count(`SELECT COUNT(*) as c FROM courses WHERE lecturer_id = ?`),
    published: count(`SELECT COUNT(*) as c FROM courses WHERE lecturer_id = ? AND status = 'published'`),
    pending: count(`SELECT COUNT(*) as c FROM courses WHERE lecturer_id = ? AND status = 'pending_review'`),
    drafts: count(`SELECT COUNT(*) as c FROM courses WHERE lecturer_id = ? AND status = 'draft'`),
    episodes: count(
      `SELECT COUNT(*) as c FROM episodes WHERE course_id IN (SELECT id FROM courses WHERE lecturer_id = ?)`
    ),
    views,
    uniqueViewers,
    completions,
    completionRate: views ? Math.round((completions / views) * 1000) / 10 : 0,
    saves: count(
      `SELECT COUNT(*) as c FROM user_list WHERE course_id IN (SELECT id FROM courses WHERE lecturer_id = ?)`
    ),
    avgWatchMinutes: Math.round(
      (
        (
          db
            .prepare(
              `SELECT AVG(current_time) as avg_t FROM video_progress
               WHERE duration > 0
                 AND course_id IN (SELECT id FROM courses WHERE lecturer_id = ?)`
            )
            .get(lecturerId) as { avg_t: number | null }
        ).avg_t || 0
      ) / 60
    ),
    totalWatchHours: Math.round((watchSeconds / 3600) * 10) / 10,
    paywallHits: eventCount('paywall_opened'),
    upgrades: eventCount('upgrade_clicked'),
    referredLeads: count(`SELECT COUNT(*) as c FROM track_leads WHERE referred_by_lecturer_id = ?`),
    referredUsers: count(`SELECT COUNT(*) as c FROM users WHERE referred_by_lecturer_id = ?`),
    isFounder: Boolean(
      (db.prepare(`SELECT is_founder FROM lecturers WHERE id = ?`).get(lecturerId) as { is_founder?: number } | undefined)
        ?.is_founder
    ),
    viewsByDay,
    topContent,
    recentStatuses,
  };
}

export function getMyLecturerProfile(userId: string, role: string) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) throw Object.assign(new Error('אין פרופיל מרצה'), { status: 403 });
  const row = getDb().prepare(`SELECT * FROM lecturers WHERE id = ?`).get(lecturerId) as SqlRow | undefined;
  if (!row) throw Object.assign(new Error('פרופיל לא נמצא'), { status: 404 });
  return {
    id: String(row.id),
    name: String(row.name || ''),
    title: String(row.title || ''),
    bio: String(row.bio || ''),
    avatarUrl: publicMediaUrl(String(row.avatar_url || '')),
    isFounder: Number(row.is_founder || 0) === 1,
    expertise: (() => {
      try {
        const parsed = JSON.parse(String(row.credentials || '[]'));
        return Array.isArray(parsed) ? parsed.map(String) : [];
      } catch {
        return [] as string[];
      }
    })(),
  };
}

export function updateMyLecturerProfile(
  userId: string,
  role: string,
  input: { name?: string; title?: string; bio?: string; avatarUrl?: string; expertise?: string[] }
) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) throw Object.assign(new Error('אין פרופיל מרצה'), { status: 403 });
  const existing = getMyLecturerProfile(userId, role);
  const name = String(input.name ?? existing.name).trim();
  if (!name) throw Object.assign(new Error('נא להזין שם'), { status: 400 });
  const expertise = Array.isArray(input.expertise) ? input.expertise.map(String).filter(Boolean) : existing.expertise;
  getDb()
    .prepare(
      `UPDATE lecturers
       SET name = ?, title = ?, bio = ?, avatar_url = ?, credentials = ?
       WHERE id = ?`
    )
    .run(
      name,
      String(input.title ?? existing.title).trim(),
      String(input.bio ?? existing.bio).trim(),
      String(input.avatarUrl ?? existing.avatarUrl).trim(),
      JSON.stringify(expertise),
      lecturerId
    );
  return getMyLecturerProfile(userId, role);
}

export function assertCanManageTeam(userId: string, role: string) {
  if (role === 'admin') return;
  const row = getDb()
    .prepare(`SELECT is_founder FROM lecturers WHERE user_id = ?`)
    .get(userId) as { is_founder?: number } | undefined;
  if (!row || Number(row.is_founder) !== 1) {
    throw Object.assign(new Error('רק צוות המיזם יכול להוסיף יזמים'), { status: 403 });
  }
}

export function addTeamMemberAsFounder(
  userId: string,
  role: string,
  input: { name: string; title: string; bio: string; avatarUrl: string }
) {
  assertCanManageTeam(userId, role);
  return createFounder(input);
}

export function listMyCourses(userId: string, role: string): Course[] {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) return [];
  const rows = getDb()
    .prepare(`SELECT id FROM courses WHERE lecturer_id = ? ORDER BY updated_at DESC`)
    .all(lecturerId) as Array<{ id: string }>;
  return rows.map((row) => getCourseById(row.id)).filter(Boolean) as Course[];
}

function assertOwnCourse(courseId: string, lecturerId: string) {
  const course = getCourseById(courseId);
  if (!course) throw Object.assign(new Error('ההרצאה לא נמצאה'), { status: 404 });
  if (course.instructorId !== lecturerId) {
    throw Object.assign(new Error('אפשר לערוך רק את התכנים שלכם'), { status: 403 });
  }
  return course;
}

export function createMyCourse(userId: string, role: string, input: CourseInput) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) throw Object.assign(new Error('אין פרופיל מרצה'), { status: 403 });
  return createCourse({
    ...input,
    instructorId: lecturerId,
    status: input.status === 'pending_review' ? 'pending_review' : 'draft',
    isNew: true,
  });
}

export function updateMyCourse(userId: string, role: string, courseId: string, input: CourseInput) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) throw Object.assign(new Error('אין פרופיל מרצה'), { status: 403 });
  const course = assertOwnCourse(courseId, lecturerId);
  if (course.status === 'published' || course.status === 'blocked') {
    throw Object.assign(new Error('הרצאה שפורסמה נערכת דרך האדמין'), { status: 400 });
  }
  return updateCourse(courseId, {
    ...input,
    instructorId: lecturerId,
    status: course.status || 'draft',
  });
}

export function submitMyCourse(userId: string, role: string, courseId: string) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) throw Object.assign(new Error('אין פרופיל מרצה'), { status: 403 });
  const course = assertOwnCourse(courseId, lecturerId);
  if (course.status === 'published') {
    throw Object.assign(new Error('ההרצאה כבר פורסמה'), { status: 400 });
  }
  return setCourseStatus(courseId, 'pending_review');
}
