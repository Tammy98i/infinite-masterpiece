import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { captionTracksForEpisode, defaultCaptionTracks } from '../../src/constants/captions.ts';
import type { AccessLevel, CaptionTrack, Category, Course, Episode, Instructor, PublishStatus } from '../../src/types.ts';

type SqlRow = Record<string, unknown>;

function parseJson<T>(value: unknown, fallback: T): T {
  try {
    return JSON.parse(String(value || '')) as T;
  } catch {
    return fallback;
  }
}

function episodeFromRow(row: SqlRow): Episode {
  const accessLevel = (String(row.access_level || 'premium') as AccessLevel) || 'premium';
  return {
    id: String(row.id),
    title: String(row.title),
    description: String(row.description || ''),
    duration: Number(row.duration || 0),
    videoUrl: String(row.video_url || ''),
    episodeNumber: Number(row.episode_number || 0),
    accessLevel,
    isFreeSample: accessLevel === 'free',
    captionTracks: parseJson<CaptionTrack[]>(row.caption_tracks, []),
  };
}

function courseFromRow(row: SqlRow, episodes: Episode[]): Course {
  return {
    id: String(row.id),
    title: String(row.title),
    subtitle: String(row.subtitle || ''),
    description: String(row.description || ''),
    categoryId: String(row.category_id || ''),
    instructorId: String(row.lecturer_id || ''),
    coverImage: String(row.cover_image || ''),
    backdropImage: String(row.backdrop_image || ''),
    trailerUrl: String(row.trailer_url || ''),
    episodes,
    tags: parseJson<string[]>(row.tags, []),
    level: (String(row.level || 'לכל הרמות') as Course['level']) || 'לכל הרמות',
    whatYouWillLearn: parseJson<string[]>(row.what_you_will_learn, []),
    targetAudience: String(row.target_audience || ''),
    isFeatured: Boolean(row.is_featured),
    isPopular: Boolean(row.is_popular),
    isNew: Boolean(row.is_new),
    isShort: Boolean(row.is_short),
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    createdAt: String(row.created_at || '').slice(0, 10),
    status: String(row.status || 'draft') as PublishStatus,
    accessLevel: String(row.access_level || 'premium') as AccessLevel,
    resources: String(row.resources || ''),
    programWeek: Number(row.program_week || 0),
    questionsEnabled: String(row.status || '') === 'published',
  };
}

function lecturerFromRow(row: SqlRow): Instructor {
  return {
    id: String(row.id),
    name: String(row.name),
    title: String(row.title || ''),
    avatarUrl: String(row.avatar_url || ''),
    bio: String(row.bio || ''),
    credentials: parseJson<string[]>(row.credentials, []),
    isFounder: Boolean(row.is_founder),
    founderId: row.founder_id ? String(row.founder_id) : undefined,
    sortOrder: Number(row.sort_order || 0),
    externalLinks: parseJson<Array<{ label: string; url: string }>>(row.external_links, []),
  };
}

function categoryFromRow(row: SqlRow): Category {
  return {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description || ''),
    icon: String(row.icon || ''),
    coverImage: String(row.cover_image || ''),
    sortOrder: Number(row.sort_order || 0),
    accessLevel: (String(row.access_level || 'premium') as AccessLevel) || 'premium',
    leadInstructorIds: parseJson<string[]>(row.lead_instructor_ids, []),
  };
}

function episodesFor(courseId: string) {
  return (getDb()
    .prepare(`SELECT * FROM episodes WHERE course_id = ? ORDER BY episode_number`)
    .all(courseId) as SqlRow[]).map(episodeFromRow);
}

function redactEpisode(ep: Episode): Episode {
  return { ...ep, videoUrl: '' };
}

function redactCourse(course: Course): Course {
  return {
    ...course,
    trailerUrl: '',
    episodes: course.episodes.map(redactEpisode),
    questionsEnabled: course.status === 'published',
  };
}

