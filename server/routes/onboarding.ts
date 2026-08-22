import { Router } from 'express';
import * as svc from '../services/onboardingService.js';

const router = Router();

router.get('/paths', (req, res) => {
  try {
    const role = (req.query.role as string) || 'student';
    res.json(svc.getPathsByRole(role));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/path/:id', (req, res) => {
  try {
    const path = svc.getPathById(req.params.id);
    if (!path) return res.status(404).json({ error: 'Path not found' });
    res.json(path);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/start', (req, res) => {
  try {
    const { userId, pathId, level } = req.body;
    if (!userId || !pathId || !level) {
      return res.status(400).json({ error: 'userId, pathId, and level are required' });
    }
    const progress = svc.startOnboarding(userId, pathId, level);
    res.json(progress);
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/step-complete', (req, res) => {
  try {
    const { userId, stepId } = req.body;
    if (!userId || !stepId) {
      return res.status(400).json({ error: 'userId and stepId are required' });
    }
    res.json(svc.completeStep(userId, stepId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.post('/step-skip', (req, res) => {
  try {
    const { userId, stepId } = req.body;
    if (!userId || !stepId) {
      return res.status(400).json({ error: 'userId and stepId are required' });
    }
    res.json(svc.skipStep(userId, stepId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/user-progress/:userId', (req, res) => {
  try {
    res.json(svc.getUserProgress(req.params.userId));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

router.get('/trigger-steps', (req, res) => {
  try {
    const { userId, role, trigger } = req.query;
    if (!userId || !role || !trigger) {
      return res.status(400).json({ error: 'userId, role, and trigger are required' });
    }
    res.json(svc.getStepsForTrigger(userId as string, role as svc.UserRole, trigger as string));
  } catch (e) {
    res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
