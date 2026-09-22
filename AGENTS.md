# Base44 development environment

- Start with `docker compose -f docker-compose.base44.yml up -d`. Do not use the production compose for preview: it serves a frozen build.
- The Base44 app container runs both Vite on 3000 and Express on 3001, so the existing localhost `/api` and `/uploads` proxies work without a separate public API origin. Source is bind-mounted; both processes watch for edits.
- Use Node 22 with built-in `node:sqlite`. SQLite schema, migrations, and initial catalog/demo seeds run automatically in `getDb()` at API startup; do not run a separate seed concurrently. Data persists in the `base44-data` Docker volume, separate from any hosted database.
- External credentials are not required for local startup. Keep managed credentials only in `/run/base44/app.env`; payment, object storage, and email integrations require real credentials to function. Do not copy sample credentials into the environment.
- Check `/api/health` through port 3000 as well as `/`. The HTML must include `/@vite/client`, proving the preview serves live source. Check the browser for a populated `#root`, no error overlay, and no failed module requests.
- Run checks inside the container: `docker compose -f docker-compose.base44.yml exec -T app npm test` and `docker compose -f docker-compose.base44.yml exec -T app npm run lint`.
