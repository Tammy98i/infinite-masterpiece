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
התחברות Google / Supabase: [`docs/SUPABASE-AUTH.md`](docs/SUPABASE-AUTH.md) (`/auth/callback`, `/oauth/consent`)

## בדיקות

```bash
npm run lint
npm run a11y:generate-captions
npm run dev          # טרמינל 1
npm run a11y:smoke   # טרמינל 2
```

## Production (שבוע 1)

### Docker

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
