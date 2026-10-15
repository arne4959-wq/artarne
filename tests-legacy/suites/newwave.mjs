// The "new wave" artists: complete in data, rendered everywhere, in both languages, and the page numbers follow the data.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {launch, sleep} from '../../tools/browser.mjs';
export const name = 'newwave';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS, DISC_EN, CITY_EN} = new Function(fs.readFileSync(path.join(root, 'artists.js'), 'utf8') + '\n;return {ARTISTS, DISC_EN, CITY_EN};')();
export async function run({url, check}) {
  const wave = ARTISTS.filter(a => a.wave);
  check('there are new-wave artists in the data', wave.length >= 4, wave.map(a => a.id));
  for (const a of wave) {
    const miss = ['bio', 'bioEn', 'city', 'since', 'email', 'kind', 'nameEn'].filter(k => !a[k]);
    const bad = a.pieces.filter(p => !(p.t && p.tEn && p.m && p.mEn && p.s && p.y && p.ar && fs.existsSync(path.join(root, p.img))));
    check(`${a.id}: complete data (bio TH+EN, 3 pieces with title/year/medium/size/image)`, !miss.length && !bad.length && a.pieces.length === 3 && DISC_EN[a.disc] && CITY_EN[a.city], {miss, bad: bad.map(p => p.t)});
    check(`${a.id}: the English bio is exactly two sentences, the Thai bio is not empty`, (a.bioEn.match(/[.!?](\s|$)/g) || []).length === 2 && a.bio.length > 40, a.bioEn);
  }
  const kinds = new Set(ARTISTS.map(a => a.kind));
  check('every building has its own shape (no two artists share a kind)', kinds.size === ARTISTS.length, [...kinds]);

  for (const [lang, w, h, touch] of [['th', 1440, 800, false], ['en', 375, 812, true]]) {
    const b = await launch(); await b.lang(lang); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    const r = await b.ev(`(()=>({bd:document.querySelectorAll('.bd').length,tags:[...document.querySelectorAll('.bd .wv')].map(e=>e.textContent),dist:document.querySelectorAll('.dist').length,stat:[document.getElementById('c-art').dataset.count,document.getElementById('c-work').dataset.count],gap:(()=>{const f=document.getElementById('filters').getBoundingClientRect(),m=document.getElementById('map-grid').getBoundingClientRect();return Math.round(m.top-f.bottom)})(),overflowX:document.documentElement.scrollWidth-innerWidth}))()`);
    check(`${lang} ${w}px: every artist has a building and a district; counters follow the data`, r.bd === ARTISTS.length && r.dist === ARTISTS.length && +r.stat[0] === ARTISTS.length && +r.stat[1] === ARTISTS.reduce((n, a) => n + a.pieces.length, 0), r);
    check(`${lang} ${w}px: each new-wave building carries the label, nobody else does`, r.tags.length === wave.length && r.tags.every(t => /NEW WAVE|คลื่นลูกใหม่/.test(t)), r.tags);
    check(`${lang} ${w}px: no empty hole between the filters and the map`, r.gap < 70 && r.overflowX <= 0, r);
    b.close();
  }
  /* every new-wave studio opens, shows its 3 pictures in the museum hall, its label, and the detail dialog works */
  const b = await launch(); await b.lang('en'); await b.view(1280, 900);
  for (const a of wave) {
    await b.go(`${url}/studio-${a.id}.html?work=1`, 3500);
    const r = await b.ev(`({floors:document.querySelectorAll('.mus-art').length,imgs:[...document.querySelectorAll('.mus-art img')].filter(i=>i.complete&&i.naturalWidth>0).length,kicker:document.querySelector('.kicker').textContent,dlg:document.getElementById('dlg').open,title:document.getElementById('dlg-t').textContent,roof:!!document.querySelector('.roof'),overflowX:document.documentElement.scrollWidth-innerWidth})`);
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
  /* a phone: the hint talks about swiping, the museum is on the first screen, nothing overflows */
  {
    const m = await launch(); await m.lang('en'); await m.view(375, 812, true);
    await m.go(`${url}/cutaway.html?id=${wave[0].id}`, 3500);
    const r = await m.ev(`({hint:document.querySelector('.hint').dataset.t,txt:document.querySelector('.hint').textContent,top:Math.round(document.getElementById('mus-stage').getBoundingClientRect().top),ox:document.documentElement.scrollWidth-innerWidth})`);
    check('375px: hint is the swipe text, the hall starts above 520px (first picture visible), no horizontal overflow', r.hint === 'hint_swipe' && /Swipe/i.test(r.txt) && r.top < 520 && r.ox <= 0, r);
    m.close();
  }
}
