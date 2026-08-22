import { Router } from 'express';

const router = Router();

router.post('/', (_req, res) => {
  res.status(403).json({
    error: 'שאלות למרצה אינן פתוחות בשלב זה. גישה לתכנים היא דרך הרשמה למסלול בספרייה.',
  });
});

export default router;
