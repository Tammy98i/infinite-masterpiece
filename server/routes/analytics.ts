import { Router } from 'express';
import type { Request } from 'express';
import { isAllowedEvent, trackEvent } from '../services/analyticsService.js';
import type { AuthUser } from '../services/authService.js';

const router = Router();

router.post('/', (req, res) => {
  const event = String(req.body?.event || '');
  if (!isAllowedEvent(event)) {
    // Analytics should never surface as a user-facing console error.
    res.status(204).end();
    return;
  }
  const raw = req.body?.properties;
  const properties: Record<string, string> = {};
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
      if (typeof value === 'string' && key.length < 40) properties[key] = value.slice(0, 200);
    }
  }
  const userId = (req as Request & { authUser?: AuthUser }).authUser?.id;
  trackEvent(event, { userId, properties });
  res.status(204).end();
});

export default router;
