import { randomBytes, scryptSync } from 'crypto';
import type { DatabaseSync } from 'node:sqlite';
import { CATEGORIES, COURSES, INSTRUCTORS } from '../../src/data/initialData.ts';
import { captionTracksForEpisode } from '../../src/constants/captions.ts';
import { FOUNDERS } from '../../src/marketing/data/founders.ts';

export const ADMIN_EMAIL = 'admin@infinitemasterpiece.local';
const ADMIN_PASSWORD = 'Masterpiece88';
const ADMIN_ID = 'user-admin-local';

export const DEMO_FOUNDER_EMAIL = 'gal@infinitemasterpiece.local';
export const DEMO_TAMI_EMAIL = 'tami@infinitemasterpiece.local';
export const DEMO_LECTURER_EMAIL = 'lecturer@infinitemasterpiece.local';
const DEMO_PASSWORD = 'Masterpiece88';

function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

function json(value: unknown) {
  return JSON.stringify(value ?? []);
}

export function seedCatalogIfEmpty(db: DatabaseSync) {
  const catCount = db.prepare(`SELECT COUNT(*) as c FROM categories`).get() as { c: number };
  if (!catCount.c) {
    const insert = db.prepare(
      `INSERT INTO categories (id, name, description, icon, sort_order, cover_image, access_level, lead_instructor_ids)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    );
    CATEGORIES.forEach((cat) => {
      insert.run(
        cat.id,
        cat.name,
        cat.description,
        cat.icon,
        cat.sortOrder ?? 0,
        cat.coverImage || '',
        cat.accessLevel || 'premium',
        json(cat.leadInstructorIds || [])
      );
    });
  }

  const lecCount = db.prepare(`SELECT COUNT(*) as c FROM lecturers`).get() as { c: number };
  if (!lecCount.c) {
    const insert = db.prepare(
      `INSERT INTO lecturers (id, name, title, avatar_url, bio, credentials, is_founder, founder_id)
       VALUES (?, ?, ?, ?, ?, ?, 0, NULL)`
    );
    for (const inst of INSTRUCTORS) {
      insert.run(inst.id, inst.name, inst.title, inst.avatarUrl, inst.bio, json(inst.credentials));
    }
  }

  const courseCount = db.prepare(`SELECT COUNT(*) as c FROM courses`).get() as { c: number };
  if (!courseCount.c) {
    const insertCourse = db.prepare(`
      INSERT INTO courses (
        id, title, subtitle, description, category_id, lecturer_id,
        cover_image, backdrop_image, trailer_url, tags, level,
        what_you_will_learn, target_audience, status, access_level,
        is_featured, is_popular, is_new, is_short, rating, review_count, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published', 'premium', ?, ?, ?, ?, ?, ?, ?)
    `);
    const insertEpisode = db.prepare(`
      INSERT INTO episodes (
        id, course_id, title, description, duration, video_url, caption_tracks, episode_number, access_level
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const course of COURSES) {
      insertCourse.run(
        course.id,
        course.title,
        course.subtitle,
        course.description,
        course.categoryId,
        course.instructorId,
        course.coverImage,
        course.backdropImage,
        course.trailerUrl,
        json(course.tags),
        course.level,
        json(course.whatYouWillLearn),
        course.targetAudience,
        course.isFeatured ? 1 : 0,
        course.isPopular ? 1 : 0,
        course.isNew ? 1 : 0,
        course.isShort ? 1 : 0,
        course.rating,
        course.reviewCount,
        course.createdAt
      );
      for (const ep of course.episodes) {
        insertEpisode.run(
          ep.id,
          course.id,
          ep.title,
          ep.description,
          ep.duration,
          ep.videoUrl,
          json(captionTracksForEpisode(ep.id)),
          ep.episodeNumber,
          ep.isFreeSample ? 'free' : 'premium'
        );
      }
    }
  }
}

export function seedAdminIfMissing(db: DatabaseSync) {
  upsertStaffUser(db, {
    id: ADMIN_ID,
    email: ADMIN_EMAIL,
    name: 'מנהלת המערכת',
    role: 'admin',
    isFounder: false,
    password: ADMIN_PASSWORD,
    plan: 'premium_88',
  });
}

function upsertStaffUser(
  db: DatabaseSync,
  input: {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'lecturer';
    isFounder: boolean;
    password: string;
    plan: string;
    lecturerWhere?: string;
  }
) {
  const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(input.email) as { id: string } | undefined;
  const userId = existing?.id || input.id;
  const passwordHash = hashPassword(input.password);
  if (!existing) {
    db.prepare(
      `INSERT INTO users (id, email, password_hash, full_name, role, subscription_plan, is_founder, blocked)
       VALUES (?, ?, ?, ?, ?, ?, ?, 0)`
    ).run(input.id, input.email, passwordHash, input.name, input.role, input.plan, input.isFounder ? 1 : 0);
    console.log(`Staff account ready: ${input.email}`);
  } else {
    db.prepare(
      `UPDATE users SET password_hash = ?, full_name = ?, role = ?, subscription_plan = ?, is_founder = ?, blocked = 0
       WHERE id = ?`
    ).run(passwordHash, input.name, input.role, input.plan, input.isFounder ? 1 : 0, userId);
  }

  if (input.lecturerWhere) {
    db.prepare(`UPDATE lecturers SET user_id = NULL WHERE user_id = ? AND NOT (${input.lecturerWhere})`).run(userId);
    db.prepare(`UPDATE lecturers SET user_id = ? WHERE ${input.lecturerWhere}`).run(userId);
  }
  return userId;
}

export function seedDemoLecturersIfMissing(db: DatabaseSync) {
  upsertStaffUser(db, {
    id: 'user-demo-gal',
    email: DEMO_FOUNDER_EMAIL,
    name: 'גל אברמוביץ׳',
    role: 'lecturer',
    isFounder: true,
    password: DEMO_PASSWORD,
    plan: 'premium_88',
    lecturerWhere: `id = 'inst-gal' OR founder_id = 'gal'`,
  });
  upsertStaffUser(db, {
    id: 'user-demo-tami',
    email: DEMO_TAMI_EMAIL,
    name: 'תמי אליאן',
    role: 'lecturer',
    isFounder: true,
    password: DEMO_PASSWORD,
    plan: 'premium_88',
    lecturerWhere: `id = 'inst-tami' OR founder_id = 'tami'`,
  });
  upsertStaffUser(db, {
    id: 'user-demo-lecturer',
    email: DEMO_LECTURER_EMAIL,
    name: 'ד"ר מיכל שוורץ',
    role: 'lecturer',
    isFounder: false,
    password: DEMO_PASSWORD,
    plan: 'monthly',
    lecturerWhere: `id = 'inst-michal'`,
  });
}

const SAMPLE_VIDEO = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
const SAMPLE_VIDEO_2 = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4';

const FOUNDER_LECTURES: Array<{
  founderId: string;
  lecturerId: string;
  courseId: string;
  categoryId: string;
  title: string;
  subtitle: string;
  description: string;
  episodeTitle: string;
  episodeDescription: string;
  tags: string[];
  programWeek: 1 | 2;
}> = [
  {
    founderId: 'gal',
    lecturerId: 'inst-gal',
    courseId: 'course-gal-system',
    categoryId: 'cat-founders',
    title: 'מחזון למערכת',
    subtitle: 'איך הופכים רעיון ממסע השראה למבנה עסקי שעובד',
    description:
      'גל פורס את הדרך מחזון לשפה, לקהילה ולמערכת ביצוע. ההרצאה מיועדת למי שבונה תנועה, לא עוד תוכן בודד.',
    episodeTitle: 'פרק 1: הרעיון הופך למבנה',
    episodeDescription: 'איך בונים שפה, מבנה והפצה סביב חזון אחד.',
    tags: ['חזון', 'מבנה עסקי', 'נבחרת 88'],
    programWeek: 1,
  },
  {
    founderId: 'tami',
    lecturerId: 'inst-tami',
    courseId: 'course-tami-product',
    categoryId: 'cat-founders',
    title: 'מוצר שעובד',
    subtitle: 'מהחזון למערכת שהמשתמשים באמת משתמשים בה',
    description:
      'תמי מפרקת איך הופכים חזון למוצר: חוויית שימוש, ספרייה, מדידה ואוטומציה שעובדות יחד.',
    episodeTitle: 'פרק 1: ממוצר לרצף שימוש',
    episodeDescription: 'איך בונים ספרייה ומסלול צפייה שאנשים חוזרים אליהם.',
    tags: ['מוצר', 'UX', 'נבחרת 88'],
    programWeek: 2,
  },
];

export function seedFounderLecturers(db: DatabaseSync) {
  const insertLecturer = db.prepare(`
    INSERT INTO lecturers (id, name, title, avatar_url, bio, credentials, is_founder, founder_id)
    VALUES (?, ?, ?, ?, ?, ?, 1, ?)
  `);
  const insertCourse = db.prepare(`
    INSERT INTO courses (
      id, title, subtitle, description, category_id, lecturer_id,
      cover_image, backdrop_image, trailer_url, tags, level,
      what_you_will_learn, target_audience, status, access_level,
      is_featured, is_popular, is_new, is_short, rating, review_count, program_week, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'לכל הרמות', ?, ?, 'published', 'premium', 1, 0, 1, 0, 0, 0, ?, datetime('now'))
  `);
  const insertEpisode = db.prepare(`
    INSERT INTO episodes (id, course_id, title, description, duration, video_url, caption_tracks, episode_number, access_level)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, 'free')
  `);

  for (const item of FOUNDER_LECTURES) {
    const founder = FOUNDERS.find((f) => f.id === item.founderId);
    if (!founder) continue;

    const lecturer = db.prepare(`SELECT id FROM lecturers WHERE id = ? OR founder_id = ?`).get(
      item.lecturerId,
      item.founderId
    ) as { id: string } | undefined;
    const lecturerId = lecturer?.id || item.lecturerId;
    if (!lecturer) {
      insertLecturer.run(
        item.lecturerId,
        founder.name,
        founder.title,
        founder.image,
        founder.description.replace(/\n\n+/g, ' '),
        json(founder.expertise),
        item.founderId
      );
    } else {
      db.prepare(`UPDATE lecturers SET is_founder = 1, founder_id = ? WHERE id = ?`).run(
        item.founderId,
        lecturerId
      );
    }

    const course = db.prepare(`SELECT id FROM courses WHERE id = ?`).get(item.courseId);
    if (!course) {
      insertCourse.run(
        item.courseId,
        item.title,
        item.subtitle,
        item.description,
        item.categoryId,
        lecturerId,
        founder.image,
        founder.image,
        SAMPLE_VIDEO,
        json(item.tags),
        json(['הבנת המבנה מאחורי Infinite Masterpiece', 'חיבור בין חזון לביצוע']),
        'ליוצרים ולחברי נבחרת שרוצים להבין את המערכת מבפנים',
        item.programWeek
      );
      insertEpisode.run(
        `ep-${item.courseId}-1`,
        item.courseId,
        item.episodeTitle,
        item.episodeDescription,
        720,
        item.founderId === 'tami' ? SAMPLE_VIDEO_2 : SAMPLE_VIDEO,
        json(captionTracksForEpisode(`ep-${item.courseId}-1`))
      );
    }
  }

  const tagWeek = db.prepare(`UPDATE courses SET program_week = ? WHERE id = ? AND program_week = 0`);
  for (const item of FOUNDER_LECTURES) {
    tagWeek.run(item.programWeek, item.courseId);
  }

  const galPhoto = '/team/gal.png';
  db.prepare(`UPDATE lecturers SET avatar_url = ? WHERE founder_id = 'gal' OR id = 'inst-gal'`).run(galPhoto);
  db.prepare(`UPDATE users SET avatar = ? WHERE email = ?`).run(galPhoto, DEMO_FOUNDER_EMAIL);
  db.prepare(
    `UPDATE courses SET cover_image = ?, backdrop_image = ?
     WHERE lecturer_id IN (SELECT id FROM lecturers WHERE founder_id = 'gal' OR id = 'inst-gal')
       AND (cover_image LIKE '%unsplash%' OR cover_image = '')`
  ).run(galPhoto, galPhoto);

  const tamiPhoto = '/team/tami.png';
  db.prepare(`UPDATE lecturers SET avatar_url = ? WHERE founder_id = 'tami' OR id = 'inst-tami'`).run(tamiPhoto);
  db.prepare(
    `UPDATE courses SET cover_image = ?, backdrop_image = ?
     WHERE lecturer_id IN (SELECT id FROM lecturers WHERE founder_id = 'tami' OR id = 'inst-tami')
       AND (cover_image LIKE '%unsplash%' OR cover_image = '')`
  ).run(tamiPhoto, tamiPhoto);
}
