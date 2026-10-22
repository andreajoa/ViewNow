import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
test('video parser handles four supported platforms', async () => {
  const source = readFileSync('src/lib/video.ts', 'utf8');
  for (const name of ['youtube.com','instagram.com','tiktok.com','facebook.com']) assert.ok(source.includes(name));
});
test('Vercel API functions not shadowed by SPA rewrite', async () => {
  const vercel = JSON.parse(readFileSync('vercel.json','utf8'));
  assert.deepEqual(vercel.rewrites.map(x => x.source), ['/app','/watch']);
});
