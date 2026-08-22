import { Router } from 'express';
import { getFounderCatalog, getPublicCatalog } from '../services/catalogService.js';

const router = Router();

router.get('/founders/:founderId', (req, res) => {
  try {
    res.json(getFounderCatalog(req.params.founderId));
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.get('/', (_req, res) => {
  try {
    res.json(getPublicCatalog());
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
