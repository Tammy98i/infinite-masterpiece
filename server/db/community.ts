import { randomUUID } from 'node:crypto';
import type { DatabaseSync } from 'node:sqlite';
import type { AuthUser } from '../services/authService.js';
import { isProduction } from '../config/env.js';

export type CommunityChannelId = 'board' | 'talk' | 'library' | 'premium88' | 'lecturers';

type ChannelDef = {
  id: CommunityChannelId;
  label: string;
};

const CHANNELS: ChannelDef[] = [
  { id: 'board', label: 'לוח' },
  { id: 'talk', label: 'שיחה' },
  { id: 'library', label: 'ספרייה' },
  { id: 'premium88', label: 'נבחרת 88' },
  { id: 'lecturers', label: 'מרצים' },
];

const SEED_KEY = 'community_demo_seeded';

type HttpError = Error & { status?: number };

function fail(message: string, status = 400): never {
  throw Object.assign(new Error(message), { status });
}

function isChannel(value: string): value is CommunityChannelId {
  return CHANNELS.some((channel) => channel.id === value);
}

const MEMBER_PLANS = new Set(['free_trial', 'monthly', 'annual', 'premium_88']);

export function canEnterCommunity(
  user: Pick<AuthUser, 'role' | 'subscriptionPlan' | 'isFounder' | 'blocked'> | null
) {
  if (!user || user.blocked) return false;
  if (user.role === 'admin' || user.role === 'instructor' || user.isFounder) return true;
  return MEMBER_PLANS.has(user.subscriptionPlan);
}

export function canSeeChannel(
  user: Pick<AuthUser, 'role' | 'subscriptionPlan' | 'isFounder' | 'blocked'>,
  channel: CommunityChannelId
) {
  if (!canEnterCommunity(user)) return false;
  if (channel === 'premium88') {
    return user.role === 'admin' || Boolean(user.isFounder) || user.subscriptionPlan === 'premium_88';
  }
  if (channel === 'lecturers') return user.role === 'admin' || user.role === 'instructor';
  return true;
}

export function canPostInChannel(
  user: Pick<AuthUser, 'role' | 'subscriptionPlan' | 'isFounder' | 'blocked' | 'staffDesk'>,
  channel: CommunityChannelId
) {
  if (!canSeeChannel(user, channel)) return false;
  if (channel === 'board') return user.role === 'admin' || user.staffDesk === 'community';
  return true;
}

function badgeFor(role: string, plan: string, founder: boolean) {
  if (role === 'admin') return 'אדמין';
  if (role === 'instructor' || role === 'lecturer') return 'מרצה';
  if (founder || plan === 'premium_88') return 'נבחרת 88';
  return 'חבר ספרייה';
}

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] || 'חבר';
}

function initial(name: string) {
  return firstName(name).charAt(0) || 'ח';
}

function cleanBody(value: unknown) {
  const body = String(value ?? '').trim();
  if (body.length < 2) fail('כתבו כמה מילים');
  if (body.length > 2000) fail('הטקסט ארוך מדי');
  return body;
}

function cleanLecture(value: unknown) {
  const title = String(value ?? '').trim();
  if (title.length > 120) fail('שם ההרצאה ארוך מדי');
  return title;
}

function cleanImage(value: unknown) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (!url.startsWith('/uploads/') || url.includes('..') || url.length > 300) fail('התמונה לא תקינה');
  return url;
}

