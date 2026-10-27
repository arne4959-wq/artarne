// tools/dist.mjs — copies ONLY the public site into dist/ so dev files (tests, tools, notes, snapshots) never get uploaded.
// Run: node tools/dist.mjs   then publish the dist/ folder instead of the project root.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), out = path.join(root, 'dist');
const DIRS = ['art', 'fonts', 'legends', 'og', 'people', 'vendor'];   // people/ = the pixel visitors of the studio hall (tools/make-sprites.mjs)
const FILES = ['.nojekyll', 'robots.txt', 'sitemap.xml', 'og.png', 'favicon.svg'];   // robots.txt points at sitemap.xml
const skip = n => n === '.DS_Store';

fs.rmSync(out, {recursive: true, force: true}); fs.mkdirSync(out);
const copy = (src, dst) => {
  if (fs.statSync(src).isDirectory()) { fs.mkdirSync(dst, {recursive: true}); for (const n of fs.readdirSync(src)) if (!skip(n)) copy(path.join(src, n), path.join(dst, n)); }
  else fs.copyFileSync(src, dst);
};
const top = fs.readdirSync(root).filter(n => fs.statSync(path.join(root, n)).isFile() && /\.(html|css|js)$/.test(n) && n !== 'punk-ui-demo.html');   // the demo page is for testing only (HOOKUP.md)
for (const n of [...top, ...FILES]) if (fs.existsSync(path.join(root, n))) copy(path.join(root, n), path.join(out, n));
for (const d of DIRS) if (fs.existsSync(path.join(root, d))) copy(path.join(root, d), path.join(out, d));
// retired artists (published-ids.json) stay in the repo as test fixtures but are never published: their pages and share images are dropped here
for (const id of Object.keys(JSON.parse(fs.readFileSync(path.join(root, 'published-ids.json'), 'utf8')).retired || {})) for (const f of [`studio-${id}.html`, `profile-${id}.html`, `og/${id}.png`]) fs.rmSync(path.join(out, f), {force: true});

// The artists' settings page (manage.html) is built by the React app (npm run app:build). If that build exists, ship it with its scripts:
// the page and app/dist/assets/ are copied next to the plain-HTML site, so the "Settings" links on the site work.
const appDist = path.join(root, 'app', 'dist');
if (fs.existsSync(path.join(appDist, 'manage.html')) && fs.existsSync(path.join(appDist, 'assets'))) {
  copy(path.join(appDist, 'manage.html'), path.join(out, 'manage.html'));
  copy(path.join(appDist, 'assets'), path.join(out, 'assets'));
  // the footer "Settings" link stays hidden (CONFIG.manage = false in circles.js) unless the page it points at is really in this folder
  const cj = path.join(out, 'circles.js'), src = fs.readFileSync(cj, 'utf8');
  if (!/manage: false,/.test(src)) throw new Error('circles.js: CONFIG.manage not found, cannot show the Settings link');
  fs.writeFileSync(cj, src.replace('manage: false,', 'manage: true,'));
  console.log('manage.html (artist settings) included from app/dist, Settings link switched on');
} else console.log('NOTE: app/dist/manage.html not found, so the artist settings page is NOT in dist/. Run: npm run app:build   then   npm run dist');

// every local file the pages point at must exist in dist/
const missing = new Set();
for (const n of fs.readdirSync(out).filter(n => n.endsWith('.html') || n.endsWith('.css'))) {
  const txt = fs.readFileSync(path.join(out, n), 'utf8');
  for (const m of txt.matchAll(/(?:src|href)="([^"#?:]+\.(?:js|css|png|jpg|svg|webp|woff2|html))["?#]|url\(["']?([^"')#?:]+\.(?:woff2|png|svg|jpg|webp))/g)) {
    const ref = m[1] || m[2]; if (ref.startsWith('/') || ref.startsWith('http') || ref.includes('${')) continue;
    if (!fs.existsSync(path.join(out, ref))) missing.add(`${n} → ${ref}`);
  }
}
console.log(`dist/ ready: ${fs.readdirSync(out).length} top-level entries`);
if (missing.size) console.log('references not found in dist/ (check these):\n - ' + [...missing].join('\n - '));
