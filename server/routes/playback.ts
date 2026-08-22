import { Router } from 'express';
import type { Request } from 'express';
import type { AuthUser } from '../services/authService.js';
import { createPlaybackSession } from '../services/playbackService.js';

const router = Router();

router.post('/chapters/:chapterId/playback-session', (req, res) => {
  try {
    const user = (req as Request & { authUser?: AuthUser }).authUser || null;
    const result = createPlaybackSession(String(req.params.chapterId || ''), user);
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
