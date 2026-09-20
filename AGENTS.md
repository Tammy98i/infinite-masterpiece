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
- `npm run lint` = `tsc --noEmit`; `npm test` includes the galaxy math/validation and in-memory SQLite CRUD tests.

## Team galaxy
- `/webinar#team-universe` renders the team galaxy; Admin → גלקסיית הצוות manages the separate `team_members` collection.
- `initializeTeamMembers` runs after founder/catalog seeding. A `site_settings.team_members_imported` marker makes this a one-time import; CMS edits and hidden members survive restarts. Only existing founder records plus the webinar's Gleb profile are imported. Initial impact scores are editable presentation defaults, not verified measurements.
- Public `GET /api/team-members` returns active members only. `/api/admin/team-members` GET/POST/PUT uses the existing server-side admin authentication and audit log. Only one active founder is allowed. Images use the existing authenticated `/api/upload` flow.
- Gleb's image is absent from the repository: the new profile starts with an empty photo and renders a gold monogram, not a stock image.
- The Base44 Compose command now uses `tsx watch` alongside Vite so API source edits reload too.
- Explicitly empty VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY must remain empty, not fall back to the project's published Supabase defaults. Otherwise local demo login returns a client-only preview token that cannot authorize API writes. With local defaults, sign out of any old preview-only session and log in again to get a real SQLite session.
- These endpoints are implemented for the Express runtime used by Compose; the separate Vercel serverless API tree does not provide the new Team Members endpoints.

## Homepage SpaceEdu hero
- `SpaceHero` replaces the former homepage `VideoHero` and owns its branded Infinite Masterpiece navigation, original Hebrew hero copy and webinar-phase CTAs alongside the planet-switching state, lazy video loading, entrance sequence, and responsive composition. The regular site Header is hidden on home only; all other routes retain it unchanged.
- Earth is the initial feature; Venus and Mars occupy the left/right slots. Each slot contains all three preloaded cut-out images and switches visibility by class, while non-featured video clips receive a `src` only after selection.
- `SiteBackdropLayout` still provides the persistent static `SkyBackdrop` (user-provided minimalist starfield hosted on `media.base44.com`, `68f8c5a13_image.png`) behind every route. The three planet clips are scoped to the homepage hero and unmount on navigation.
- Reduced motion includes both the OS preference and the accessibility widget's `a11y-reduce-motion` class: clips are hidden in favor of the selected poster and planet transforms/entrance animations are disabled.
- Verify the reversible Earth → Venus → Mars → Earth cycle, initial one-video loading, menu Escape/outside-click closure, and layouts at desktop, tablet, narrow phone, and short landscape.
