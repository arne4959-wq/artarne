// The studio tower: floors, windows, lift, contact sheet, and the stage panel of the work window (tabs, peel, timeline, empty states).
// Two passes: the real data (the owner has only finished pictures: every idea / sketch / draft window is an honest empty window)
// and a fixture (tests-legacy/tower-fixture.mjs, served only here) with an idea, sketch and draft on the first works.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';
import {FIXTURE_JS} from '../tower-fixture.mjs';
export const name = 'tower';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export async function run({check}) {
  const base = fs.readFileSync(path.join(root, 'artists.js'), 'utf8');
  const circles = fs.readFileSync(path.join(root, 'circles.js'), 'utf8').replace(/endpoint: '[^']*'/, "endpoint: ''").replace(/turnstileSiteKey: '[^']*'/, "turnstileSiteKey: ''");
  const js = body => ({type: 'text/javascript; charset=utf-8', body});
  const real = await startServer(root, {'/circles.js': () => js(circles)});
  const fix = await startServer(root, {'/circles.js': () => js(circles), '/artists.js': () => js(base + FIXTURE_JS)});
  try {
    /* ---- real data ---- */
    let b = await launch(); await b.lang('th'); await b.view(1280, 900);
    await b.go(`${real.url}/cutaway.html?id=arne`, 3500);
    const r = await b.ev(`(()=>{const f=[...document.querySelectorAll('.tw-fl')].map(x=>x.dataset.f);const w=s=>document.querySelectorAll('.tw-'+s).length;return {floors:f.join(),wins:document.querySelectorAll('.tw-win').length,voidIdea:document.querySelectorAll('.tw-idea.tw-void').length,voidSketch:document.querySelectorAll('.tw-sketch.tw-void').length,lift:!!document.querySelector('.tw-lift'),sheet:!!document.querySelector('.tw-sheet'),finals:[...document.querySelectorAll('.tw-final img')].filter(i=>i.complete&&i.naturalWidth>0).length,emptyText:(document.querySelector('.tw-sketch .tw-empty')||{}).textContent,roof:(document.querySelector('.tw-sign')||{}).textContent,don:!!document.querySelector('.tw-roof [data-support]'),old:!!document.querySelector('.mus-art,#mus')}})()`);
    check('arne (real data): with no process material only the finished-works floor is built (3 windows, no lift, no contact sheet), all pictures load, no 3D hall', r.floors === 'work' && r.wins === 3 && r.finals === 3 && !r.old && !r.lift && !r.sheet, r);
    check('arne: the roof sign carries the name', /ARNE/.test(r.roof), r);
    await b.go(`${real.url}/cutaway.html?id=arne&work=1&stage=sketch`, 3500);
    const e = await b.ev(`({open:document.getElementById('dlg').open,cur:document.getElementById('dlg-frame').dataset.cur,void:document.getElementById('dlg-frame').hasAttribute('data-void'),tabs:document.querySelectorAll('#dlg-stg .stg-tab').length,peel:!!document.getElementById('stg-range'),zoom:getComputedStyle(document.querySelector('#dlg-frame .zoom-btn')).display})`);
    check('a work with no idea, sketch or draft: the window shows the finished picture even for ?stage=sketch, with no empty stage tabs and the zoom on', e.open && e.cur === 'final' && !e.void && e.tabs === 0 && !e.peel && e.zoom !== 'none', e);
    await b.key('Escape', 'Escape', 27); await sleep(300);
    check('real data: the studio shows no lift and no empty contact sheet', await b.ev("!document.querySelector('.tw-lift') && !document.querySelector('.tw-sheet')"));
    check('no console / network errors (real data)', b.logs.length === 0, b.logs);
    b.close();

    /* ---- fixture: idea, sketch, draft ---- */
    b = await launch(); await b.lang('en'); await b.view(1280, 900);
    await b.go(`${fix.url}/cutaway.html?id=arne`, 3500);
    const g = await b.ev(`({note:(document.querySelector('.tw-idea[data-k="0"] .tw-note')||{}).textContent,sk:[...document.querySelectorAll('.tw-sketch img')].filter(i=>i.complete&&i.naturalWidth>0).length,voidIdea:document.querySelectorAll('.tw-idea.tw-void').length,voidSketch:document.querySelectorAll('.tw-sketch.tw-void').length,cell:document.querySelectorAll('.tw-cell:not(.tw-void)').length})`);
    check('fixture: the idea note (English text), two sketches, and the empty window of the work without process', /red star/.test(g.note) && g.sk === 2 && g.voidIdea === 1 && g.voidSketch === 1 && g.cell === 8, g);
    await b.ev("document.querySelector('.tw-cell[data-k=\"0\"][data-s=\"draft\"]').click()"); await sleep(800);
    const d = await b.ev(`({cur:document.getElementById('dlg-frame').dataset.cur,rng:document.getElementById('stg-range').value,tl:[...document.querySelectorAll('.stg-tl time')].map(x=>x.textContent).join('|'),on:document.querySelector('.stg-tl li.on').dataset.stage,op:[...document.querySelectorAll('.stg-layer')].map(x=>x.style.opacity).join()})`);
    check('a sheet cell opens the draft: slider at 2, only the draft layer visible, timeline shows the dates and marks the draft', d.cur === 'draft' && +d.rng === 2 && d.op === '0,0,1,0' && d.tl === '03/2026|12/04/2026|05/2026|06/2026' && d.on === 'draft', d);
    await b.ev("(()=>{const r=document.getElementById('stg-range');r.value=2.5;r.dispatchEvent(new Event('input',{bubbles:true}))})()");
    const p = await b.ev(`({op:[...document.querySelectorAll('.stg-layer')].map(x=>x.style.opacity).join(),pressed:document.querySelector('.stg-tab[aria-pressed=true]').dataset.stage})`);
    check('peel: halfway between draft and final both layers are half visible', p.op === '0,0,0.5,0.5', p);
    await b.ev("document.querySelector('.stg-tab[data-stage=idea]').click()"); await sleep(1300);
    const i = await b.ev(`({cur:document.getElementById('dlg-frame').dataset.cur,rng:+document.getElementById('stg-range').value,note:(document.querySelector('.stg-layer[data-stage=idea] .stg-note')||{}).textContent})`);
    check('the Idea tab slides the peel to the idea note with its text', i.cur === 'idea' && i.rng === 0 && /red star/.test(i.note), i);
    await b.ev("document.getElementById('dlg-next').click()"); await sleep(400);
    check('next work keeps the stage you are looking at', await b.ev("document.getElementById('dlg-frame').dataset.cur") === 'idea');
    await b.key('Escape', 'Escape', 27);
    await b.go(`${fix.url}/cutaway.html?id=arne&work=0&stage=sketch`, 4000);
    check('deep link ?work=0&stage=sketch opens the sketch', await b.ev("document.getElementById('dlg').open && document.getElementById('dlg-frame').dataset.cur === 'sketch'"));
    check('no console / network errors (fixture)', b.logs.length === 0, b.logs);
    b.close();

    /* ---- phone ---- */
    b = await launch(); await b.lang('th'); await b.view(390, 844, true);
    await b.go(`${fix.url}/cutaway.html?id=arne`, 3500);
    const m = await b.ev(`({ox:document.documentElement.scrollWidth-innerWidth,perRow:Math.max(...[...document.querySelectorAll('.tw-fl')].map(f=>new Set([...f.querySelectorAll('.tw-win')].map(w=>Math.round(w.getBoundingClientRect().top))).size)),liftTop:document.querySelector('.tw-lift').getBoundingClientRect().top+scrollY,bldTop:document.getElementById('tw-bld').getBoundingClientRect().top+scrollY,btn:Math.min(...[...document.querySelectorAll('.tw-lift button,.tw-cell,.stg-tab')].map(x=>x.getBoundingClientRect().height)),sheetOver:document.querySelector('.tw-sheet-sc').scrollWidth-document.querySelector('.tw-sheet-sc').clientWidth})`);
    check('390px: no sideways scroll, 3 windows on one row per floor, the lift is a row above the tower, the contact sheet fits', m.ox <= 0 && m.perRow === 1 && m.liftTop < m.bldTop && m.sheetOver <= 1, m);
    await b.go(`${fix.url}/cutaway.html?id=arne&work=0&stage=sketch`, 4000);
    const w = await b.ev(`({ox:document.querySelector('dialog[open]').scrollWidth-document.querySelector('dialog[open]').clientWidth,tab:Math.min(...[...document.querySelectorAll('.stg-tab')].map(x=>x.getBoundingClientRect().height))})`);
    check('390px work window: stage tabs are tap-sized and nothing scrolls sideways', w.ox <= 0 && w.tab >= 44, w);
    b.close();
  } finally { real.close(); fix.close(); }
}
