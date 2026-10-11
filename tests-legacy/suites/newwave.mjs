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
    const bad = a.pieces.filter(p => !(p.t && p.tEn && p.m && p.mEn && p.s && p.p > 0 && p.y && p.ar && fs.existsSync(path.join(root, p.img))));
    check(`${a.id}: complete data (bio TH+EN, 3 pieces with title/year/medium/size/price/image)`, !miss.length && !bad.length && a.pieces.length === 3 && DISC_EN[a.disc] && CITY_EN[a.city], {miss, bad: bad.map(p => p.t)});
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
}
