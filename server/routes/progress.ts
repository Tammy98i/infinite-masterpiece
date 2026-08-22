import { Router } from 'express';
import { authUser } from '../middleware/auth.js';
import { listProgress, saveProgress } from '../services/progressService.js';

const router = Router();

router.get('/', (req, res) => {
  try {
    res.json({ progress: listProgress(authUser(req).id) });
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

router.put('/', (req, res) => {
  try {
    const courseId = String(req.body?.courseId || '');
    const episodeId = String(req.body?.episodeId || '');
    if (!courseId || !episodeId) {
      res.status(400).json({ error: 'חסר פרק' });
      return;
    }
    res.json(
      saveProgress(authUser(req).id, {
        courseId,
        episodeId,
        currentTime: Number(req.body?.currentTime || 0),
        duration: Number(req.body?.duration || 1),
        completed: Boolean(req.body?.completed),
        updatedAt: Number(req.body?.updatedAt || Date.now()),
      })
    );
  } catch (err) {
    res.status(500).json({ error: (err as Error).message });
  }
});

export default router;
