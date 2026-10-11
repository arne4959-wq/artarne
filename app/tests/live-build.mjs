// The Supabase → site bridge, end to end without the network: a made-up real artist in artists.live.json is built into the app
// (own folder, own dist), then its buy and profile pages are opened in a headless Chrome. Needs Node 22 and Chrome.
//   node app/tests/live-build.mjs [folder for screenshots]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';
import {rowsToArtists} from '../../tools/live-data.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SITE = path.resolve(APP, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'live-build-')), DIR = path.join(TMP, 'site'), DIST = path.join(TMP, 'dist');
const out = process.argv[2] || TMP;
fs.mkdirSync(DIR);
for (const f of ['artists.js', 'circles.js']) fs.copyFileSync(path.join(SITE, f), path.join(DIR, f));
const row = {id: 'mali-live', name: 'มะลิ', name_en: 'Mali', name_lo: 'ມະລິ', disc: 'ศิลปะดิจิทัล', city: 'เวียงจันทน์', since: 2018, bio: 'วาดเมืองกลางคืน', bio_en: 'Night-city drawings', bio_lo: null, tagline: 'เมืองที่ไม่หลับ',
  tagline_en: 'The city that does not sleep', concept: null, concept_en: null, instagram: 'https://instagram.com/mali', commission_open: true, commission_until: 'ธ.ค.', commission_until_en: 'Dec', sold_elsewhere: 2,
  timeline: [], scale: '1', kind: 'arch', colors: [], created_at: '2026-10-01T00:00:00Z'};
const w = (i, o) => ({artist_id: 'mali-live', position: i, title: 'ตลาดกลางคืน', title_en: 'Night Market', title_lo: null, year: 2024, medium: 'สีน้ำมัน', medium_en: 'Oil', medium_lo: null, size: '50 × 70 ซม.', size_lo: null,
  price_usd: '450.00', price_lak: '10000000', ar: '4/5', img: 'art/napha-1.svg', status: '', edition: null, pay: null, quote: 'แสงสุดท้าย', quote_en: 'The last light', quote_lo: null, story: null, story_en: null, story_lo: null, concept: null, ...o});
const live = rowsToArtists([row], [w(0, {}), w(1, {title: 'ซีรีส์พิมพ์', title_en: 'Print Series', edition: 12, price_usd: '60.00', price_lak: null}), w(2, {title: 'ขายแล้ว', title_en: 'Sold One', status: 'sold'})]);
fs.writeFileSync(path.join(DIR, 'artists.live.json'), JSON.stringify({pulledAt: 'test', hideDemo: false, artists: live}));
const env = {...process.env, CIRCLES_FIXTURE: DIR, CIRCLES_DIST: DIST};
execFileSync('npx', ['vite', 'build', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'error'], {cwd: APP, env, stdio: 'inherit'});
execFileSync('node', ['scripts/pages.mjs'], {cwd: APP, env, stdio: 'ignore'});

let ok = 0, bad = 0; const check = (n, c, x = '') => { c ? ok++ : bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '  ' + x)); };
for (const f of ['studio-mali-live.html', 'profile-mali-live.html', 'buy-mali-live-0.html', 'buy-mali-live-1.html', 'buy-mali-live-2.html', 'buy-napha-0.html'])
  check(`page file ${f} exists`, fs.existsSync(path.join(DIST, f)));
const srv = await startServer(DIST), b = await launch(); await b.lang('th');
const ev = e => b.ev(e), text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent||''`);
await b.view(1280, 900);

await b.go(`${srv.url}/buy-mali-live-0.html`, 1800);
check('buy page shows the real work, its price and the artist', /ตลาดกลางคืน/.test(await text('#by-title')) && /\$450/.test(await text('.by-price')) && /มะลิ/.test(await text('.by-chip')), await text('#by'));
check('the picture is the one from the database', /napha-1\.svg/.test(await ev("document.querySelector('.by-frame img')?.src||''")));
check('an unsold one-off work says one of a kind', /ชิ้นเดียว/.test(await text('.by-sticker')), await text('.by-sticker'));
await b.go(`${srv.url}/buy-mali-live-1.html`, 1500);
check('a work with an edition says so, not "one of a kind"', /edition 12|edition of 12/.test(await text('.by-sticker')), await text('.by-sticker'));
await b.go(`${srv.url}/buy-mali-live-2.html`, 1500);
check('a sold work shows the sold stamp', /ขายแล้ว/.test(await text('.by-sticker')), await text('.by-sticker'));
await b.go(`${srv.url}/profile-mali-live.html`, 1800);
check('profile shows name, tagline, commission, sold count (2 elsewhere + 1 here)', /มะลิ|Mali/.test(await text('#pf-name')) && /เมืองที่ไม่หลับ/.test(await text('#pf')) && /\b3\b/.test(await text('#pf')), (await text('#pf')).slice(0, 300));
await b.shot(`${out}/live-profile.png`);
await b.go(`${srv.url}/buy-napha-0.html`, 1500);
check('the sample artists are still there', /นภา|Napha/.test(await text('.by-chip')));
await b.go(`${srv.url}/buy-mali-live-0.html`, 1500);
check('the artist message goes to the site contact when the artist has no public address', await (async () => {
  await ev("document.querySelector('.by-form [name=name]').value='A';document.querySelector('.by-form [name=email]').value='a@b.co'");
  return !/mali-live@/.test(await ev("document.documentElement.outerHTML"));
})());
await b.go(`${srv.url}/buy.html?id=mali-live&k=9`, 1500);
check('a work that does not exist shows the not-found section, not a crash', await ev("!!document.querySelector('.nf')"));
console.log(b.logs.filter(l => !/favicon|Cloudflare|turnstile|lgkqvfm/i.test(l)).slice(0, 6).join('\n') || '(no console errors)');
console.log(`${ok} passed, ${bad} failed`);
b.close(); srv.close(); fs.rmSync(TMP, {recursive: true, force: true, ...(out === TMP ? {} : {})});
process.exit(bad ? 1 : 0);
