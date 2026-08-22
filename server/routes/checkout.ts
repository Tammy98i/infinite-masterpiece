import { Router } from 'express';
import { createCheckoutSession, isStripeEnabled } from '../services/stripeService.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({ enabled: isStripeEnabled() });
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

export default router;
