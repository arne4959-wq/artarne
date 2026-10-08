#!/usr/bin/env python3
"""Spinning 3D logo coin: nav (hover/tap + language change), home loader (hop),
page-change curtain (spin), home hero badge (tap = settle spin).
Run from the site folder:  python3 tools/apply-spin.py      (safe to run again; it replaces its own block)"""
import os, re, sys, glob
HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE) if os.path.basename(HERE) == 'tools' else os.getcwd()
B_JS, E_JS = '/* ===== spin:begin ===== */', '/* ===== spin:end ===== */'
HEAD = "<script>try{if(sessionStorage.getItem('circles-pgc'))document.documentElement.classList.add('pgc-in')}catch(e){}</script>"
JS = r'''/* ================= 3D spinning logo (a thick coin, like a LEGO-game loading brick) =================
   The logo <svg>s already in the pages are swapped for a coin at load time, so no page markup changes:
   · nav logo        hover or tap: one spin with a bounce · it also flips when the language changes
   · home loader     hop, spin in the air, squash on landing (loops while the page loads)
   · home hero arch  floats; tap or click it: fast spin that slows, wobbles and settles
   · page changes    a black curtain with a spinning coin covers the jump between pages
   Everything stays still for visitors who ask for reduced motion. */
function coin3d(host, {front = '#orb', back = '#orb-s', depth = 7, n = 13, mode = ''} = {}) {
  const edges = Array.from({length: n}, (_, i) =>
    `<i class="c3-edge${i === 0 || i === n - 1 ? ' hi' : ''}" style="transform:translateZ(${(-depth + 2 * depth * i / (n - 1)).toFixed(2)}px)"></i>`).join('');
  host.classList.add('c3');
  if (mode) host.classList.add('c3-m' + mode);
  host.innerHTML = `<span class="c3-lift"><span class="c3-coin">${edges}` +
    `<span class="c3-face" style="transform:translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${front}"/></svg></span>` +
    `<span class="c3-face" style="transform:rotateY(180deg) translateZ(${depth}px)"><svg viewBox="0 0 200 200" aria-hidden="true"><use href="${back}"/></svg></span></span></span>`;
  return host;
}
function coinPlay(host, cls) {
  if (reduce || !host) return;
  const c = host.querySelector('.c3-coin'); if (!c) return;
  c.classList.remove('c3-once', 'c3-settle'); void c.offsetWidth; c.classList.add(cls);
  c.addEventListener('animationend', () => c.classList.remove(cls), {once: true});
}
function coinSwap(svg, opts) {
  if (!svg || !document.getElementById('orb')) return null;
  const span = document.createElement('span');
  const cls = svg.getAttribute('class'); if (cls) span.className = cls;
  if (svg.id) span.id = svg.id;
  span.setAttribute('aria-hidden', 'true');
  svg.replaceWith(span);
  return coin3d(span, opts);
}
(function initCoins() {
  if (!document.getElementById('orb')) return;
  const navCoins = [];
  document.querySelectorAll('.brand > svg').forEach(svg => {
    const brand = svg.parentElement, c = coinSwap(svg, {front: '#orb-s', back: '#orb-s', depth: 2, n: 5});
    navCoins.push(c);
    brand.addEventListener('pointerenter', () => coinPlay(c, 'c3-once'));
    brand.addEventListener('click', () => coinPlay(c, 'c3-once'));
  });
  let first = true;
  onLang(() => { if (first) { first = false; return; } navCoins.forEach(c => coinPlay(c, 'c3-once')); });
  coinSwap(document.querySelector('svg.loader-orb'), {mode: 'hop'});
  coinSwap(document.querySelector('#curtain > svg'), {mode: 'spin', depth: 5, n: 9});
  const hero = coinSwap(document.querySelector('#arch-par > svg'), {mode: 'float', depth: 9, n: 15});
  if (hero) {
    hero.setAttribute('aria-hidden', 'false'); hero.setAttribute('role', 'button'); hero.tabIndex = 0;
    hero.setAttribute('aria-label', LANG === 'en' ? 'Spin the circles badge' : 'หมุนโลโก้ circles');
    const go = () => coinPlay(hero, 'c3-settle');
    hero.addEventListener('click', go);
    hero.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
    setTimeout(go, 2600);                       // one spin by itself after the page has settled, so people learn it moves
  }
})();

/* page change curtain: covers the jump between pages with a spinning coin */
(function pageCurtain() {
  const html = document.documentElement, KEY = 'circles-pgc';
  const make = () => {
    const el = document.createElement('div'); el.className = 'pgc'; el.setAttribute('aria-hidden', 'true');
    el.appendChild(document.createElement('span'));
    document.body.appendChild(el);
    if (document.getElementById('orb')) coin3d(el.firstChild, {mode: 'spin', depth: 5, n: 9});
    return el;
  };
  // arriving: the page was opened through the curtain, so lift it off
  let arrived = false;
  try { arrived = sessionStorage.getItem(KEY) === '1'; sessionStorage.removeItem(KEY); } catch (e) {}
  if (arrived && !reduce) {
    const el = make(); el.classList.add('on', 'still');
    html.classList.remove('pgc-in');
    void el.offsetWidth; el.classList.remove('still');
    setTimeout(() => { el.classList.add('up'); setTimeout(() => el.remove(), 450); }, 260);
  } else html.classList.remove('pgc-in');
  if (reduce) return;
  // leaving: catch plain clicks on links to other pages of this site
  document.addEventListener('click', e => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    const a = e.target.closest && e.target.closest('a[href]'); if (!a || a.target || a.hasAttribute('download')) return;
    const url = new URL(a.getAttribute('href'), location.href);
    if (url.origin !== location.origin || !/\.html$|\/$/.test(url.pathname)) return;
    if (url.pathname === location.pathname && url.search === location.search) return;   // same page (anchors)
    e.preventDefault();
    try { sessionStorage.setItem(KEY, '1'); } catch (err) {}
    const el = make(); void el.offsetWidth; el.classList.add('on');
    setTimeout(() => { location.href = url.href; }, 430);
  });
  addEventListener('pageshow', e => { if (e.persisted) document.querySelectorAll('.pgc').forEach(el => el.remove()); });
})();'''
CSS = r'''/* ---------- 3D spinning logo (see coin3d in circles.js) ---------- */
.c3{display:inline-block;perspective:600px;flex:none;}
.c3-lift,.c3-coin{display:block;position:relative;width:100%;height:100%;transform-style:preserve-3d;}
.c3-edge{position:absolute;inset:3%;border-radius:50%;background:#2a2622;}
.c3-edge.hi{background:var(--pink,#FF2E88);}
.c3-face{position:absolute;inset:0;backface-visibility:hidden;-webkit-backface-visibility:hidden;}
.c3-face svg{display:block;width:100%!important;height:100%!important;position:static!important;transform:none!important;animation:none!important;transition:none!important;}
.c3-mspin .c3-coin{animation:c3spin 2.2s linear infinite;}
.c3-mhop .c3-lift{animation:c3hop 1.6s cubic-bezier(.3,0,.3,1) infinite;}
.c3-mhop .c3-coin{animation:c3hopspin 1.6s cubic-bezier(.45,0,.2,1) infinite;}
.c3-mfloat .c3-lift{animation:c3float 6s ease-in-out infinite;}
.c3-coin.c3-once{animation:c3spin .9s cubic-bezier(.3,1.4,.5,1);}
.c3-coin.c3-settle{animation:c3settle 2.2s cubic-bezier(.15,.8,.25,1);}
@keyframes c3spin{to{transform:rotateY(360deg);}}
@keyframes c3hop{0%,100%{transform:translateY(0) scale(1.06,.92);}12%{transform:translateY(0) scale(1);}50%{transform:translateY(-38%) scale(1);}88%{transform:translateY(0) scale(1);}94%{transform:translateY(0) scale(1.08,.9);}}
@keyframes c3hopspin{0%,12%{transform:rotateY(0);}88%,100%{transform:rotateY(360deg);}}
@keyframes c3float{0%,100%{transform:translateY(0) rotate(-2deg);}50%{transform:translateY(-11px) rotate(3deg);}}
@keyframes c3settle{0%{transform:rotateY(0) rotateX(0);}60%{transform:rotateY(1080deg) rotateX(0);}70%{transform:rotateY(1080deg) rotateX(16deg);}80%{transform:rotateY(1080deg) rotateX(-9deg);}90%{transform:rotateY(1080deg) rotateX(3deg);}100%{transform:rotateY(1080deg) rotateX(0);}}
/* where the coins sit */
.brand > .c3{width:36px;height:36px;}
.arch-par > .c3{width:60%;aspect-ratio:1;cursor:pointer;-webkit-tap-highlight-color:transparent;}
.arch-par > .c3:focus-visible{outline:3px solid var(--pink,#FF2E88);outline-offset:6px;border-radius:50%;}
.arch-par > .c3 .c3-face svg{filter:drop-shadow(7px 7px 0 #0E0D0C);}
.loader-orb.c3{animation:none;aspect-ratio:1;filter:drop-shadow(6px 10px 0 var(--pink,#FF2E88));}
#curtain > .c3{position:absolute;left:50%;top:50%;width:96px;height:96px;margin:-48px 0 0 -48px;}
@media(max-width:860px){.brand > .c3{width:30px;height:30px;}}
/* page change curtain */
html.pgc-in::after{content:"";position:fixed;inset:0;background:#0E0D0C;z-index:2000;animation:pgcSafe 0s 1.5s forwards;}  /* never stays black if the script fails */
@keyframes pgcSafe{to{visibility:hidden;}}
.pgc{position:fixed;inset:0;z-index:2001;background:#0E0D0C;display:grid;place-items:center;transform:translateY(100%);transition:transform .4s cubic-bezier(.65,0,.35,1);pointer-events:none;}
.pgc::before{content:"";position:absolute;left:0;right:0;top:-18px;height:18px;background:repeating-linear-gradient(135deg,#0E0D0C 0 16px,#E8B730 16px 32px);}
.pgc.on{transform:none;pointer-events:all;}
.pgc.still{transition:none;}
.pgc.up{transform:translateY(-100%);}
.pgc > .c3{width:110px;height:110px;}
@media(prefers-reduced-motion:reduce){.c3-coin,.c3-lift{animation:none!important;}.pgc{display:none;}}'''

def put(path, block):
    s = open(path, encoding='utf-8').read()
    new = f'{B_JS}\n{block.strip()}\n{E_JS}\n'
    if B_JS in s:
        s2 = re.sub(re.escape(B_JS) + r'[\s\S]*?' + re.escape(E_JS) + r'\n?', lambda m: new, s)
    else:
        s2 = s.rstrip('\n') + '\n\n' + new
    if s2 != s:
        open(path, 'w', encoding='utf-8').write(s2); print('  updated', os.path.basename(path))
    else: print('  ok', os.path.basename(path))

put(os.path.join(ROOT, 'circles.js'), JS)
put(os.path.join(ROOT, 'circles.css'), CSS)
n = 0
for f in sorted(glob.glob(os.path.join(ROOT, '*.html'))):
    s = open(f, encoding='utf-8').read()
    if 'circles.js' not in s or 'circles-pgc' in s: continue
    s2 = re.sub(r'(<meta charset="UTF-8">)', lambda m: m.group(1) + '\n' + HEAD, s, count=1, flags=re.I)
    if s2 != s: open(f, 'w', encoding='utf-8').write(s2); n += 1
print(f'  head script added to {n} page(s)')
print('done. (studio-*.html come from cutaway.html, which is patched too)')
