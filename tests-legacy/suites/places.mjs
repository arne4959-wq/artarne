// The artists' own words, the weekly highlights, the Legends frame, "Support circles" (kept apart from artist donations), the resonated button, Lao strings.
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS} = new Function(fs.readFileSync(path.join(__root, 'artists.js'), 'utf8') + '\n;return {ARTISTS};')();
export const name = 'places';
export async function run({url, check}) {
  const all = ARTISTS.flatMap(a => a.pieces);
  check('every sample work has say, why and look (TH + EN)', all.every(p => p.say && p.sayEn && p.why && p.whyEn && p.look && p.lookEn), all.filter(p => !p.say).map(p => p.tEn));
  const b = await launch(); await b.lang('en'); await b.view(1280, 900); const ev = b.ev;
  await ev("localStorage.clear()");
  /* highlights */
  await b.go(`${url}/highlights.html`, 3000);
  const h = await ev("({tabs:document.querySelectorAll('#hi-tabs [role=tab]').length,towers:document.querySelectorAll('.pl-twr').length,dir:document.querySelectorAll('.pl-dir li').length,txt:document.body.innerText,money:/\\$\\s?\\d/.test(document.getElementById('main').innerText),dist:!!document.querySelector('.pl-dist')})");
  check('highlights: 3 tabs, 3 towers, 3 lobby-board rows, the signposts', h.tabs === 3 && h.towers === 3 && h.dir === 3 && h.dist, h);
  check('highlights: says "not a competition", no donation amounts on the page', /Not a competition/.test(h.txt) && !h.money);
  await ev("document.getElementById('tab-c').click()");
  check('highlights: concepts tab shows the artists\' own words', await ev("document.querySelectorAll('#pan-c .pl-cp q').length>=3 && !document.getElementById('pan-c').hidden"));
  /* legends */
  await b.go(`${url}/legends.html`, 3000);
  const l = await ev(`(()=>{const rooms=[...document.querySelectorAll('.pl-vt')];const own=r=>r.querySelector('.pl-vt-own q')?.textContent||'';const img=r=>r.querySelector('img');return {rooms:rooms.length,names:rooms.map(r=>r.querySelectorAll('dd')[1].textContent),
    donate:document.querySelectorAll('[data-support],.pf-sbtn,.pf-donate').length,go:!!document.querySelector('.pl-nodon a[href="highlights.html"]'),
    other:document.querySelectorAll('audio,video,.pl-vt.empty,.pl-vt-stamp,.pl-flt,[data-type=film],[data-type=music]').length,
    pics:rooms.every(r=>img(r)&&/^legends\\/.+\\.jpg$/.test(img(r).getAttribute('src'))),loaded:rooms.every(r=>img(r)?.complete&&img(r).naturalWidth>400),
    quotes:rooms.every(r=>own(r).length>20),srcs:rooms.every(r=>/^https:/.test(r.querySelector('.pl-vt-own a')?.href||'')),
    credits:rooms.every(r=>/CC0|public domain|สาธารณสมบัติ/.test(r.querySelector('dl>div:last-child dd')?.textContent||'')&&/^https:/.test(r.querySelector('dl>div:last-child a')?.href||'')),
    hist:rooms.every(r=>/\\(.*circles.*\\)/.test(r.querySelector('.pl-vt-hist dt').textContent)),sign:rooms.every(r=>r.querySelector('.pl-vt-sign')?.textContent.length>1)}})()`);
  check('legends: paintings only (no film, music, samples or empty rooms), no donate button, a link to the living artists', l.rooms >= 2 && l.other === 0 && l.donate === 0 && l.go, l);
  check('legends: Claude Monet and Vincent van Gogh are there, each with a painting file that loads', l.names.some(n => /Monet/.test(n)) && l.names.some(n => /Gogh/.test(n)) && l.pics && l.loaded, l);
  check('legends: each room has the painter\'s own words with a linked source, a sign, a history note labelled as circles\' words, and a linked CC0/public-domain credit', l.quotes && l.srcs && l.sign && l.hist && l.credits, l);
  await ev("document.getElementById('lang-btn')?.click()"); 
  const lang = await ev("(()=>{for(const l of ['en','lo']){setLang(l);var rs=[...document.querySelectorAll('.pl-vt')];if(!rs.length||rs.some(r=>r.querySelector('.pl-vt-own q').textContent.length<20||!r.querySelector('dd').textContent.trim()))return 'empty '+l;}setLang('th');return 'ok'})()");
  check('legends: English and Lao render every room (Lao falls back to Thai only where a line is missing)', lang === 'ok', lang);
  /* studio work window: the artist's words + resonated */
  await b.go(`${url}/cutaway.html?id=napha&work=0`, 3500);
  const w = await ev("({voice:!!document.querySelector('#dlg .voice'),stamp:/Written by the artist/.test(document.querySelector('.v-stamp')?.textContent||''),rows:document.querySelectorAll('#dlg .v-rows>div').length,note:/does not edit or interpret/.test(document.querySelector('.v-note')?.textContent||''),room:document.getElementById('dlg-fl').textContent})");
  check('work window: "In the artist\'s words" with the stamp, 2 rows and the no-edit note', w.voice && w.stamp && w.rows === 2 && w.note && /Room/.test(w.room), w);
  const c0 = +(await ev("document.querySelector('#dlg-res b').textContent"));
  await ev("document.getElementById('dlg-res').click()");
  const c1 = +(await ev("document.querySelector('#dlg-res b').textContent"));
  check('resonated: one tap adds one, a second tap takes it back', c1 === c0 + 1 && +(await ev("(document.getElementById('dlg-res').click(),document.querySelector('#dlg-res b').textContent)")) === c0);
  /* support circles: footer link, 3 floors, separate from the artist */
  await b.go(`${url}/profile-napha.html`, 3000);
  const s = await ev("(()=>{const f=document.querySelector('.sc-foot');if(!f)return 'no footer link';f.click();const d=document.getElementById('dlg-sc');return {open:d.open,floor:d.querySelector('.cdlg-fl b')?.textContent,plate:!!d.querySelector('.sc-plate')}})()");
  check('support circles: opens from the footer on floor 1/3 with the gold "not the artist" plate', s.open && /1\/3/.test(s.floor) && s.plate, s);
  await ev("document.querySelector('#dlg-sc .pf-amt').click()"); await sleep(300);
  await ev("document.querySelector('[data-sc-sent]').click()"); await sleep(300);
  check('support circles: thank-you on floor 3/3, remembered apart from artist tips', await ev("/3\\/3/.test(document.querySelector('#dlg-sc .cdlg-fl b').textContent) && !!JSON.parse(localStorage.getItem('circles-sample-v1')).circles && !JSON.parse(localStorage.getItem('circles-sample-v1')).tips"));
  /* artist donation: 4 floors, thank-you offers the separate option */
  await b.go(`${url}/profile-napha.html`, 3000);
  await ev("document.querySelector('[data-pf-tip=\"5\"]').click()"); await sleep(400);
  const f2 = await ev("/2\\/4/.test(document.querySelector('#dlg-tip .cdlg-fl b').textContent)");
  await ev("document.querySelector('[data-sm-sent]').click()"); await sleep(300);
  await ev("(()=>{const f=document.querySelector('#dlg-tip form');f.elements.name.value='A';f.elements.email.value='a@b.co';f.requestSubmit()})()"); await sleep(1800);
  check('artist donation: floors 2/4 then 4/4 with a stone and the separate "Support circles" box', f2 && await ev("/4\\/4/.test(document.querySelector('#dlg-tip .cdlg-fl b').textContent) && !!document.querySelector('#dlg-tip .stone') && !!document.querySelector('#dlg-tip .after [data-sc]')"));
  check('profile: first sentence of the artist under each picture', await ev("document.querySelectorAll('.pf-say').length>=3"));
  b.close();
  /* Lao */
  const lb = await launch(); await lb.lang('lo'); await lb.view(1280, 900);
  await lb.go(`${url}/highlights.html`, 3000);
  check('Lao: highlights page and footer link are in Lao', await lb.ev("/ໄຮໄລທ໌/.test(document.querySelector('.pl-h').textContent) && /ຊ່ວຍ/.test(document.querySelector('.sc-foot').textContent)"));
  lb.close();
}