export function getPublicCatalog() {
  const db = getDb();
  const categories = (db.prepare(`SELECT * FROM categories ORDER BY sort_order, name`).all() as SqlRow[]).map(
    categoryFromRow
  );
  const instructors = (db
    .prepare(`SELECT * FROM lecturers ORDER BY is_founder DESC, sort_order, name`)
    .all() as SqlRow[]).map(lecturerFromRow);
  const rows = db
    .prepare(`SELECT * FROM courses WHERE status = 'published' ORDER BY created_at DESC`)
    .all() as SqlRow[];
  const courses = rows.map((row) => redactCourse(courseFromRow(row, episodesFor(String(row.id)))));
  return {
    categories,
    instructors,
    courses,
    weeklyPopularIds: getWeeklyPopularCourseIds(12),
  };
}

/** Course IDs ranked by playback starts in the last 7 days. */
export function getWeeklyPopularCourseIds(limit = 12): string[] {
  const db = getDb();
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  try {
    const rows = db
      .prepare(
        `SELECT COALESCE(
           json_extract(properties, '$.courseId'),
           json_extract(properties, '$.course_id'),
           json_extract(properties, '$.content_id')
         ) as course_id,
         COUNT(*) as c
         FROM analytics_events
         WHERE created_at >= ?
           AND event IN ('video_view_started', 'course_play_started', 'course_resume_started')
           AND COALESCE(
             json_extract(properties, '$.courseId'),
             json_extract(properties, '$.course_id'),
             json_extract(properties, '$.content_id')
           ) IS NOT NULL
         GROUP BY course_id
         ORDER BY c DESC
         LIMIT ?`
      )
      .all(since, limit) as Array<{ course_id: string; c: number }>;
    return rows.map((r) => String(r.course_id)).filter(Boolean);
  } catch {
    return [];
  }
}

export function getFounderCatalog(founderId: string) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM lecturers WHERE founder_id = ?`).get(founderId) as SqlRow | undefined;
  if (!row) return { instructor: null, courses: [] as Course[] };
  const instructor = lecturerFromRow(row);
  const rows = db
    .prepare(
      `SELECT * FROM courses WHERE lecturer_id = ? AND status = 'published' ORDER BY created_at DESC`
    )
    .all(instructor.id) as SqlRow[];
  return {
    instructor,
    courses: rows.map((courseRow) =>
      redactCourse(courseFromRow(courseRow, episodesFor(String(courseRow.id))))
    ),
  };
}

export function listAllCourses() {
  const rows = getDb().prepare(`SELECT * FROM courses ORDER BY updated_at DESC`).all() as SqlRow[];
  return rows.map((row) => courseFromRow(row, episodesFor(String(row.id))));
}

export function getCourseById(id: string) {
  const row = getDb().prepare(`SELECT * FROM courses WHERE id = ?`).get(id) as SqlRow | undefined;
  if (!row) return null;
  return courseFromRow(row, episodesFor(id));
}

export function getEpisodeById(episodeId: string) {
  const epRow = getDb().prepare(`SELECT * FROM episodes WHERE id = ?`).get(episodeId) as SqlRow | undefined;
  if (!epRow) return null;
  const courseId = String(epRow.course_id || '');
  const course = getCourseById(courseId);
  if (!course) return null;
  const episode = episodeFromRow(epRow);
  return { episode, course };
}

export interface CourseInput {
  title: string;
  subtitle?: string;
  description?: string;
  categoryId?: string;
  instructorId?: string;
  coverImage?: string;
  backdropImage?: string;
  trailerUrl?: string;
  tags?: string[];
  level?: Course['level'];
  whatYouWillLearn?: string[];
  targetAudience?: string;
  status?: PublishStatus;
  accessLevel?: AccessLevel;
  resources?: string;
  programWeek?: number;
  isFeatured?: boolean;
  isPopular?: boolean;
  isNew?: boolean;
  isShort?: boolean;
  episodes?: Array<{
    id?: string;
    title: string;
    description?: string;
    duration?: number;
    videoUrl?: string;
    accessLevel?: AccessLevel;
    captionTracks?: CaptionTrack[];
  }>;
}

function replaceEpisodes(courseId: string, episodes: CourseInput['episodes'], fallbackAccess: AccessLevel) {
  const db = getDb();
  db.prepare(`DELETE FROM episodes WHERE course_id = ?`).run(courseId);
  const insert = db.prepare(`
    INSERT INTO episodes (id, course_id, title, description, duration, video_url, caption_tracks, episode_number, access_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  (episodes || []).forEach((ep, idx) => {
    insert.run(
      ep.id || `ep-${randomUUID()}`,
      courseId,
      ep.title || `פרק ${idx + 1}`,
      ep.description || '',
      Number(ep.duration) || 0,
      ep.videoUrl || '',
      JSON.stringify(
        ep.captionTracks?.length
          ? ep.captionTracks
          : defaultCaptionTracks(ep.id || `ep-new-${idx}`)
      ),
      idx + 1,
      ep.accessLevel || fallbackAccess
    );
  });
}

