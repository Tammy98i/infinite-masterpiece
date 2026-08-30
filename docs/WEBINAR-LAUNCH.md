# השקת משפך וובינר לפרודקשן

מסמך זה הוא רשימת הפעלה לפני פתיחת מודעות בתשלום.

## ארכיטקטורה

```
מודעה → /webinar → טופס → api/webinar/register
  → Supabase (webinar_registrations)
  → Zoom (registrant + join URL)
  → Resend (אישור)
  → /webinar/thank-you
  → יומן / וואטסאפ
  → Cron תזכורות 24ש / 1ש / 15ד
  → Zoom Webhook → נוכחות → מייל אחרי הערב
```

## מה להריץ ב־Supabase

1. לפתוח SQL Editor.
2. להריץ את הקובץ `supabase/webinar.sql`.
3. לוודא שקיימת שורה ב־`webinars` עם `id = 'default'`.

## משתני סביבה ב־Vercel (Production)

חובה:
- `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY`
- `RESEND_API_KEY` + `EMAIL_FROM` (דומיין מאומת)
- `APP_URL` = כתובת הפרודקשן

מומלץ לפני מודעות:
- `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBINAR_ID`
- `ZOOM_WEBHOOK_SECRET_TOKEN`
- `CRON_SECRET`
- `VITE_GA4_ID`, `VITE_META_PIXEL_ID`, `VITE_CLARITY_ID`

אופציונלי:
- `WEBINAR_WEBHOOK_URL` (CRM)
- `WEBINAR_FULL_ATTENDANCE_PCT`, `WEBINAR_PARTIAL_ATTENDANCE_PCT`

אחרי שינוי `VITE_*` חובה Redeploy.

## Zoom

1. ליצור Server-to-Server OAuth App ב־Zoom Marketplace.
2. להעתיק Account ID / Client ID / Client Secret.
3. ליצור Webinar ולשמור את ה־Webinar ID.
4. Webhook endpoint בפרודקשן:
   `https://<domain>/api/webinar/webhooks/zoom`
5. להדביק Secret Token ל־`ZOOM_WEBHOOK_SECRET_TOKEN`.
6. לאפשר אירועי participant join/leave ו־webinar.ended.

## Resend

1. לאמת דומיין שולח.
2. להגדיר SPF / DKIM / DMARC.
3. לבדוק מייל בדיקה מאדמין (Express) או הרשמה אמיתית.

## בדיקת קצה־לקצה לפני מודעות

1. לפתוח `/webinar?utm_source=meta&utm_campaign=test&fbclid=test123`
2. להירשם עם מייל אמיתי.
3. לוודא שורה ב־Supabase + Zoom registrant.
4. לוודא מייל אישור.
5. לוודא דף תודה + יומן + CompleteRegistration פעם אחת.
6. לרענן דף תודה — בלי כפילות המרה.
7. להריץ כפילות מייל — `alreadyRegistered` בלי רשומה כפולה.
8. לבדוק honeypot (שדה `website`) לא יוצר ליד אמיתי.

## Cron

- נתיב: `/api/cron/webinar-reminders`
- לוח: כל 15 דקות (`vercel.json`)
- אימות: `Authorization: Bearer $CRON_SECRET`

## סיכונים אם חסר מפתח

| חסר | תוצאה |
|-----|--------|
| `SUPABASE_SERVICE_ROLE_KEY` | הרשמה ב־Vercel מחזירה 503 |
| `RESEND_API_KEY` | אין מיילי אישור/תזכורות |
| Zoom | הרשמה נשמרת, בלי join URL ייחודי |
| Webhook Zoom | אין נוכחות/סגמנטציה אוטומטית |
| `VITE_META_PIXEL_ID` | אין Lead/CompleteRegistration למטא |

## WhatsApp

כרגע: קישור לקבוצה שקטה בלבד (לא API).
שכבת ערוצים מוכנה להרחבה בעתיד בלי לשבור את הרישום.
