// What a visitor can do: language, buildings, studios, dialogs, forms, filters, keyboard, no-JS, reduced motion, offline-safe assets.
import {demoArtists} from '../demo.mjs';
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS} = new Function(demoArtists(__root) + '\n;return {ARTISTS};')();
const N = ARTISTS.length, WORKS = ARTISTS.reduce((n, a) => n + a.pieces.length, 0), FEATURED = 8;
export const name = 'flow';
export async function run({url, check}) {
  /* ---------- home page, English ---------- */
  let b = await launch(); await b.lang('en'); await b.view(1280, 860);
  const ev = b.ev;
  await b.go(`${url}/index.html`, 4500);

  const res = await ev("performance.getEntriesByType('resource').map(r=>r.name)");
  check('no request leaves the project (fonts + Lenis are local)', res.every(u => u.startsWith(url) || u.startsWith('data:')), res.filter(u => !u.startsWith(url)));
  check('Lenis smooth scroll is active', (await ev('document.documentElement.className')).includes('lenis'));
  check('fonts loaded: Anton, Chonburi, IBM Plex Sans Thai, Playfair, Special Elite', (await ev("[...new Set([...document.fonts].filter(f=>f.status==='loaded').map(f=>f.family))].sort().join()")) === 'Anton,Chonburi,IBM Plex Sans Thai,Playfair Display,Special Elite');
  check('hero text is English', (await ev("[...document.querySelectorAll('.hl')].map(e=>e.textContent).join('|')")) === "A city of artists|Room for art|that won't shut up");
  check('buildings are real links to studio pages', (await ev("[...document.querySelectorAll('.bd')].map(a=>a.getAttribute('href')).join()")) === ARTISTS.map(a => `studio-${a.id}.html`).join());
  check('keyboard: no <a> without href', (await ev("document.querySelectorAll('a:not([href]):not([hidden])').length")) === 0);

  // language switch: three buttons side by side (TH | EN | ລາວ), the current one is marked; a click on a button switches to that language
  const pick = l => ev(`document.querySelector('#lang button[data-l="${l}"]').click()`);
  await pick('lo'); await sleep(900);
  check('language switch: English → Lao (the Lao button is marked)', (await ev('document.documentElement.lang')) === 'lo' && (await ev(`document.querySelector('#lang button[data-l="lo"]').getAttribute('aria-pressed')`)) === 'true');
  await pick('th'); await sleep(900);
  check('language switch: Lao → Thai (Thai title)', (await ev('document.documentElement.lang')) === 'th' && (await ev('document.title')).includes('เมืองของศิลปิน'));
  await pick('en'); await sleep(900);
  check('language switch: Thai → English', (await ev('document.documentElement.lang')) === 'en');

  // featured: sort + show all
  await ev("document.getElementById('all-btn').click()"); await sleep(800);
  check(`"Show all" lists all ${WORKS} works`, (await ev("document.querySelectorAll('.card').length")) === WORKS);
  check('no price sort any more: only "curated" and "newest"', (await ev("[...document.querySelectorAll('#sort option')].map(o=>o.value).join()")) === 'cur,new');
  await ev("(()=>{const s=document.getElementById('sort');s.value='new';s.dispatchEvent(new Event('change'))})()"); await sleep(700);
  const years = await ev("[...document.querySelectorAll('.card .pp')].map(e=>+e.textContent.replace(/\\D/g,''))");
  check('sort newest first is descending by year', years.length === WORKS && years.every((y, i) => i === 0 || y <= years[i - 1]), years.join());
  await ev("document.getElementById('sort').value='cur';document.getElementById('sort').dispatchEvent(new Event('change'));document.getElementById('all-btn').click()"); await sleep(500);

  // map filter bar
  await ev("document.querySelector('.fbtn[data-d=\"เซรามิก\"]').click()"); await sleep(900);
  check('filter highlights exactly the matching building', (await ev("[...document.querySelectorAll('.bd.lit')].map(e=>e.dataset.id).join()")) === 'phum');
  check('follow-me note is shown with "Enter building"', (await ev("!document.getElementById('fnote').classList.contains('off')")) && (await ev("!document.getElementById('fnote-in').hidden")) && (await ev("document.getElementById('fnote-in').getAttribute('href')")) === 'studio-phum.html');
  await ev("document.getElementById('fnote-x').click()"); await sleep(500);
  check('clearing the filter resets every building', (await ev("document.querySelectorAll('.bd.lit,.bd.dim').length")) === 0);

  // new-wave filter
  const waveIds = ARTISTS.filter(a => a.wave).map(a => a.id).join();
  check('new-wave labels sit on exactly the new-wave buildings', (await ev("[...document.querySelectorAll('.bd')].filter(b=>b.querySelector('.wv')).map(b=>b.dataset.id).join()")) === waveIds && waveIds.length > 0);
  await ev("document.querySelector('.fbtn[data-d=\"*wave\"]').click()"); await sleep(900);
  check('"New wave" filter lights those buildings and those districts', (await ev("[...document.querySelectorAll('.bd.lit')].map(e=>e.dataset.id).join()")) === waveIds && (await ev("document.querySelectorAll('.dist.on').length")) === waveIds.split(',').length);
  await ev("document.getElementById('fnote-x').click()"); await sleep(500);

  // forms
  await ev("document.querySelector('footer .btn[onclick*=openJoin]').click()"); await sleep(700);
  check('Join dialog opens (English)', (await ev("document.getElementById('dlg-join').open")) && (await ev("document.querySelector('#dlg-join h2').textContent")) === 'Request a building in this city');
  check('Join form links the privacy policy', (await ev("!!document.querySelector('#dlg-join .note a[href=\"privacy.html\"]')")));
  await ev("(()=>{const f=document.querySelector('#dlg-join form');f.name.value='New Artist';f.email.value='a@example.com';f.message.value='I make things.';f.requestSubmit()})()"); await sleep(800);
  check('Join submit → email app + copyable message', (await ev("document.querySelector('#dlg-join .cdlg-h h2').textContent")) === 'Your email app is opening' && (await ev("document.getElementById('done-pre').textContent")).includes('name: New Artist'));
  check('Join message goes to the contact address', (await ev("document.querySelector('#dlg-join .note').textContent.includes(CONFIG.contact)")));
  await b.key('Escape', 'Escape', 27); await sleep(300);

  // buildings: drag must not navigate, click must
  await ev("document.getElementById('strip').scrollLeft=0;document.getElementById('strip').scrollIntoView({block:'center'});0"); await sleep(2200);   // (the filter above slid the city to another building)
  const pt = await ev("(()=>{const e=document.querySelector('.bd[data-id=napha] .mon').getBoundingClientRect();return {x:Math.round(e.left+e.width/2),y:Math.round(e.top+e.height*.55)}})()");
  await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: pt.x, y: pt.y}); await sleep(400);
  check('hovering a building shows the ENTER cursor', (await ev("document.getElementById('cursor-label').textContent")) === 'ENTER');
  const before = await ev("document.getElementById('strip').scrollLeft");
  await b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: pt.x, y: pt.y, button: 'left', clickCount: 1});
  for (let i = 1; i <= 25; i++) { await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: pt.x - i * 12, y: pt.y, button: 'left'}); await sleep(14); }
  await b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: pt.x - 300, y: pt.y, button: 'left', clickCount: 1}); await sleep(900);
  check('dragging the city (even from a building) scrolls it and stays on the page', (await ev("document.getElementById('strip').scrollLeft")) > before + 100 && (await ev('location.pathname')).endsWith('index.html'));
  await ev("document.getElementById('strip').scrollLeft=0;0"); await sleep(600);
  const p2 = await ev("(()=>{const e=document.querySelector('.bd[data-id=napha] .mon').getBoundingClientRect();return {x:Math.round(e.left+e.width/2),y:Math.round(e.top+e.height*.55)}})()");
  await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: p2.x, y: p2.y}); await sleep(200);
  await b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: p2.x, y: p2.y, button: 'left', clickCount: 1});
  await b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: p2.x, y: p2.y, button: 'left', clickCount: 1}); await sleep(2800);
  check('clicking a building opens its studio page', (await ev('location.pathname')).endsWith('studio-napha.html'));

  /* ---------- studio page (the tower: ideas / sketches / works floors) ---------- */
  await b.go(`${url}/studio-thara.html`, 3500);
  check('studio page: a tower with 4 works (only the finished floor is built when nobody has shown a process: 4 windows, 4 finished pictures), links to neighbours', (await ev("document.querySelectorAll('.tw-win').length")) === 4 && (await ev("document.querySelectorAll('.tw-final img').length")) === 4 && (await ev("[...document.querySelectorAll('.sn')].map(a=>a.getAttribute('href')).join()")) === 'studio-napha.html,studio-kwan.html');
  await ev("document.querySelector('.tw-final[data-k=\"1\"]').click()"); await sleep(900);
  check('clicking a finished-work window opens a detail dialog with the facts', (await ev("document.getElementById('dlg').open")) && (await ev("document.getElementById('dlg-t').textContent")) === 'The Waiting' && (await ev("document.getElementById('dlg-dl').innerText")).includes('Pigment print on cotton paper'));
  check('URL remembers the open work', (await ev('location.search')) === '?work=1');
  await ev("document.getElementById('dlg-next').click()"); await sleep(300);
  check('next / previous work', (await ev("document.getElementById('dlg-t').textContent")) === "Bird's-eye");
  await b.key('ArrowLeft', 'ArrowLeft', 37); await sleep(300);
  check('ArrowLeft goes back', (await ev("document.getElementById('dlg-t').textContent")) === 'The Waiting');
  await b.key('Escape', 'Escape', 27); await sleep(300);
  check('Esc closes it and clears ?work', (await ev("!document.getElementById('dlg').open")) && (await ev('location.search')) === '');
  await ev("document.querySelector('.tw-final[data-k=\"1\"]').click()"); await sleep(900);
  await ev("document.getElementById('dlg-sup').click()"); await sleep(700);
  check('the Support button in the open work opens the donation dialog, naming the work', (await ev("document.getElementById('dlg-tip')?.open")) && (await ev("document.getElementById('dlg-tip').textContent")).includes('The Waiting') && (await ev("!!document.querySelector('#dlg-tip .pf-amt')")));
  await ev("document.getElementById('dlg-tip').close()");

  await b.go(`${url}/studio-dao.html?work=2`, 4000);
  check('deep link ?work=2 opens "The Letter"', (await ev("document.getElementById('dlg').open")) && (await ev("document.getElementById('dlg-t').textContent")) === 'The Letter');
  await b.go(`${url}/cutaway.html?id=phum`, 3500);
  check('dynamic cutaway.html?id= still works (fallback)', (await ev("document.querySelectorAll('.tw-final').length")) === 2);
  await b.go(`${url}/studio-nobody.html`, 3500);
  check('unknown studio URL → friendly "no such building" page', (await ev("document.querySelector('.nf h1')?.textContent")) === "This building doesn't exist yet");
  await b.go(`${url}/cutaway.html?id=zzz`, 2500);
  check('unknown ?id= shows the same page, no detail dialog', (await ev("!document.getElementById('dlg')")));
  // the only expected "errors" so far: that deliberate 404 and mailto aborts
  // Chrome also logs "ViewTransition opt-in disabled" when a page that opts in to cross-document view transitions (the studio) links to one
  // that does not (the buy page): the page just changes without the fade. Harmless, so it is not counted.
  const unexpected = b.logs.filter(l => !/studio-nobody\.html|HTTP 404|ViewTransition opt-in disabled/.test(l));
  check('no console / network errors in the whole walk-through', unexpected.length === 0, unexpected);
  b.close();

  /* ---------- touch screen: menu + always-open work list ---------- */
  b = await launch(); await b.lang('th'); await b.view(375, 812, true);
  await b.go(`${url}/index.html`, 4500);
  check('touch: building tag shows its works list without hover', (await b.ev("[...document.querySelectorAll('.wl')].every(w=>getComputedStyle(w).opacity==='1')")));
  await b.ev("document.getElementById('menu-btn').click()"); await sleep(700);
  check('mobile menu opens', (await b.ev("document.getElementById('mnav').classList.contains('open')")));
  await b.ev("document.querySelector('#mnav a[href=\"#map\"]').click()"); await sleep(2800);
  check('menu link scrolls to the section and closes', (await b.ev("Math.abs(document.getElementById('map').getBoundingClientRect().top-60)<30")) && !(await b.ev("document.getElementById('mnav').classList.contains('open')")));
  check('touch: tap targets ≥ 40px', (await b.ev("[...document.querySelectorAll('.lang,.menu-btn,.links .join,.fbtn,#all-btn')].filter(e=>e.getBoundingClientRect().width&&e.getBoundingClientRect().height<40).map(e=>e.id||e.className)")).length === 0);
  b.close();

  /* ---------- JavaScript off: crawlers and no-JS visitors ---------- */
  b = await launch(); await b.view(1280, 900); await b.send('Emulation.setScriptExecutionDisabled', {value: true});
  await b.go(`${url}/studio-thara.html`, 2500);
  check('no-JS: studio page has its tower, pictures, title and JSON-LD', (await b.ev("document.querySelectorAll('.tw-final').length")) === 4 && (await b.ev("document.querySelectorAll('.tw-final img').length")) === 4 && (await b.ev("document.querySelector('script[type=\"application/ld+json\"]').textContent")).includes('VisualArtwork'));
  await b.go(`${url}/index.html`, 2500);
  check('no-JS: home shows cards, map, studio links, and no black loader', (await b.ev("document.querySelectorAll('.card').length")) === FEATURED && (await b.ev("document.querySelectorAll('.dist').length")) === N && (await b.ev("document.querySelectorAll('#strip-in .ns a').length")) === N && (await b.ev("getComputedStyle(document.getElementById('loader')).display")) === 'none');
  b.close();

  /* ---------- reduced motion ---------- */
  b = await launch(); await b.lang('th'); await b.view(1280, 900);
  await b.send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
  await b.go(`${url}/index.html`, 3500);
  const rm = await b.ev("({loader:!!document.getElementById('loader'),hiddenReveals:[...document.querySelectorAll('.reveal')].filter(e=>getComputedStyle(e).opacity<1).length,hiddenBd:[...document.querySelectorAll('.bd')].filter(e=>getComputedStyle(e).opacity<1).length,looping:document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.getTiming().iterations===Infinity).length})");
  check('reduced motion: no loader, everything visible, nothing loops', !rm.loader && !rm.hiddenReveals && !rm.hiddenBd && rm.looping === 0, rm);
  b.close();
}
