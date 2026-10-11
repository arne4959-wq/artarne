// The generated files (studio pages, share images, pre-rendered blocks) must match artists.js.
import fs from 'node:fs';
import path from 'node:path';
export const name = 'build';
export async function run({root, check}) {
  const read = f => fs.readFileSync(path.join(root, f), 'utf8');
  const {ARTISTS} = new Function(read('artists.js') + '\n;return {ARTISTS};')();
  const idx = read('index.html');
  for (const a of ARTISTS) {
    const f = `studio-${a.id}.html`, ok = fs.existsSync(path.join(root, f));
    check(`${f} exists`, ok); if (!ok) continue;
    const html = read(f);
    const stale = a.pieces.filter(p => !html.includes(`$${p.p.toLocaleString('en-US')}`) || !html.includes(p.t));
    check(`${f} is up to date with artists.js`, stale.length === 0, stale.length ? 'stale pieces: ' + stale.map(p => p.t).join(', ') + ' → run: node tools/build.mjs' : '');
    check(`og/${a.id}.png exists`, fs.existsSync(path.join(root, 'og', `${a.id}.png`)) && fs.statSync(path.join(root, 'og', `${a.id}.png`)).size > 5000);
    check(`index.html links studio-${a.id}.html`, idx.includes(`href="studio-${a.id}.html`));
    for (const p of a.pieces) check(`image exists: ${p.img}`, fs.existsSync(path.join(root, p.img)));
  }
  for (const m of ['masonry', 'filters', 'map', 'strip']) check(`index.html has pre-rendered block "${m}"`, new RegExp(`<!--pre:${m}-->[\\s\\S]{40,}<!--/pre:${m}-->`).test(idx));
  for (const f of ['privacy.html', 'terms.html', '404.html', 'robots.txt', 'og.png', 'fonts/fonts.css', 'vendor/lenis.min.js']) check(`${f} exists`, fs.existsSync(path.join(root, f)));
}
