import { Router } from 'express';
import { createTrackLead } from '../services/trackService.js';

const router = Router();

router.post('/leads', (req, res) => {
  try {
    const lead = createTrackLead(req.body || {});
    res.json({ ok: true, lead });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
