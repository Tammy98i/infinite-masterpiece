import { Router } from 'express';
import {
  cancelLibraryStripeSubscription,
  checkoutStatus,
  confirmLibraryCheckout,
  createCheckoutSession,
  createLibraryCheckoutSession,
} from '../services/stripeService.js';
import { authUser, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json(checkoutStatus());
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
    const user = authUser(req);
    const plan = String(req.body?.plan || '');
    const session = await createLibraryCheckoutSession(user, plan);
    res.json(session);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.post('/library-confirm', requireAuth, async (req, res) => {
  try {
    const user = authUser(req);
    const sessionId = String(req.body?.sessionId || '');
    const result = await confirmLibraryCheckout(user, sessionId);
    res.json(result);
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
