# AGENTS.md

## Cursor Cloud specific instructions

Infinite Masterpiece is a single VOD learning platform (React SPA + Express API), not a monorepo. See `README.md` and `docs/SPEC-VOD-PLATFORM.md` for product details, and `package.json` for the full list of scripts.

### Runtime requirements (non-obvious)
- **Node.js 22+ is mandatory.** The API uses the built-in `node:sqlite` module (`DatabaseSync`) instead of a native SQLite dependency, so older Node versions will fail to boot the server. The VM already has Node 22.
- There is **no external database**. SQLite lives inside the API process at `server/data/onboarding.db` (WAL mode) and **auto-creates its schema and seeds demo data on first API boot** — no migration or DB container step is needed.
- Copy `.env.example` to `.env` before running (all integrations can stay empty). Stripe, S3 uploads, email/Resend, CRM webhook, and Gemini are all feature-flagged off when their env vars are blank; the app runs fully without them (leads are captured, uploads go to local disk `server/data/uploads`).

### Running services
- `npm run dev` runs **both** processes concurrently via `concurrently`: the Express API on port **3001** and the Vite dev server on port **3000**. Vite proxies `/api` and `/uploads` to the API, so use **http://localhost:3000** in the browser. Run this in a persistent (tmux) terminal since it is long-running.
- `npm run server` runs the API alone; `npm run start:prod` runs the production monolith (API + built SPA) on port 3000.
- Health check: `GET /api/health` (works directly on `:3001` and through the Vite proxy on `:3000`).

### Seeded demo accounts (from `server/db/catalogSeed.ts`)
- Admin: `admin@infinitemasterpiece.local` / `Masterpiece88`
- Founder/lecturer/other demo accounts also use password `Masterpiece88` (`gal@`, `tami@`, `lecturer@infinitemasterpiece.local`).
- Note: logging in as admin redirects to the admin dashboard (`/library/admin`); navigate to `/library` for the Netflix-style catalog.

### Lint / test
- `npm run lint` is a TypeScript typecheck (`tsc --noEmit`); there is no separate unit-test framework.
- `npm run a11y:smoke` is an HTTP smoke test that **requires the dev server to already be running** on port 3000 (start `npm run dev` first, then run it in a second terminal).
- `npm run test:hosting` verifies the Vercel split-hosting config.
