#!/usr/bin/env node
// compare.mjs — old page vs React page, side by side in headless Chrome.
//   node tests/compare.mjs join.html privacy.html …      (build first: npm run build)
// For every page × th / en / lo × desktop 1280 and phone 375 (reduced motion, so nothing moves) it checks:
//   · the DOM: every element with its attributes and text, in order (data-t*, onclick, the sprite and scripts are ignored)
//   · a screenshot: share of pixels that differ
//   · console errors / failed requests and horizontal overflow on the React page
// Extra states: "join.html#dialog" also opens the Join dialog and compares it; "index.html#map" the map view, "index.html#filter" the new-wave filter.
// --fixture: both sides use the test data of tests/fixture.mjs (pay link, commission, shipping, no endpoint …).
// Exit code 1 when a DOM differs or more than 0.5 % of pixels differ. Screenshots of failures go to tests/out/.
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {startServer, launch, sleep} from '../../tools/browser.mjs';
import {makeFixture} from './fixture.mjs';

const APP = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), SITE = path.resolve(APP, '..'), OUT = path.join(APP, 'tests', 'out');
const pages = process.argv.slice(2).filter(a => !a.startsWith('--'));
const MAX_PX = 0.005, WAIT = +(process.argv.find(a => a.startsWith('--wait=')) || '--wait=1800').slice(7);
if (!pages.length) { console.log('usage: node tests/compare.mjs page.html [page.html#dialog …]'); process.exit(2); }
const FIX = process.argv.includes('--fixture') ? makeFixture() : null;
if (!FIX && !fs.existsSync(path.join(APP, 'dist', 'index.html'))) { console.log('no app/dist: run npm run build first'); process.exit(2); }
fs.mkdirSync(OUT, {recursive: true});

/* runs in the page: a flat, comparable list of the visible document */
const SNAPSHOT = `(() => {
  const SKIP_TAG = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'LINK', 'META', 'TITLE']);
  // data-t stays compared: circles.css styles [data-t] in Lao. data-t-aria / -ph / -html were only read by the old script.
  // The old ransom() chips carry junk attributes from a quote bug (font-family:"Special Elite" ends style="…"):
  // special="" and elite";font-weight:400"="" — see OLD_QUOTE_BUG in src/components/art.jsx
  const SKIP_ATTR = (a, el) => /^data-t-(aria|ph)$/.test(a) || /^on[a-z]+$/.test(a) || a.includes('"') || (a === 'special' && [...el.attributes].some(x => x.name.includes('"')));
  const out = [];
  const walk = (el, depth) => {
    let text = '', shown = false;                      // neighbouring text nodes count as one (JSX splits "{a} · {b}" into several)
    // a blank between two inline elements takes room on screen (the old templates had newlines there), so a blank
    // that renders is recorded as "␠"; blanks that take no room (between blocks) are ignored
    const flush = () => { const t = text.replace(/\\s+/g, ' ').trim(); if (t) out.push('  '.repeat(depth) + '"' + t + '"'); else if (shown) out.push('  '.repeat(depth) + '␠'); text = ''; shown = false; };
    const rendersBlank = n => { const r = document.createRange(); r.selectNodeContents(n); return [...r.getClientRects()].some(x => x.width > 0); };
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { text += n.textContent; if (!shown && !n.textContent.trim() && rendersBlank(n)) shown = true; continue; }
      if (n.nodeType === 8) continue;                  // comments split nothing
      flush();
      if (n.nodeType !== 1 || SKIP_TAG.has(n.tagName)) continue;
      if (n.id === 'root') { walk(n, depth); continue; }                                    // the React mount point is layout-neutral (display:contents)
      if (n.tagName.toLowerCase() === 'svg' && n.getAttribute('width') === '0' && n.getAttribute('height') === '0') { out.push('  '.repeat(depth) + '<svg sprite>'); continue; }
      // style is compared as the browser reads it (cssText), not as written
      const attrs = [...n.attributes].filter(a => !SKIP_ATTR(a.name, n)).map(a => a.name + '=' + JSON.stringify(a.name === 'style' ? n.style.cssText : a.value.replace(/\\s+/g, ' ').trim())).sort();
      out.push('  '.repeat(depth) + '<' + n.tagName.toLowerCase() + (attrs.length ? ' ' + attrs.join(' ') : '') + '>');
      if (n.tagName === 'DIALOG' && !n.open) continue;
      walk(n, depth + 1);
    }
    flush();
  };
  walk(document.body, 0);
  return {dom: out, title: document.title, lang: document.documentElement.lang, ox: document.documentElement.scrollWidth - innerWidth};
})()`;

