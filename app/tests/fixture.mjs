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

export function makeFixture({build = true} = {}) {
  fs.mkdirSync(DIR, {recursive: true});
  let a = fs.readFileSync(path.join(SITE, 'artists.js'), 'utf8');
  a = edit(a, "{ id:'napha', ", `{ id:'napha', tagline:'วาดสิ่งที่หายไป', taglineEn:'I paint what is gone', timeline:[{y:2016,t:'นิทรรศการแรก',tEn:'First show'},{y:2024,t:'เปิดตึก',tEn:'Opened the building'},{y:2025}], instagram:'https://instagram.com/napha.example', sold:4, `, 'napha');
  a = edit(a, "{ id:'thara', ", "{ id:'thara', instagram:'http://insecure.example',", 'thara');
  let c = fs.readFileSync(path.join(SITE, 'circles.js'), 'utf8');
  c = edit(c, /endpoint: '[^']*'/, "endpoint: ''", 'CONFIG.endpoint');
  c = edit(c, /donate: '[^']*'/, "donate: 'https://donate.example/circles'", 'CONFIG.donate');
  c = edit(c, /turnstileSiteKey: '[^']*'/, "turnstileSiteKey: ''", 'CONFIG.turnstileSiteKey');
  fs.writeFileSync(path.join(DIR, 'artists.js'), a); fs.writeFileSync(path.join(DIR, 'circles.js'), c);
  if (build) {
    const env = {...process.env, CIRCLES_FIXTURE: DIR, CIRCLES_DIST: DIST};
    execFileSync('npx', ['vite', 'build', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'error'], {cwd: APP, env, stdio: 'inherit'});
    execFileSync('node', ['scripts/pages.mjs'], {cwd: APP, env, stdio: 'ignore'});
  }
  const js = f => () => fs.readFileSync(path.join(DIR, f), 'utf8');
  return {dir: DIR, dist: DIST, routes: {'/artists.js': js('artists.js'), '/circles.js': js('circles.js')}};
}
