// Donation-only site, sample mode (no real payment data): no selling anywhere, the donation dialog from home / studio / profile, old buy addresses, the phone loader, the home-page search.
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS, CITY_EN} = new Function(fs.readFileSync(path.join(__root, 'artists.js'), 'utf8') + '\n;return {ARTISTS, CITY_EN};')();
export const name = 'sample';
export async function run({url, check}) {
  const A = ARTISTS.find(a => !a.live);
  const quiet = l => !/ViewTransition opt-in disabled/.test(l);

  /* ---------- nothing is for sale: no price, buy button, buy link, sold / reserved label on any page (TH and EN) ---------- */
  const files = fs.readdirSync(__root).filter(f => /\.html$/.test(f));
  check('no buy page is left: no buy.html / buy-*.html, no buy.js / buy.css', !files.some(f => /^buy/.test(f)) && !fs.existsSync(path.join(__root, 'buy.js')) && !fs.existsSync(path.join(__root, 'buy.css')));
  const withBuyLink = files.filter(f => /href="buy[-.]/.test(fs.readFileSync(path.join(__root, f), 'utf8')));
  check('no page links to a buy page', !withBuyLink.length, withBuyLink);
  const SELLING = `(()=>{const t=document.body.innerText;const bad=[];
    if(/\\$ ?\\d|THB|₭|฿/.test(t.replace(/\\$[0-9]+(?=\\s*\\n|\\s*$)/g,'')))bad.push('amount');
    if(/\\b(SOLD|ON HOLD|RESERVED|ONE OF A KIND|Buy direct|Shipping)\\b|ขายแล้ว|จองแล้ว|ซื้อตรง|ค่าส่ง/.test(t))bad.push('sale wording');
    if(document.querySelector('a[href^="buy"],.by-box,[class*=" pp"],.strike,.stamp,.chip'))bad.push('sale element');
    return bad;})()`;
  for (const lang of ['en', 'th']) {
    const b = await launch(); await b.lang(lang); await b.view(1280, 900);
    for (const p of ['index.html', `studio-${A.id}.html`, `studio-${A.id}.html?work=0`]) {
      await b.go(`${url}/${p}`, 3500);
      await b.ev("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))");
      check(`${lang} · ${p}: nothing for sale`, !(await b.ev(SELLING)).length, await b.ev(SELLING));
    }
    await b.go(`${url}/profile-${A.id}.html`, 3500);
    const bad = await b.ev(SELLING.replace("const t=document.body.innerText;", "const t=[...document.body.children].filter(e=>true).map(e=>e.innerText).join('\\n').split('\\n').filter(l=>!/^\\$[0-9]+$/.test(l.trim())).join('\\n');"));
    check(`${lang} · profile: nothing for sale (only the donation presets show dollars)`, !bad.length, bad);
    b.close();
  }

  /* ---------- the donation dialog opens from home, studio and profile ---------- */
  let b = await launch(); await b.lang('en'); await b.view(1280, 900); const ev = b.ev;
  await ev("localStorage.removeItem('circles-sample-v1')");
  await b.go(`${url}/index.html`, 3500);
  check('home: a Support button opens the donation dialog', (await ev("(()=>{const x=document.querySelector('[data-support=site]');if(!x||x.disabled)return false;x.click();return true})()")) && (await ev("!!document.getElementById('dlg-support')?.open")));
  await ev("document.getElementById('dlg-support').close()");
  await b.go(`${url}/studio-${A.id}.html?work=0`, 3500);
  await ev("document.getElementById('dlg-sup').click()"); await sleep(600);
  check('studio: Support in the open work opens the donation dialog (amounts, named work)', (await ev("document.getElementById('dlg-tip')?.open && document.querySelectorAll('#dlg-tip .pf-amt').length===3 && document.getElementById('dlg-tip').textContent.includes('For the work')")));
  await ev("document.querySelector('#dlg-tip [data-amt]').click()"); await sleep(300);
  check('studio: choosing an amount shows the SAMPLE QR, how to donate and the no-fee note', (await ev("!!document.querySelector('#dlg-tip svg.sm-qr') && /SAMPLE/.test(document.querySelector('#dlg-tip .sup-sample').textContent) && /no fee/.test(document.getElementById('dlg-tip').textContent)")));
  await ev("document.getElementById('dlg-tip').close()");
  await b.go(`${url}/studio-${A.id}.html`, 3500);
  check('studio: the label under the picture has Support instead of Buy', (await ev("!!document.querySelector('#mus-label [data-support]') && !/Buy/.test(document.getElementById('mus-label').textContent)")));
  await b.go(`${url}/profile-${A.id}.html`, 3500);
  check('profile: presets 3 / 5 / 10 USD and a custom amount field', (await ev("[...document.querySelectorAll('.pf-amt')].map(x=>x.textContent).join()")) === '$3,$5,$10' && (await ev("!!document.querySelector('#pf-tip-n')")));
  await ev("document.querySelector('.pf-tipf input').value='0';document.querySelector('.pf-tipf').requestSubmit()"); await sleep(200);
  check('profile: an invalid custom amount shows a message and opens nothing', (await ev("!document.querySelector('.pf-tiperr').hidden")) && (await ev("!document.getElementById('dlg-tip')?.open")));
  await ev("document.querySelector('.pf-tipf input').value='25';document.querySelector('.pf-tipf').requestSubmit()"); await sleep(500);
  check('profile: a custom amount opens the dialog with a SAMPLE QR and the amount', (await ev("document.getElementById('dlg-tip').open && !!document.querySelector('#dlg-tip svg.sm-qr') && document.querySelector('#dlg-tip .sm-amt').textContent.includes('$25')")));
  await ev("document.querySelector('[data-sm-sent]').click()"); await sleep(300);
  await ev("document.querySelector('#dlg-tip .sm-form').requestSubmit()"); await sleep(200);
  check('"I\'ve donated": an empty notice is refused', (await ev("!document.querySelector('.sm-err').hidden")));
  await ev("(()=>{const f=document.querySelector('#dlg-tip .sm-form');f.name.value='Kind Person';f.email.value='kind@example.com';const d=new DataTransfer();d.items.add(new File([new ArrayBuffer(3*1024*1024)],'slip.png',{type:'image/png'}));f.slip.files=d.files;f.slip.dispatchEvent(new Event('change',{bubbles:true}));})()"); await sleep(200);
  check('a slip over 2 MB is refused', /2 MB/.test(await ev("document.querySelector('.sm-err').textContent")));
  await ev("(()=>{const f=document.querySelector('#dlg-tip .sm-form');const d=new DataTransfer();f.slip.files=d.files;f.slip.dispatchEvent(new Event('change',{bubbles:true}));f.requestSubmit();})()"); await sleep(1500);
  check('the notice ends with a demo thank-you; nothing was sent', (await ev("document.querySelector('#dlg-tip .cdlg-done')?.textContent||''")).includes('demo') && (await ev("JSON.parse(localStorage.getItem('circles-sample-v1')).tips.length")) === 1);
  const out = (await ev("performance.getEntriesByType('resource').map(r=>r.name)")).filter(u => !u.startsWith(url));
  check('donation flow: no request leaves the project, no console errors', out.length === 0 && b.logs.filter(quiet).length === 0, out.concat(b.logs));
  b.close();

  /* ---------- old buy addresses land on the artist's donation block ---------- */
  b = await launch(); await b.lang('en'); await b.view(1280, 900);
  await b.go(`${url}/buy-${A.id}-0.html`, 3000);
  check('an old buy-<id>-<k>.html address goes to the profile donation block', (await b.ev('location.pathname')).endsWith(`profile-${A.id}.html`) && (await b.ev('location.hash')) === '#pf-tips');
  await b.go(`${url}/buy.html?id=${A.id}&k=1`, 3000);
  check('an old buy.html?id= address does too', (await b.ev('location.pathname')).endsWith(`profile-${A.id}.html`) && (await b.ev('location.hash')) === '#pf-tips');
  b.close();

  /* ---------- the same at 375px in Thai: no sideways scroll ---------- */
  b = await launch(); await b.lang('th'); await b.view(375, 812, true);
  await b.go(`${url}/profile-${A.id}.html`, 3500);
  await b.ev("document.querySelector('.pf-amt').click()"); await sleep(500);
  check('profile + donation dialog (Thai, 375px): Thai wording, nothing overflows', (await b.ev("document.getElementById('dlg-tip').textContent")).includes('ตัวอย่าง') && (await b.ev('document.documentElement.scrollWidth')) <= 376);
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
