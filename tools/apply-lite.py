#!/usr/bin/env python3
"""apply-lite.py: makes the home page smooth on phones and weak computers.

What it changes (safe to run twice; the second run changes nothing):
  1. circles.css  the page-change curtain's coin no longer spins while hidden (it forced a full
                  layout every frame, all the time, on every page); sections pause their
                  animations while off screen; "lite" mode CSS.
  2. circles.js   decides lite mode (phones, 2-core or 2 GB devices, data saver; ?lite / ?full to force),
                  pauses #hero and #city when they are off screen, footer says the content is a demo.
  3. site.js      the nav-shadow scroll handler reads scrollY once per frame instead of on every event.
  4. hd2d.js      lite mode: 3 walkers instead of 5, 2 birds instead of 3.
  5. index.html   the pre-rendered footer text matches the new demo wording.

Run from the site folder:  python3 tools/apply-lite.py
Undo lite mode for a single visit: add ?full to the address, e.g. index.html?full
"""
import pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
MARK = '/* ===== lite:'


def edit(name, old, new, marker):
    p = ROOT / name
    s = p.read_text(encoding='utf-8')
    if marker in s:
        print(f'ok    {name} (already done)')
        return
    n = s.count(old)
    if n != 1:
        sys.exit(f'STOP  {name}: expected the anchor once, found it {n} times. Nothing more was changed.')
    p.write_text(s.replace(old, new), encoding='utf-8')
    print(f'done  {name}')


def append(name, text, marker):
    p = ROOT / name
    s = p.read_text(encoding='utf-8')
    if marker in s:
        print(f'ok    {name} (already done)')
        return
    p.write_text(s.rstrip('\n') + '\n' + text, encoding='utf-8')
    print(f'done  {name}')


CSS = """/* ===== lite:start ===== */
/* the curtain's coin only spins while the curtain is covering the page */
.curtain:not(.cover) .c3-coin,.curtain:not(.cover) .c3-lift{animation-play-state:paused!important;}
/* a section that is off screen stops animating (circles.js adds .zz-off) */
.zz-off,.zz-off *{animation-play-state:paused!important;}
/* lite mode: no light shafts or dust, people at the doors stand still */
html.lite .fx{display:none!important;}
html.lite .stand .spr canvas{animation:none!important;}
html.lite .stand .spr canvas:first-child{opacity:1;}
/* ===== lite:end ===== */
"""

JS = """/* ===== lite:start ===== */
/* pause the hero and the city while they are off screen: nothing animates where nobody looks */
(function pauseOffscreen() {
  if (!('IntersectionObserver' in window)) return;
  const io = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('zz-off', !en.isIntersecting)), {rootMargin: '120px 0px'});
  const go = () => document.querySelectorAll('#hero, #city').forEach(el => io.observe(el));
  document.readyState === 'loading' ? addEventListener('DOMContentLoaded', go) : go();
})();
/* ===== lite:end ===== */
"""

LITE_DECIDE = """const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
/* ===== lite:decide ===== phones, very weak devices (2 cores or 2 GB) and data-saver get fewer moving things. ?lite or ?full in the address forces it. */
const LITE = (() => { try {
  const q = new URLSearchParams(location.search);
  if (q.has('full')) return false;
  if (q.has('lite')) return true;
  const phone = matchMedia('(pointer:coarse)').matches && innerWidth < 900;
  const weak = (navigator.hardwareConcurrency || 8) <= 2 || (navigator.deviceMemory || 8) <= 2;
  const save = !!(navigator.connection && navigator.connection.saveData);
  return phone || weak || save;
} catch (e) { return false; } })();
if (LITE) document.documentElement.classList.add('lite');"""

NAV_OLD = "addEventListener('scroll', () => document.getElementById('nav').classList.toggle('scrolled', scrollY > 40), {passive: true});"
NAV_NEW = """/* ===== lite:nav ===== read scrollY once per frame, touch the class only when it changes */
{ const nav = document.getElementById('nav'); let on = null, q = false;
  const sync = () => { q = false; const v = scrollY > 40; if (v !== on) { on = v; nav.classList.toggle('scrolled', v); } };
  addEventListener('scroll', () => { if (!q) { q = true; requestAnimationFrame(sync); } }, {passive: true}); sync(); }"""

TH_OLD = "foot_copy:'© 2026 CIRCLES · ต้นแบบ · NO GALLERY. NO MIDDLEMAN.'"
TH_NEW = "foot_copy:'© 2026 CIRCLES · ต้นแบบ · ศิลปินและผลงานในเว็บนี้เป็นตัวอย่าง · NO GALLERY. NO MIDDLEMAN.'"
EN_OLD = "foot_copy:'© 2026 CIRCLES · prototype · NO GALLERY. NO MIDDLEMAN.'"
EN_NEW = "foot_copy:'© 2026 CIRCLES · prototype · artists and works shown are examples · NO GALLERY. NO MIDDLEMAN.'"
HTML_OLD = "© 2026 CIRCLES · ต้นแบบ · NO GALLERY. NO MIDDLEMAN."
HTML_NEW = "© 2026 CIRCLES · ต้นแบบ · ศิลปินและผลงานในเว็บนี้เป็นตัวอย่าง · NO GALLERY. NO MIDDLEMAN."

append('circles.css', CSS, MARK)
edit('circles.js', "const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;", LITE_DECIDE, 'lite:decide')
append('circles.js', JS, '/* ===== lite:start')
edit('circles.js', TH_OLD, TH_NEW, 'ศิลปินและผลงานในเว็บนี้เป็นตัวอย่าง')
edit('circles.js', EN_OLD, EN_NEW, 'artists and works shown are examples')
edit('site.js', NAV_OLD, NAV_NEW, 'lite:nav')
edit('hd2d.js', "  WALKERS.forEach((w, i) => {", "  /* lite:walkers */ if (document.documentElement.classList.contains('lite')) WALKERS.length = 3;\n  WALKERS.forEach((w, i) => {", 'lite:walkers')
edit('hd2d.js', "  [{y: '2.2rem', T: 54, rev: false, o: .15}, {y: '6.5rem', T: 76, rev: true, o: .55}, {y: '10.5rem', T: 64, rev: false, o: .8}].forEach((b, i) => {",
     "  /* lite:birds */ [{y: '2.2rem', T: 54, rev: false, o: .15}, {y: '6.5rem', T: 76, rev: true, o: .55}, {y: '10.5rem', T: 64, rev: false, o: .8}].slice(0, document.documentElement.classList.contains('lite') ? 2 : 3).forEach((b, i) => {",
     'lite:birds')
edit('index.html', HTML_OLD, HTML_NEW, 'ศิลปินและผลงานในเว็บนี้เป็นตัวอย่าง')
print('finished. Check with:  node --check circles.js && node --check site.js && node --check hd2d.js')
