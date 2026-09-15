# Base44 Dev Environment

## Stack
- **Frontend**: Vite 6 + React 19 + Tailwind 4 (TypeScript), served on port 3000
- **Backend**: Express API on port 3001 (run via `tsx`), auto-seeds SQLite on first boot
- **Database**: Node built-in `node:sqlite` (`server/data/onboarding.db`) — requires Node 22+
- **Dev command**: `npm run dev` runs both via `concurrently` (Vite proxies `/api` → `:3001`)

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Single `node:22-alpine` service, source bind-mounted, `node_modules` in a named volume.
- `npm install` runs at container start, then `npm run dev`.
- Vite has `allowedHosts: true` — no host allowlist needed.
- Health check: `GET /api/health` (returns JSON with service status).

## Secrets
- All external services (Stripe, S3, Resend, Supabase, Gemini, Zoom) are **optional** — the app boots and runs in degraded/lead-only mode without them.
- `.env.base44-defaults` holds dev placeholders; `/run/base44/app.env` (platform-managed) overrides them.
- `GEMINI_API_KEY` has a dev placeholder so AI features won't crash on import, but AI calls won't work until a real key is provided.

## Demo accounts (auto-seeded)
- Admin: `admin@infinitemasterpiece.local` / `Masterpiece88`
- Founder: `gal@infinitemasterpiece.local` / `Masterpiece88`
- Staff: `tami@infinitemasterpiece.local` / `Masterpiece88`
- Lecturer: `lecturer@infinitemasterpiece.local` / `Masterpiece88`

## Notes
- SQLite DB persists in the `vod-data` Docker volume across restarts.
- The repo's own `docker-compose.yml` builds a production image — do NOT use it for dev (it freezes source).
- `npm run lint` = `tsc --noEmit`; `npm test` runs unit tests via `tsx --test`.
