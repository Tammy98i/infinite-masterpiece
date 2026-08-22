import { Router } from 'express';
import { createPremium88Application } from '../services/premium88Service.js';

const router = Router();

router.post('/applications', (req, res) => {
  try {
    const result = createPremium88Application({
      fullName: String(req.body?.fullName || ''),
      phone: String(req.body?.phone || ''),
      email: String(req.body?.email || ''),
      field: String(req.body?.field || ''),
      businessStage: String(req.body?.businessStage || ''),
      goal: String(req.body?.goal || ''),
      links: String(req.body?.links || ''),
      notes: String(req.body?.notes || ''),
    });
    res.status(201).json({ ok: true, application: result });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
