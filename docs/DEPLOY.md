# פריסה — Vercel (SPA) + API נפרד

האתר הוא SPA. ה-API הוא תהליך Node עם SQLite (או דיסק נפח) והעלאות וידאו עד 400MB.

**אין להריץ את Express על Vercel Serverless.** מגבלות גוף הבקשה וה-timeout ישברו העלאות וידאו, ו-SQLite על מערכת קבצים זמנית יימחק בין בקשות.

## שני מצבי פרודקשן

### 1. שרת יחיד (Docker / `npm run start:prod`)

Express מגיש גם `/api` וגם את `dist/`.

- `APP_URL` — כתובת האתר (Stripe redirect, CORS)
- `PUBLIC_UPLOAD_ORIGIN` — אותה כתובת, או ריק (אותו origin)
- `VITE_API_URL` — **ריק** בזמן `npm run build`
- `SERVE_SPA` — לא חובה (ברירת מחדל: כן ב-production)

### 2. פיצול: Vercel + Railway / Fly / VM

| שירות | מה רץ | משתנים |
|--------|--------|---------|
| **Vercel** | Vite SPA בלבד | `VITE_API_URL=https://api.your-domain.co.il` (בזמן **build**) + `VITE_A11Y_*` |
| **API** | `npm run start:prod` או Docker בלי צורך ב-`dist` | ראו למטה |

על ה-API:

```
NODE_ENV=production
PORT=3000
APP_URL=https://www.your-domain.co.il
CORS_ORIGINS=https://www.your-domain.co.il,https://your-app.vercel.app
PUBLIC_UPLOAD_ORIGIN=https://api.your-domain.co.il
SERVE_SPA=false
```

- `APP_URL` = אתר השיווק (Vercel) — הצלחות Stripe, קישורים במייל
- `PUBLIC_UPLOAD_ORIGIN` = שרת הקבצים (`/uploads`), **לא** דומיין ה-SPA
- עם S3/R2: `S3_*` + `S3_PUBLIC_BASE_URL` — הקבצים לא עוברים דרך הדיסק המקומי
- `CORS_ORIGINS` — כל origin של הדפדפן (פרודקשן + preview)

אל תגדירו ב-`vercel.json` proxy ל-`/api`. העלאת וידאו חייבת ללכת **ישר** ל-API (`VITE_API_URL`).

## פיתוח מקומי

השאירו `VITE_API_URL` ריק. Vite מפנה `/api` ו-`/uploads` ל-`localhost:3001`.

## SQLite

הקובץ `server/data/onboarding.db` חייב להיות על **נפח קבוע**. ב-Vercel הוא לא שורד. ב-Railway/Fly חברו volume ל-`server/data`.

## בדיקה אחרי פריסה

1. `GET https://api…/api/health` — `status: ok`, `serveSpa: false` במצב מפוצל
2. בדפדפן: התחברות, קטלוג, נגן
3. אדמין: העלאת תמונה (ואז וידאו קטן) — ה-URL חייב להיפתח מ-`PUBLIC_UPLOAD_ORIGIN` או מ-S3
