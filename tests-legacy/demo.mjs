// The owner's artists.js hides the ten sample artists once the generated LIVE block says hideDemo (tools/merge-live.mjs), and tools/build.mjs then writes pages
// for the owner only. Most suites test the demo city, so they read artists.js through demoArtists(), and run.mjs serves them demoSite(): a throw-away copy
// of the site, rebuilt with the demo shown. (build, tower, realmode and live use the real folder on purpose.)
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
const HIDE = /"hideDemo":true\}\);/, SHOW = '"hideDemo":false});';
export const demoArtists = root => fs.readFileSync(path.join(root, 'artists.js'), 'utf8').replace(HIDE, SHOW);
export function demoSite(root) {
  const src = fs.readFileSync(path.join(root, 'artists.js'), 'utf8');
  if (!HIDE.test(src)) return root;   // the demo is already shown: nothing to rebuild
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'circles-demo-'));
  const skip = ['.git', 'node_modules', 'app', 'dist', 'review-shots', 'art-originals', 'screenshots', 'design', 'docs', 'supabase'];
  const r = spawnSync('rsync', ['-a', ...skip.map(d => `--exclude=/${d}`), '--exclude=/studio-*.html', '--exclude=/profile-*.html', `${root}/`, `${dir}/`], {stdio: 'inherit'});
  if (r.status !== 0) throw new Error('could not copy the site for the demo tests (rsync)');
  fs.writeFileSync(path.join(dir, 'artists.js'), src.replace(HIDE, SHOW));
  const live = path.join(dir, 'artists.live.json');
  if (fs.existsSync(live)) fs.writeFileSync(live, JSON.stringify({...JSON.parse(fs.readFileSync(live, 'utf8')), hideDemo: false}));
  const b = spawnSync(process.execPath, ['tools/build.mjs'], {cwd: dir, stdio: 'pipe', encoding: 'utf8'});
  if (b.status !== 0) throw new Error('the demo copy did not build: ' + String(b.stderr || b.stdout).slice(-400));
  return dir;
}
