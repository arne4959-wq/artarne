// Download the legends' paintings from the museums' OPEN-ACCESS archives (Met + Art Institute of Chicago).
// npm run pictures        (needs internet; skips files that already exist; only saves public-domain items whose title matches)
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const MET = id => `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
const AIC = id => `https://api.artic.edu/api/v1/artworks/${id}?fields=id,title,image_id,is_public_domain`;

// file, source, id, regex the museum's title must match (a wrong id is refused, never saved)
const LIST = [
  ['hokusai-great-wave.jpg',            'met', 45434,  /under the wave/i],
  ['seurat-la-grande-jatte.jpg',        'aic', 27992,  /grande jatte/i],
  ['vangogh-irises.jpg',                'met', 436528, /irises/i],
  ['vangogh-bedroom-in-arles.jpg',      'aic', 28560,  /bedroom/i],
  ['monet-water-lilies.jpg',            'aic', 16568,  /water lilies/i],
  ['monet-bridge-water-lilies.jpg',     'met', 437112, /bridge over a pond of water lilies/i],
  ['hokusai-fine-wind-clear-morning.jpg','met', 36491, /south wind|fine wind/i],
  ['seurat-circus-sideshow.jpg',        'met', 437658, /circus sideshow/i],
];

fs.mkdirSync(path.join(root, 'legends'), { recursive: true });
let ok = 0, bad = 0;
for (const [file, src, id, rx] of LIST) {
  const out = path.join(root, 'legends', file);
  if (fs.existsSync(out)) { console.log('have  ' + file); continue; }
  try {
    const j = await (await fetch(src === 'met' ? MET(id) : AIC(id))).json();
    const d = src === 'aic' ? j.data : j;
    const title = d.title || '', pd = src === 'met' ? d.isPublicDomain : d.is_public_domain;
    if (!rx.test(title)) throw new Error(`id ${id} is "${title}", not the expected picture`);
    if (!pd) throw new Error('not marked public domain');
    const url = src === 'met' ? d.primaryImage : `https://www.artic.edu/iiif/2/${d.image_id}/full/1200,/0/default.jpg`;
    if (!url) throw new Error('no image');
    const r = await fetch(url);
    if (!r.ok) throw new Error('download HTTP ' + r.status);
    fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
    try { execFileSync('sips', ['-Z', '1600', '-s', 'formatOptions', '82', out], { stdio: 'ignore' }); } catch {}   // shrink big museum scans (macOS sips); the page loads faster
    console.log('saved ' + file + '  ←  ' + title);
    ok++;
  } catch (e) { console.log('SKIP  ' + file + '  (' + e.message + ')'); bad++; }
}
console.log(`\n${ok} saved, ${bad} skipped. Reload the site: pictures that exist appear by themselves.`);