export function initializeCommunitySchema(db: DatabaseSync) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS community_posts (
      id TEXT PRIMARY KEY,
      channel TEXT NOT NULL,
      author_id TEXT NOT NULL,
      body TEXT NOT NULL,
      lecture_title TEXT NOT NULL DEFAULT '',
      image_url TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'visible' CHECK(status IN ('visible', 'hidden')),
      pinned INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_community_posts_feed
      ON community_posts(channel, status, pinned, created_at);

    CREATE TABLE IF NOT EXISTS community_replies (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      author_id TEXT NOT NULL,
      body TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'visible' CHECK(status IN ('visible', 'hidden')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_community_replies_post ON community_replies(post_id, created_at);

    CREATE TABLE IF NOT EXISTS community_reactions (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS community_bookmarks (
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS community_reports (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_community_reports_once
      ON community_reports(post_id, user_id);

    CREATE TABLE IF NOT EXISTS community_mutes (
      user_id TEXT PRIMARY KEY,
      muted_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  const reportColumns = new Set(
    (db.prepare(`PRAGMA table_info(community_reports)`).all() as Array<{ name: string }>).map((column) => column.name)
  );
  if (!reportColumns.has('status')) {
    db.exec(`ALTER TABLE community_reports ADD COLUMN status TEXT NOT NULL DEFAULT 'open'`);
  }
}

type AuthorRow = {
  id: string;
  full_name: string;
  role: string;
  subscription_plan: string;
  is_founder: number;
  avatar: string;
};

function authorFrom(row: AuthorRow) {
  return {
    firstName: firstName(row.full_name),
    initial: initial(row.full_name),
    badge: badgeFor(row.role, row.subscription_plan, Boolean(row.is_founder)),
    avatar: row.avatar || '',
  };
}

const PAGE_SIZE = 12;

function isMuted(db: DatabaseSync, userId: string) {
  return Boolean(db.prepare(`SELECT user_id FROM community_mutes WHERE user_id = ?`).get(userId));
}

function withinEditWindow(createdAt: string) {
  const then = Date.parse(`${createdAt.replace(' ', 'T')}Z`);
  return Number.isFinite(then) && Date.now() - then <= 15 * 60 * 1000;
}

export function getCommunityHome(db: DatabaseSync, user: AuthUser | null, requested?: string, cursor?: string) {
  if (!user || !canEnterCommunity(user)) {
    return { access: 'locked' as const, channel: 'talk', channels: [], posts: [], people: [], nextCursor: null };
  }

  const muted = isMuted(db, user.id);
  const channels = CHANNELS.filter((channel) => canSeeChannel(user, channel.id)).map((channel) => ({
    id: channel.id,
    label: channel.label,
    canPost: !muted && canPostInChannel(user, channel.id),
  }));
  const channel: CommunityChannelId =
    requested && isChannel(requested) && canSeeChannel(user, requested) ? requested : 'talk';

  const params: Array<string | number> = [channel, user.id, user.role === 'admin' ? 1 : 0];
  let older = '';
  if (cursor) {
    const [createdAt, id] = cursor.split('|');
    if (createdAt && id) {
      older = ` AND p.pinned = 0 AND (p.created_at < ? OR (p.created_at = ? AND p.id < ?))`;
      params.push(createdAt, createdAt, id);
    }
  }
  const rows = db
    .prepare(
      `SELECT p.id, p.channel, p.body, p.lecture_title, p.image_url, p.status, p.pinned, p.created_at,
              u.id as author_id, u.full_name, u.role, u.subscription_plan, u.is_founder, u.avatar
       FROM community_posts p
       JOIN users u ON u.id = p.author_id
       WHERE p.channel = ?
         AND (p.status = 'visible' OR p.author_id = ? OR ? = 1)
         ${older}
       ORDER BY p.pinned DESC, p.created_at DESC, p.id DESC
       LIMIT ?`
    )
    .all(...params, PAGE_SIZE + 1) as Array<
    AuthorRow & {
      author_id: string;
      body: string;
      lecture_title: string;
      image_url: string;
      status: string;
      pinned: number;
      created_at: string;
      channel: string;
    }
  >;
  const hasMore = rows.length > PAGE_SIZE;
  const page = hasMore ? rows.slice(0, PAGE_SIZE) : rows;
  const last = page[page.length - 1];
  const nextCursor = hasMore && last ? `${last.created_at}|${last.id}` : null;

  const ids = page.map((row) => row.id);
  const hearts = new Map<string, number>();
  const mineHearts = new Set<string>();
  const saved = new Set<string>();
  const reported = new Set<string>();
  const replies = new Map<string, Array<Record<string, unknown>>>();

  if (ids.length) {
    const marks = ids.map(() => '?').join(',');
    for (const row of db.prepare(`SELECT post_id, COUNT(*) as c FROM community_reactions WHERE post_id IN (${marks}) GROUP BY post_id`).all(...ids) as Array<{ post_id: string; c: number }>) {
      hearts.set(row.post_id, row.c);
    }
    for (const row of db.prepare(`SELECT post_id FROM community_reactions WHERE user_id = ? AND post_id IN (${marks})`).all(user.id, ...ids) as Array<{ post_id: string }>) {
      mineHearts.add(row.post_id);
    }
    for (const row of db.prepare(`SELECT post_id FROM community_bookmarks WHERE user_id = ? AND post_id IN (${marks})`).all(user.id, ...ids) as Array<{ post_id: string }>) {
      saved.add(row.post_id);
    }
    for (const row of db.prepare(`SELECT post_id FROM community_reports WHERE user_id = ? AND post_id IN (${marks})`).all(user.id, ...ids) as Array<{ post_id: string }>) {
      reported.add(row.post_id);
    }
    const replyRows = db
      .prepare(
        `SELECT r.id, r.post_id, r.body, r.created_at, u.full_name, u.role, u.subscription_plan, u.is_founder, u.avatar
         FROM community_replies r
         JOIN users u ON u.id = r.author_id
         WHERE r.status = 'visible' AND r.post_id IN (${marks})
         ORDER BY r.created_at ASC`
      )
      .all(...ids) as Array<AuthorRow & { post_id: string; body: string; created_at: string }>;
    for (const reply of replyRows) {
      const list = replies.get(reply.post_id) || [];
      list.push({
        id: reply.id,
        body: reply.body,
        createdAt: reply.created_at,
        author: authorFrom(reply),
      });
      replies.set(reply.post_id, list);
    }
  }

  const visible = channels.map((item) => item.id);
  const people = visible.length
    ? (db
        .prepare(
          `SELECT u.full_name, u.role, u.subscription_plan, u.is_founder
           FROM community_posts p
           JOIN users u ON u.id = p.author_id
           WHERE p.status = 'visible' AND p.channel IN (${visible.map(() => '?').join(',')})
           GROUP BY u.id
           ORDER BY MAX(p.created_at) DESC
           LIMIT 6`
        )
        .all(...visible) as Array<{ full_name: string; role: string; subscription_plan: string; is_founder: number }>)
    : [];

  return {
    access: 'open' as const,
    channel,
    channels,
    nextCursor,
    posts: page.map((row) => ({
      id: row.id,
      channel: row.channel,
      body: row.body,
      lectureTitle: row.lecture_title,
      imageUrl: row.image_url,
      pinned: Boolean(row.pinned),
      hidden: row.status === 'hidden',
      createdAt: row.created_at,
      canEdit: row.author_id === user.id && withinEditWindow(row.created_at),
      mine: row.author_id === user.id,
      author: authorFrom(row),
      hearts: hearts.get(row.id) || 0,
      hearted: mineHearts.has(row.id),
      saved: saved.has(row.id),
      reported: reported.has(row.id),
      replies: replies.get(row.id) || [],
    })),
    people: people.map((person) => ({
      firstName: firstName(person.full_name),
      initial: initial(person.full_name),
      badge: badgeFor(person.role, person.subscription_plan, Boolean(person.is_founder)),
    })),
    me: {
      firstName: firstName(user.name),
      initial: initial(user.name),
      badge: badgeFor(user.role, user.subscriptionPlan, Boolean(user.isFounder)),
      isAdmin: user.role === 'admin',
      muted,
    },
  };
}

function assertRate(db: DatabaseSync, table: 'community_posts' | 'community_replies', userId: string, limit: number) {
  const row = db
    .prepare(`SELECT COUNT(*) as c FROM ${table} WHERE author_id = ? AND created_at >= datetime('now', '-1 hour')`)
    .get(userId) as { c: number };
  if (row.c >= limit) fail('אפשר לפרסם שוב בעוד קצת', 429);
}

export function createCommunityPost(
  db: DatabaseSync,
  user: AuthUser,
  input: { channel?: string; body?: unknown; lectureTitle?: unknown; imageUrl?: unknown }
) {
  if (!canEnterCommunity(user)) fail('הקהילה נפתחת עם מנוי הספרייה', 403);
  if (isMuted(db, user.id)) fail('הפרסום הושתק על ידי הצוות', 403);
  const channel = String(input.channel || 'talk');
  if (!isChannel(channel) || !canPostInChannel(user, channel)) fail('אין הרשאה לפרסם בערוץ הזה', 403);
  assertRate(db, 'community_posts', user.id, 8);
  const id = randomUUID();
  db.prepare(
    `INSERT INTO community_posts (id, channel, author_id, body, lecture_title, image_url, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`
  ).run(id, channel, user.id, cleanBody(input.body), cleanLecture(input.lectureTitle), cleanImage(input.imageUrl));
  return id;
}

export function createCommunityReply(db: DatabaseSync, user: AuthUser, postId: string, body: unknown) {
  if (!canEnterCommunity(user)) fail('הקהילה נפתחת עם מנוי הספרייה', 403);
  if (isMuted(db, user.id)) fail('הפרסום הושתק על ידי הצוות', 403);
  const post = db.prepare(`SELECT id, channel, status FROM community_posts WHERE id = ?`).get(postId) as
    | { id: string; channel: CommunityChannelId; status: string }
    | undefined;
  if (!post || !canSeeChannel(user, post.channel)) fail('הפוסט לא נמצא', 404);
  if (post.status === 'hidden' && user.role !== 'admin') fail('הפוסט הוסתר', 403);
  assertRate(db, 'community_replies', user.id, 20);
  const id = randomUUID();
  db.prepare(
    `INSERT INTO community_replies (id, post_id, author_id, body, created_at) VALUES (?, ?, ?, ?, datetime('now'))`
  ).run(id, postId, user.id, cleanBody(body));
  return id;
}

function toggle(db: DatabaseSync, table: 'community_reactions' | 'community_bookmarks', postId: string, userId: string) {
  const existing = db.prepare(`SELECT post_id FROM ${table} WHERE post_id = ? AND user_id = ?`).get(postId, userId);
  if (existing) {
    db.prepare(`DELETE FROM ${table} WHERE post_id = ? AND user_id = ?`).run(postId, userId);
    return false;
  }
  db.prepare(`INSERT INTO ${table} (post_id, user_id, created_at) VALUES (?, ?, datetime('now'))`).run(postId, userId);
  return true;
}

function visiblePost(db: DatabaseSync, user: AuthUser, postId: string) {
  const post = db.prepare(`SELECT id, channel FROM community_posts WHERE id = ? AND status = 'visible'`).get(postId) as
    | { id: string; channel: CommunityChannelId }
    | undefined;
  if (!post || !canSeeChannel(user, post.channel)) fail('הפוסט לא נמצא', 404);
  return post;
}

export function toggleCommunityHeart(db: DatabaseSync, user: AuthUser, postId: string) {
  if (!canEnterCommunity(user)) fail('הקהילה נפתחת עם מנוי הספרייה', 403);
  visiblePost(db, user, postId);
  return toggle(db, 'community_reactions', postId, user.id);
}

export function toggleCommunityBookmark(db: DatabaseSync, user: AuthUser, postId: string) {
  if (!canEnterCommunity(user)) fail('הקהילה נפתחת עם מנוי הספרייה', 403);
  visiblePost(db, user, postId);
  return toggle(db, 'community_bookmarks', postId, user.id);
}

export function reportCommunityPost(db: DatabaseSync, user: AuthUser, postId: string) {
  if (!canEnterCommunity(user)) fail('הקהילה נפתחת עם מנוי הספרייה', 403);
  visiblePost(db, user, postId);
  db.prepare(
    `INSERT INTO community_reports (id, post_id, user_id, created_at) VALUES (?, ?, ?, datetime('now'))
     ON CONFLICT(post_id, user_id) DO NOTHING`
  ).run(randomUUID(), postId, user.id);
}

export function setCommunityPinned(db: DatabaseSync, user: AuthUser, postId: string, pinned: boolean) {
  if (user.role !== 'admin') fail('אין הרשאת ניהול', 403);
  const post = db.prepare(`SELECT id FROM community_posts WHERE id = ?`).get(postId);
  if (!post) fail('הפוסט לא נמצא', 404);
  db.prepare(`UPDATE community_posts SET pinned = ? WHERE id = ?`).run(pinned ? 1 : 0, postId);
}

export function setCommunityHidden(db: DatabaseSync, user: AuthUser, postId: string, hidden: boolean) {
  if (user.role !== 'admin') fail('אין הרשאת ניהול', 403);
  const post = db.prepare(`SELECT id FROM community_posts WHERE id = ?`).get(postId);
  if (!post) fail('הפוסט לא נמצא', 404);
  db.prepare(`UPDATE community_posts SET status = ? WHERE id = ?`).run(hidden ? 'hidden' : 'visible', postId);
}

export function editCommunityPost(db: DatabaseSync, user: AuthUser, postId: string, body: unknown) {
  if (!canEnterCommunity(user)) fail('הקהילה נפתחת עם מנוי הספרייה', 403);
  const post = db.prepare(`SELECT id, author_id, created_at FROM community_posts WHERE id = ?`).get(postId) as
    | { id: string; author_id: string; created_at: string }
    | undefined;
  if (!post || post.author_id !== user.id) fail('אפשר לערוך רק פוסט שלך', 403);
  if (!withinEditWindow(post.created_at)) fail('חלון העריכה נסגר', 403);
  db.prepare(`UPDATE community_posts SET body = ? WHERE id = ?`).run(cleanBody(body), postId);
}

function assertModerator(user: AuthUser) {
  if (user.role !== 'admin') fail('אין הרשאת ניהול', 403);
}

export function listCommunityReports(db: DatabaseSync, user: AuthUser) {
  assertModerator(user);
  return (
    db
      .prepare(
        `SELECT r.id, r.created_at, r.post_id, p.body, p.status as post_status, p.author_id,
                author.full_name as author_name, reporter.full_name as reporter_name,
                CASE WHEN m.user_id IS NULL THEN 0 ELSE 1 END as muted
         FROM community_reports r
         JOIN community_posts p ON p.id = r.post_id
         JOIN users author ON author.id = p.author_id
         JOIN users reporter ON reporter.id = r.user_id
         LEFT JOIN community_mutes m ON m.user_id = p.author_id
         WHERE r.status = 'open'
         ORDER BY r.created_at DESC
         LIMIT 50`
      )
      .all() as Array<{
      id: string;
      created_at: string;
      post_id: string;
      body: string;
      post_status: string;
      author_id: string;
      author_name: string;
      reporter_name: string;
      muted: number;
    }>
  ).map((row) => ({
    id: row.id,
    postId: row.post_id,
    body: row.body,
    hidden: row.post_status === 'hidden',
    authorId: row.author_id,
    authorName: firstName(row.author_name),
    reporterName: firstName(row.reporter_name),
    muted: Boolean(row.muted),
    createdAt: row.created_at,
  }));
}

export function dismissCommunityReport(db: DatabaseSync, user: AuthUser, reportId: string) {
  assertModerator(user);
  const report = db.prepare(`SELECT id FROM community_reports WHERE id = ?`).get(reportId);
  if (!report) fail('הדיווח לא נמצא', 404);
  db.prepare(`UPDATE community_reports SET status = 'dismissed' WHERE id = ?`).run(reportId);
}

export function setCommunityMuted(db: DatabaseSync, user: AuthUser, userId: string, muted: boolean) {
  assertModerator(user);
  if (userId === user.id) fail('אי אפשר להשתיק את עצמך', 400);
  const target = db.prepare(`SELECT id FROM users WHERE id = ?`).get(userId);
  if (!target) fail('המשתמש לא נמצא', 404);
  if (muted) {
    db.prepare(
      `INSERT INTO community_mutes (user_id, muted_by, created_at) VALUES (?, ?, datetime('now'))
       ON CONFLICT(user_id) DO NOTHING`
    ).run(userId, user.id);
    return;
  }
  db.prepare(`DELETE FROM community_mutes WHERE user_id = ?`).run(userId);
}

function userIdByEmail(db: DatabaseSync, email: string) {
  const row = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email) as { id: string } | undefined;
  return row?.id;
}

export function seedDemoCommunity(db: DatabaseSync) {
  if (isProduction()) return;
  if (db.prepare(`SELECT value FROM site_settings WHERE key = ?`).get(SEED_KEY)) return;
  const adminId = userIdByEmail(db, 'admin@infinitemasterpiece.local');
  const galId = userIdByEmail(db, 'gal@infinitemasterpiece.local');
  const libraryId = userIdByEmail(db, 'library@infinitemasterpiece.local');
  if (!adminId || !galId) return;

  const insert = db.prepare(
    `INSERT INTO community_posts (id, channel, author_id, body, lecture_title, pinned, created_at)
     VALUES (?, ?, ?, ?, ?, ?, datetime('now', ?))`
  );
  insert.run(
    'community-demo-welcome',
    'board',
    adminId,
    'ברוכים הבאים לקהילה. כאן שואלים, משתפים, ומפנים להרצאה כשצריך. מכירה ותיאום אישי נשארים מחוץ לפיד.',
    '',
    1,
    '-2 hours'
  );
  insert.run(
    'community-demo-story',
    'talk',
    galId,
    'מי שפתח את ההרצאה על סטוריטלינג, שווה לעצור על הדוגמה של הדקה הרביעית. שם יושב המהלך.',
    'סטוריטלינג שעובד',
    0,
    '-30 minutes'
  );
  if (libraryId) {
    insert.run(
      'community-demo-library',
      'library',
      libraryId,
      'חיפשתי הרצאה קצרה לפתיחת שבוע. «יש לי 10 דקות» יושב שם בדיוק.',
      '',
      0,
      '-10 minutes'
    );
  }
  db.prepare(`INSERT INTO site_settings (key, value) VALUES (?, '1')`).run(SEED_KEY);
}

export function initializeCommunity(db: DatabaseSync) {
  initializeCommunitySchema(db);
  seedDemoCommunity(db);
}
