#!/usr/bin/env node
// tools/stamp.mjs — cache busting. GitHub Pages lets browsers keep a file for 10 minutes, so right after a push a visitor can get the new
// page with an old circles.js. This puts ?v=<first 8 hex of the file's sha1> on every local .js/.css a root page links, and fills
// PUNK_V in circles.js for the files it loads on demand. A file that did not change keeps its number. Run before committing a release:
//   npm run stamp            (safe to run again: it only rewrites numbers that changed)
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {strip} from './merge-live.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// artists.js is hashed without the generated LIVE block (never committed), so the number matches what is in git.
// shortcut: a live-data merge alone keeps the old number (visitors may see it up to 10 min late); stamp in dist.mjs if that ever matters
const body = f => f === 'artists.js' ? strip(fs.readFileSync(path.join(ROOT, f), 'utf8')) : fs.readFileSync(path.join(ROOT, f));
const hash = f => crypto.createHash('sha1').update(body(f)).digest('hex').slice(0, 8);
const write = (f, s) => { if (fs.readFileSync(path.join(ROOT, f), 'utf8') !== s) { fs.writeFileSync(path.join(ROOT, f), s); return 1; } return 0; };

// 1. the files circles.js loads by itself (PUNK_FILES), stamped first because writing PUNK_V changes circles.js
let cj = fs.readFileSync(path.join(ROOT, 'circles.js'), 'utf8');
const files = [...new Set([...(cj.match(/const PUNK_FILES = \{([^\n]*)\};/) || [, ''])[1].matchAll(/'([\w.-]+\.(?:js|css))'/g)].map(m => m[1]))];
if (!files.length || !/const PUNK_V = \{[^}]*\};/.test(cj)) throw new Error('circles.js: PUNK_FILES or PUNK_V not found');
const map = Object.fromEntries(files.filter(f => fs.existsSync(path.join(ROOT, f))).map(f => [f, hash(f)]));
let changed = write('circles.js', cj.replace(/const PUNK_V = \{[^}]*\};/, `const PUNK_V = ${JSON.stringify(map).replace(/,/g, ', ')};`));

// 2. every root page: src="x.js" / href="x.css" (with or without an old ?v=) → ?v=<hash>
for (const page of fs.readdirSync(ROOT).filter(n => n.endsWith('.html'))) {
  const s = fs.readFileSync(path.join(ROOT, page), 'utf8');
  changed += write(page, s.replace(/((?:src|href)=")([\w./-]+\.(?:js|css))(?:\?v=[0-9a-f]*)?"/g, (m, a, f) => fs.existsSync(path.join(ROOT, f)) && !f.startsWith('/') ? `${a}${f}?v=${hash(f)}"` : m));
}
console.log(`stamp: ${changed} file(s) updated`);
