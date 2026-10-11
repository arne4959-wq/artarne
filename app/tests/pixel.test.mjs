// pixel.js: every sprite frame is 16 x 16 and uses only the site's letters; the pointer / tilt maths stays inside -1…1.
import test from 'node:test';
import assert from 'node:assert/strict';
import {ALL_FRAMES, COL, walkFrames, standFrames, sitFrames, birdFrames, perchFrames, pointerNorm, tiltNorm} from '../src/lib/pixel.js';

test('every frame is 16 rows of 16 characters', () => {
  const frames = ALL_FRAMES();
  assert.ok(frames.length >= 16);
  frames.forEach((f, i) => { assert.equal(f.length, 16, `frame ${i}: ${f.length} rows`); f.forEach((r, y) => assert.equal(r.length, 16, `frame ${i} row ${y}: "${r}" is ${r.length} wide`)); });
});

test('frames use only clear pixels and the site colours (hair and coat are painted in)', () => {
  const ok = new Set(['.', ...Object.keys(COL)]);
  ALL_FRAMES().forEach((f, i) => f.forEach((r, y) => [...r].forEach(ch => assert.ok(ok.has(ch), `frame ${i} row ${y} has "${ch}"`))));
  assert.ok(Object.values(COL).every(c => /^#[0-9A-F]{6}$/i.test(c)));
});

test('frame counts match what the CSS steps through (2 or 4)', () => {
  assert.equal(walkFrames('r', 't').length, 4); assert.equal(standFrames('r', 't').length, 2); assert.equal(sitFrames('r', 't').length, 4);
  assert.equal(birdFrames.length, 4); assert.equal(perchFrames.length, 2);
});

test('the sitting person has feet on the bottom row, and the standing one too', () => {
  for (const f of [sitFrames('r', 't')[0], standFrames('r', 't')[0], walkFrames('r', 't')[1]]) assert.ok(/k/.test(f[15]), f[15]);
});

test('pointer and tilt are normalised to -1…1', () => {
  assert.deepEqual(pointerNorm(500, 300, 1000, 600), {nx: 0, ny: 0});
  assert.deepEqual(pointerNorm(0, 600, 1000, 600), {nx: -1, ny: 1});
  assert.equal(pointerNorm(5000, -5000, 1000, 600).nx, 1);
  assert.deepEqual(tiltNorm(0, 45), {nx: 0, ny: 0});
  assert.equal(tiltNorm(90, 45).nx, 1); assert.equal(tiltNorm(-90, 10).ny, -1);
  assert.deepEqual(tiltNorm(null, null), {nx: 0, ny: 0});
});
