import { Router } from 'express';
import {
  createCheckoutSession,
  createLibraryCheckoutSession,
  isLibraryStripeEnabled,
  isStripeEnabled,
  libraryCheckoutPublicStatus,
} from '../services/stripeService.js';
import { requireAuth } from '../middleware/auth.js';
import type { AuthUser } from '../services/authService.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    enabled: isStripeEnabled(),
    library: libraryCheckoutPublicStatus(),
  });
});

router.post('/session', async (req, res) => {
  try {
    const session = await createCheckoutSession(req.body || {});
    res.json(session);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/library-session', requireAuth, async (req, res) => {
  try {
    if (!isLibraryStripeEnabled()) {
      res.status(503).json({ error: 'סליקת מנוי ספרייה עדיין לא מחוברת' });
      return;
    }
    const user = (req as typeof req & { authUser: AuthUser }).authUser;
    const session = await createLibraryCheckoutSession({
      userId: user.id,
      email: user.email,
      plan: String(req.body?.plan || ''),
    });
    res.json(session);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
