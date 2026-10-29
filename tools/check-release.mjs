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
const [lgMain, lgMore = ''] = lg.split('const MORE');   // legends first; the gallery pictures (MORE) after
const files = [...lgMain.matchAll(/file:\s*'(legends\/[^']+)'/g)].map(x => x[1]);
const moreFiles = [...lgMore.matchAll(/file:\s*'(legends\/[^']+)'/g)].map(x => x[1]);
const bio = new Set([...sc.matchAll(/\n    (\w+): \{\n      name:/g)].map(x => x[1]));
for (const f of files) {
  const id = f.split('/').pop().split('-')[0];
  if (!bio.has(id)) fail.push(`legend "${id}" has no profile (BIO) in showcase.js`);
  if (!exists(f)) warn.push(`legend picture not added yet: ${f} (the legend stays hidden until the file is there; run npm run pictures)`);
}
const missingMore = moreFiles.filter(f => !exists(f));
if (missingMore.length) warn.push(`${missingMore.length} of ${moreFiles.length} gallery pictures are not in legends/ yet (they simply do not show; run npm run pictures)`);
console.log(`legends: ${files.length} entries, ${moreFiles.length} gallery pictures`);

/* 3. still-a-prototype markers */
if (/analytics:\s*'https?:/.test(circles) && /ไม่ใช้เครื่องมือวิเคราะห์|runs no analytics/.test(read('privacy.html'))) fail.push('CONFIG.analytics is on but privacy.html still says there is no analytics: update privacy.html first');
if (/sample:\s*true/.test((circles.match(/^const CONFIG = .*$/m) || [""])[0])) warn.push('CONFIG.support.sample is true: the bank details and QR are samples');
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

/* 5. privacy: artists.js and artists.live.json are PUBLIC files in a public repo. A real e-mail address must never be in them
   (the live pull from Supabase exports public columns only and blanks the e-mail; private details stay in Supabase). */
const emailRe = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)+/g;
/* In the deploy build (CI) artists.js carries the generated LIVE block and artists.live.json is the fresh pull: neither is committed, and the words in them are what the artists chose
   to show on their public page. An e-mail in an artist's bio must not stop everybody's deploy, so there it is only a warning, and the generated block is not part of artists.js here. */
for (const f of ['artists.js', 'artists.live.json']) {
  if (!exists(f)) continue;
  const text = f === 'artists.js' ? read(f).replace(/\n*\/\*LIVE:BEGIN[\s\S]*?\/\*LIVE:END\*\/\n?/, '\n') : read(f);
  const bad = [...new Set(text.match(emailRe) || [])].filter(e => !/\.example$/i.test(e));
  if (bad.length) (f === 'artists.live.json' && process.env.CI ? warn : fail).push(`${f} is public but contains a real-looking e-mail address (${bad.slice(0, 3).join(', ')}): keep private details in Supabase, never in this file${f === 'artists.live.json' && process.env.CI ? ' (here it is text an artist wrote on their public page: only a warning)' : ''}`);
}

/* 6. pictures: originals do not belong in git (it keeps every version forever). Publish a web copy: webp / jpg, long side <= 1600px, under ~700 KB. */
const RAW = /\.(tiff?|psd|psb|raw|dng|cr2|nef|arw|heic|ai|indd|xcf)$/i, RASTER = /\.(jpe?g|png|webp|gif)$/i;
const walk = d => fs.readdirSync(path.join(root, d), {withFileTypes: true}).flatMap(e => e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
for (const d of ['art', 'og', 'legends', 'people', 'art-originals']) {
  if (!exists(d)) continue;
  for (const f of walk(d)) {
    const kb = Math.round(fs.statSync(path.join(root, f)).size / 1024);
    if (RAW.test(f) || kb > 8192) fail.push(`${f} (${kb} KB) looks like an original: keep originals out of git (Supabase Storage or your own drive), publish a web copy`);
    else if (RASTER.test(f) && kb > 700) warn.push(`${f} is ${kb} KB: make a web copy (long side <= 1600px, under ~700 KB)`);
  }
}

/* 7. URLs never change: every id in published-ids.json must still exist, with its pages (people print QR codes and share links) */
if (!exists('published-ids.json')) warn.push('published-ids.json is missing: it records which artist ids (and URLs) are public');
else {
  const pub = JSON.parse(read('published-ids.json')), retired = pub.retired || {};
  const A = vm.runInNewContext('(function(){' + read('artists.js') + '\n;return ARTISTS})()');
  const live = exists('artists.live.json') ? JSON.parse(read('artists.live.json')) : [];
  const liveList = Array.isArray(live) ? live : (live && live.artists) || [];   // artists.live.json is {artists: [...], hideDemo, pulledAt}
  const have = new Set([...A.map(a => a.id), ...liveList.map(a => a && a.id).filter(Boolean)]);
  for (const id of pub.ids) {
    if (!have.has(id) && !retired[id]) fail.push(`artist "${id}" is public (published-ids.json) but gone from artists.js: studio-${id}.html and profile-${id}.html would break. Keep it, or list it under "retired" with a redirect`);
    for (const f of [`studio-${id}.html`, `profile-${id}.html`]) if (!exists(f)) fail.push(`${f} is missing but "${id}" is public: run npm run build`);
  }
  for (const id of have) if (!pub.ids.includes(id)) warn.push(`artist id "${id}" is not in published-ids.json: add it when it goes live (an id never changes after that)`);
  /* translations are optional: a missing English / Lao field shows the original text, and the site never machine-translates an artist's words */
  const works = A.flatMap(a => a.pieces), en = works.filter(p => p.sayEn || p.stEn || p.qEn).length, lo = works.filter(p => p.sayLo || p.stLo || p.qLo).length;
  console.log(`translations: ${en}/${works.length} works carry the artist's words in English, ${lo}/${works.length} in Lao (the rest show the original text)`);
}

for (const x of fail) console.log('FAIL  ' + x);
for (const x of warn) console.log('WARN  ' + x);
if (!fail.length && !warn.length) console.log('OK    nothing to fix');
process.exit(fail.length || (strict && warn.length) ? 1 : 0);
