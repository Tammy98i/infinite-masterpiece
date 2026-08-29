import assert from 'node:assert/strict';
import test from 'node:test';
import handler from './providers.ts';
import catalog from '../catalog.ts';

type Res = { statusCode: number; body: unknown };

function invoke(fn: (req: { method?: string }, res: { status: (code: number) => unknown; json: (body: unknown) => void }) => void) {
  const out: Res = { statusCode: 0, body: null };
  const res = {
    status(code: number) {
      out.statusCode = code;
      return res;
    },
    json(body: unknown) {
      out.body = body;
    },
  };
  fn({ method: 'GET' }, res);
  return out;
}

test('providers handler returns 200 without Vite src imports', () => {
  const out = invoke(handler);
  assert.equal(out.statusCode, 200);
  const body = out.body as { local?: boolean; supabase?: boolean };
  assert.equal(body.local, false);
  assert.equal(body.supabase, true);
});

test('catalog handler returns published lectures', () => {
  const out = invoke(catalog);
  assert.equal(out.statusCode, 200);
  const body = out.body as { courses?: unknown[] };
  assert.ok(Array.isArray(body.courses) && body.courses.length > 0);
});
