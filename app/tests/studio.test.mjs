// studio.test.mjs — the studio page's pure parts: the hall geometry (lib/hall.js) and the rules of the artwork window.
// Run: npm test (in app/). The browser side (clicks, window, zoom, phone) is app/tests/studio-ui.mjs and the old-vs-React runs in behaviour.mjs / compare.mjs.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {W, H, FIRST, GAP, NEAR, END_NEAR, VW, VH, hasHall, geometry, yawFor, camT, artBox, benchAt, ribsAndLights, isGone, youAt, fitScale, MAP} from '../src/lib/hall.js';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SITE = path.resolve(APP, '..');
const ARTISTS = new Function(fs.readFileSync(path.join(SITE, 'artists.js'), 'utf8') + '\nreturn ARTISTS;')();
const src = f => fs.readFileSync(path.join(APP, 'src', f), 'utf8');
const mk = (n, ar = '4/5') => ({pieces: Array.from({length: n}, () => ({ar}))});

test('every artist with a work gets a hall; an artist without one does not', () => {
  assert.equal(hasHall(mk(1)), true); assert.equal(hasHall(mk(0)), false); assert.equal(hasHall(null), false); assert.equal(hasHall({}), false);
  for (const a of ARTISTS) assert.equal(hasHall(a), true, a.id);
});

test('geometry: sides alternate L / R, the last work hangs at the far end, the camera stops in front of each work', () => {
  for (const a of ARTISTS) {
    const G = geometry(a), n = a.pieces.length;
    assert.equal(G.n, n); assert.equal(G.spots.length, n);
    G.spots.forEach((s, k) => {
      assert.equal(s.k, k);
      assert.equal(s.side, k === n - 1 ? 'E' : k % 2 ? 'R' : 'L', `${a.id} #${k}`);
      assert.ok(s.cam >= 0 && s.cam <= G.L, `${a.id} #${k} camera inside the hall`);
      assert.ok(s.d <= G.L, `${a.id} #${k} hangs inside the hall`);
      assert.ok(s.h <= H && s.w <= (s.side === 'E' ? 640 : 460), `${a.id} #${k} fits the wall`);
      const [aw, ah] = a.pieces[k].ar.split('/').map(Number);
      assert.ok(Math.abs(s.w / s.h - aw / ah) < .03, `${a.id} #${k} keeps its proportions`);
    });
    for (let k = 1; k < n; k++) assert.ok(G.spots[k].cam >= G.spots[k - 1].cam, `${a.id}: walking on never goes back`);
    assert.equal(G.spots[n - 1].cam, G.L - END_NEAR);
  }
});

test('geometry: known numbers (a hall of 3: length 3000, first camera 420, far-end camera 2740)', () => {
  const G = geometry(mk(3));
  assert.equal(G.L, FIRST + GAP + 1300);
  assert.deepEqual(G.spots.map(s => [s.side, s.d, s.cam]), [['L', 800, 800 - NEAR], ['R', 800 + GAP, 800 + GAP - NEAR], ['E', 3000, 3000 - END_NEAR]]);
  assert.equal(geometry(mk(1)).L, 1500);   // a hall never shorter than 1500
  assert.equal(geometry(mk(1)).spots[0].side, 'E');
});

test('the camera turn is small and the camera string is stable', () => {
  for (const a of ARTISTS) for (const s of geometry(a).spots) assert.ok(Math.abs(yawFor(s)) <= 40, `${a.id} #${s.k}`);
  const s = geometry(mk(3)).spots[0];
  assert.equal(camT(s), 'translate3d(0,0,800px) rotateY(-18deg) translate3d(-230px,0,-380px)');   // what the old page puts on #mus-world for napha
});

test('pictures hang inside their wall; the bench is never in front of a left-wall picture', () => {
  for (const a of ARTISTS) {
    const G = geometry(a), bd = benchAt(G);
    for (const s of G.spots) { const b = artBox(s, G); assert.ok(parseFloat(b.left) >= -1 && parseFloat(b.top) >= -H, `${a.id} #${s.k}`); }
    assert.ok(bd <= G.L - 500);
    for (const s of G.spots.filter(x => x.side === 'L')) assert.ok(Math.abs(s.d - bd) >= 480 || bd === G.L - 500, `${a.id} bench vs #${s.k}`);
  }
});

test('things behind the camera fade out; "min" things only once the camera has come far enough (the old toggle() bug is gone)', () => {
  assert.equal(isGone(300, null, 420), true); assert.equal(isGone(760, null, 420), false);
  assert.equal(isGone(2900, 2100, 420), true, 'a far visitor waits until the camera is near');
  assert.equal(isGone(2900, 2100, 2200), false);
  assert.equal(typeof isGone(760, undefined, 420), 'boolean', 'always true or false, never undefined (classList.toggle(x, undefined) would flip)');
  const G = geometry(mk(3)), {ribs, sky} = ribsAndLights(G);
  assert.deepEqual(ribs, [300, 760, 1220, 1680, 2140, 2600]); assert.deepEqual(sky, [530, 1450, 2370]);
});

test('floor plan marker moves from the door to the far end; fit: cover on a desktop, a taller stage on a phone', () => {
  const G = geometry(mk(3)); assert.equal(youAt(0, G), MAP.my + MAP.mh); assert.equal(youAt(G.L, G), MAP.my);
  const d = fitScale(1100, 680); assert.equal(d.sc, 1); assert.equal(d.narrow, false); assert.equal(d.height, null);
  const p = fitScale(375, 520); assert.equal(p.narrow, true); assert.equal(p.sc, Math.round(375 / 640 * 10000) / 10000); assert.equal(p.height, Math.round(VH * p.sc));
  assert.ok(VW > W && VH > H);
});

test('the artwork window: donate goes to the artist only, no shop, no site-support gift', () => {
  const files = ['pages/Studio.jsx', 'components/Hall.jsx', 'components/WorkDialog.jsx', 'components/Zoom.jsx', 'lib/hall.js'].map(f => [f, src(f)]);
  for (const [f, code] of files) {
    assert.ok(!/payLink|\bprice|\bsold\b|add to cart|checkout|buy-|rememberSampleCircles|openSupportCircles/i.test(code), `${f}: nothing to buy, and the circles gift stays in its own dialog`);
  }
  const w = src('components/WorkDialog.jsx');
  assert.match(w, /openDonate\(A, 0, k\)/, 'the donate link names the work and gives to the artist A');
  assert.match(w, /data-quiet/, 'the per-work link is the quiet one');
  assert.match(w, /v_stamp/, 'the "written by the artist" badge');
  assert.match(w, /res_btn/, 'the Resonated button');
  assert.match(w, /cdlg-h wd-h/); assert.match(w, /cdlg-foot/); assert.match(w, /cdlg-fl wd-room/);   // punk x architecture: beam on top, room sign, hazard footing
});
