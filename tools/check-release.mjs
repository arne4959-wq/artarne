// Release check for circles.  node tools/check-release.mjs [--strict]
// Always fails (exit 1) on real bugs: a language missing keys, a legend with no words/profile.
// Prints WARNINGS for "still a prototype" things (sample bank, example e-mail, [__] placeholders, old dist/).
// With --strict the warnings fail too: run it with --strict right before you go live.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const strict = process.argv.includes('--strict');
const fail = [], warn = [];
const read = f => fs.readFileSync(path.join(root, f), 'utf8');
const exists = f => fs.existsSync(path.join(root, f));

/* 1. every language has every key (what a visitor sees when a key is missing: another language) */
const circles = read('circles.js');
const m = circles.match(/const STR\s*=\s*\{/);
if (!m) fail.push('circles.js: could not find STR');
else {
  let d = 0, j = m.index + m[0].length - 1;
  for (; j < circles.length; j++) { if (circles[j] === '{') d++; else if (circles[j] === '}') { d--; if (!d) break; } }
  const STR = vm.runInNewContext('(' + circles.slice(m.index + m[0].length - 1, j + 1) + ')');
  const langs = Object.keys(STR), all = new Set(langs.flatMap(l => Object.keys(STR[l])));
  for (const l of langs) {
    const miss = [...all].filter(k => !(k in STR[l]));
    if (miss.length) fail.push(`language "${l}" is missing ${miss.length} key(s): ${miss.slice(0, 8).join(', ')}${miss.length > 8 ? ' …' : ''}`);
  }
  console.log(`languages: ${langs.join(', ')} · ${all.size} keys`);
}

/* 2. legends: every entry has a profile in showcase.js; pictures not added yet are only a note */
const lg = read('legends.js'), sc = read('showcase.js');
const files = [...lg.matchAll(/file:\s*'(legends\/[^']+)'/g)].map(x => x[1]);
const bio = new Set([...sc.matchAll(/\n    (\w+): \{\n      name:/g)].map(x => x[1]));
for (const f of files) {
  const id = f.split('/').pop().split('-')[0];
  if (!bio.has(id)) fail.push(`legend "${id}" has no profile (BIO) in showcase.js`);
  if (!exists(f)) warn.push(`legend picture not added yet: ${f} (the legend stays hidden until the file is there)`);
}
console.log(`legends: ${files.length} entries`);

/* 3. still-a-prototype markers */
if (/sample:\s*true/.test(circles)) warn.push('CONFIG.support.sample is true: the bank details and QR are samples');
if (/\.example/.test(circles.split('\n').find(l => l.startsWith('const CONFIG')) || '')) warn.push('CONFIG.contact is a *.example address');
if (/donate:\s*''/.test(circles)) warn.push("CONFIG.donate is empty (the 'support the site' link)");
const pages = fs.readdirSync(root).filter(n => n.endsWith('.html'));
for (const p of pages) { const n = (read(p).match(/\[__\]/g) || []).length; if (n) warn.push(`${p}: ${n} "[__]" placeholder(s)`); }
for (const p of ['privacy.html', 'terms.html']) if (exists(p) && /template/i.test(read(p))) warn.push(`${p}: still marked as a template`);

/* 4. dist/ is the folder you upload: is it older than the source? */
if (!exists('dist')) warn.push('dist/ does not exist: run npm run dist before uploading');
else {
  const top = fs.readdirSync(root).filter(n => /\.(html|css|js)$/.test(n) && fs.statSync(path.join(root, n)).isFile());
  const stale = top.filter(n => !exists('dist/' + n) || read(n) !== read('dist/' + n));
  if (stale.length) warn.push(`dist/ is older than the source (${stale.length} file(s), e.g. ${stale.slice(0, 4).join(', ')}): run npm run dist`);
}

for (const x of fail) console.log('FAIL  ' + x);
for (const x of warn) console.log('WARN  ' + x);
if (!fail.length && !warn.length) console.log('OK    nothing to fix');
process.exit(fail.length || (strict && warn.length) ? 1 : 0);
