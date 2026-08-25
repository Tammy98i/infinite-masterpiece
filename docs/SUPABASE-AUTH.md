# Supabase Auth — Infinite Masterpiece

## מה חובר בקוד

1. Frontend: אם מוגדרים `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` — התחברות/הרשמה עוברות ב-Supabase.
2. אחרי login ב-Supabase, השרת מסנכרן לטבלת `users` המקומית (`POST /api/auth/supabase`) ויוצר session כמו היום.
3. תפקידים (admin / מרצה / מנוי) ממשיכים להתנהל באדמין על המשתמש המקומי.
4. SQL לפרופילים ב-Supabase: [`supabase/profiles.sql`](../supabase/profiles.sql).

בלי מפתחות Supabase — נשארת התחברות המקומית הרגילה.

## הקמה (פעם אחת)

1. צרי פרויקט ב-[supabase.com](https://supabase.com).
2. **Settings → API**: העתיקי Project URL + `anon` `public` key.
3. הוסיפי ל-`.env` (לוקאל) ול-Vercel Env:

```bash
VITE_SUPABASE_URL="https://xxxx.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJ..."
SUPABASE_URL="https://xxxx.supabase.co"
SUPABASE_ANON_KEY="eyJ..."
```

4. ב-Supabase SQL Editor הריצי את [`supabase/profiles.sql`](../supabase/profiles.sql).
5. **Authentication → Providers**: Email מופעל. לביטול אימות מייל בפיתוח: Authentication → Providers → Email → Disable "Confirm email".
6. הריצי מחדש `npm run server` + Vite (או redeploy).

## יצירת אדמין אחרי Supabase

1. הירשמי באתר עם האימייל שלך (Supabase).
2. התחברי כ-admin מקומי ישן **או** עדכני ב-DB:

```sql
-- SQLite מקומי
UPDATE users SET role = 'admin' WHERE email = 'your@email.com';
```

או באדמין → משתמשים → שינוי תפקיד (אם יש לך כבר אדמין אחר).

## בדיקה

```bash
curl http://localhost:3001/api/auth/providers
# {"local":true,"supabase":true}
```

## הערה על Vercel

Supabase Auth לבד לא מפעיל את ה-API של הקטלוג. עדיין צריך שרת Node לייב (או מיגרציה מלאה ל-Postgres). השלב הזה מחבר **זיהוי יוזרים**; השלב הבא הוא DB מלא.