export function createCourse(input: CourseInput) {
  const id = `course-${randomUUID()}`;
  const status = input.status || 'draft';
  const access = input.accessLevel || 'premium';
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `INSERT INTO courses (
        id, title, subtitle, description, category_id, lecturer_id,
        cover_image, backdrop_image, trailer_url, tags, level,
        what_you_will_learn, target_audience, status, access_level, resources,
        is_featured, is_popular, is_new, is_short, program_week, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      input.title.trim(),
      input.subtitle || '',
      input.description || '',
      input.categoryId || null,
      input.instructorId || null,
      input.coverImage || '',
      input.backdropImage || input.coverImage || '',
      input.trailerUrl || '',
      JSON.stringify(input.tags || []),
      input.level || 'לכל הרמות',
      JSON.stringify(input.whatYouWillLearn || []),
      input.targetAudience || '',
      status,
      access,
      input.resources || '',
      input.isFeatured ? 1 : 0,
      input.isPopular ? 1 : 0,
      input.isNew === false ? 0 : 1,
      input.isShort ? 1 : 0,
      Number(input.programWeek || 0),
      now,
      now
    );
  replaceEpisodes(id, input.episodes, access);
  return getCourseById(id);
}

export function updateCourse(id: string, input: CourseInput) {
  const existing = getCourseById(id);
  if (!existing) throw Object.assign(new Error('הקורס לא נמצא'), { status: 404 });
  const access = input.accessLevel || existing.accessLevel || 'premium';
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE courses SET
        title = ?, subtitle = ?, description = ?, category_id = ?, lecturer_id = ?,
        cover_image = ?, backdrop_image = ?, trailer_url = ?, tags = ?, level = ?,
        what_you_will_learn = ?, target_audience = ?, status = ?, access_level = ?, resources = ?,
        is_featured = ?, is_popular = ?, is_new = ?, is_short = ?, program_week = ?, updated_at = ?
       WHERE id = ?`
    )
    .run(
      input.title.trim(),
      input.subtitle || '',
      input.description || '',
      input.categoryId || null,
      input.instructorId || null,
      input.coverImage || '',
      input.backdropImage || input.coverImage || '',
      input.trailerUrl || '',
      JSON.stringify(input.tags || []),
      input.level || existing.level,
      JSON.stringify(input.whatYouWillLearn || existing.whatYouWillLearn),
      input.targetAudience || '',
      input.status || existing.status || 'draft',
      access,
      input.resources ?? existing.resources ?? '',
      input.isFeatured ? 1 : 0,
      input.isPopular ? 1 : 0,
      input.isNew ? 1 : 0,
      input.isShort ? 1 : 0,
      Number(input.programWeek ?? existing.programWeek ?? 0),
      now,
      id
    );
  if (input.episodes) replaceEpisodes(id, input.episodes, access);
  return getCourseById(id);
}

export function setCourseStatus(id: string, status: PublishStatus) {
  if (!['draft', 'pending_review', 'published', 'blocked'].includes(status)) {
    throw Object.assign(new Error('סטטוס לא תקין'), { status: 400 });
  }
  const existing = getCourseById(id);
  if (!existing) throw Object.assign(new Error('הקורס לא נמצא'), { status: 404 });
  getDb()
    .prepare(`UPDATE courses SET status = ?, updated_at = ? WHERE id = ?`)
    .run(status, new Date().toISOString(), id);
  return getCourseById(id);
}

