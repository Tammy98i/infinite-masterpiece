# Infinite Masterpiece — VOD Platform

פלטפורמת VOD מחוברת לאתר שיווק. אפיון: [`docs/SPEC-VOD-PLATFORM.md`](docs/SPEC-VOD-PLATFORM.md)

## פיתוח מקומי

```bash
cp .env.example .env
npm install
npm run dev
```

- אתר: http://localhost:3000  
- API: http://localhost:3001 (proxy דרך Vite)

**חשבונות דמו** (אחרי seed): ראו `server/db/catalogSeed.ts`

## בדיקות

```bash
npm run lint
npm run a11y:generate-captions
npm run dev          # טרמינל 1
npm run a11y:smoke   # טרמינל 2
```

## Production (שבוע 1)

**אל תריצו את ה-API על Vercel.** SQLite והעלאות וידאו (עד 400MB) דורשים תהליך Node עם דיסק קבוע. פירוט: [`docs/DEPLOY.md`](docs/DEPLOY.md)

### פיצול מומלץ: Vercel (SPA) + Railway/Fly/VM (API)

1. פריסת Vercel מה-repo — `vercel.json` מגיש רק את ה-SPA (אין proxy ל-`/api`)
2. ב-Vercel (build): `VITE_API_URL=https://api.your-domain.co.il`
3. על שרת ה-API: `SERVE_SPA=false`, `APP_URL` = דומיין האתר, `PUBLIC_UPLOAD_ORIGIN` = דומיין ה-API, `CORS_ORIGINS` כולל את האתר

### Docker (שרת יחיד)

```bash
cp .env.production.example .env
# ערכו APP_URL, A11Y_*, Stripe, S3
npm run build:prod
docker compose up --build -d
```

Health: `GET /api/health`

### סקריפטים

| פקודה | תיאור |
|--------|--------|
| `npm run build:prod` | build + lint |
| `npm run start:prod` | שרת יחיד (API + SPA מ-`dist/`) |

### מסמכי השקה

- [`docs/DEPLOY.md`](docs/DEPLOY.md) — Vercel + API / Docker
- [`docs/PRODUCTION-LAUNCH-PLAN.md`](docs/PRODUCTION-LAUNCH-PLAN.md) — 3 שבועות
- [`docs/PRODUCTION-A11Y-CHECKLIST.md`](docs/PRODUCTION-A11Y-CHECKLIST.md)
- [`docs/A11Y-OPERATIONS.md`](docs/A11Y-OPERATIONS.md)

## מבנה

- `src/` — React SPA (שיווק + `/library`)
- `server/` — Express API + SQLite
- `public/captions/` — WebVTT

## הפרדת מוצרים

- **מסלול 8888** → `/pricing` (אמיצים / הססנים)
- **מנוי ספרייה** → `/library-membership`
- Paywall: «פתיחת גישה» ≠ «בדיקת התאמה»
