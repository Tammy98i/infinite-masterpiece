import { Router } from 'express';
import { getSetting } from '../services/settingsService.js';
import { getAccessibilityPublicConfig } from '../config/accessibility.js';
import { createAccessibilityReport } from '../services/accessibilityReportService.js';

const router = Router();

const DEFAULTS: Record<string, string> = {
  terms: `ברוכים הבאים ל-Infinite Masterpiece. השימוש באתר ובשירותים המוצעים בו כפוף לתנאים המפורטים להלן.

1. כללי
האתר מהווה פלטפורמה להרשמה לתוכנית הליווי, ואין לראות בתכניו כהבטחה לתוצאות פיננסיות מסוימות.

2. תנאי הצטרפות
ההרשמה למסלולים השונים כפופה לתהליך סינון ובדיקת התאמה.

3. מדיניות ביטולים
ביטולים והחזרים יתאפשרו בהתאם לחוק הגנת הצרכן ולמדיניות שתימסר טרם ביצוע התשלום.`,
  privacy: `מדיניות הפרטיות של Infinite Masterpiece.

אנו אוספים פרטי קשר ותשובות לשאלונים לצורך בדיקת התאמה, תפעול המסלולים ושיפור השירות.

המידע לא יועבר לצדדים שלישיים אלא אם נדרש לצורך סליקה, תפעול או חובה חוקית.`,
  raffle: `תקנון הגרלות Infinite Masterpiece.

כרטיסי הגרלה מוענקים לפי מסלול הכניסה. מסלול האמיצים מקבל שני כרטיסים, ומסלול ההססנים מקבל כרטיס אחד.

פרסום הגרלה ותוצאות יתבצע רק לאחר אישור משפטי.`,
};

router.get('/accessibility-config', (_req, res) => {
  res.json(getAccessibilityPublicConfig());
});

router.post('/accessibility-report', (req, res) => {
  try {
    const report = createAccessibilityReport({
      fullName: String(req.body?.fullName || ''),
      email: String(req.body?.email || ''),
      phone: String(req.body?.phone || ''),
      pageUrl: String(req.body?.pageUrl || req.headers.referer || ''),
      message: String(req.body?.message || ''),
    });
    res.status(201).json({ ok: true, report });
  } catch (err) {
    const status = (err as { status?: number }).status || 500;
    res.status(status).json({ error: (err as Error).message });
  }
});

router.get('/:page', (req, res) => {
  const page = String(req.params.page || '');
  if (page === 'accessibility-config') {
    res.status(404).json({ error: 'עמוד לא נמצא' });
    return;
  }
  const keyMap: Record<string, string> = {
    terms: 'legal_terms',
    privacy: 'legal_privacy',
    raffle: 'legal_raffle',
  };
  const settingKey = keyMap[page];
  if (!settingKey) {
    res.status(404).json({ error: 'עמוד לא נמצא' });
    return;
  }
  const stored = getSetting(settingKey);
  res.json({
    page,
    content: stored || DEFAULTS[page] || '',
    updated: Boolean(stored),
  });
});

export default router;
