import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { SITE_NAME } from '../../constants/brand';
import { fetchAccessibilityConfig, type AccessibilityPublicConfig } from '../../api/accessibility';
import { AccessibilityReportForm } from '../../components/AccessibilityReportForm';

export function AccessibilityStatement() {
  const [config, setConfig] = useState<AccessibilityPublicConfig | null>(null);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    fetchAccessibilityConfig()
      .then(setConfig)
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'טעינה נכשלה'));
  }, []);

  const phoneHref = config?.phoneHref || '';
  const phoneDisplay = config?.phoneDisplay || config?.phone || '';

  return (
    <article dir="rtl" lang="he" className="min-h-screen bg-transparent pt-32 pb-24">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-white mb-8">הצהרת נגישות</h1>

        {loadError ? <p className="text-sm text-rose-300 mb-6">{loadError}</p> : null}

        <div className="prose prose-invert prose-slate max-w-none text-slate-400 leading-relaxed space-y-8">
          <section>
            <h2 className="text-xl font-semibold text-white mb-4">התחייבות לנגישות</h2>
            <p>
              אנחנו ב-{SITE_NAME} מחויבים להנגשת האתר, הספרייה והשירותים הדיגיטליים לאנשים עם מוגבלויות,
              בהתאם לחוק שוויון זכויות לאנשים עם מוגבלויות והתקנות להתאמות נגישות לשירות, ולתקן הישראלי{' '}
              {config?.standard || 'ת"י 5568 / WCAG 2.0 AA'}.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">אמצעי נגישות באתר</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>ניווט מלא באמצעות מקלדת, כולל קישורי דילוג לתוכן הראשי</li>
              <li>הגדרת שפה עברית (<code dir="ltr">lang=&quot;he&quot;</code>) וכיוון RTL</li>
              <li>תמיכה בקוראי מסך (NVDA, JAWS, VoiceOver) — מובנית באתר, לא «מצב קורא מסך» מלאכותי</li>
              <li>תמונות מלוות בטקסט חלופי, ככל שניתן (לא נוצר אוטומטית ב-AI)</li>
              <li>ניגודיות צבעים בהתאם ל-WCAG 2.0 AA</li>
              <li>טופס דיווח נגיש, מעקב פניות ורכז/ת נגישות</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">כלי העדפות נגישות (Alt+A)</h2>
            <p className="mb-3">
              כפתור צף לנוחות המשתמש/ת בלבד. הוא מפעיל <strong>העדפות תצוגה</strong> (CSS על הדף) ואינו
              מחליף הנגשה מלאה. <strong>לא משתמשים</strong> בתוספי overlay כמו «נגיש בקליק», UserWay או accessiBe.
            </p>
            <p className="text-white/80 mb-2">מתגים זמינים בווידג&apos;ט:</p>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>ניגודיות (רגיל / גבוה / כהה / בהיר / היפוך / שחור-לבן)</li>
              <li>רוויית צבעים (רגיל / נמוכה / גבוהה)</li>
              <li>גודל טקסט, ריווח שורות, גופן קריא</li>
              <li>הדגשת קישורים וכותרות</li>
              <li>כפתורים גדולים, השתקת מדיה, עצירת אנימציות</li>
              <li>סמן מותאם (שחור / גדול)</li>
              <li>לשונית «מבנה דף» — רשימת ציוני דרך וכותרות לקפיצה (ללא שכתוב DOM)</li>
            </ul>
            <p className="mt-3 text-sm text-slate-500">
              קיצור: Alt+A לפתיחת התפריט (לא Control-F10/F11 — שמורים לתוספים אחרים).
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">מה הדפדפן וקורא המסך מספקים</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>הקראת טקסט, זום ופקודות קוליות — יכולות מערכת ההפעלה / הדפדפן</li>
              <li>ניווט מקלדת — מובנה באתר; אין «ניווט חכם» במקשים נומריים</li>
              <li>כתוביות לווידאו — WebVTT לכל פרק (קובץ ייעודי + העלאה באדמין/מרצה); לא נוצרות ב-AI</li>
              <li>תיאור תמונות — alt משמעותי בתוכן; תמונות דקורטיביות מסומנות בהתאם</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">מה לא נכלל בווידג&apos;ט (בכוונה)</h2>
            <ul className="list-disc list-inside space-y-2 text-sm">
              <li>«התאמה לקורא מסך» / שכתוב ARIA אוטומטי</li>
              <li>תיאור תמונות או כיתוביות ב-AI</li>
              <li>מילון, מקלדת וירטואלית, חלון קריאה נפרד</li>
              <li>ניטור אוטומטי שוטף או תג «תואם WCAG» מתוסף צד שלישי</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">מגבלות נגישות ידועות</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>נגן וידאו: כתוביות WebVTT לכל פרק; כתוביות מלאות מותאמות לתוכן מועלות ידנית. חלק מהפקדים תלויים בספק הווידאו.</li>
              <li>מסמכים דיגיטיים להורדה (PDF וכד&apos;) — ייתכן שטרם הונגשו במלואם לפי ת&quot;י 5568 חלק 2.</li>
              <li>אנימציות ואפקטים ויזואליים — ניתן להפחית באמצעות כלי ההעדפות, לא תמיד להסיר לחלוטין.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">פנייה בנושא נגישות</h2>
            <p>רכז/ת הנגישות: {config?.coordinatorName || `צוות ${SITE_NAME}`}</p>
            <ul className="list-none space-y-2 mt-3">
              {phoneHref && phoneDisplay ? (
                <li>
                  <span className="text-white/70">טלפון: </span>
                  <a href={phoneHref} dir="ltr" className="text-[#C8A24C] hover:text-[#F7E7B5]">
                    {phoneDisplay}
                  </a>
                </li>
              ) : (
                <li className="text-sm text-amber-200/80">
                  מספר טלפון לנגישות — יפורסם לאחר עדכון בהגדרות המערכת.
                </li>
              )}
              <li>
                <span className="text-white/70">דוא&quot;ל: </span>
                <a
                  href={`mailto:${config?.email || 'negishot@infinite-masterpiece.co.il'}`}
                  className="text-[#C8A24C] hover:text-[#F7E7B5]"
                >
                  {config?.email || 'negishot@infinite-masterpiece.co.il'}
                </a>
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">דיווח על מחסום נגישות</h2>
            <p className="mb-4">
              ניתן לדווח על בעיית נגישות בטופס, בדוא&quot;ל או בטלפון. כל פנייה נרשמת במערכת לצורך מעקב וטיפול.
            </p>
            <AccessibilityReportForm />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4">הליך טיפול בפניות</h2>
            <ul className="list-disc list-inside space-y-2">
              <li>פנייה נקלטת ומקבלת מספר מזהה פנימי. רכז/ת הנגישות בודק/ת את הדיווח.</li>
              <li>
                מטרתנו להשיב תוך {config?.responseDays || 14} ימי עסקים. במקרים מורכבים הטיפול עשוי להימשך,
                ולא יאוחר מ-60 יום מקבלת הודעת תיקון — בהתאם לדין.
              </li>
              <li>לאחר תיקון, נעדכן את המגבלות הידועות בהצהרה זו.</li>
              <li>
                אם לא קיבלתם מענה מספק, ניתן לפנות לנציבות שוויון זכויות לאנשים עם מוגבלות —
                <a
                  href="https://www.gov.il/he/departments/moj_disability_rights/govil-landing-page"
                  className="text-[#C8A24C] hover:text-[#F7E7B5] underline ms-1"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  באתר הנציבות
                </a>
                .
              </li>
            </ul>
          </section>

          <section>
            <p>
              <span className="text-white/70">תאריך ביקורת הנגישות האחרונה: </span>
              {config?.lastAuditDate || '22 באוגוסט 2026'}
            </p>
            <p>
              <span className="text-white/70">תאריך עדכון ההצהרה: </span>
              {config?.statementUpdated || '22 באוגוסט 2026'}
            </p>
          </section>

          <p>
            <Link to="/" className="text-[#C8A24C] hover:text-[#F7E7B5] underline">
              חזרה לדף הבית
            </Link>
          </p>
        </div>
      </div>
    </article>
  );
}
