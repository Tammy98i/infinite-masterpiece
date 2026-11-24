import { Router } from 'express';
import { getDb } from '../db/connection.js';
import {
  createCommunityPost,
  createCommunityReply,
  getCommunityHome,
  reportCommunityPost,
  setCommunityHidden,
  setCommunityPinned,
  toggleCommunityBookmark,
  toggleCommunityHeart,
} from '../db/community.js';
import { authUser, optionalAuth, requireAuth } from '../middleware/auth.js';
import { writeAudit } from '../services/auditService.js';

function sendError(res: { status: (code: number) => { json: (body: unknown) => void } }, err: unknown) {
  const status = (err as { status?: number }).status || 500;
  res.status(status).json({ error: (err as Error).message || 'שגיאה' });
}

export const communityRoutes = Router();

communityRoutes.use(optionalAuth);

communityRoutes.get('/', (req, res) => {
  try {
    const user = (req as { authUser?: ReturnType<typeof authUser> }).authUser ?? null;
    const channel = typeof req.query.channel === 'string' ? req.query.channel : undefined;
    res.set('Cache-Control', 'no-store').json(getCommunityHome(getDb(), user, channel));
  } catch (err) {
    sendError(res, err);
  }
});

communityRoutes.post('/posts', requireAuth, (req, res) => {
  try {
    const id = createCommunityPost(getDb(), authUser(req), req.body || {});
    res.status(201).json({ id });
  } catch (err) {
    sendError(res, err);
  }
});

communityRoutes.post('/posts/:id/replies', requireAuth, (req, res) => {
  try {
    const id = createCommunityReply(getDb(), authUser(req), req.params.id, req.body?.body);
    res.status(201).json({ id });
  } catch (err) {
    sendError(res, err);
  }
});

communityRoutes.post('/posts/:id/react', requireAuth, (req, res) => {
  try {
    res.json({ on: toggleCommunityHeart(getDb(), authUser(req), req.params.id) });
  } catch (err) {
    sendError(res, err);
  }
});

communityRoutes.post('/posts/:id/bookmark', requireAuth, (req, res) => {
  try {
    res.json({ on: toggleCommunityBookmark(getDb(), authUser(req), req.params.id) });
  } catch (err) {
    sendError(res, err);
  }
});

communityRoutes.post('/posts/:id/report', requireAuth, (req, res) => {
  try {
    reportCommunityPost(getDb(), authUser(req), req.params.id);
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

communityRoutes.post('/posts/:id/pin', requireAuth, (req, res) => {
  try {
    const user = authUser(req);
    setCommunityPinned(getDb(), user, req.params.id, Boolean(req.body?.pinned));
    writeAudit({
      adminUserId: user.id,
      actionType: 'community_pin',
      entityType: 'community_post',
      entityId: req.params.id,
      after: { pinned: Boolean(req.body?.pinned) },
    });
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});

communityRoutes.post('/posts/:id/hide', requireAuth, (req, res) => {
  try {
    const user = authUser(req);
    setCommunityHidden(getDb(), user, req.params.id, req.body?.hidden !== false);
    writeAudit({
      adminUserId: user.id,
      actionType: 'community_hide',
      entityType: 'community_post',
      entityId: req.params.id,
      after: { hidden: req.body?.hidden !== false },
    });
    res.json({ ok: true });
  } catch (err) {
    sendError(res, err);
  }
});
