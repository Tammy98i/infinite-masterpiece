# Supabase Auth — Infinite Masterpiece

התחברות אופציונלית דרך Supabase: אימייל+סיסמה ו־**OAuth עם Google**.

בלי מפתחות — נשארת ההתחברות המקומית (`admin@infinitemasterpiece.local` / `Masterpiece88` עם `npm run dev`).

## מה חובר בקוד

1. Frontend: אם מוגדרים `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — מופיע כפתור «התחברות עם Google», ואימייל/סיסמה עוברים ב-Supabase.
2. אחרי Google חוזרים ל־`/auth/callback`. השרת מסנכרן לטבלת `users` (`POST /api/auth/supabase`) ויוצר session רגיל.
3. תפקידים (admin / מרצה / מנוי) ממשיכים להתנהל באדמין על המשתמש המקומי.
4. SQL לפרופילים: [`supabase/profiles.sql`](../supabase/profiles.sql).

## הקמה (פעם אחת)

### 1. מפתחות

1. פרויקט ב-[supabase.com](https://supabase.com) (אצלכם: `bjhxluqeyjdioebtuvob`).
2. **Project Settings → API**: העתיקי Project URL + `anon` `public` key.
3. הוסיפי ל-`.env` המקומי **ול-Vercel → Environment Variables** (Production + Preview):

```bash
VITE_SUPABASE_URL="https://bjhxluqeyjdioebtuvob.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_URL="https://bjhxluqeyjdioebtuvob.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
```

`VITE_*` נדרשים ב-build של Vercel. `SUPABASE_*` נדרשים בשרת Node.

4. ב-Supabase SQL Editor הריצי את [`supabase/profiles.sql`](../supabase/profiles.sql).

### 2. Google OAuth

1. **Authentication → Sign In / Providers** — גללי **למעלה** ל-Google (לא LinkedIn/X).
2. Enable Google.
3. ב-[Google Cloud Console](https://console.cloud.google.com/apis/credentials) צרי OAuth 2.0 Client (Web application):
   - Authorized JavaScript origins: `https://bjhxluqeyjdioebtuvob.supabase.co` + `http://localhost:3000`
   - Authorized redirect URI: `https://bjhxluqeyjdioebtuvob.supabase.co/auth/v1/callback`
4. הדביקי Client ID + Client Secret במסך Google ב-Supabase.

### 3. כתובות חזרה

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000` בפיתוח, ובפריסה הדומיין החי.
- Redirect URLs (כל אחד בשורה):
  - `http://localhost:3000/auth/callback`
  - `https://infinite-masterpiece-lovat.vercel.app/auth/callback`
  - `https://*.vercel.app/auth/callback`

### 4. אימייל בפיתוח

Authentication → Providers → Email: כבו Confirm email אם רוצים להיכנס בלי מייל אישור.

הריצי מחדש `npm run dev` (או Redeploy ב-Vercel אחרי שמירת המשתנים).

## אדמין אחרי Google

החשבון `admin@infinitemasterpiece.local` הוא סיד מקומי, לא משתמש Google.

1. התחברי פעם אחת עם Google.
2. עדכני תפקיד ב-SQLite המקומי, או מאדמין קיים:

```sql
UPDATE users SET role = 'admin' WHERE email = 'your-gmail@gmail.com';
```

## בדיקה מקומית

```bash
curl http://localhost:3001/api/auth/providers
# {"local":true,"supabase":true}
```

## הערה על Vercel

Vercel מגיש את ה-SPA בלבד. בלי שרת Node חי (`/api/auth/supabase`) ההתחברות עם Google תיעצר אחרי החזרה מ-Google.

- מקומית: `npm run dev` — עובד.
- בפריוויו: צריך API נפרד (Railway/Fly) + `VITE_API_URL` (PR #3), או כניסה מקומית.

Deployment Protection על Preview (401 Protected deployment) גם חוסם את `/api`. כבו זאת ב-Vercel לפריוויו, או התחברו מקומית.
