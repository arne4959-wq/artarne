// The "new wave" artists: complete in data, rendered everywhere, in both languages, and the page numbers follow the data.
import {demoArtists} from '../demo.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launch, sleep} from '../../tools/browser.mjs';
export const name = 'newwave';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS, DISC_EN, CITY_EN} = new Function(demoArtists(root) + '\n;return {ARTISTS, DISC_EN, CITY_EN};')();
export async function run({url, check}) {
  const wave = ARTISTS.filter(a => a.wave);
  check('there are new-wave artists in the data', wave.length >= 4, wave.map(a => a.id));
  for (const a of wave) {
    const miss = ['bio', 'bioEn', 'city', 'since', 'email', 'kind', 'nameEn'].filter(k => !a[k]);
    const bad = a.pieces.filter(p => !(p.t && p.tEn && p.m && p.mEn && p.s && p.y && p.ar && fs.existsSync(path.join(root, p.img))));
    check(`${a.id}: complete data (bio TH+EN, 3 pieces with title/year/medium/size/image)`, !miss.length && !bad.length && a.pieces.length === 3 && DISC_EN[a.disc] && CITY_EN[a.city], {miss, bad: bad.map(p => p.t)});
    check(`${a.id}: the English bio is exactly two sentences, the Thai bio is not empty`, (a.bioEn.match(/[.!?](\s|$)/g) || []).length === 2 && a.bio.length > 40, a.bioEn);
  }
  /* the sample city was drawn with one shape per building. Real artists (the owner, and everybody from Supabase) pick from the same ten shapes, so they may share one. */
  const sample = ARTISTS.filter(a => /\.example$/i.test(String(a.email || ''))), kinds = new Set(sample.map(a => a.kind));
  check('every sample building has its own shape (no two sample artists share a kind)', kinds.size === sample.length, [...kinds]);

  for (const [lang, w, h, touch] of [['th', 1440, 800, false], ['en', 375, 812, true]]) {
    const b = await launch(); await b.lang(lang); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    const r = await b.ev(`(()=>({bd:document.querySelectorAll('.bd').length,tags:[...document.querySelectorAll('.bd .wv')].map(e=>e.textContent),dist:document.querySelectorAll('.dist').length,stat:[document.getElementById('c-art').dataset.count,document.getElementById('c-work').dataset.count],gap:(()=>{const f=document.getElementById('filters').getBoundingClientRect(),m=document.getElementById('map-grid').getBoundingClientRect();return Math.round(m.top-f.bottom)})(),overflowX:document.documentElement.scrollWidth-innerWidth}))()`);
    check(`${lang} ${w}px: every artist has a building and a district; counters follow the data`, r.bd === ARTISTS.length && r.dist === ARTISTS.length && +r.stat[0] === ARTISTS.length && +r.stat[1] === ARTISTS.reduce((n, a) => n + a.pieces.length, 0), r);
    check(`${lang} ${w}px: each new-wave building carries the label, nobody else does`, r.tags.length === wave.length && r.tags.every(t => /NEW WAVE|คลื่นลูกใหม่/.test(t)), r.tags);
    check(`${lang} ${w}px: no empty hole between the filters and the map`, r.gap < 70 && r.overflowX <= 0, r);
    b.close();
  }
  /* every new-wave studio opens, shows its 3 finished works in the tower, its label, and the detail dialog works */
  const b = await launch(); await b.lang('en'); await b.view(1280, 900);
  for (const a of wave) {
    await b.go(`${url}/studio-${a.id}.html?work=1`, 3500);
    const r = await b.ev(`({floors:document.querySelectorAll('.tw-final').length,imgs:[...document.querySelectorAll('.tw-final img')].filter(i=>i.complete&&i.naturalWidth>0).length,kicker:document.querySelector('.kicker').textContent,dlg:document.getElementById('dlg').open,title:document.getElementById('dlg-t').textContent,roof:!!document.querySelector('.tw-roof'),overflowX:document.documentElement.scrollWidth-innerWidth})`);
    check(`${a.id} studio: 3 pictures, all images, new-wave label, ?work=1 opens "${a.pieces[1].tEn}"`, r.floors === 3 && r.imgs === 3 && /NEW WAVE/.test(r.kicker) && r.dlg && r.title === a.pieces[1].tEn && r.overflowX <= 0, r);
  }
  check('no console / network errors on the new studios', b.logs.length === 0, b.logs);
  b.close();
  /* the open work: a big plain picture with one tape, a fullscreen zoom button that opens THIS work's image, Esc closes only the zoom, arrows do not move the work behind it */
  {
    const z = await launch(); await z.lang('en'); await z.view(1280, 900);
    await z.go(`${url}/cutaway.html?id=${wave[0].id}&work=1`, 3500);
    const r = await z.ev(`(()=>{const f=document.getElementById('dlg-frame'),i=f.querySelector('img'),b=f.querySelector('.zoom-btn'),fr=f.getBoundingClientRect();return {tape:f.querySelectorAll('.dlg-tape').length,stamp:f.querySelectorAll('.stamp').length,btn:!!b,host:f.classList.contains('zoom-host'),src:i&&i.getAttribute('src'),w:Math.round(fr.width),shadow:getComputedStyle(f).boxShadow.includes('232, 183, 48')}})()`);
    check('open work: one tape, no sticker on the picture, no gold frame, picture wider than 400px, zoom button present', r.tape === 1 && r.stamp === 0 && r.btn && r.host && !r.shadow && r.w > 400, r);
    const rect = await z.ev("(()=>{document.querySelector('#dlg-frame .zoom-btn').scrollIntoView({block:'center'});const r=document.querySelector('#dlg-frame .zoom-btn').getBoundingClientRect();return [r.x+r.width/2,r.y+r.height/2]})()");
    await z.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: rect[0], y: rect[1], button: 'left', clickCount: 1}); await z.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: rect[0], y: rect[1], button: 'left', clickCount: 1}); await sleep(500);
    const o = await z.ev(`({open:document.getElementById('dlg-zoom').open,src:(document.querySelector('.zm-img')||{}).src||''})`);
    check('zoom button opens the fullscreen viewer with the current work\'s image', o.open && o.src.endsWith(r.src), {o, expect: r.src});
    await z.key('ArrowRight', 'ArrowRight', 39); await sleep(250);
    check('arrow keys inside the viewer do not change the work behind it', await z.ev("document.getElementById('dlg-t').textContent") === wave[0].pieces[1].tEn);
    await z.key('Escape', 'Escape', 27); await sleep(400);
    check('Esc closes only the viewer, the work dialog stays open', await z.ev("!document.getElementById('dlg-zoom').open&&document.getElementById('dlg').open"));
    await z.key('ArrowRight', 'ArrowRight', 39); await sleep(400);
    check('after the viewer, the arrow keys walk the works again', await z.ev("document.getElementById('dlg-t').textContent") === wave[0].pieces[2].tEn);
    check('no console / network errors on the open work', z.logs.length === 0, z.logs);
    z.close();
  }
  /* a phone: the lift is a row above the tower, three windows per floor, nothing overflows */
  {
    const m = await launch(); await m.lang('en'); await m.view(375, 812, true);
    await m.go(`${url}/cutaway.html?id=${wave[0].id}`, 3500);
    const r = await m.ev(`({lift:!document.querySelector('.tw-lift')||document.querySelector('.tw-lift').getBoundingClientRect().top<document.getElementById('tw-bld').getBoundingClientRect().top,perRow:Math.max(...[...document.querySelectorAll('.tw-fl')].map(f=>new Set([...f.querySelectorAll('.tw-win')].map(w=>Math.round(w.getBoundingClientRect().top))).size)),ox:document.documentElement.scrollWidth-innerWidth})`);
    check('375px: the lift (when there is more than one kind of floor) is a row above the tower, every floor keeps its windows on one row, no horizontal overflow', r.lift && r.perRow === 1 && r.ox <= 0, r);
    m.close();
  }
}
