// Four layout promises: ransom words never split, pixel people at the doors, a building + its tag fit one screen, a clear break before the Manifesto.
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS} = new Function(fs.readFileSync(path.join(__root, 'artists.js'), 'utf8') + '\n;return {ARTISTS};')();
const N = ARTISTS.length, WORKS = ARTISTS.reduce((n, a) => n + a.pieces.length, 0), FEATURED = 8;
export const name = 'layout';
export async function run({url, check}) {
  /* 1 — a ransom-note WORD is never broken across lines (a split would put its letters ≥ one line apart) */
  for (const [lang, w, h, touch] of [['th', 1440, 900, false], ['th', 375, 812, true], ['en', 1440, 900, false], ['en', 375, 812, true]]) {
    const b = await launch(); await b.lang(lang); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    const words = await b.ev(`[...document.querySelectorAll('.mani-lines .rw')].map(rw=>{const ys=[...rw.children].map(c=>{const r=c.getBoundingClientRect();return r.top+r.height/2});return {word:rw.textContent,spread:Math.round(Math.max(...ys)-Math.min(...ys))}})`);
    check(`Manifesto (${lang} ${w}px): every word stays on one line`, words.length >= 8 && words.every(x => x.spread < 24), words.filter(x => x.spread >= 24));
    const wrapperLooks = await b.ev("(()=>{const s=getComputedStyle(document.querySelector('.rw'));return s.borderTopWidth==='0px'&&s.boxShadow==='none'&&s.paddingTop==='0px'})()");
    check(`Manifesto (${lang} ${w}px): the word wrapper adds no box of its own`, wrapperLooks);
    b.close();
  }

  /* 2 — pixel people instead of the vector silhouettes */
  let b = await launch(); await b.lang('th'); await b.view(1440, 900);
  await b.go(`${url}/index.html`, 4500);
  const st = await b.ev(`(()=>{const out={vector:0,stands:0,bad:[]};document.querySelectorAll('.bd').forEach(bd=>{out.vector+=bd.querySelectorAll('svg circle[r="4.4"]').length;const s=bd.querySelector('.stand');if(!s){out.bad.push(bd.dataset.id+': no sprite');return}out.stands++;const cs=[...s.querySelectorAll('canvas')];if(cs.length!==2||cs.some(c=>c.width!==16||c.height!==16||getComputedStyle(c).imageRendering!=='pixelated'))out.bad.push(bd.dataset.id+': not 2 pixelated 16x16 frames');const r=s.getBoundingClientRect(),m=bd.querySelector('.mon').getBoundingClientRect();if(r.left<m.left||r.right>m.right||r.bottom>m.bottom+2)out.bad.push(bd.dataset.id+': outside its building')});return out})()`);
  check('every building has a pixel person at its door and no vector silhouette is left', st.stands === N && st.vector === 0 && st.bad.length === 0, st);
  const pal = await b.ev(`(()=>{const ok=new Set(['14,13,12','244,241,232','255,46,136','232,183,48','163,24,44','232,228,216']);const bad=new Set();for(const c of document.querySelectorAll('.stand canvas')){const d=c.getContext('2d').getImageData(0,0,16,16).data;for(let i=0;i<d.length;i+=4)if(d[i+3]>0&&!ok.has(d[i]+','+d[i+1]+','+d[i+2]))bad.add(d[i]+','+d[i+1]+','+d[i+2])}return [...bad]})()`);
  check('standing people use only the site palette', pal.length === 0, pal);
  b.close();

  /* 3 — the tallest building + its name tag fit in one screen */
  const widths = {};
  for (const [w, h, touch] of [[1440, 800, false], [1280, 800, false], [1440, 1080, false], [375, 812, true], [390, 700, true]]) {
    b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    await b.ev("(()=>{const s=document.getElementById('strip');window.scrollTo(0,s.getBoundingClientRect().top+scrollY-62);s.scrollLeft=0;document.querySelectorAll('.bd').forEach(x=>x.classList.add('in'))})()"); await sleep(2300);
    const r = await b.ev(`(()=>{const nav=document.getElementById('nav').getBoundingClientRect().bottom;const rows=[...document.querySelectorAll('.bd')].map(x=>({top:x.querySelector('.mon').getBoundingClientRect().top,tag:x.querySelector('.tag').getBoundingClientRect().bottom}));return {nav:Math.round(nav),top:Math.round(Math.min(...rows.map(x=>x.top))),tagBottom:Math.round(Math.max(...rows.map(x=>x.tag))),vh:innerHeight,bw:Math.round(parseFloat(getComputedStyle(document.querySelector('.bd')).width)/1.12)}})()`);
    widths[h + (touch ? 'm' : 'd')] = r.bw;
    check(`${w}x${h}: tallest building + name tags fit one screen`, r.top >= r.nav - 1 && r.tagBottom <= r.vh, r);
    b.close();
  }
  check('the city scales with the screen height (taller screen, bigger buildings)', widths['1080d'] > widths['800d'], widths);

  /* 4 — a visible break under the tartan street; the work cards and the artist of the week now come before the Manifesto, which keeps its own tape above it */
  for (const [w, h, touch] of [[1440, 900, false], [375, 812, true]]) {
    b = await launch(); await b.lang('th'); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    const r = await b.ev(`(()=>{const g=document.querySelector('.ground').getBoundingClientRect(),p=document.getElementById('progress').getBoundingClientRect(),t=document.querySelector('.tape-wrap'),tr=t.getBoundingClientRect(),m=document.getElementById('featured').getBoundingClientRect();return {adjacent:t.nextElementSibling===document.getElementById('featured')&&t.previousElementSibling.classList.contains('city')&&document.getElementById('manifesto').previousElementSibling.classList.contains('tape-wrap'),gap:Math.round(tr.top-g.bottom),aboveProgress:Math.round(tr.top-p.bottom),overlapsManifesto:Math.round(m.top-tr.top)}})()`);
    check(`${w}px: hazard tape between the street and the cards (and another one before the Manifesto), with a gap`, r.adjacent && r.gap >= 24 && r.aboveProgress >= 6 && r.overlapsManifesto > 0, r);
    b.close();
  }
  /* 5 — the new colour: map icons never sit on the text, patterns exist (the card tapes are hidden now: their old check is gone) */
  for (const [w, h, touch] of [[1280, 900, false], [375, 812, true]]) {
    const b = await launch(); await b.lang('en'); await b.view(w, h, touch);
    await b.go(`${url}/index.html`, 4500);
    await b.ev("document.querySelectorAll('.reveal').forEach(e=>e.classList.add('in'))"); await sleep(1500);
    const r = await b.ev(`(()=>{const tapes=[...document.querySelectorAll('.card .tape')].map(t=>Math.round(t.getBoundingClientRect().height));const hit=[];document.querySelectorAll('.dist').forEach(d=>{const s=d.querySelector('svg').getBoundingClientRect();[...d.querySelectorAll('span')].forEach(t=>{const range=document.createRange();range.selectNodeContents(t);for(const q of range.getClientRects()){if(q.width&&q.left<s.right&&q.right>s.left&&q.top<s.bottom&&q.bottom>s.top)hit.push(d.dataset.d+': "'+t.textContent.slice(0,16)+'"')}})});const cs=getComputedStyle(document.documentElement);return {tapes,hit,tokens:['--checker','--tt-red','--tt-pink','--tt-gold','--tt-black'].map(k=>cs.getPropertyValue(k).trim().length>20),kerb:getComputedStyle(document.querySelector('.dist'),'::before').backgroundImage!=='none',statsChecker:getComputedStyle(document.querySelector('.stats'),'::before').backgroundImage.includes('conic'),floorChecker:true}})()`);
    check(`${w}px: map icons do not sit on the district names`, r.hit.length === 0, r.hit);
    check(`${w}px: checker + four tartan colourways exist and are used`, r.tokens.every(Boolean) && r.kerb && r.statsChecker, r);
    b.close();
  }
}

