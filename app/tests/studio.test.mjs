// studio.test.mjs — the studio page's pure parts: the tower rules (lib/tower.js) and the rules of the artwork window.
// Run: npm test (in app/). The browser side (clicks, window, peel, zoom, phone) is app/tests/studio-ui.mjs and the old-vs-React runs in behaviour.mjs / compare.mjs.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {STAGES, CATS, PER_ROW, MAX_ROWS, safeSrc, dateOf, fmtOn, num, stage, stagesOf, hasProcess, floors} from '../src/lib/tower.js';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SITE = path.resolve(APP, '..');
const src = f => fs.readFileSync(path.join(APP, 'src', f), 'utf8');
const L = {pk: (o, k) => o[k] || ''};   // the one thing tower.js asks of the language object

test('a stage has something to show only when the artist gave it; the finished picture is the work\'s image', () => {
  const p = {img: 'art/a.webp', y: 2026, sketch: 'art/s.webp', idea: '  a boat  '};
  assert.deepEqual(STAGES, ['idea', 'sketch', 'draft', 'final']);
  assert.deepEqual(stage(L, p, 'idea'), {s: 'idea', has: true, text: 'a boat', on: ''});
  assert.deepEqual(stage(L, p, 'sketch'), {s: 'sketch', has: true, src: 'art/s.webp', on: ''});
  assert.equal(stage(L, p, 'draft').has, false, 'no invented draft');
  assert.deepEqual(stage(L, p, 'final'), {s: 'final', has: true, src: 'art/a.webp', on: '2026'}, 'the finished date falls back to the work\'s year');
  assert.equal(stage(L, {y: 2026}, 'final').has, false);
  assert.equal(stagesOf(L, p).length, 4);
});

test('an artist\'s address must be https or a file of this site; dates are YYYY, YYYY-MM or YYYY-MM-DD', () => {
  assert.equal(safeSrc('https://x.test/a.png'), 'https://x.test/a.png'); assert.equal(safeSrc('art/arne/a-b.webp'), 'art/arne/a-b.webp');
  for (const bad of ['javascript:alert(1)', 'http://x.test/a.png', 'https://x.test/a"onerror=', '../up.png', '//evil.test/a.png', '', null, 5]) assert.equal(safeSrc(bad), '', String(bad));
  assert.equal(dateOf('2026'), '2026'); assert.equal(dateOf('2026-03'), '2026-03'); assert.equal(dateOf('2026-03-09'), '2026-03-09'); assert.equal(dateOf('yesterday'), ''); assert.equal(dateOf('2026-3'), '');
  assert.equal(fmtOn('2026-03-09'), '09/03/2026'); assert.equal(fmtOn('2026-03'), '03/2026'); assert.equal(fmtOn('2026'), '2026'); assert.equal(fmtOn('x'), '');
  assert.equal(num(0), '01'); assert.equal(num(11), '12');
});

test('a work has a process only when an idea, sketch or draft (or a date for one) exists', () => {
  assert.equal(hasProcess(L, {img: 'a.webp', y: 2026}), false);
  assert.equal(hasProcess(L, {img: 'a.webp', sketch: 'art/s.webp'}), true);
  assert.equal(hasProcess(L, {img: 'a.webp', stages: {draft: '2025-12'}}), true, 'a dated stage counts even without a picture');
  assert.equal(hasProcess(L, {img: 'a.webp', stages: {final: '2026'}}), false, 'the finished date alone is no process');
});

test('floors: three kinds from the roof down, at most 3 windows a row and 3 rows a kind', () => {
  assert.deepEqual(CATS.map(c => c[0]), ['idea', 'sketch', 'work']); assert.equal(PER_ROW, 3); assert.equal(MAX_ROWS, 3);
  const a = floors(3); assert.equal(a.rows, 1); assert.equal(a.total, 3); assert.deepEqual(a.floors.map(f => [f.cat, f.level, f.ks]), [['idea', 3, [0, 1, 2]], ['sketch', 2, [0, 1, 2]], ['work', 1, [0, 1, 2]]]);
  const b = floors(5); assert.equal(b.rows, 2); assert.equal(b.total, 6); assert.deepEqual(b.floors.map(f => f.ks.length), [3, 2, 3, 2, 3, 2]);
  const c = floors(40); assert.equal(c.shown, 9); assert.equal(c.rows, 3); assert.equal(c.total, 9 / 3 * 3); assert.deepEqual(c.floors.map(f => f.level), [9, 8, 7, 6, 5, 4, 3, 2, 1]);
  assert.equal(floors(0).floors.length, 0);
});

test('the artwork window: donate goes to the artist only, no shop, no site-support gift', () => {
  const files = ['pages/Studio.jsx', 'components/WorkDialog.jsx', 'components/Zoom.jsx', 'lib/tower.js'].map(f => [f, src(f)]);
  for (const [f, code] of files) {
    assert.ok(!/payLink|\bprice|\bsold\b|add to cart|checkout|buy-|rememberSampleCircles|openSupportCircles/i.test(code), `${f}: nothing to buy, and the circles gift stays in its own dialog`);
  }
  const tw = src('components/Tower.jsx');
  assert.ok(!/payLink|\bprice|\bsold\b|add to cart|checkout|buy-|rememberSampleCircles/i.test(tw), 'Tower.jsx: nothing to buy');
  assert.match(tw, /openDonate\(A\)/, 'the roof button donates to the artist of the building');
  assert.match(tw, /data-support="site"[^>]*onClick=\{openSupportCircles\}/, 'the lobby button is the one place that offers the circles gift');
  const w = src('components/WorkDialog.jsx');
  assert.match(w, /openDonate\(A, 0, k\)/, 'the donate link names the work and gives to the artist A');
  assert.match(w, /data-quiet/, 'the per-work link is the quiet one');
  assert.match(w, /v_stamp/, 'the "written by the artist" badge');
  assert.match(w, /res_btn/, 'the Resonated button');
  assert.match(w, /cdlg-h wd-h/); assert.match(w, /cdlg-foot/); assert.match(w, /cdlg-fl wd-room/);   // punk x architecture: beam on top, room sign, hazard footing
});
