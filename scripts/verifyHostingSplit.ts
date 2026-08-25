/**
 * Sanity checks for split-hosting helpers (no network).
 * Run: npx tsx scripts/verifyHostingSplit.ts
 */
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'production';
process.env.APP_URL = 'https://www.example.co.il/';
process.env.CORS_ORIGINS = 'https://preview.vercel.app, https://www.example.co.il/';
process.env.PUBLIC_UPLOAD_ORIGIN = 'https://api.example.co.il';
process.env.SERVE_SPA = 'false';

const env = await import('../server/config/env.ts');

const origins = env.corsOrigins();
assert.ok(Array.isArray(origins));
assert.ok(env.isCorsOriginAllowed('https://www.example.co.il'));
assert.ok(env.isCorsOriginAllowed('https://preview.vercel.app'));
assert.equal(env.isCorsOriginAllowed('https://evil.example'), false);

process.env.CORS_ORIGINS = '*.vercel.app';
assert.ok(env.isCorsOriginAllowed('https://im-git-main-user.vercel.app'));
assert.equal(env.serveSpa(), false);
assert.equal(env.publicUploadOrigin(), 'https://api.example.co.il');
assert.equal(env.publicMediaUrl('/uploads/a.mp4'), 'https://api.example.co.il/uploads/a.mp4');
assert.equal(env.publicMediaUrl('/captions/he.vtt'), '/captions/he.vtt');
assert.equal(env.publicMediaUrl('https://cdn.example/x.mp4'), 'https://cdn.example/x.mp4');

process.env.SERVE_SPA = '';
assert.equal(env.serveSpa(), true);

console.log('verifyHostingSplit: ok');
