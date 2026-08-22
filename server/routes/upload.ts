import { Router } from 'express';
import {
  finalizeUploadedFile,
  multerMessage,
  parseUploadKind,
  uploadMiddleware,
} from '../services/uploadService.js';

const router = Router();

router.post('/', (req, res) => {
  const kind = parseUploadKind(req.query.kind);
  uploadMiddleware(kind)(req, res, (err) => {
    void (async () => {
      if (err) {
        res.status(400).json({ error: multerMessage(err) });
        return;
      }
      const file = req.file;
      if (!file) {
        res.status(400).json({ error: 'חסר קובץ' });
        return;
      }
      try {
        const url = await finalizeUploadedFile(file);
        res.json({ url, kind });
      } catch (uploadErr) {
        res.status(500).json({ error: (uploadErr as Error).message || 'העלאה נכשלה' });
      }
    })();
  });
});

export default router;
