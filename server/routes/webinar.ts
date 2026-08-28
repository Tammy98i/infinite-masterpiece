import { Router } from 'express';
import {
  createWebinarRegistration,
  getWebinarPublicPayload,
  getWebinarResume,
} from '../services/webinarService.js';

const router = Router();

router.get('/config', (req, res) => {
  try {
    const abVariant = typeof req.query.abVariant === 'string' ? req.query.abVariant : undefined;
    res.json(getWebinarPublicPayload(abVariant));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/resume/:id', (req, res) => {
  try {
    res.json({ ok: true, registration: getWebinarResume(req.params.id) });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/register', (req, res) => {
  try {
    const result = createWebinarRegistration(req.body || {});
    res.json({ ok: true, registration: result });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