/* pixel difference of two PNG screenshots, measured in a canvas */
const PXDIFF = (a, b) => `(async () => {
  const load = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
  const [x, y] = await Promise.all([load(${JSON.stringify(a)}), load(${JSON.stringify(b)})]);
  if (x.width !== y.width || x.height !== y.height) return 1;
  const c = document.createElement('canvas'); c.width = x.width; c.height = x.height; const g = c.getContext('2d', {willReadFrequently: true});
  g.drawImage(x, 0, 0); const A = g.getImageData(0, 0, c.width, c.height).data;
  g.clearRect(0, 0, c.width, c.height); g.drawImage(y, 0, 0); const B = g.getImageData(0, 0, c.width, c.height).data;
  let n = 0; for (let i = 0; i < A.length; i += 4) if (Math.abs(A[i] - B[i]) + Math.abs(A[i + 1] - B[i + 1]) + Math.abs(A[i + 2] - B[i + 2]) > 24) n++;
  return n / (A.length / 4);
})()`;

const firstDiff = (a, b) => {
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) if (a[i] !== b[i]) return {line: i, old: a.slice(Math.max(0, i - 2), i + 4), react: b.slice(Math.max(0, i - 2), i + 4)};
  return null;
};

const oldSrv = await startServer(SITE, FIX ? FIX.routes : {}), newSrv = await startServer(FIX ? FIX.dist : path.join(APP, 'dist'));
let fails = 0, runs = 0;
try {
  for (const [w, h, touch, vp] of [[1280, 900, false, 'desktop'], [375, 812, true, 'phone']]) {
    const b = await launch();
    await b.send('Emulation.setEmulatedMedia', {features: [{name: 'prefers-reduced-motion', value: 'reduce'}]});
    await b.send('Network.setBlockedURLs', {urls: ['*challenges.cloudflare.com*']});   // never load the real CAPTCHA from a test
    await b.view(w, h, touch);
    for (const spec of pages) {
      const [page, state] = spec.split('#');   // page may carry its own ?query
      for (const lang of ['th', 'en', 'lo']) {
        const snap = async base => {
          await b.ev(`try{localStorage.clear();sessionStorage.clear()}catch(e){}`);
          await b.go(`${base}/${page}${page.includes("?") ? "&" : "?"}lang=${lang}`, WAIT);
          if (state === 'map') { await b.ev(`document.querySelector('.vt[data-v=map]').click()`); await sleep(500); }                                   // the home page's map view
          if (state === 'filter') { await b.ev(`document.querySelector('.fbtn[data-d="*wave"]').click()`); await sleep(1500); }                      // the home page with the new-wave filter on
          if (state === 'dialog') { await b.ev(`(document.querySelector('.jn-cta .btn')||document.querySelector('nav .join')).click()`); await sleep(500); }
          await b.ev('document.fonts.ready.then(()=>1)');
          const s = await b.ev(SNAPSHOT);
          const shot = await b.send('Page.captureScreenshot', {format: 'png'});
          return {...s, png: 'data:image/png;base64,' + shot.data};
        };
        b.logs.length = 0;
        const o = await snap(oldSrv.url);
        const oldLogs = b.logs.splice(0);
        const n = await snap(newSrv.url);
        const newLogs = b.logs.splice(0).filter(l => !/cloudflare|ERR_BLOCKED_BY_CLIENT/.test(l));
        const px = await b.ev(PXDIFF(o.png, n.png));
        const diff = firstDiff(o.dom, n.dom);
        const label = `${spec} · ${lang} · ${vp}`;
        const problems = [];
        if (diff) problems.push('DOM differs at line ' + diff.line + '\n      old:   ' + diff.old.join('\n             ') + '\n      react: ' + diff.react.join('\n             '));
        if (o.title !== n.title) problems.push(`title: "${o.title}" vs "${n.title}"`);
        if (px > MAX_PX) problems.push(`pixels: ${(px * 100).toFixed(2)} % differ`);
        if (n.ox > 0) problems.push(`horizontal overflow ${n.ox}px`);
        if (newLogs.length) problems.push('errors: ' + newLogs.join(' | ') + (oldLogs.length ? '  (old page: ' + oldLogs.join(' | ') + ')' : ''));
        runs++;
        if (problems.length) {
          fails++;
          const f = label.replace(/[^\w]+/g, '_');
          fs.writeFileSync(path.join(OUT, f + '_old.png'), Buffer.from(o.png.split(',')[1], 'base64'));
          fs.writeFileSync(path.join(OUT, f + '_react.png'), Buffer.from(n.png.split(',')[1], 'base64'));
          console.log(`✗ ${label}\n    ${problems.join('\n    ')}`);
        } else console.log(`✓ ${label}  (${(px * 100).toFixed(2)} % px, ${n.dom.length} nodes)`);
      }
    }
    b.close();
  }
} finally { oldSrv.close(); newSrv.close(); }
console.log(`\n${runs - fails} same, ${fails} different`);
process.exit(fails ? 1 : 0);
