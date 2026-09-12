# Base44 Dev Environment

## Stack
- **Frontend**: Vite 6 + React 19 SPA (Hebrew, RTL), served on port 3000
- **Backend**: Express API on port 3001 (tsx server/index.ts), auto-proxied by Vite (`/api`, `/uploads`)
- **Database**: SQLite via Node built-in `node:sqlite` (auto-created & seeded on first boot at `server/data/onboarding.db`)
- **Dev command**: `npm run dev` (concurrently runs API + Vite)

## Running
```bash
docker compose -f docker-compose.base44.yml up -d
```
- Single `node:22-alpine` service, source bind-mounted at `/app`
- `npm install` runs at container start, then `npm run dev`
- Health: `GET /api/health` (proxied through Vite)
- `node:sqlite` works without `--experimental-sqlite` flag on Node 22.23+ (prints a warning only)

## External Services (all optional — app boots without them)
- Stripe, S3, Resend, Zoom, Supabase, Gemini — all have graceful fallbacks when env vars are empty
- No secrets required to boot the app in development mode

## Demo Accounts (seeded on first boot)
- Admin: `admin@infinitemasterpiece.local`
- Lecturers: `gal@`, `tami@`, `lecturer@` `@infinitemasterpiece.local`
- See `server/db/catalogSeed.ts` for passwords

## File Watching
- `CHOKIDAR_USEPOLLING=true` is set for bind-mount compatibility
- Vite `allowedHosts: true` accepts the preview origin
