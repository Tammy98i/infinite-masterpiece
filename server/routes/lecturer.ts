import { Router } from 'express';
import { authUser, requireLecturer } from '../middleware/auth.js';
import { trackEvent } from '../services/analyticsService.js';
import {
  createMyCourse,
  getApplicationForUser,
  getMyLecturerProfile,
  lecturerOverview,
  listMyCourses,
  submitApplication,
  submitMyCourse,
  updateMyCourse,
  updateMyLecturerProfile,
  addTeamMemberAsFounder,
  assertCanManageTeam,
} from '../services/lecturerService.js';
import {
  answerContentQuestion,
  listMyContentQuestions,
  listTeamMessagesForLecturer,
  markTeamMessageRead,
} from '../services/lecturerInboxService.js';
import { listFounders } from '../services/catalogService.js';

const router = Router();

router.get('/application', (req, res) => {
  try {
    res.json({ application: getApplicationForUser(authUser(req).id) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/application', (req, res) => {
  try {
    const user = authUser(req);
    const application = submitApplication(user.id, req.body || {});
    trackEvent('lecturer_application_submitted', { userId: user.id });
    res.status(201).json({ application });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/overview', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    trackEvent('lecturer_dashboard_opened', { userId: user.id });
    res.json(lecturerOverview(user.id, user.role));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/profile', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    res.json({ profile: getMyLecturerProfile(user.id, user.role) });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/profile', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    const profile = updateMyLecturerProfile(user.id, user.role, {
      name: req.body?.name !== undefined ? String(req.body.name) : undefined,
      title: req.body?.title !== undefined ? String(req.body.title) : undefined,
      bio: req.body?.bio !== undefined ? String(req.body.bio) : undefined,
      avatarUrl: req.body?.avatarUrl !== undefined ? String(req.body.avatarUrl) : undefined,
      expertise: Array.isArray(req.body?.expertise) ? req.body.expertise.map(String) : undefined,
    });
    trackEvent('lecturer_profile_updated', { userId: user.id });
    res.json({ profile });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/courses', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    res.json({ courses: listMyCourses(user.id, user.role) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/courses', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    const title = String(req.body?.title || '').trim();
    if (!title) {
      res.status(400).json({ error: 'נא להזין שם הרצאה' });
      return;
    }
    const course = createMyCourse(user.id, user.role, req.body);
    if (!course) {
      res.status(500).json({ error: 'יצירת ההרצאה נכשלה' });
      return;
    }
    trackEvent('lecture_uploaded', { userId: user.id, properties: { courseId: course.id } });
    res.status(201).json({ course });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.patch('/courses/:id', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    res.json({ course: updateMyCourse(user.id, user.role, req.params.id, req.body) });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/courses/:id/submit', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    const course = submitMyCourse(user.id, user.role, req.params.id);
    trackEvent('lecture_submitted_for_review', { userId: user.id, properties: { courseId: req.params.id } });
    res.json({ course });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/team', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    assertCanManageTeam(user.id, user.role);
    res.json({ members: listFounders() });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/team', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    const founder = addTeamMemberAsFounder(user.id, user.role, {
      name: String(req.body?.name || ''),
      title: String(req.body?.title || ''),
      bio: String(req.body?.bio || ''),
      avatarUrl: String(req.body?.avatarUrl || ''),
    });
    res.status(201).json({ founder });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/questions', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    res.json({ questions: listMyContentQuestions(user.id, user.role) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.patch('/questions/:id', requireLecturer, (req, res) => {
  try {
    const user = authUser(req);
    const status = String(req.body?.status || 'answered') === 'escalated' ? 'escalated' : 'answered';
    const question = answerContentQuestion(user.id, user.role, req.params.id, String(req.body?.answer || ''), status);
    res.json({ question });
  } catch (err) {
    const statusCode = (err as { status?: number }).status || 500;
    res.status(statusCode).json({ error: (err as Error).message });
  }
});

router.get('/messages', requireLecturer, (req, res) => {
  try {
    res.json({ messages: listTeamMessagesForLecturer(authUser(req).id) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.post('/messages/:id/read', requireLecturer, (req, res) => {
  try {
    const message = markTeamMessageRead(authUser(req).id, req.params.id);
    res.json({ message });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
