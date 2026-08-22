# תפעול נגישות — Infinite Masterpiece

מסמך זה משלים את `/accessibility` ואת קוד הווידג'ט. **אינו** מחליף חוות דעת ממורשה נגישות השירות.

**לפני production:** [`PRODUCTION-A11Y-CHECKLIST.md`](./PRODUCTION-A11Y-CHECKLIST.md)

## רכז/ת נגישות

1. מלאו שם ופרטי קשר אמיתיים ב-`.env`:
   - `A11Y_COORDINATOR_NAME` / `VITE_A11Y_COORDINATOR_NAME`
   - `A11Y_CONTACT_PHONE` / `VITE_A11Y_CONTACT_PHONE`
   - `A11Y_CONTACT_PHONE_DISPLAY` (לתצוגה בהצהרה)
2. עדכנו `A11Y_STATEMENT_UPDATED` / `VITE_A11Y_STATEMENT_UPDATED` בכל שינוי מהותי.

## טיפול בפניות נגישות

| שלב | פעולה |
|-----|--------|
| קבלה | טופס ב-`/accessibility` → `accessibility_reports` + התראה באדמין |
| מעקב | פאנל משפטי באדמין — סטטוס `open` / `in_progress` / `resolved` |
| יעד | תגובה ראשונית תוך `A11Y_RESPONSE_DAYS` (ברירת מחדל 14) |
| סגירה | תיעוד `admin_notes` + `resolved_at` |

## חוות דעת מורשה

- הזמינו **מורשה נגישות השירות** לביקורת על HTML, PDF, נגן וידאו והצהרה.
- עדכנו `A11Y_LAST_AUDIT_DATE` לאחר ביקורת.
- שמרו את המסמך החתום מחוץ ל-repo (או ב-storage פרטי).

## כיתוביות ו-alt

- **כיתוביות:** העלאת `.vtt` לכל פרק (אדמין / מרצה). עד אז — `he-placeholder.vtt`.
- **תמונות:** alt משמעותי בהעלאה; תמונות דקורטיביות בתוך כפתור עם `aria-label` — `alt=""` + `aria-hidden`.

## בדיקות תקופתיות

```bash
npm run lint
npm run a11y:generate-captions   # יצירת stubs ל-public/captions/episodes/
npm run a11y:smoke               # דורש dev server על :3000
npm run a11y:audit               # HTML סטטי בלבד (SPA)
```

בדיקה ידנית: Tab, skip-link, `Alt+A`, NVDA/VoiceOver על `/`, `/library`, `/accessibility`, נגן עם CC.

## מה לא משתמשים בו

לא מתקינים «נגיש בקליק», UserWay, accessiBe או overlay דומה — ראו `.cursor/skills/israeli-accessibility-compliance/`.
