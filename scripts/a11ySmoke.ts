/**
 * Lightweight accessibility smoke checks (static + optional live fetch).
 * Run with dev server: npm run dev & npm run a11y:smoke
 */
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { A11Y_BOOTSTRAP_SCRIPT, A11Y_STORAGE_KEY } from '../src/a11y/prefs';

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

function checkBootstrapSync(): Check {
  const indexHtml = readFileSync(resolve(process.cwd(), 'index.html'), 'utf8');
  const scriptMatch = indexHtml.match(/<script>\s*(\(function\(\)\{try\{[\s\S]*?\}\)\(\);?)\s*<\/script>/);
  const normalize = (s: string) => s.replace(/\s+/g, '').replace(/;+$/, '');
  const inline = normalize(scriptMatch?.[1] ?? '');
  const expected = normalize(A11Y_BOOTSTRAP_SCRIPT);
  return {
    name: 'bootstrap CLASS_RULES sync',
    pass: Boolean(inline) && inline === expected,
    detail: inline === expected ? 'index.html matches A11Y_BOOTSTRAP_SCRIPT' : 'index.html bootstrap drifted from prefs.ts',
  };
}

async function main() {
  const checks: Check[] = [];

  checks.push(checkBootstrapSync());

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
      pass: html.includes(A11Y_STORAGE_KEY) && html.includes('a11y-contrast-dark'),
      detail: 'inline a11y bootstrap v2',
    }))
  );

  checks.push(
    await checkUrl('/', (html) => ({
      name: 'shell skip link',
      pass: html.includes('דלג לתוכן הראשי') && html.includes('href="#main-content"'),
      detail: 'static Hebrew skip link in index.html',
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
      pass: html.includes('lang="he"') && html.includes('דלג לתוכן הראשי'),
      detail: 'SPA shell for /accessibility with skip link',
    }))
  );

  checks.push(
    await checkUrl('/library', (html) => ({
      name: 'library route',
      pass: html.includes('lang="he"'),
      detail: 'SPA shell for /library',
    }))
  );

  checks.push(
    await checkUrl('/api/legal/accessibility-config', (body) => {
      try {
        const json = JSON.parse(body) as { standard?: string; email?: string };
        return {
          name: 'accessibility config API',
          pass: Boolean(json.standard?.includes('5568') && json.email),
          detail: 'public coordinator config served',
        };
      } catch {
        return { name: 'accessibility config API', pass: false, detail: 'invalid JSON' };
      }
    })
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
