/**
 * Lightweight accessibility smoke checks (static + optional live fetch).
 * Run with dev server: npm run dev & npm run a11y:smoke
 */
const BASE = process.env.A11Y_SMOKE_URL || 'http://localhost:3000';

type Check = { name: string; pass: boolean; detail: string };

async function checkUrl(path: string, test: (html: string) => Check): Promise<Check> {
  try {
    const res = await fetch(`${BASE}${path}`, { redirect: 'follow' });
    const html = await res.text();
    if (!res.ok) return { name: path, pass: false, detail: `HTTP ${res.status}` };
    return test(html);
  } catch (err) {
    return { name: path, pass: false, detail: err instanceof Error ? err.message : 'fetch failed' };
  }
}

async function main() {
  const checks: Check[] = [];

  checks.push(
    await checkUrl('/', (html) => ({
      name: 'index lang/dir',
      pass: html.includes('lang="he"') && html.includes('dir="rtl"'),
      detail: 'lang=he and dir=rtl in shell',
    }))
  );

  checks.push(
    await checkUrl('/', (html) => ({
      name: 'a11y prefs bootstrap',
      pass: html.includes('site_a11y_prefs_v1') && html.includes('a11y-contrast-dark'),
      detail: 'inline a11y bootstrap v2',
    }))
  );

  checks.push(
    await checkUrl('/captions/he-placeholder.vtt', (body) => ({
      name: 'placeholder vtt',
      pass: body.startsWith('WEBVTT'),
      detail: 'he-placeholder.vtt served',
    }))
  );

  checks.push(
    await checkUrl('/accessibility', (html) => ({
      name: 'accessibility route',
      pass: html.includes('lang="he"'),
      detail: 'SPA shell for /accessibility',
    }))
  );

  checks.push(
    await checkUrl('/library', (html) => ({
      name: 'library route',
      pass: html.includes('lang="he"'),
      detail: 'SPA shell for /library',
    }))
  );

  const failed = checks.filter((c) => !c.pass);
  for (const c of checks) {
    console.log(`${c.pass ? 'PASS' : 'FAIL'}  ${c.name} — ${c.detail}`);
  }

  if (failed.length) {
    console.error(`\n${failed.length}/${checks.length} checks failed`);
    process.exit(1);
  }
  console.log(`\nAll ${checks.length} smoke checks passed (${BASE})`);
  console.log('Manual: Tab skip-link, Alt+A widget, NVDA on /library and /accessibility');
}

void main();
