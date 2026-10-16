// lao-review.mjs — makes lao-review.csv: every Lao text that is still a DRAFT, next to its Thai and English, with an empty column for a
// native Lao reader to write the corrected text. Open it in Excel / Numbers / Google Sheets (UTF-8).
//   npm run lao-review
// When the reviewed file comes back, copy the corrected Lao into circles.js (site) or app/src/lib/manageStrings.js (settings page)
// and delete the "// DRAFT lo" comment on that line.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const objAt = (src, re) => {
  const m = src.match(re); if (!m) return null;
  let d = 0, j = m.index + m[0].length - 1;
  for (; j < src.length; j++) { if (src[j] === '{') d++; else if (src[j] === '}') { d--; if (!d) break; } }
  return vm.runInNewContext('(' + src.slice(m.index + m[0].length - 1, j + 1) + ')');
};
const csv = v => '"' + String(v ?? '').replace(/"/g, '""').replace(/\r?\n/g, ' ') + '"';
const rows = [];

const circles = fs.readFileSync(path.join(root, 'circles.js'), 'utf8');
const STR = objAt(circles, /const STR\s*=\s*\{/);
const draft = new Set();
for (const line of circles.split('\n')) if (/DRAFT lo/.test(line)) { const k = line.match(/^\s*([A-Za-z0-9_]+)\s*:/); if (k) draft.add(k[1]); }
for (const k of Object.keys(STR.lo)) if (draft.has(k)) rows.push(['site (circles.js)', k, STR.th[k], STR.en[k], STR.lo[k]]);

const ms = fs.readFileSync(path.join(root, 'app/src/lib/manageStrings.js'), 'utf8');
const MS = objAt(ms, /export const MS\s*=\s*\{/);
for (const k of Object.keys(MS.lo)) rows.push(['settings page (manageStrings.js)', k, MS.th[k], MS.en[k], MS.lo[k]]);

const out = path.join(root, 'lao-review.csv');
fs.writeFileSync(out, '﻿' + [['where', 'key', 'Thai', 'English', 'Lao (draft)', 'Lao (corrected by reader)', 'note'].map(csv).join(','), ...rows.map(r => [...r, '', ''].map(csv).join(','))].join('\n') + '\n');
console.log(`${rows.length} Lao draft texts written to lao-review.csv. Send it to a native Lao reader.`);
