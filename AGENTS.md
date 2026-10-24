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
- `npm ci` syncs the lockfile at container start, then `concurrently` runs Vite and `tsx watch` from the bind-mounted source.
- Vite has `allowedHosts: true` — no host allowlist needed.
- The Compose health check probes both the API (`/api/health` on 3001) and the live frontend (`/` on 3000); a healthy API alone does not prove the preview is available.

## Secrets
- All external services (Stripe, S3, Resend, Supabase, Gemini, Zoom) are **optional** — the app boots and runs in degraded/lead-only mode without them.
- `.env.base44-defaults` holds dev placeholders; `/run/base44/app.env` (platform-managed) overrides them.
- `GEMINI_API_KEY` has a dev placeholder so AI features won't crash on import, but AI calls won't work until a real key is provided.

## Demo accounts (auto-seeded)
- Admin: `admin@infinitemasterpiece.local` / `Masterpiece88`
- Founder: `gal@infinitemasterpiece.local` / `Masterpiece88`
- Staff: `tami@infinitemasterpiece.local` / `Masterpiece88`
- Lecturer: `lecturer@infinitemasterpiece.local` / `Masterpiece88`
- Journey member (pod): `journey@infinitemasterpiece.local` / `Masterpiece88`
- Hesitant queue (unassigned): `hesitant@infinitemasterpiece.local` / `Masterpiece88`
- Library-only (not in pod queue): `library@infinitemasterpiece.local` / `Masterpiece88`
- Approved 88 queue: `p88@infinitemasterpiece.local` / `Masterpiece88`
- Gal is captain of the demo journey pod.

## Notes
- SQLite DB persists in the `vod-data` Docker volume across restarts.
- The repo's own `docker-compose.yml` builds a production image — do NOT use it for dev (it freezes source).
- `npm run lint` = `tsc --noEmit`; `npm test` includes the galaxy math/validation and in-memory SQLite CRUD tests.

