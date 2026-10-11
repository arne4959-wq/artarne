// The HD-2D city strip: three depth planes, depth-of-field blur, pixel sprites, light + dust, only transform/opacity, reduced motion, phone.
import {launch, sleep} from '../../tools/browser.mjs';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const __root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const {ARTISTS} = new Function(fs.readFileSync(path.join(__root, 'artists.js'), 'utf8') + '\n;return {ARTISTS};')();
const N = ARTISTS.length, WORKS = ARTISTS.reduce((n, a) => n + a.pieces.length, 0), FEATURED = 8;
export const name = 'hd2d';
const ALLOWED = ['transform', 'opacity'];
export async function run({url, check}) {
  let b = await launch({gpu: true}); await b.lang('th'); await b.view(1280, 900); const ev = b.ev;
  await b.go(`${url}/index.html`, 4500);

  /* 1 — three planes, different speeds */
  const tx = sel => `(()=>{const m=new DOMMatrix(getComputedStyle(document.querySelector('${sel}')).transform);return Math.round(m.m41)})()`;
  await ev("document.getElementById('strip').scrollLeft=1000;0"); await sleep(600);      // (clamped to the city's real length)
  const sl = await ev("document.getElementById('strip').scrollLeft");
  const far = await ev(tx('.far')), mid = await ev(tx('.mid'));
  check('far city is pushed back 55% of the scroll, mid city 28% (buildings 0%)', sl > 300 && far === Math.round(sl * .55) && mid === Math.round(sl * .28), {scrollLeft: sl, far, mid});
  check('three planes exist: far, mid, buildings', (await ev("!!document.querySelector('#depth .far')&&!!document.querySelector('#depth .mid')&&document.querySelectorAll('.bd').length")) === N);
  check('scroll range ends at the last building (back planes are clipped)', await ev("(()=>{const s=document.getElementById('strip');return s.scrollWidth===document.getElementById('strip-in').offsetWidth})()"));
  check('layers still cover the screen at the far right end', await ev(`(()=>{const s=document.getElementById('strip');s.scrollLeft=1e9;const v=s.getBoundingClientRect(),f=document.querySelector('.far').getBoundingClientRect(),m=document.querySelector('.mid').getBoundingClientRect();return f.left<=v.left&&f.right>=v.right&&m.left<=v.left&&m.right>=v.right})()`));
  await ev("document.getElementById('strip').scrollLeft=0;0");

  /* 2 — depth of field */
  const f = await ev("[getComputedStyle(document.querySelector('.far')).filter,getComputedStyle(document.querySelector('.mid')).filter,getComputedStyle(document.querySelector('.bd')).filter,getComputedStyle(document.querySelector('.bd .mon')).filter]");
  check('blur: far 4px, mid 1.5px, artists\' buildings sharp', f[0] === 'blur(4px)' && f[1] === 'blur(1.5px)' && f[2] === 'none' && f[3] === 'none', f);

  /* 3 — pixel sprites */
  const sp = await ev(`(()=>{const c=[...document.querySelectorAll('.spr canvas')];return {n:c.length,real:[...new Set(c.map(x=>x.width+'x'+x.height))].join(),scaled:Math.round(c[0].getBoundingClientRect().width),render:getComputedStyle(c[0]).imageRendering,walkers:document.querySelectorAll('.walker').length,birds:document.querySelectorAll('.bird').length}})()`);
  check('sprites are 16x16 canvases scaled up with image-rendering: pixelated', sp.real === '16x16' && sp.scaled === 48 && sp.render === 'pixelated' && sp.walkers >= 3 && sp.birds >= 2, sp);
  const colours = await ev(`(()=>{const ok=new Set(['14,13,12','244,241,232','255,46,136','232,183,48','163,24,44','232,228,216']);const bad=new Set();for(const c of document.querySelectorAll('.spr canvas')){const d=c.getContext('2d').getImageData(0,0,16,16).data;for(let i=0;i<d.length;i+=4)if(d[i+3]>0&&!ok.has(d[i]+','+d[i+1]+','+d[i+2]))bad.add(d[i]+','+d[i+1]+','+d[i+2])}return [...bad]})()`);
  check('sprites use only the site\'s palette', colours.length === 0, colours);
  const w1 = await ev("[...document.querySelectorAll('.walker')].map(w=>new DOMMatrix(getComputedStyle(w).transform).m41)"); await sleep(1500);
  const w2 = await ev("[...document.querySelectorAll('.walker')].map(w=>new DOMMatrix(getComputedStyle(w).transform).m41)");
  check('people really walk, both directions', w1.some((x, i) => w2[i] > x + 10) && w1.some((x, i) => w2[i] < x - 10));

  /* 4 — light and dust */
  check('light shafts and dust sit in front of the city and let the mouse through', await ev("document.querySelectorAll('.ray').length>=3&&document.querySelectorAll('.dust').length>=2&&getComputedStyle(document.querySelector('.fx')).pointerEvents==='none'"));

  /* 5 — only transform and opacity animate (the Hero's one-off clip-path reveal is the original design) */
  const props = await ev(`[...new Set(document.getAnimations().filter(a=>/^(walkR|walkL|bob|fr4|ray|dustA|dustB)$/.test(a.animationName)).flatMap(a=>a.effect.getKeyframes().flatMap(k=>Object.keys(k).filter(x=>!['offset','easing','composite','computedOffset'].includes(x)))))]`);
  check('HD-2D animations touch only transform and opacity', props.length > 0 && props.every(p => ALLOWED.includes(p)), props);
  check('city still draggable through the overlay', await (async () => {
    await ev("document.getElementById('strip').scrollIntoView({block:'center'});0"); await sleep(1500);
    const y = await ev("Math.round(document.getElementById('strip').getBoundingClientRect().top+300)");
    await b.send('Input.dispatchMouseEvent', {type: 'mousePressed', x: 900, y, button: 'left', clickCount: 1});
    for (let i = 1; i <= 25; i++) { await b.send('Input.dispatchMouseEvent', {type: 'mouseMoved', x: 900 - i * 12, y, button: 'left'}); await sleep(14); }
    await b.send('Input.dispatchMouseEvent', {type: 'mouseReleased', x: 600, y, button: 'left', clickCount: 1}); await sleep(800);
    return (await ev("document.getElementById('strip').scrollLeft")) > 100;
  })());
  check('no console / network errors', b.logs.length === 0, b.logs);
  b.close();

  /* reduced motion: the scene stays, nothing moves */
  b = await launch(); await b.lang('th'); await b.view(1280, 900);
  await b.send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
  await b.go(`${url}/index.html`, 4500);
  const rm = await b.ev(`(()=>{const run=document.getAnimations().filter(a=>a.playState==='running'&&a.effect&&a.effect.target&&a.effect.target.closest&&a.effect.target.closest('.stage,#strip-in'));return {running:run.length,walker:getComputedStyle(document.querySelector('.walker')).animationName,dust:getComputedStyle(document.querySelector('.dust')).display,ray:getComputedStyle(document.querySelector('.ray')).animationName,frames:[...document.querySelectorAll('.spr')].every(s=>[...s.children].every((c,i)=>getComputedStyle(c).opacity===(i===0?'1':'0'))),sprites:document.querySelectorAll('.spr canvas').length,parallax:document.querySelector('.far').style.getPropertyValue('--sx')}})()`);
  check('reduced motion: sprites stand still on frame 1, dust hidden, light static, no parallax, nothing running', rm.running === 0 && rm.walker === 'none' && rm.dust === 'none' && rm.ray === 'none' && rm.frames && rm.sprites > 0 && rm.parallax === '', rm);
  b.close();

  /* phone, 375px */
  b = await launch(); await b.lang('th'); await b.view(375, 812, true);
  await b.go(`${url}/index.html`, 4500);
  const ph = await b.ev(`({overflowX:document.documentElement.scrollWidth-innerWidth,sprite:Math.round(document.querySelector('.spr canvas').getBoundingClientRect().width),rangeOk:document.getElementById('strip').scrollWidth===document.getElementById('strip-in').offsetWidth})`);
  check('375px: no horizontal overflow, sprites 2x (32px), scroll range = the city', ph.overflowX <= 0 && ph.sprite === 32 && ph.rangeOk, ph);
  b.close();
}
