# Supabase Auth — Infinite Masterpiece

שני דברים שונים ב-Supabase, שניהם מחוברים בקוד:

1. **התחברות לאתר** — אימייל+סיסמה, טלפון (OTP), ו-Google דרך **Authentication → Providers**.
2. **OAuth Server** — האתר שלנו כספק זהות לאפליקציות אחרות. דף האישור: `/oauth/consent`.

בלי מפתחות שרת נשארת גם כניסת הדמו בפריוו (`admin@infinitemasterpiece.local` / `Masterpiece88`).

## מה חובר בקוד

1. חלון התחברות: **אימייל וסיסמה** הוא הנתיב הראשי (`signUp` / `signInWithPassword`, כולל אימות סיסמה ו«שכחתי סיסמה»). טלפון שולח OTP ב-SMS (`signInWithOtp` / `verifyOtp`). Google הוא כפתור משני מתחת למפריד «או».
2. הסשן נשמר ב-Supabase (`persistSession` + `onAuthStateChange`). רענון הדף לא מנתק. התנתקות: `supabase.auth.signOut()`.
3. אחרי אישור מייל / איפוס סיסמה / Google חוזרים ל־`/auth/callback`. איפוס סיסמה ממשיך ל־`/auth/reset`. מקומית Express מסנכרן ל-SQLite. ב-Vercel יש פונקציות `api/auth/*` בלי SQLite, ואם גם הן חסומות — הסשן נשמר ישירות מ-Supabase בדפדפן.
4. אפליקציה חיצונית שמתחברת דרך OAuth Server מגיעה ל־`/oauth/consent?authorization_id=…` (אישור / דחייה).
5. מיילים כאדמין: באדמין → משתמשים → «מיילים עם הרשאת אדמין», או בקובץ `src/data/adminEmails.ts`.
6. SQL לפרופילים: [`supabase/profiles.sql`](../supabase/profiles.sql).

## הקמה (פעם אחת)

### 1. מפתחות

פרויקט: `bjhxluqeyjdioebtuvob`. ה-URL וה-anon הציבוריים מחוברים בקוד (`src/lib/supabasePublic.ts`), כך שהתחברות אימייל/סיסמה מופיעה גם בלי משתני Vercel.

טבלת `public.profiles` כבר נוצרה בפרויקט.

**Project Settings → API**: Project URL + `anon` `public`.

ב-`.env` המקומי **וב-Vercel → Environment Variables** (Production + Preview):

```bash
VITE_SUPABASE_URL="https://bjhxluqeyjdioebtuvob.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_URL="https://bjhxluqeyjdioebtuvob.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
```

`VITE_*` נדרשים ב-build. `SUPABASE_*` מספיקים לפונקציות Vercel בזמן ריצה.

ב-SQL Editor כבר רצה [`supabase/profiles.sql`](../supabase/profiles.sql).

### 2. אימייל וסיסמה

Authentication → Providers → **Email** דלוק.

כבו **Confirm email** כדי שאחרי הרשמה אפשר להיכנס מיד עם האימייל והסיסמה (בלי לחכות למייל אישור). אם Confirm נשאר דלוק, אחרי הרשמה נשלח קישור ל־`/auth/callback`.

### 3. טלפון (הרשמה / כניסה עם קוד)

Authentication → Providers → **Phone**: הפעילו.

ספק ה-SMS בפרויקט הוא Twilio. באותו מסך מלאו Twilio Account SID, Auth Token, ומספר שולח. בלי זה הקוד לא יישלח.

מספרים באתר: E.164, למשל `+972501234567`. גם `05XXXXXXXX` מתקבל ומומר אוטומטית.

### 4. Google (אופציונלי)

הופעל. Authentication → Sign In / Providers → Google.

Redirect ב-Google Cloud: `https://bjhxluqeyjdioebtuvob.supabase.co/auth/v1/callback`

### 5. OAuth Server — האתר כספק זהות

כבר הופעל אצלכם (Site URL `http://localhost:3000`, Authorization Path `/oauth/consent`).

- הקוד מגיש את `/oauth/consent`.
- בפריסה חיה עדכני Site URL לדומיין החי (או הוסיפי אותו ב-URL Configuration).
- **Allow Dynamic OAuth Apps** דלוק — אפליקציות יכולות להירשם דרך ה-API. כבו אם לא צריך.

### 6. כתובות חזרה

**Authentication → URL Configuration**

- Site URL: `http://localhost:3000` בפיתוח; בפריסה הדומיין החי.
- Redirect URLs:
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/reset`
  - `http://localhost:3000/oauth/consent`
  - `https://infinite-masterpiece.vercel.app/auth/callback`
  - `https://*.vercel.app/auth/callback`
  - `https://*.vercel.app/auth/reset`
  - `https://*.vercel.app/oauth/consent`

הריצי מחדש `npm run dev`, וב-Vercel Redeploy אחרי שמירת המשתנים.

## אדמין

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

קטלוג הספרייה נופל לתוכן הסטטי אם אין Express. אימייל/סיסמה ו-Google עובדים בפריוו בלי משתני Vercel (ה-anon הציבורי בקוד). הרשמת טלפון דורשת שספק Phone+SMS יהיה דלוק ב-Supabase.