export function getOverview() {
  const db = getDb();
  const count = (sql: string) => (db.prepare(sql).get() as { c: number }).c;
  const eventSince = (event: string, since: string) =>
    (
      db
        .prepare(`SELECT COUNT(*) as c FROM analytics_events WHERE event = ? AND created_at >= ?`)
        .get(event, since) as { c: number }
    ).c;
  const eventCount = (event: string) =>
    (db.prepare(`SELECT COUNT(*) as c FROM analytics_events WHERE event = ?`).get(event) as { c: number }).c;
  const users = count(`SELECT COUNT(*) as c FROM users`);
  const paying = count(
    `SELECT COUNT(*) as c FROM users WHERE subscription_plan IN ('monthly', 'annual', 'premium_88')`
  );
  const started = eventCount('video_view_started');
  const completed = eventCount('video_completed');
  const watchSeconds =
    (db.prepare(`SELECT COALESCE(SUM(current_time), 0) as s FROM video_progress`).get() as { s: number }).s || 0;
  const now = Date.now();
  return {
    users,
    free: count(`SELECT COUNT(*) as c FROM users WHERE subscription_plan = 'none'`),
    trial: count(`SELECT COUNT(*) as c FROM users WHERE subscription_plan = 'free_trial'`),
    paying,
    braveUsers: count(`SELECT COUNT(*) as c FROM users WHERE entry_track = 'brave'`),
    hesitantUsers: count(`SELECT COUNT(*) as c FROM users WHERE entry_track = 'hesitant'`),
    failedPayments: count(`SELECT COUNT(*) as c FROM payment_installments WHERE status = 'failed'`),
    dueInstallments: count(
      `SELECT COUNT(*) as c FROM payment_installments WHERE status IN ('due', 'scheduled') AND due_at IS NOT NULL AND due_at <= datetime('now')`
    ),
    premium88: count(`SELECT COUNT(*) as c FROM users WHERE subscription_plan = 'premium_88'`),
    lecturers: count(`SELECT COUNT(*) as c FROM users WHERE role = 'lecturer'`),
    courses: count(`SELECT COUNT(*) as c FROM courses`),
    published: count(`SELECT COUNT(*) as c FROM courses WHERE status = 'published'`),
    drafts: count(`SELECT COUNT(*) as c FROM courses WHERE status = 'draft'`),
    pending: count(`SELECT COUNT(*) as c FROM courses WHERE status = 'pending_review'`),
    episodes: count(`SELECT COUNT(*) as c FROM episodes`),
    applicationsPending: count(
      `SELECT COUNT(*) as c FROM lecturer_applications WHERE status = 'pending'`
    ),
    paywallHits: eventCount('paywall_opened'),
    upgrades: eventCount('upgrade_clicked'),
    conversionRate: users ? Math.round((paying / users) * 100) : 0,
    completionRate: started ? Math.round((completed / started) * 100) : 0,
    watchTimeHours: Math.round((watchSeconds / 3600) * 10) / 10,
    viewsDay: eventSince('video_view_started', new Date(now - 86400000).toISOString()),
    viewsWeek: eventSince('video_view_started', new Date(now - 7 * 86400000).toISOString()),
    viewsMonth: eventSince('video_view_started', new Date(now - 30 * 86400000).toISOString()),
    popularContent: topNamed(
      db,
      `SELECT c.id as id, c.title as name, COUNT(*) as views
       FROM analytics_events e
       JOIN courses c ON c.id = json_extract(e.properties, '$.courseId')
       WHERE e.event = 'video_view_started'
       GROUP BY c.id ORDER BY views DESC LIMIT 1`
    ),
    strongestCategory: topNamed(
      db,
      `SELECT cat.id as id, cat.name as name, COUNT(*) as views
       FROM analytics_events e
       JOIN courses c ON c.id = json_extract(e.properties, '$.courseId')
       JOIN categories cat ON cat.id = c.category_id
       WHERE e.event = 'video_view_started'
       GROUP BY cat.id ORDER BY views DESC LIMIT 1`
    ),
    leadingLecturer: topNamed(
      db,
      `SELECT l.id as id, l.name as name, COUNT(*) as views
       FROM analytics_events e
       JOIN courses c ON c.id = json_extract(e.properties, '$.courseId')
       JOIN lecturers l ON l.id = c.lecturer_id
       WHERE e.event = 'video_view_started'
       GROUP BY l.id ORDER BY views DESC LIMIT 1`
    ),
    convertingContent: topNamed(
      db,
      `SELECT c.id as id, c.title as name, COUNT(*) as views
       FROM analytics_events e
       JOIN courses c ON c.id = json_extract(e.properties, '$.courseId')
       WHERE e.event = 'paywall_opened'
       GROUP BY c.id ORDER BY views DESC LIMIT 1`
    ),
  };
}

