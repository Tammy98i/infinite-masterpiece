import { Router } from 'express';
import { getDb } from '../db/connection.js';
import { authUser, requireAdmin, requireAuth } from '../middleware/auth.js';
import { writeAudit } from '../services/auditService.js';
import { trackEvent } from '../services/analyticsService.js';
import {
  answerQuestion,
  askQuestion,
  assignMember,
  createPod,
  getMyPodsState,
  getPodHome,
  joinSession,
  listAssignmentQueue,
  listPods,
  reviewSubmission,
  setCaptain,
  setGroupNotice,
  setMemberStatus,
  submitTask,
  transferMember,
  updatePod,
  upsertSession,
  upsertTask,
} from '../db/pods.js';

function sendError(res: { status: (code: number) => { json: (body: unknown) => void } }, err: unknown) {
  const status = (err as { status?: number }).status || 500;
  res.status(status).json({ error: (err as Error).message || 'שגיאה' });
}

export const memberPods = Router();
export const adminPods = Router();

memberPods.use(requireAuth);
adminPods.use(requireAdmin);

memberPods.get('/me', (req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json(getMyPodsState(getDb(), authUser(req).id));
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.get('/:id', (req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json({ pod: getPodHome(getDb(), authUser(req).id, req.params.id) });
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.post('/:id/tasks/:taskId/submit', (req, res) => {
  try {
    const userId = authUser(req).id;
    const submission = submitTask(getDb(), userId, req.params.id, req.params.taskId, req.body || {});
    trackEvent('pod_task_submitted', { userId, properties: { podId: req.params.id } });
    res.json({ submission });
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.post('/:id/questions', (req, res) => {
  try {
    const userId = authUser(req).id;
    const question = askQuestion(getDb(), userId, req.params.id, String(req.body?.body || ''));
    trackEvent('pod_question_asked', { userId, properties: { podId: req.params.id } });
    res.status(201).json({ question });
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.post('/:id/session/join', (req, res) => {
  try {
    const userId = authUser(req).id;
    const result = joinSession(getDb(), userId, req.params.id);
    trackEvent('pod_session_joined', { userId, properties: { podId: req.params.id } });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.post('/:id/captain/task', (req, res) => {
  try {
    const task = upsertTask(getDb(), authUser(req).id, req.params.id, req.body || {});
    trackEvent('pod_task_opened', { userId: authUser(req).id, properties: { podId: req.params.id } });
    res.json({ task });
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.patch('/:id/captain/session', (req, res) => {
  try {
    const session = upsertSession(getDb(), authUser(req).id, req.params.id, req.body || {});
    trackEvent('pod_session_opened', { userId: authUser(req).id, properties: { podId: req.params.id } });
    res.json({ session });
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.patch('/:id/captain/notice', (req, res) => {
  try {
    const pod = setGroupNotice(getDb(), authUser(req).id, req.params.id, String(req.body?.groupNotice || ''));
    res.json({ pod });
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.patch('/submissions/:submissionId', (req, res) => {
  try {
    const submission = reviewSubmission(getDb(), authUser(req).id, req.params.submissionId, req.body || {});
    const status = String(req.body?.status || '');
    trackEvent(status === 'stuck' ? 'pod_task_stuck' : 'pod_task_reviewed', {
      userId: authUser(req).id,
      properties: { submissionId: req.params.submissionId },
    });
    res.json({ submission });
  } catch (err) {
    sendError(res, err);
  }
});

memberPods.patch('/questions/:questionId', (req, res) => {
  try {
    const question = answerQuestion(getDb(), authUser(req).id, req.params.questionId, String(req.body?.answerBody || ''));
    trackEvent('pod_question_answered', { userId: authUser(req).id, properties: { questionId: req.params.questionId } });
    res.json({ question });
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.get('/', (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json({ pods: listPods(getDb()) });
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.get('/queue', (_req, res) => {
  try {
    res.set('Cache-Control', 'no-store').json(listAssignmentQueue(getDb()));
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.post('/', (req, res) => {
  try {
    const pod = createPod(getDb(), req.body || {});
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'pod_created',
      entityType: 'pod',
      entityId: pod.id,
      after: pod,
    });
    trackEvent('pod_created', { userId: authUser(req).id, properties: { podId: pod.id } });
    res.status(201).json({ pod });
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.patch('/:id', (req, res) => {
  try {
    const before = listPods(getDb()).find((item) => item.id === req.params.id);
    const pod = updatePod(getDb(), req.params.id, req.body || {});
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: pod.status === 'closed' ? 'pod_closed' : 'pod_updated',
      entityType: 'pod',
      entityId: pod.id,
      before,
      after: pod,
    });
    if (pod.status === 'closed') {
      trackEvent('pod_closed', { userId: authUser(req).id, properties: { podId: pod.id } });
    }
    res.json({ pod });
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.post('/:id/captain', (req, res) => {
  try {
    const pod = setCaptain(getDb(), req.params.id, String(req.body?.userId || ''));
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'pod_captain_changed',
      entityType: 'pod',
      entityId: pod.id,
      after: pod,
    });
    trackEvent('pod_captain_changed', { userId: authUser(req).id, properties: { podId: pod.id } });
    res.json({ pod });
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.post('/:id/assign', (req, res) => {
  try {
    const result = assignMember(getDb(), req.params.id, String(req.body?.userId || ''));
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'pod_assigned',
      entityType: 'pod',
      entityId: req.params.id,
      after: result,
    });
    trackEvent('pod_assigned', {
      userId: authUser(req).id,
      properties: { podId: req.params.id, memberUserId: String(req.body?.userId || '') },
    });
    res.status(201).json(result);
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.post('/:id/members/:userId/status', (req, res) => {
  try {
    const status = String(req.body?.status || '');
    if (status !== 'paused' && status !== 'left' && status !== 'active') {
      res.status(400).json({ error: 'סטטוס החבר אינו תקין' });
      return;
    }
    const member = setMemberStatus(getDb(), req.params.id, req.params.userId, status);
    trackEvent(status === 'paused' ? 'pod_member_paused' : status === 'left' ? 'pod_member_left' : 'pod_assigned', {
      userId: authUser(req).id,
      properties: { podId: req.params.id },
    });
    res.json({ member });
  } catch (err) {
    sendError(res, err);
  }
});

adminPods.post('/:id/transfer', (req, res) => {
  try {
    const result = transferMember(
      getDb(),
      String(req.body?.userId || ''),
      req.params.id,
      String(req.body?.toPodId || '')
    );
    writeAudit({
      adminUserId: authUser(req).id,
      actionType: 'pod_member_transferred',
      entityType: 'pod',
      entityId: req.params.id,
      after: result,
    });
    res.json(result);
  } catch (err) {
    sendError(res, err);
  }
});
