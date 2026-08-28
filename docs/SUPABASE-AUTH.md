# Supabase Auth — Infinite Masterpiece

שני דברים שונים ב-Supabase, שניהם מחוברים בקוד:

1. **התחברות לאתר** — Google / אימייל דרך **Authentication → Sign In / Providers**.
2. **OAuth Server** — האתר שלנו כספק זהות לאפליקציות אחרות. דף האישור: `/oauth/consent`.

בלי מפתחות נשארת ההתחברות המקומית (`admin@infinitemasterpiece.local` / `Masterpiece88` עם `npm run dev`).

## מה חובר בקוד

1. כפתור «התחברות עם Google» כשיש URL+anon (build-time `VITE_*` או runtime מ־`GET /api/auth/providers`).
2. אחרי Google חוזרים ל־`/auth/callback`. מקומית Express מסנכרן ל-SQLite. ב-Vercel יש פונקציות `api/auth/*` בלי SQLite, ואם גם הן חסומות — הסשן נשמר ישירות מ-Supabase בדפדפן.
3. אפליקציה חיצונית שמתחברת דרך OAuth Server מגיעה ל־`/oauth/consent?authorization_id=…` (אישור / דחייה).
4. האימייל `tam98iiy@gmail.com` מקבל תפקיד admin כשאין שורת `profiles`. אפשר להוסיף עוד ב־`VITE_ADMIN_EMAILS`.
5. SQL לפרופילים: [`supabase/profiles.sql`](../supabase/profiles.sql).

## הקמה (פעם אחת)

### 1. מפתחות

פרויקט: `bjhxluqeyjdioebtuvob`.

**Project Settings → API**: Project URL + `anon` `public`.

ב-`.env` המקומי **וב-Vercel → Environment Variables** (Production + Preview):

```bash
VITE_SUPABASE_URL="https://bjhxluqeyjdioebtuvob.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_URL="https://bjhxluqeyjdioebtuvob.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
```

`VITE_*` נדרשים ב-build כדי שכפתור Google יופיע מיד. `SUPABASE_*` מספיקים לפונקציות Vercel בזמן ריצה.

ב-SQL Editor הריצי את [`supabase/profiles.sql`](../supabase/profiles.sql).

### 2. Google — כניסה לאתר

זה **לא** מסך OAuth Server. זה **Authentication → Sign In / Providers**.

1. גללי **למעלה** ל-Google (לא LinkedIn/X).
2. Enable Google.
3. ב-[Google Cloud Console](https://console.cloud.google.com/apis/credentials) צרי OAuth 2.0 Client (Web application):
   - Authorized JavaScript origins: `https://bjhxluqeyjdioebtuvob.supabase.co` + `http://localhost:3000`
   - Authorized redirect URI: `https://bjhxluqeyjdioebtuvob.supabase.co/auth/v1/callback`
4. הדביקי Client ID + Client Secret במסך Google ב-Supabase.

### 3. OAuth Server — האתר כספק זהות

כבר הופעל אצלכם (Site URL `http://localhost:3000`, Authorization Path `/oauth/consent`).

- הקוד מגיש את `/oauth/consent`.
- בפריסה חיה עדכני Site URL לדומיין החי (או הוסיפי אותו ב-URL Configuration).
- **Allow Dynamic OAuth Apps** דלוק — אפליקציות יכולות להירשם דרך ה-API. כבו אם לא צריך.

### 4. כתובות חזרה

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000` בפיתוח; בפריסה הדומיין החי.
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/oauth/consent`
  - `https://infinite-masterpiece-lovat.vercel.app/auth/callback`
  - `https://*.vercel.app/auth/callback`
  - `https://*.vercel.app/oauth/consent`

### 5. אימייל בפיתוח

Authentication → Providers → Email: כבו Confirm email אם רוצים להיכנס בלי מייל אישור.

הריצי מחדש `npm run dev`, וב-Vercel Redeploy אחרי שמירת המשתנים.

## אדמין אחרי Google

`admin@infinitemasterpiece.local` הוא סיד מקומי, לא משתמש Google.

ה-Gmail של המייסדת מקבל admin אוטומטית בנתיב Vercel/Supabase. מקומית עם SQLite:

```sql
UPDATE users SET role = 'admin' WHERE email = 'tam98iiy@gmail.com';
UPDATE public.profiles SET role = 'admin' WHERE email = 'tam98iiy@gmail.com';
```

## בדיקה מקומית

```bash
curl http://localhost:3001/api/auth/providers
# {"local":true,"supabase":true,...}
```

## Vercel

`vercel.json` מגיש את ה-SPA. `api/auth/login` + `providers` / `supabase` / `me` / `logout` רצים כפונקציות. בלי מפתחות Supabase, חשבונות הדמו (`admin@infinitemasterpiece.local` / `Masterpiece88`) נכנסים בפריוו לבד — גם אם Deployment Protection חוסם את `/api`.

קטלוג הספרייה נופל לתוכן הסטטי אם אין Express. Google עדיין דורש את המפתחות בסעיף 1.