function topNamed(db: ReturnType<typeof getDb>, sql: string) {
  try {
    const row = db.prepare(sql).get() as { id?: string; name?: string; views?: number } | undefined;
    if (!row?.id) return null;
    return { id: String(row.id), name: String(row.name || ''), views: Number(row.views || 0) };
  } catch {
    return null;
  }
}

export function listUsers() {
  const rows = getDb()
    .prepare(
      `SELECT id, email, full_name, role, subscription_plan, trial_ends_at, blocked, is_founder, created_at, last_login_at,
              entry_track, current_payment_phase, raffle_tickets_count, payment_plan_status, staff_desk, staff_status
       FROM users ORDER BY created_at DESC`
    )
    .all() as SqlRow[];
  return rows.map((row) => ({
    id: String(row.id),
    email: String(row.email),
    name: String(row.full_name),
    role: row.role === 'admin' ? 'admin' : row.role === 'lecturer' ? 'instructor' : 'student',
    subscriptionPlan: String(row.subscription_plan || 'none'),
    trialEndsAt: row.trial_ends_at ? String(row.trial_ends_at) : undefined,
    blocked: Boolean(row.blocked),
    isFounder: Boolean(row.is_founder),
    createdAt: String(row.created_at || ''),
    lastLoginAt: row.last_login_at ? String(row.last_login_at) : undefined,
    entryTrack: String(row.entry_track || 'none'),
    currentPaymentPhase: Number(row.current_payment_phase || 0),
    raffleTicketsCount: Number(row.raffle_tickets_count || 0),
    paymentPlanStatus: String(row.payment_plan_status || 'none'),
    staffDesk: String(row.staff_desk || '') as
      | ''
      | 'content'
      | 'support'
      | 'sales'
      | 'legal'
      | 'finance'
      | 'community',
    staffStatus: String(row.staff_status || 'active') as 'active' | 'suspended' | 'limited',
  }));
}

function toDbRole(role: string) {
  if (role === 'admin') return 'admin';
  if (role === 'instructor' || role === 'lecturer') return 'lecturer';
  return 'user';
}