## Team galaxy
- `/webinar#team-universe` renders the team galaxy; Admin → גלקסיית הצוות manages the separate `team_members` collection.
- `initializeTeamMembers` runs after founder/catalog seeding. A `site_settings.team_members_imported` marker makes this a one-time import; CMS edits and hidden members survive restarts. Only existing founder records plus the webinar's Gleb profile are imported. Initial impact scores are editable presentation defaults, not verified measurements.
- Public `GET /api/team-members` returns active members only. `/api/admin/team-members` GET/POST/PUT uses the existing server-side admin authentication and audit log. Only one active founder is allowed. Images use the existing authenticated `/api/upload` flow.
- Gleb's portrait is `public/team/gleb.jpg`. Supporting galaxy profiles (contributor) render in a smaller row under the founder and leadership, and are inserted once by name so later CMS edits survive restarts.
- The Base44 Compose command now uses `tsx watch` alongside Vite so API source edits reload too.
- Explicitly empty VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY must remain empty, not fall back to the project's published Supabase defaults. Otherwise local demo login returns a client-only preview token that cannot authorize API writes. With local defaults, sign out of any old preview-only session and log in again to get a real SQLite session.
- These endpoints are implemented for the Express runtime used by Compose; the separate Vercel serverless API tree does not provide the new Team Members endpoints.
- Production startup fails fast unless `APP_URL` is HTTPS and Supabase + Resend server credentials are present. Local/demo auth and demo-user seeding are development-only; paid plans cannot be self-assigned through `/api/auth/subscription`.
- Production Docker builds require `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as build args. Supabase currently owns authentication/profiles; the broader content store still uses SQLite pending a separate asynchronous data-layer migration.

## Homepage SpaceEdu hero
- `SpaceHero` replaces the former homepage `VideoHero` and owns the original Hebrew hero copy and webinar-phase CTAs alongside the planet-switching state, lazy video loading, entrance sequence, and responsive composition. The same site `Header` stays fixed on the home, webinar, and other marketing routes: one height, one shape, and the same links. Webinar section anchors live in a separate sticky subnav.
- Earth is the initial feature; Venus and Mars occupy the left/right slots. Each slot contains all three preloaded cut-out images and switches visibility by class, while non-featured video clips receive a `src` only after selection.
- `SiteBackdropLayout` provides the persistent static `SkyBackdrop` (user-provided blue Milky Way starfield hosted on `media.base44.com`, `025d40d79_image.png`) behind every route. Translucent navy surfaces preserve the image throughout marketing and library routes; gold remains the accent color. The three planet clips are scoped to the homepage hero and unmount on navigation.
- Reduced motion includes both the OS preference and the accessibility widget's `a11y-reduce-motion` class: clips are hidden in favor of the selected poster and planet transforms/entrance animations are disabled.
- Verify the reversible Earth → Venus → Mars → Earth cycle, initial one-video loading, menu Escape/outside-click closure, and layouts at desktop, tablet, narrow phone, and short landscape.
- Public marketing routes share an elegant conversion system through `marketing-shell`: refined `glass-card`, primary `btn-gold`, secondary `btn-secondary`, balanced heading/body wrapping, and a reusable `ConversionBand` before the footer. The conversion band is intentionally hidden on transactional, legal, authentication, and webinar routes where a dedicated conversion flow already exists.
- The library HOME uses the approved Classic Netflix layout in `LibraryWeekly.css`, scoped by `library-weekly` only when `currentView === 'home'`: 820-high hero, rails overlapping by 170, five equal landscape cards, access strip and four quick actions, then three start-here cards. Course images/copy remain data-bound; the hero and empty topic-image fallbacks use the approved static artwork. Legacy console rules force `flex-basis:390px` and `!important` column/padding; reset these in the home scope or the access strip becomes oversized. Check computed styles, not just declarations, against these legacy rules. Wait for the 14-second hero zoom before final screenshots and use instant scrolling when capturing separate sections (global smooth scrolling otherwise captures the wrong section). Verify details and carousel gestures only after the catalog request finishes: cached initial course data may be replaced during boot. The existing library-logo return can show home without synchronizing the URL; this remains outside the visual-only redesign.
- Inner library views use `library-netflix` and the focused `LibraryNetflix.css` companion to the home-only `library-weekly` theme. It standardizes gutters, billboards, five/three/two-column grids and landscape cards without changing handlers, permissions or player/workspace geometry. Keep this stylesheet after the base themes, with the opt-in page polish following it. Category hero artwork is inline: do not include `.library-page-hero` in a theme `background: ... !important` shorthand, which erases the data-bound image; use `background-color` instead. Verified search → course, instructor index → profile, category filtering, and mobile menu; signed-in desks and Continue Watching still need an authenticated session.
- `LibraryPagePolish.css` follows `LibraryNetflix.css` and implements the approved Lecturer Stage design. `VodApp` enables `library-stage` for saved, history, shorts, category, instructor index and instructor profile views only; opaque #090A0B surfaces, #C6A46C gold, serif headings, framed 3:4 portraits, and scoped rise/sweep animations replace the earlier page polish. `LibraryStageAtmosphere` owns only the approved static directory backdrop; portraits and topic images stay data-bound. Existing header/actions, history resume rows, recommendations, biography and credentials remain intact. The legacy catalog/charcoal rules use `!important`, so verify computed styles when editing this companion. Test all six at desktop/mobile; anonymous history is not proof of authenticated save/playback behavior. Programmatic focus after a pointer action does not necessarily match `:focus-visible`; a missing ring in that state is not proof of a CSS cascade defect. No handlers or routes are changed.
- Course details opt into `library-premiere` in `VodApp`; `LibraryCourseDetail.css` implements the approved Premiere Auditorium layout (680-high billboard, metadata band, framed player/chapters, three-card film strip, paired information panels). Keep cover/portrait/recommendation imagery data-bound and preserve all access/player handlers. The legacy catalog CSS forces transparent backgrounds and header minimum heights, so the course scope needs explicit opaque background and 72-high header overrides. Mobile keeps the existing info tabs; selected-tab colors need `!important` against legacy styles. Verified guest save dialog, chapter selection, carousel scrolling, mobile tabs and instructor-profile navigation; authenticated saving and actual playback are not covered by these visual checks.
- `LibraryNavbar.css` loads last in `VodApp` and scopes the shared compact library header (64px desktop / 60px mobile, minimum 44px controls). Branding is always the infinity icon + IM; avoid view-specific wordmarks. This companion overrides legacy home/course header sizing without changing navigation handlers or the marketing header. Mobile expanded search overlays the row; scope search-close checks to the header because the search page has its own same-named field.
- Library routes use the separate starfield asset (`39d83ce2e_generated_af120ace.png`) with one shared charcoal shade in `SkyBackdrop`. `LibraryCharcoalTheme.css`, imported after the catalog/desk styles, scopes charcoal surfaces and champagne accents to `.vod-app.library-catalog`; the hero's duplicate sky layers are hidden so the backdrop is continuous. Check `/library/search`, `/library/instructors`, a live course/profile, and the rails below the hero when changing this theme; marketing must keep its original backdrop.
