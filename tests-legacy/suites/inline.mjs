// No big data: URIs baked into the generated pages. A page that carries a picture as base64 text cannot be cached across pages and grows every file.
// The pixel visitors of the studio hall are shared files (people/*.png, written by tools/make-sprites.mjs); the build must never inline them again.
// Expected to FAIL on a checkout whose pages were built before this change, until `node tools/build.mjs` is run again.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
export const name = 'inline';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const LIMIT = {'svg+xml': 2048, gif: 2048, png: 300, jpeg: 300, jpg: 300, webp: 300};   // bytes of the URI text. Vector icons (the favicon, the grain) may be small; a raster picture of any size must be a file
const SPRITES = ['people/stand.png', 'people/sit-a.png', 'people/sit-b.png'];
export async function run({check}) {
  const pages = fs.readdirSync(root).filter(f => /^(index|studio-[\w-]+|profile-[\w-]+)\.html$/.test(f)).sort();
  check('there are generated pages to check', pages.length >= 20, pages.length);
  const bad = [];
  for (const f of pages) {
    const txt = fs.readFileSync(path.join(root, f), 'utf8');
    for (const m of txt.matchAll(/(?:(?<=url\()data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,][^)"\s]*|(?<!url\()data:image\/(png|jpe?g|webp|gif|svg\+xml)[;,][^"\s]*)/g)) {
      const kind = m[1] || m[2], max = LIMIT[kind];
      if (m[0].length > max) bad.push(`${f}: a data:image/${kind} URI of ${m[0].length} bytes (limit ${max}) — make it a file and link it`);
    }
  }
  check('no generated page inlines a big data:image URI (index, studio-*, profile-*)', bad.length === 0, bad.slice(0, 12).concat(bad.length > 12 ? [`… and ${bad.length - 12} more`] : []));

  /* the shared sprites exist, are 20x28 RGBA PNGs, and the studio template links them (not data:) */
  const png = f => { try { return fs.readFileSync(path.join(root, f)); } catch (e) { return null; } };
  const info = SPRITES.map(f => { const b = png(f); return {f, ok: !!b && b.length > 60 && b.subarray(1, 4).toString() === 'PNG' && b.readUInt32BE(16) === 20 && b.readUInt32BE(20) === 28 && b[25] === 6}; });
  check('people/*.png: the 3 shared hall sprites exist (20x28, RGBA PNG)', info.every(i => i.ok), info.filter(i => !i.ok).map(i => i.f));
  const mus = fs.readFileSync(path.join(root, 'museum.js'), 'utf8');
  check('museum.js points at the shared files and never serialises a canvas', SPRITES.every(f => mus.includes(f)) && !/toDataURL/.test(mus));
  const studios = pages.filter(f => f.startsWith('studio-'));
  const noLink = studios.filter(f => !fs.readFileSync(path.join(root, f), 'utf8').includes('src="people/'));
  check('each studio page links its visitors as people/*.png', noLink.length === 0, noLink);
}