export function updateUser(
  id: string,
  patch: {
    role?: string;
    subscriptionPlan?: string;
    blocked?: boolean;
    isFounder?: boolean;
    trialEndsAt?: string | null;
    entryTrack?: string;
    currentPaymentPhase?: number;
    staffDesk?: string;
    staffStatus?: string;
  }
) {
  const row = getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(id) as SqlRow | undefined;
  if (!row) throw Object.assign(new Error('המשתמש לא נמצא'), { status: 404 });

  const role = patch.role ? toDbRole(patch.role) : String(row.role);
  const plan = patch.subscriptionPlan ?? String(row.subscription_plan);
  const allowed = ['none', 'free_trial', 'monthly', 'annual', 'premium_88'];
  if (!allowed.includes(plan)) {
    throw Object.assign(new Error('תוכנית לא תקינה'), { status: 400 });
  }
  const blocked = patch.blocked === undefined ? Number(row.blocked || 0) : patch.blocked ? 1 : 0;
  const founder = patch.isFounder === undefined ? Number(row.is_founder || 0) : patch.isFounder ? 1 : 0;
  const trial =
    patch.trialEndsAt === undefined
      ? (row.trial_ends_at as string | null)
      : patch.trialEndsAt;
  const entryTrack = patch.entryTrack ?? String(row.entry_track || 'none');
  if (!['none', 'brave', 'hesitant'].includes(entryTrack)) {
    throw Object.assign(new Error('מסלול כניסה לא תקין'), { status: 400 });
  }
  const phase =
    patch.currentPaymentPhase === undefined
      ? Number(row.current_payment_phase || 0)
      : Number(patch.currentPaymentPhase);
  const tickets = entryTrack === 'brave' ? 2 : entryTrack === 'hesitant' ? 1 : 0;
  const paymentStatus =
    entryTrack === 'none' ? 'none' : entryTrack === 'brave' && phase >= 1 ? 'brave_paid' : phase >= 4 ? 'hesitant_completed' : 'active';

  const deskRaw = patch.staffDesk === undefined ? String(row.staff_desk || '') : String(patch.staffDesk || '');
  const staffDesk = ['content', 'support', 'sales', 'legal', 'finance', 'community'].includes(deskRaw)
    ? deskRaw
    : '';
  const statusRaw =
    patch.staffStatus === undefined ? String(row.staff_status || 'active') : String(patch.staffStatus || 'active');
  const staffStatus = ['active', 'suspended', 'limited'].includes(statusRaw) ? statusRaw : 'active';

  getDb()
    .prepare(
      `UPDATE users SET role = ?, subscription_plan = ?, blocked = ?, is_founder = ?, trial_ends_at = ?,
        entry_track = ?, current_payment_phase = ?, raffle_tickets_count = ?, payment_plan_status = ?,
        staff_desk = ?, staff_status = ? WHERE id = ?`
    )
    .run(role, plan, blocked, founder, trial, entryTrack, phase, tickets, paymentStatus, staffDesk, staffStatus, id);

  if (blocked === 1 || staffStatus === 'suspended') {
    getDb().prepare(`DELETE FROM sessions WHERE user_id = ?`).run(id);
  }

  return listUsers().find((u) => u.id === id);
}

export function deleteUser(id: string, actorId: string) {
  const db = getDb();
  const row = db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as SqlRow | undefined;
  if (!row) throw Object.assign(new Error('המשתמש לא נמצא'), { status: 404 });
  if (id === actorId) {
    throw Object.assign(new Error('לא ניתן להסיר את החשבון שבו אתם מחוברים'), { status: 400 });
  }
  if (String(row.role) === 'admin') {
    const remaining = (
      db.prepare(`SELECT COUNT(*) as c FROM users WHERE role = 'admin'`).get() as { c: number }
    ).c;
    if (remaining <= 1) {
      throw Object.assign(new Error('לא ניתן להסיר את האדמין האחרון במערכת'), { status: 400 });
    }
  }

  const snapshot = listUsers().find((u) => u.id === id);

  db.exec('BEGIN');
  try {
    db.prepare(`UPDATE lecturers SET user_id = NULL WHERE user_id = ?`).run(id);
    db.prepare(`UPDATE payment_plans SET user_id = NULL WHERE user_id = ?`).run(id);
    db.prepare(`UPDATE raffle_tickets SET user_id = NULL WHERE user_id = ?`).run(id);
    db.prepare(`UPDATE raffles SET winner_user_id = NULL WHERE winner_user_id = ?`).run(id);
    db.prepare(`UPDATE analytics_events SET user_id = NULL WHERE user_id = ?`).run(id);

    db.prepare(`DELETE FROM sessions WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM video_progress WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM user_list WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM user_onboarding_progress WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM user_onboarding_steps WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM user_bonus_unlocks WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM lecturer_applications WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM content_questions WHERE user_id = ?`).run(id);
    db.prepare(`DELETE FROM team_messages WHERE lecturer_user_id = ?`).run(id);
    db.prepare(`DELETE FROM users WHERE id = ?`).run(id);
    db.exec('COMMIT');
  } catch (err) {
    try {
      db.exec('ROLLBACK');
    } catch {
      /* already rolled back */
    }
    throw err;
  }

  return snapshot;
}

