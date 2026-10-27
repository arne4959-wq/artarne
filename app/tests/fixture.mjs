// fixture.mjs — test data for the branches the real data does not reach yet: a timeline,
// Instagram, a tagline, a sold count, a kip price, filled-in shipping, a THB rate, a donate link, and no form endpoint
// (so forms take the email-app path). Made from the real artists.js / circles.js by small text edits, so it follows them.
//   makeFixture() → {dir, dist, routes}: dir holds the edited files, dist is an app build made from them,
//   routes serves the same files to the OLD site (startServer(root, routes)).
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SITE = path.resolve(APP, '..');
const DIR = path.join(APP, 'tests', 'out', 'fixture'), DIST = path.join(APP, 'tests', 'out', 'dist-fixture');

const edit = (src, from, to, what) => { if (!(from instanceof RegExp ? from.test(src) : src.includes(from))) throw new Error('fixture: cannot find ' + what); return src.replace(from, to); };

/* process material for the tower and the work window: Napha's first two works get an idea note, a sketch and a draft with dates (the pictures are other sample files, standing in for uploads) */
const PROCESS = `
;(function () {
  var a = ARTISTS.find(function (x) { return x.id === 'napha'; }); if (!a) return;
  a.pieces[0].idea = 'ภูเขาที่หายไปในหมอก'; a.pieces[0].ideaEn = 'A mountain that vanishes in the fog';
  a.pieces[0].sketch = 'art/mali-1.svg'; a.pieces[0].draft = 'art/dao-1.svg';
  a.pieces[0].stages = {idea: '2021-11', sketch: '2022-01-15', draft: '2022-02', final: '2022-03'};
  a.pieces[1].idea = 'ต้นไม้ที่ไม่อยู่แล้ว'; a.pieces[1].sketch = 'art/mali-2.svg';
  a.pieces[1].stages = {idea: '2022-04', sketch: '2022-05'};
})();
`;

export function makeFixture({build = true} = {}) {
  fs.mkdirSync(DIR, {recursive: true});
  let a = fs.readFileSync(path.join(SITE, 'artists.js'), 'utf8');
  a = edit(a, "{ id:'napha', ", `{ id:'napha', tagline:'วาดสิ่งที่หายไป', taglineEn:'I paint what is gone', timeline:[{y:2016,t:'นิทรรศการแรก',tEn:'First show'},{y:2024,t:'เปิดตึก',tEn:'Opened the building'},{y:2025}], instagram:'https://instagram.com/napha.example', sold:4, `, 'napha');
  a = edit(a, "{ id:'thara', ", "{ id:'thara', instagram:'http://insecure.example',", 'thara');
  a = a.replace(/\/\*LIVE:BEGIN[\s\S]*?LIVE:END\*\/\n?/, '');   // the sample artists stay in the test data even when the working copy has a generated "hide the samples" block (tools/merge-live.mjs)
  a += PROCESS;
  let c = fs.readFileSync(path.join(SITE, 'circles.js'), 'utf8');
  c = edit(c, /endpoint: '[^']*'/, "endpoint: ''", 'CONFIG.endpoint');
  c = edit(c, /donate: '[^']*'/, "donate: 'https://donate.example/circles'", 'CONFIG.donate');
  c = edit(c, /turnstileSiteKey: '[^']*'/, "turnstileSiteKey: ''", 'CONFIG.turnstileSiteKey');
  fs.writeFileSync(path.join(DIR, 'artists.live.json'), JSON.stringify({hideDemo: false, artists: []}));   // keep the samples, whatever the working copy's own artists.live.json says
  fs.writeFileSync(path.join(DIR, 'artists.js'), a); fs.writeFileSync(path.join(DIR, 'circles.js'), c);
  if (build) {
    const env = {...process.env, CIRCLES_FIXTURE: DIR, CIRCLES_DIST: DIST};
    execFileSync('npx', ['vite', 'build', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'error'], {cwd: APP, env, stdio: 'inherit'});
    execFileSync('node', ['scripts/pages.mjs'], {cwd: APP, env, stdio: 'ignore'});
  }
  const js = f => () => fs.readFileSync(path.join(DIR, f), 'utf8');
  /* the old site's pre-built studio-<id>.html twins are written by tools/build.mjs at deploy time and may be stale in a working copy: the OLD side serves
     cutaway.html (what the build starts from) under those names, marked as the pre-built twin of that artist */
  const cut = id => () => fs.readFileSync(path.join(SITE, 'cutaway.html'), 'utf8').replace('<main id="main"', `<main id="main" data-pre="1" data-studio="${id}"`);
  const studios = Object.fromEntries([...a.matchAll(/\{ id:'([a-z0-9-]+)', /g)].map(m => ['/studio-' + m[1] + '.html', cut(m[1])]));
  return {dir: DIR, dist: DIST, routes: {'/artists.js': js('artists.js'), '/circles.js': js('circles.js'), ...studios}};
}
