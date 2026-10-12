// The Supabase → site bridge, end to end without the network: a made-up real artist in artists.live.json is built into the app
// (own folder, own dist), then its studio and profile pages (and an old buy address) are opened in a headless Chrome. Needs Node 22 and Chrome.
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
  tagline_en: 'The city that does not sleep', concept: null, concept_en: null, instagram: 'https://instagram.com/mali',
  timeline: [], scale: '1', kind: 'arch', colors: [], created_at: '2026-10-01T00:00:00Z'};
const w = (i, o) => ({artist_id: 'mali-live', position: i, title: 'ตลาดกลางคืน', title_en: 'Night Market', title_lo: null, year: 2024, medium: 'สีน้ำมัน', medium_en: 'Oil', medium_lo: null, size: '50 × 70 ซม.', size_lo: null,
  ar: '4/5', img: 'art/napha-1.svg', quote: 'แสงสุดท้าย', quote_en: 'The last light', quote_lo: null, story: null, story_en: null, story_lo: null, concept: null, ...o});
const odd = {...row, id: 'odd-one', name: 'แปลก', name_en: 'Odd', name_lo: null, kind: 'zzz', tagline: null, tagline_en: null, concept: null, bio: null, bio_en: null, instagram: null, created_at: '2026-10-02T00:00:00Z'};
const live = rowsToArtists([row, odd], [w(0, {}), w(1, {title: 'ซีรีส์พิมพ์', title_en: 'Print Series'}), w(2, {title: 'ชิ้นที่สาม', title_en: 'Third One'}),
  w(0, {artist_id: 'odd-one', title: 'ไม่มีรูป', title_en: 'No Picture', img: null, size: null, medium: null, medium_en: null})], [{artist_id: 'mali-live', bank: 'BCEL', account_name: 'Mali L', account_no: '123 456 789', qr_path: null}]);   // Mali has bank details (a real artist can be donated to), Odd has none
fs.writeFileSync(path.join(DIR, 'artists.live.json'), JSON.stringify({pulledAt: 'test', hideDemo: false, artists: live}));
const env = {...process.env, CIRCLES_FIXTURE: DIR, CIRCLES_DIST: DIST};
execFileSync('npx', ['vite', 'build', '--outDir', DIST, '--emptyOutDir', '--logLevel', 'error'], {cwd: APP, env, stdio: 'inherit'});
execFileSync('node', ['scripts/pages.mjs'], {cwd: APP, env, stdio: 'ignore'});

let ok = 0, bad = 0; const check = (n, c, x = '') => { c ? ok++ : bad++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (c ? '' : '  ' + x)); };
for (const f of ['studio-mali-live.html', 'profile-mali-live.html', 'profile-odd-one.html'])
  check(`page file ${f} exists`, fs.existsSync(path.join(DIST, f)));
check('no buy page files are written (nothing is sold)', !fs.readdirSync(DIST).some(f => /^buy/.test(f)));
const srv = await startServer(DIST), b = await launch(); await b.lang('th');
const ev = e => b.ev(e), text = sel => ev(`document.querySelector(${JSON.stringify(sel)})?.textContent||''`);
await b.view(1280, 900);

