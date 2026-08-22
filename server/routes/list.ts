import { Router } from 'express';
import { authUser } from '../middleware/auth.js';
import { listSaved, saveList } from '../services/listService.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    res.json({ courseIds: listSaved(authUser(req).id) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/', (req, res) => {
  try {
    const user = authUser(req);
    const ids = Array.isArray(req.body?.courseIds) ? req.body.courseIds.map(String) : [];
    const unlimited =
      user.role === 'admin' ||
      user.subscriptionPlan === 'free_trial' ||
      user.subscriptionPlan === 'monthly' ||
      user.subscriptionPlan === 'annual' ||
      user.subscriptionPlan === 'premium_88';
    res.json(saveList(user.id, ids, unlimited));
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

export default router;
