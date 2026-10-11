// tools/dist.mjs — copies ONLY the public site into dist/ so dev files (tests, tools, notes, snapshots) never get uploaded.
// Run: node tools/dist.mjs   then publish the dist/ folder instead of the project root.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..'), out = path.join(root, 'dist');
const DIRS = ['art', 'fonts', 'og', 'vendor'];
const FILES = ['.nojekyll', 'robots.txt', 'og.png', 'sitemap.xml'];   // sitemap.xml exists only after a --site build
const skip = n => n === '.DS_Store';

fs.rmSync(out, {recursive: true, force: true}); fs.mkdirSync(out);
const copy = (src, dst) => {
  if (fs.statSync(src).isDirectory()) { fs.mkdirSync(dst, {recursive: true}); for (const n of fs.readdirSync(src)) if (!skip(n)) copy(path.join(src, n), path.join(dst, n)); }
  else fs.copyFileSync(src, dst);
};
const top = fs.readdirSync(root).filter(n => fs.statSync(path.join(root, n)).isFile() && /\.(html|css|js)$/.test(n));
for (const n of [...top, ...FILES]) if (fs.existsSync(path.join(root, n))) copy(path.join(root, n), path.join(out, n));
for (const d of DIRS) if (fs.existsSync(path.join(root, d))) copy(path.join(root, d), path.join(out, d));

// the templates (cutaway.html, profile.html, buy.html) show Napha by default, a copy of studio/profile/buy-napha: keep them out of search results
for (const n of ['cutaway.html', 'profile.html', 'buy.html']) {
  const f = path.join(out, n); if (!fs.existsSync(f)) continue;
  const html = fs.readFileSync(f, 'utf8');
  if (!/name="robots"/.test(html)) fs.writeFileSync(f, html.replace(/<meta name="viewport"[^>]*>/, m => `${m}\n<meta name="robots" content="noindex">`));
}

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
