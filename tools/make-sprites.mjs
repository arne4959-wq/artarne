#!/usr/bin/env node
// tools/make-sprites.mjs — writes the pixel visitors of the studio hall to people/*.png.
//   node tools/make-sprites.mjs
// The pixel art lives in ONE place: museum.js (the text grids, the palette and the outline pass). This script runs that file against a tiny
// fake canvas (no browser, no npm packages), takes the pixels it draws and writes them as 8-bit RGBA PNGs with node:zlib.
// The studio pages then load people/<name>.png by URL, so the browser caches them and nothing is baked into the HTML.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import zlib from 'node:zlib';
import {fileURLToPath} from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

/* a canvas that only does what museum.js needs: fillStyle (#rrggbb), fillRect, getImageData */
function fakeCanvas() {
  const cv = {width: 0, height: 0, px: null};
  const ctx = {
    fillStyle: '#000000',
    fillRect(x, y, w, h) {
      if (!cv.px || cv.px.length !== cv.width * cv.height * 4) cv.px = new Uint8ClampedArray(cv.width * cv.height * 4);
      const m = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(this.fillStyle); if (!m) throw new Error('make-sprites: unsupported colour ' + this.fillStyle);
      for (let j = y; j < y + h; j++) for (let i = x; i < x + w; i++) { if (i < 0 || j < 0 || i >= cv.width || j >= cv.height) continue; const o = (j * cv.width + i) * 4; cv.px[o] = parseInt(m[1], 16); cv.px[o + 1] = parseInt(m[2], 16); cv.px[o + 2] = parseInt(m[3], 16); cv.px[o + 3] = 255; }
    },
    getImageData(x, y, w, h) { if (!cv.px) cv.px = new Uint8ClampedArray(cv.width * cv.height * 4); return {data: cv.px.slice(), width: w, height: h}; },   // a snapshot, like the real one (museum.js reads it while it draws the outline)
  };
  cv.getContext = () => ctx;
  return cv;
}

const win = {};
vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'museum.js'), 'utf8'), {window: win, document: {createElement: () => fakeCanvas()}, location: {search: ''}, URLSearchParams}, {filename: 'museum.js'});
if (!win.MUS || !win.MUS.drawSprite) throw new Error('make-sprites: museum.js does not export MUS.drawSprite');

/* ---- PNG writer: signature, IHDR, one IDAT (filter 0 on every row), IEND ---- */
const CRC = Array.from({length: 256}, (_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; return c >>> 0; });
const crc = b => { let c = 0xFFFFFFFF; for (const x of b) c = CRC[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xFFFFFFFF) >>> 0; };
const chunk = (type, data) => { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, 'latin1'), data]); const c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
function png(w, h, rgba) {
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) { raw[y * (w * 4 + 1)] = 0; Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1); }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;   // 8 bit, colour type 6 = RGBA
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, {level: 9})), chunk('IEND', Buffer.alloc(0))]);
}

fs.mkdirSync(path.join(ROOT, 'people'), {recursive: true});
for (const [id, legs] of win.MUS.spriteKeys) {
  const cv = win.MUS.drawSprite(id, legs), file = win.MUS.spriteFiles[id], buf = png(cv.width, cv.height, cv.px);
  fs.writeFileSync(path.join(ROOT, file), buf);
  console.log(`  wrote ${file} (${cv.width}x${cv.height}, ${buf.length} bytes)`);
}
