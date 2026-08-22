import type { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'crypto';

const STUDENT_PATH_ID = 'path-student-basics';
const INSTRUCTOR_PATH_ID = 'path-instructor-basics';
const STUDENT_BONUS_ID = 'bonus-student-guide';

export function seedDatabase(db: DatabaseSync): void {
  const insertPath = db.prepare(`
    INSERT INTO onboarding_paths (id, name, description, target_role, difficulty_level, is_active)
    VALUES (?, ?, ?, ?, ?, 1)
  `);

  const insertStep = db.prepare(`
    INSERT INTO onboarding_steps (
      id, path_id, title, description, step_order, type,
      video_url, screenz_embed, page_url, trigger_event, completion_condition,
      target_selector, is_required
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertBonus = db.prepare(`
    INSERT INTO onboarding_bonuses (id, title, description, bonus_type, value, unlock_condition, path_id, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `);

  insertPath.run(
    STUDENT_PATH_ID,
    'התחלה בסיסית — סטודנט',
    'מסלול הדרכה לצפייה ראשונה, שמירת התקדמות ושימוש שוטף בפלטפורמה',
    'student',
    'all'
  );

  insertPath.run(
    INSTRUCTOR_PATH_ID,
    'הקמה ראשונה — מרצה',
    'מסלול הדרכה ליצירת קורס, העלאת תוכן ופרסום שיעור ראשון',
    'instructor',
    'all'
  );

  const studentSteps = [
    {
      title: 'איך נכנסים למערכת',
      description: 'ברוכים הבאים ל-Infinite Masterpiece! אחרי ההרשמה תמצאו את דף הבית עם קורסים מומלצים, המשך צפייה וקטגוריות תוכן.',
      order: 1,
      type: 'modal',
      trigger: 'first_login',
      selector: null,
    },
    {
      title: 'איפה הקורסים שלי',
      description: 'לחצו על "הרשימה שלי" בסרגל העליון כדי לשמור קורסים ולגשת אליהם במהירות.',
      order: 2,
      type: 'tooltip',
      trigger: 'first_login',
      selector: '[data-onboarding="my-list"]',
    },
    {
      title: 'איך צופים בשיעור',
      description: 'בחרו קורס מדף הבית, לחצו "התחלת צפייה" וצפו בפרק הראשון. ניתן לעבור בין פרקים מרשימת הפרקים.',
      order: 3,
      type: 'modal',
      trigger: 'first_course_view',
      selector: null,
    },
    {
      title: 'המשך מאותה נקודה',
      description: 'שורת "המשיכו לצפות" בדף הבית שומרת את המקום שבו עצרתם — לחצו להמשך מיידי.',
      order: 4,
      type: 'banner',
      trigger: 'first_watch',
      selector: '[data-onboarding="continue-watching"]',
    },
    {
      title: 'סימון שיעור כהושלם',
      description: 'כשצופים עד הסוף, הפרק מסומן אוטומטית כהושלם. ניתן לראות סימון ירוק ברשימת הפרקים.',
      order: 5,
      type: 'tooltip',
      trigger: 'first_watch',
      selector: '[data-onboarding="watch-player"]',
    },
  ];

  for (const s of studentSteps) {
    insertStep.run(
      randomUUID(),
      STUDENT_PATH_ID,
      s.title,
      s.description,
      s.order,
      s.type,
      null,
      null,
      null,
      s.trigger,
      'manual_confirm',
      s.selector,
      1
    );
  }

  const instructorSteps = [
    {
      title: 'כניסה לאזור המרצים',
      description: 'כמרצה, תוכלו ליצור קורסים חדשים דרך מערכת הניהול. לחצו Ctrl+Shift+A לגישה לאדמין.',
      order: 1,
      type: 'modal',
      trigger: 'first_login',
      selector: null,
    },
    {
      title: 'יצירת קורס חדש',
      description: 'במסך האדמין מלאו שם קורס, תיאור, קטגוריה ומרצה — ואז הוסיפו פרקים.',
      order: 2,
      type: 'tooltip',
      trigger: 'first_login',
      selector: '[data-onboarding="admin-create-course"]',
    },
    {
      title: 'העלאת סרטון',
      description: 'הדביקו קישור לוידאו לכל פרק. בעתיד ניתן יהיה להטמיע Screenz ישירות כאן.',
      order: 3,
      type: 'modal',
      trigger: 'first_course_create',
      selector: null,
      screenz: '<!-- Screenz embed placeholder -->',
    },
    {
      title: 'הוספת שם ותיאור',
      description: 'שם ותיאור ברורים מגדילים את שיעור ההמרה — מלאו אותם בקפידה.',
      order: 4,
      type: 'tooltip',
      trigger: 'first_course_create',
      selector: '[data-onboarding="course-title"]',
    },
    {
      title: 'פרסום שיעור ראשון',
      description: 'לחצו "פרסום" לסיום — הקורס יופיע מיד בספריית ה-VOD.',
      order: 5,
      type: 'banner',
      trigger: 'first_course_create',
      selector: '[data-onboarding="admin-publish"]',
    },
  ];

  for (const s of instructorSteps) {
    insertStep.run(
      randomUUID(),
      INSTRUCTOR_PATH_ID,
      s.title,
      s.description,
      s.order,
      s.type,
      null,
      (s as { screenz?: string }).screenz || null,
      null,
      s.trigger,
      'manual_confirm',
      s.selector,
      1
    );
  }

  insertBonus.run(
    STUDENT_BONUS_ID,
    'מדריך התחלה מהירה',
    'PDF בונוס לסיום מסלול ההדרכה לסטודנטים',
    'pdf',
    'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    'path_complete',
    STUDENT_PATH_ID
  );
}

export { STUDENT_PATH_ID, INSTRUCTOR_PATH_ID, STUDENT_BONUS_ID };