export function setCourseProgramWeek(id: string, week: number) {
  const programWeek = Number(week);
  if (!Number.isInteger(programWeek) || programWeek < 0 || programWeek > 4) {
    throw Object.assign(new Error('שבוע במסע לא תקין'), { status: 400 });
  }
  const existing = getCourseById(id);
  if (!existing) throw Object.assign(new Error('ההרצאה לא נמצאה'), { status: 404 });
  getDb()
    .prepare(`UPDATE courses SET program_week = ?, updated_at = ? WHERE id = ?`)
    .run(programWeek, new Date().toISOString(), id);
  return getCourseById(id);
}

export function listCourseWeekRows() {
  return (
    getDb()
      .prepare(`SELECT id, title, status, program_week FROM courses ORDER BY title`)
      .all() as Array<{ id: string; title: string; status: string; program_week: number }>
  ).map((row) => ({
    id: String(row.id),
    title: String(row.title),
    status: String(row.status || 'draft') as PublishStatus,
    programWeek: Number(row.program_week || 0),
  }));
}

function isStockPhoto(url: string) {
  const value = url.toLowerCase();
  return !value || value.includes('unsplash.com') || value.includes('placeholder');
}

export function createFounder(input: { name: string; title: string; bio: string; avatarUrl: string }) {
  const name = String(input.name || '').trim();
  const title = String(input.title || '').trim() || 'יזם';
  const bio = String(input.bio || '').trim() || title;
  const avatarUrl = String(input.avatarUrl || '').trim();
  if (!name || !avatarUrl) {
    throw Object.assign(new Error('נא למלא שם ולהעלות תמונה'), { status: 400 });
  }
  if (isStockPhoto(avatarUrl)) {
    throw Object.assign(new Error('נא להעלות תמונה אמיתית, לא תמונת מאגר'), { status: 400 });
  }

  const maxSort = getDb().prepare(`SELECT MAX(sort_order) as m FROM lecturers WHERE is_founder = 1`).get() as {
    m: number | null;
  };
  const id = `inst-${randomUUID()}`;
  const founderId = `founder-${randomUUID().slice(0, 8)}`;
  getDb()
    .prepare(
      `INSERT INTO lecturers (
        id, name, title, avatar_url, bio, credentials, is_founder, founder_id, sort_order, external_links
      ) VALUES (?, ?, ?, ?, ?, '[]', 1, ?, ?, '[]')`
    )
    .run(id, name, title, avatarUrl, bio, founderId, Number(maxSort?.m || 0) + 1);
  return listFounders().find((item) => item.id === id);
}

export function founderReadiness(founder: Instructor) {
  const links = founder.externalLinks || [];
  return {
    id: founder.id,
    name: founder.name,
    hasRealPhoto: !isStockPhoto(founder.avatarUrl || ''),
    hasWebsite: links.some((item) => item.label === 'אתר' && item.url),
    hasInstagram: links.some((item) => item.label === 'אינסטגרם' && item.url),
  };
}

export function listFounders() {
  return (
    getDb()
      .prepare(`SELECT * FROM lecturers WHERE is_founder = 1 ORDER BY sort_order, name`)
      .all() as SqlRow[]
  ).map(lecturerFromRow);
}

export function reorderFounders(ids: string[]) {
  const db = getDb();
  const stmt = db.prepare(`UPDATE lecturers SET sort_order = ? WHERE id = ? AND is_founder = 1`);
  ids.forEach((id, index) => stmt.run(index, id));
  return listFounders();
}

