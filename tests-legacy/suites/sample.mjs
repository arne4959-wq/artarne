// Sample mode (no real payment data): shipping terms filled in, tip block on profiles, the buy page's QR + "I have paid" flow, the phone loader, the home-page search.
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS, CITY_EN} = new Function(fs.readFileSync(path.join(__root, 'artists.js'), 'utf8') + '\n;return {ARTISTS, CITY_EN};')();
export const name = 'sample';
export async function run({url, check}) {
  const A = ARTISTS.find(a => a.pieces.some(p => p.status !== 'sold' && p.status !== 'reserved') && !a.live), k = A.pieces.findIndex(p => p.status !== 'sold' && p.status !== 'reserved');
  const buy = `${url}/buy-${A.id}-${k}.html`;

  /* ---------- buy page: shipping terms and the whole sample payment flow, in English ---------- */
  let b = await launch(); await b.lang('en'); await b.view(1280, 900); const ev = b.ev;
  await ev("localStorage.removeItem('circles-sample-v1')");
  await b.go(buy, 2500);
  check('buy page: no yellow [__] placeholder is left (shipping, fee, days, returns, reply, certificate, THB)', (await ev("document.querySelectorAll('.by-todo').length")) === 0 && (await ev("document.querySelector('.by-fx')?.textContent||''")).includes('THB'));
  check('buy page (sample): the QR is generated and labelled SAMPLE, with a banner and the account block', (await ev("!!document.querySelector('.by-box svg.sm-qr') && /SAMPLE/.test(document.querySelector('.by-box .sup-sample')?.textContent||'') && !!document.querySelector('.by-box .sup-dl')")));
  check('buy page (sample): the message form / mailto path is not shown (nothing can be sent)', (await ev("!document.querySelector('.by-form')")));
  await ev("document.querySelector('[data-sm-paid]').click()"); await sleep(300);
  check('"I have paid" opens the notice form: name, e-mail, optional slip image, no CAPTCHA', (await ev("!!document.querySelector('.sm-form input[name=name]') && !!document.querySelector('.sm-form input[name=email]') && document.querySelector('.sm-form input[type=file]')?.accept==='image/*' && !document.querySelector('.cf-holder,.cf-turnstile')")));
  await ev("document.querySelector('.sm-form').requestSubmit()"); await sleep(200);
  check('empty notice is refused with a message', (await ev("!document.querySelector('.sm-err').hidden")) && (await ev("!!document.querySelector('.sm-form')")));
  await ev("(()=>{const f=document.querySelector('.sm-form');f.name.value='Test Buyer';f.email.value='buyer@example.com';const d=new DataTransfer();d.items.add(new File([new ArrayBuffer(3*1024*1024)],'slip.png',{type:'image/png'}));f.slip.files=d.files;f.slip.dispatchEvent(new Event('change',{bubbles:true}));})()"); await sleep(200);
  check('a slip over 2 MB is refused', /2 MB/.test(await ev("document.querySelector('.sm-err').textContent")) && (await ev("!document.querySelector('.sm-err').hidden")));
  await ev("(()=>{const f=document.querySelector('.sm-form');const d=new DataTransfer();d.items.add(new File([new ArrayBuffer(2000)],'slip.png',{type:'image/png'}));f.slip.files=d.files;f.slip.dispatchEvent(new Event('change',{bubbles:true}));f.requestSubmit();})()"); await sleep(1500);
  check('submit simulates success: the work is ON HOLD with a demo note, nothing sent', (await ev("document.querySelector('.by-done')?.textContent||''")).includes('ON HOLD') && (await ev("document.querySelector('.by-done')?.textContent||''")).includes('nothing was sent') && (await ev("document.querySelector('.by-chip-st')?.textContent||''")).includes('ON HOLD'));
  await b.go(buy, 2500);
  check('the hold is remembered on reload (this browser only)', (await ev("document.querySelector('.by-done')?.textContent||''")).includes('ON HOLD'));
  await ev("document.querySelector('[data-sm-clear]').click()"); await sleep(400);
  check('"clear the demo state" brings the QR back', (await ev("!!document.querySelector('.by-box svg.sm-qr')")));
  const out = (await ev("performance.getEntriesByType('resource').map(r=>r.name)")).filter(u => !u.startsWith(url));
  check('sample flow: no request leaves the project', out.length === 0, out);
  check('sample flow: no console / network errors', b.logs.filter(l => !/ViewTransition opt-in disabled/.test(l)).length === 0, b.logs);
  b.close();

  /* ---------- the same page in Thai at 375px: wording is Thai, nothing overflows ---------- */
  b = await launch(); await b.lang('th'); await b.view(375, 812, true);
  await b.go(buy, 2500);
  check('buy page (Thai, 375px): Thai wording and no sideways scroll', (await b.ev("document.querySelector('.by-box')?.textContent||''")).includes('ตัวอย่าง') && (await b.ev('document.documentElement.scrollWidth')) <= 376);
  b.close();

  /* ---------- profile: tip block ---------- */
  b = await launch(); await b.lang('en'); await b.view(1280, 900);
  await b.go(`${url}/profile-${A.id}.html`, 3500);
  check('profile: presets 3 / 5 / 10 USD and a custom amount field', (await b.ev("[...document.querySelectorAll('.pf-amt')].map(x=>x.textContent).join()")) === '$3,$5,$10' && (await b.ev("!!document.querySelector('#pf-tip-n')")));
  await b.ev("document.querySelector('.pf-tipf input').value='0';document.querySelector('.pf-tipf').requestSubmit()"); await sleep(200);
  check('profile: an invalid custom amount shows a message and opens nothing', (await b.ev("!document.querySelector('.pf-tiperr').hidden")) && (await b.ev("!document.getElementById('dlg-tip')?.open")));
  await b.ev("document.querySelector('.pf-tipf input').value='25';document.querySelector('.pf-tipf').requestSubmit()"); await sleep(500);
  check('profile: a custom amount opens the dialog with a SAMPLE QR and the amount', (await b.ev("document.getElementById('dlg-tip').open && !!document.querySelector('#dlg-tip svg.sm-qr') && document.querySelector('#dlg-tip .sm-amt').textContent.includes('$25') && /SAMPLE/.test(document.querySelector('#dlg-tip .sup-sample').textContent)")));
  await b.ev("document.querySelector('[data-sm-sent]').click()"); await sleep(300);
  await b.ev("(()=>{const f=document.querySelector('#dlg-tip .sm-form');f.name.value='Kind Person';f.email.value='kind@example.com';f.requestSubmit();})()"); await sleep(1500);
  check('"I\'ve sent a tip" uses the same notice form and ends with a demo thank-you', (await b.ev("document.querySelector('#dlg-tip .cdlg-done')?.textContent||''")).includes('demo') && (await b.ev("JSON.parse(localStorage.getItem('circles-sample-v1')).tips.length")) === 1);
  await b.key('Escape', 'Escape', 27); await sleep(300);
  await b.ev("document.querySelector('.pf-amt').click()"); await sleep(400);
  check('a preset amount opens the dialog too', (await b.ev("document.getElementById('dlg-tip').open && document.querySelector('#dlg-tip .sm-amt').textContent.includes('$3')")));
  check('profile: no console errors', b.logs.filter(l => !/ViewTransition opt-in disabled/.test(l)).length === 0, b.logs);
  b.close();

  /* ---------- loader: skipped on phones, kept on desktop ---------- */
  b = await launch(); await b.view(375, 812, true);
  await b.go(`${url}/index.html`, 600);
  check('phone: no loader, content is there at once', (await b.ev("!document.getElementById('loader') && !document.documentElement.classList.contains('pre')")));
  b.close();
  b = await launch(); await b.view(1280, 860);
  await b.go(`${url}/index.html`, 500);
  check('desktop: the first-visit loader still runs', (await b.ev("!!document.getElementById('loader')")));
  b.close();

  /* ---------- search ---------- */
  b = await launch(); await b.lang('en'); await b.view(1280, 900);
  await b.go(`${url}/index.html`, 3500);
  const type = async v => { await b.ev(`(()=>{const i=document.getElementById('city-q');i.value=${JSON.stringify(v)};i.dispatchEvent(new Event('input',{bubbles:true}));})()`); await sleep(500); };
  const lit = () => b.ev("[...document.querySelectorAll('#strip-in .bd.lit')].length");
  const cityEn = CITY_EN[A.city] || A.city, sameCity = ARTISTS.filter(x => (CITY_EN[x.city] || x.city) === cityEn).length;
  await b.ev("document.getElementById('city-q').focus()");
  check('search: the field is a real input that takes keyboard focus', (await b.ev("document.activeElement.id")) === 'city-q');
  await type(A.nameEn || A.name);
  check('search by English name lights that building', (await lit()) >= 1 && (await b.ev("document.querySelector('#strip-in .bd.lit').getAttribute('href')")) === `studio-${A.id}.html`);
  await type(A.name);
  check('search by Thai name works too', (await lit()) >= 1);
  await type(cityEn);
  check('search by English city lights every artist of that city', (await lit()) === sameCity);
  await type(A.city);
  check('search by Thai city works too', (await lit()) === ARTISTS.filter(x => x.city === A.city).length);
  await type('zzzqqq');
  check('search with no match: empty-state message, nothing lit', (await lit()) === 0 && (await b.ev("document.getElementById('fnote-t').textContent")) === 'No artist matches your search');
  await b.key('Escape', 'Escape', 27); await sleep(400);
  check('Esc in the field clears the search', (await b.ev("document.getElementById('city-q').value")) === '' && (await lit()) === 0);
  await b.ev("document.getElementById('lang').click()"); await sleep(700); await b.ev("document.getElementById('lang').click()"); await sleep(700);
  await type('zzzqqq');
  check('empty-state message is Thai in Thai mode', (await b.ev("document.documentElement.lang")) === 'th' && (await b.ev("document.getElementById('fnote-t').textContent")) === 'ไม่พบศิลปินที่ตรงกับคำค้น');
  b.close();
}
