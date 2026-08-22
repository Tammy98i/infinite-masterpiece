import { randomUUID } from 'crypto';
import { getDb } from '../db/connection.js';
import { getLecturerIdForUser } from './lecturerService.js';
import { getCourseById } from './catalogService.js';
import { trackEvent } from './analyticsService.js';

type SqlRow = Record<string, unknown>;

function mapQuestion(row: SqlRow) {
  return {
    id: String(row.id),
    courseId: String(row.course_id),
    courseTitle: String(row.course_title || ''),
    userId: String(row.user_id || ''),
    userName: String(row.user_name || 'משתמש'),
    question: String(row.question || ''),
    answer: String(row.answer || ''),
    status: String(row.status || 'open') as 'open' | 'answered' | 'escalated' | 'hidden',
    createdAt: String(row.created_at || ''),
    answeredAt: row.answered_at ? String(row.answered_at) : null,
  };
}

function mapMessage(row: SqlRow) {
  return {
    id: String(row.id),
    lecturerUserId: String(row.lecturer_user_id),
    fromAdminId: String(row.from_admin_id || ''),
    fromAdminName: String(row.from_admin_name || 'צוות'),
    subject: String(row.subject || ''),
    body: String(row.body || ''),
    readAt: row.read_at ? String(row.read_at) : null,
    createdAt: String(row.created_at || ''),
  };
}

export function askCourseQuestion(userId: string, userName: string, courseId: string, questionText: string) {
  const question = String(questionText || '').trim();
  if (question.length < 10) {
    throw Object.assign(new Error('נא לכתוב לפחות 10 תווים'), { status: 400 });
  }
  if (question.length > 600) {
    throw Object.assign(new Error('השאלה ארוכה מדי'), { status: 400 });
  }
  const course = getCourseById(courseId);
  if (!course || course.status !== 'published' || course.questionsEnabled === false) {
    throw Object.assign(new Error('ההרצאה לא זמינה לשאלות'), { status: 404 });
  }

  const since = new Date(Date.now() - 10 * 60 * 1000).toISOString();
  const recent = getDb()
    .prepare(
      `SELECT COUNT(*) as c FROM content_questions WHERE user_id = ? AND created_at >= ?`
    )
    .get(userId, since) as { c: number };
  if (recent.c >= 5) {
    throw Object.assign(new Error('נשלחו יותר מדי שאלות. נסו שוב בעוד כמה דקות'), { status: 429 });
  }

  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO content_questions (
         id, course_id, lecturer_id, user_id, user_name, question, status, created_at
       ) VALUES (?, ?, ?, ?, ?, ?, 'open', ?)`
    )
    .run(id, courseId, course.instructorId, userId, userName, question, new Date().toISOString());
  trackEvent('content_question_asked', { userId, properties: { courseId } });
  return mapQuestion({
    id,
    course_id: courseId,
    course_title: course.title,
    user_id: userId,
    user_name: userName,
    question,
    answer: '',
    status: 'open',
    created_at: new Date().toISOString(),
    answered_at: null,
  });
}

export function listMyContentQuestions(userId: string, role: string) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) return [];
  const rows = getDb()
    .prepare(
      `SELECT q.*, c.title as course_title
       FROM content_questions q
       LEFT JOIN courses c ON c.id = q.course_id
       WHERE q.lecturer_id = ? AND q.status != 'hidden'
       ORDER BY q.created_at DESC
       LIMIT 200`
    )
    .all(lecturerId) as SqlRow[];
  return rows.map(mapQuestion);
}

export function answerContentQuestion(
  userId: string,
  role: string,
  questionId: string,
  answerText: string,
  status: 'answered' | 'escalated' = 'answered'
) {
  const lecturerId = getLecturerIdForUser(userId, role);
  if (!lecturerId) throw Object.assign(new Error('אין פרופיל מרצה'), { status: 403 });
  const row = getDb().prepare(`SELECT * FROM content_questions WHERE id = ?`).get(questionId) as SqlRow | undefined;
  if (!row || String(row.lecturer_id) !== lecturerId) {
    throw Object.assign(new Error('השאלה לא נמצאה'), { status: 404 });
  }
  const answer = String(answerText || '').trim();
  if (status === 'answered' && answer.length < 2) {
    throw Object.assign(new Error('נא לכתוב תשובה'), { status: 400 });
  }
  const now = new Date().toISOString();
  getDb()
    .prepare(
      `UPDATE content_questions
       SET answer = ?, status = ?, answered_at = ?
       WHERE id = ?`
    )
    .run(answer, status, now, questionId);
  trackEvent('lecturer_question_answered', { userId, properties: { questionId, status } });
  return listMyContentQuestions(userId, role).find((item) => item.id === questionId)!;
}

export function listTeamMessagesForLecturer(userId: string) {
  const rows = getDb()
    .prepare(
      `SELECT m.*, u.full_name as from_admin_name
       FROM team_messages m
       LEFT JOIN users u ON u.id = m.from_admin_id
       WHERE m.lecturer_user_id = ?
       ORDER BY m.created_at DESC
       LIMIT 100`
    )
    .all(userId) as SqlRow[];
  return rows.map(mapMessage);
}

export function markTeamMessageRead(userId: string, messageId: string) {
  const row = getDb()
    .prepare(`SELECT * FROM team_messages WHERE id = ? AND lecturer_user_id = ?`)
    .get(messageId, userId) as SqlRow | undefined;
  if (!row) throw Object.assign(new Error('ההודעה לא נמצאה'), { status: 404 });
  if (!row.read_at) {
    getDb()
      .prepare(`UPDATE team_messages SET read_at = ? WHERE id = ?`)
      .run(new Date().toISOString(), messageId);
  }
  return listTeamMessagesForLecturer(userId).find((item) => item.id === messageId)!;
}

export function sendTeamMessage(adminUserId: string, lecturerUserId: string, subject: string, body: string) {
  const subj = String(subject || '').trim();
  const text = String(body || '').trim();
  if (!subj || !text) throw Object.assign(new Error('נא למלא נושא ותוכן'), { status: 400 });
  const target = getDb().prepare(`SELECT id, role FROM users WHERE id = ?`).get(lecturerUserId) as
    | { id: string; role: string }
    | undefined;
  if (!target || (target.role !== 'lecturer' && target.role !== 'admin')) {
    throw Object.assign(new Error('ניתן לשלוח הודעה למרצה או איש צוות בלבד'), { status: 400 });
  }
  const id = randomUUID();
  getDb()
    .prepare(
      `INSERT INTO team_messages (id, lecturer_user_id, from_admin_id, subject, body, created_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(id, lecturerUserId, adminUserId, subj, text, new Date().toISOString());
  trackEvent('team_message_sent', { userId: adminUserId, properties: { lecturerUserId } });
  return listTeamMessagesForLecturer(lecturerUserId).find((item) => item.id === id)!;
}

export function listTeamMessagesAdmin(limit = 100) {
  const rows = getDb()
    .prepare(
      `SELECT m.*, u.full_name as from_admin_name, t.full_name as lecturer_name, t.email as lecturer_email
       FROM team_messages m
       LEFT JOIN users u ON u.id = m.from_admin_id
       LEFT JOIN users t ON t.id = m.lecturer_user_id
       ORDER BY m.created_at DESC
       LIMIT ?`
    )
    .all(limit) as SqlRow[];
  return rows.map((row) => ({
    ...mapMessage(row),
    lecturerName: String(row.lecturer_name || ''),
    lecturerEmail: String(row.lecturer_email || ''),
  }));
}