await b.go(`${srv.url}/profile-mali-live.html?lang=en`, 2500);
check('profile shows name and tagline, no price, no sold count, no commission badge', /Mali/.test(await text('#pf-name')) && /เมืองที่ไม่หลับ|does not sleep/.test(await text('#pf')) && !/\$\s?\d{2,}|SOLD|sold|ON HOLD|commission/i.test(await text('.pf-strip')) && !/commission/i.test(await text('#pf')), (await text('#pf')).slice(0, 300));
check('a real artist with bank details gets the donation block (presets 3 / 5 / 10, custom amount)', (await ev("[...document.querySelectorAll('.pf-amt')].map(x=>x.textContent).join()")) === '$3,$5,$10' && (await ev("!!document.querySelector('#pf-tip-n')")));
await ev("document.querySelector('.pf-amt').click()"); await sleep(500);
check('the donation dialog shows their account (no SAMPLE banner) and lets them press "I\'ve donated"', (await ev("document.getElementById('dlg-tip')?.open")) && /123 456 789/.test(await text('#dlg-tip')) && !/SAMPLE/.test(await text('#dlg-tip .sup-dlg')) && (await ev("!document.querySelector('[data-sm-sent]').disabled")), await text('#dlg-tip'));
await ev("document.getElementById('dlg-tip').close()");
await b.shot(`${out}/live-profile.png`);
await b.go(`${srv.url}/profile-odd-one.html?lang=en`, 2000);
check('a real artist without bank details cannot be donated to yet (disabled button, no donation block)', (await ev("document.querySelector('.pf-sbtn')?.disabled === true && !document.querySelector('.pf-tips')")));
await b.go(`${srv.url}/profile-napha.html?lang=en`, 2000);
await ev("document.querySelector('.pf-amt').click()"); await sleep(500);
check('a sample artist gets a generated SAMPLE QR, nothing sent', /SAMPLE/.test(await text('#dlg-tip')) && (await ev("!!document.querySelector('#dlg-tip svg.sm-qr')")));
await ev("document.getElementById('dlg-tip').close()");
await b.go(`${srv.url}/buy-napha-0.html`, 1500);
check('an old buy address goes to the artist\'s donation block', (await ev('location.pathname')).endsWith('profile-napha.html') && (await ev('location.hash')) === '#pf-tips', await ev('location.href'));
// the home page with real artists (one has an unknown building kind and a work without a picture)
await b.go(`${srv.url}/index.html?lang=en`, 4500);
const H = await ev("({bd:[...document.querySelectorAll('.bd')].map(e=>e.dataset.id), no:[...document.querySelectorAll('.bd .no')].slice(0,2).map(e=>e.textContent), stand:document.querySelectorAll('.bd .stand').length, dist:document.querySelectorAll('.dist').length, cards:[...document.querySelectorAll('.card')].map(c=>c.dataset.id+':'+c.dataset.k), spot:document.querySelector('#spotlight h2 span')?.textContent, cta:document.querySelector('.spot-qa .btn')?.textContent, qa:document.querySelectorAll('.spot-qa .fold-spot').length, meta:document.getElementById('spot-meta')?.textContent, counts:[...document.querySelectorAll('[data-count]')].map(e=>e.dataset.count).join(), sw:document.documentElement.scrollWidth})");
check('home: real artists come first in the city, then the samples (12 buildings)', H.bd.length === 12 && H.bd[0] === 'mali-live' && H.bd[1] === 'odd-one' && H.bd[2] === 'napha', JSON.stringify(H.bd));
check('home: numbered from the data (NO.01, NO.02)', /^NO\.01/.test(H.no[0]) && /^NO\.02/.test(H.no[1]), JSON.stringify(H.no));
check('home: an unknown building kind draws a building, has a district, and just has nobody at the door', H.dist === 12 && H.stand === 11, `dist ${H.dist} stand ${H.stand}`);
check('home: featured works start with the real artists\' first works', H.cards[0] === 'mali-live:0' && H.cards[1] === 'odd-one:0' && H.cards.length === 8, JSON.stringify(H.cards));
check('home: the spotlight is the first real artist, with their own words, not Napha\'s interview', H.spot === 'Mali' && /Mali/.test(H.cta) && H.qa === 0 && /^NO\.01/.test(H.meta), JSON.stringify({s: H.spot, c: H.cta, m: H.meta}));
check('home: the numbers follow the data (12 artists)', H.counts.split(',')[0] === '12', H.counts);
check('home: no sideways scroll', H.sw <= 1280, H.sw);
await b.go(`${srv.url}/profile-odd-one.html?lang=en`, 1500);
const oddPf = await ev(`({name: !!document.querySelector('#pf-name'), badSrc: !!document.querySelector('img[src="undefined"]')})`);
check('profile of an artist whose work has no picture does not break (no broken <img>)', oddPf.name && !oddPf.badSrc, JSON.stringify(oddPf));
console.log(b.logs.filter(l => !/favicon|Cloudflare|turnstile|lgkqvfm/i.test(l)).slice(0, 6).join('\n') || '(no console errors)');
console.log(`${ok} passed, ${bad} failed`);
b.close(); srv.close(); fs.rmSync(TMP, {recursive: true, force: true, ...(out === TMP ? {} : {})});
process.exit(bad ? 1 : 0);
