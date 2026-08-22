import { Router } from 'express';
import * as svc from '../services/onboardingService.js';

const router = Router();

router.get('/stats', (_req, res) => {
  try {
    res.json(svc.getStats());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/paths', (_req, res) => {
  try {
    res.json(svc.getAllPathsAdmin());
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/path', (req, res) => {
  try {
    const { name, description, targetRole, difficultyLevel } = req.body;
    if (!name || !targetRole) {
      return res.status(400).json({ error: 'name and targetRole are required' });
    }
    res.status(201).json(svc.createPath({ name, description, targetRole, difficultyLevel }));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put('/path/:id', (req, res) => {
  try {
    res.json(svc.updatePath(req.params.id, req.body));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.delete('/path/:id', (req, res) => {
  try {
    svc.deletePath(req.params.id);
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/path/:id/steps', (req, res) => {
  try {
    res.status(201).json(svc.createStep(req.params.id, req.body));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.put('/steps/:id', (req, res) => {
  try {
    res.json(svc.updateStep(req.params.id, req.body));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