export function updateFounder(
  id: string,
  patch: { avatarUrl?: string; externalLinks?: Array<{ label: string; url: string }> }
) {
  const row = getDb().prepare(`SELECT id FROM lecturers WHERE id = ? AND is_founder = 1`).get(id);
  if (!row) throw Object.assign(new Error('המייסד לא נמצא'), { status: 404 });
  if (patch.avatarUrl !== undefined) {
    getDb().prepare(`UPDATE lecturers SET avatar_url = ? WHERE id = ?`).run(String(patch.avatarUrl || ''), id);
  }
  if (patch.externalLinks !== undefined) {
    const links = patch.externalLinks
      .map((item) => {
        const label = String(item.label || '').trim();
        const raw = String(item.url || '').trim();
        const url = /^https?:\/\//i.test(raw) ? raw : raw ? `https://${raw}` : '';
        return { label, url };
      })
      .filter((item) => item.label && item.url);
    getDb().prepare(`UPDATE lecturers SET external_links = ? WHERE id = ?`).run(JSON.stringify(links), id);
  }
  return listFounders().find((item) => item.id === id);
}

export function listCategoriesAdmin() {
  return (getDb().prepare(`SELECT * FROM categories ORDER BY sort_order, name`).all() as SqlRow[]).map(
    categoryFromRow
  );
}

function slugifyCategory(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `cat-${base || randomUUID().slice(0, 8)}`;
}

export function createCategory(input: {
  name: string;
  description?: string;
  icon?: string;
  coverImage?: string;
  accessLevel?: AccessLevel;
  sortOrder?: number;
  leadInstructorIds?: string[];
}) {
  const name = String(input.name || '').trim();
  if (!name) throw Object.assign(new Error('נא להזין שם קטגוריה'), { status: 400 });
  let id = slugifyCategory(name);
  const exists = getDb().prepare(`SELECT id FROM categories WHERE id = ?`).get(id);
  if (exists) id = `${id}-${randomUUID().slice(0, 6)}`;

  const maxSort = getDb().prepare(`SELECT MAX(sort_order) as m FROM categories`).get() as { m: number | null };
  const sortOrder = input.sortOrder ?? Number(maxSort?.m || 0) + 1;
  const access = (input.accessLevel || 'premium') as AccessLevel;

  getDb()
    .prepare(
      `INSERT INTO categories (id, name, description, icon, sort_order, cover_image, access_level, lead_instructor_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      id,
      name,
      String(input.description || '').trim(),
      String(input.icon || '').trim(),
      sortOrder,
      String(input.coverImage || '').trim(),
      access,
      JSON.stringify(input.leadInstructorIds || [])
    );

  return listCategoriesAdmin().find((item) => item.id === id)!;
}

export function updateCategory(
  id: string,
  patch: {
    name?: string;
    description?: string;
    icon?: string;
    coverImage?: string;
    accessLevel?: AccessLevel;
    sortOrder?: number;
    leadInstructorIds?: string[];
  }
) {
  const row = getDb().prepare(`SELECT * FROM categories WHERE id = ?`).get(id) as SqlRow | undefined;
  if (!row) throw Object.assign(new Error('קטגוריה לא נמצאה'), { status: 404 });

  const name = patch.name !== undefined ? String(patch.name).trim() : String(row.name);
  if (!name) throw Object.assign(new Error('נא להזין שם קטגוריה'), { status: 400 });

  getDb()
    .prepare(
      `UPDATE categories
       SET name = ?, description = ?, icon = ?, cover_image = ?, access_level = ?, sort_order = ?, lead_instructor_ids = ?
       WHERE id = ?`
    )
    .run(
      name,
      patch.description !== undefined ? String(patch.description).trim() : String(row.description || ''),
      patch.icon !== undefined ? String(patch.icon).trim() : String(row.icon || ''),
      patch.coverImage !== undefined ? String(patch.coverImage).trim() : String(row.cover_image || ''),
      patch.accessLevel || String(row.access_level || 'premium'),
      patch.sortOrder !== undefined ? Number(patch.sortOrder) : Number(row.sort_order || 0),
      JSON.stringify(
        patch.leadInstructorIds !== undefined
          ? patch.leadInstructorIds
          : parseJson<string[]>(row.lead_instructor_ids, [])
      ),
      id
    );

  return listCategoriesAdmin().find((item) => item.id === id)!;
}

export function reorderCategories(ids: string[]) {
  const stmt = getDb().prepare(`UPDATE categories SET sort_order = ? WHERE id = ?`);
  ids.forEach((id, index) => stmt.run(index + 1, id));
  return listCategoriesAdmin();
}
