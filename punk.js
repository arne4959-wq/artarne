/* punk.js — micro-interactions for the Home page (the visual layer is punk.css). Plain JS, no libraries, nothing is added to the page's content.
   Costs: a few passive listeners; the only rAF loop runs while the page is actually scrolling and stops by itself.
   Only transform / opacity / translate / rotate are animated. Skipped completely when the visitor asks for reduced motion. */
(function () {
  if (matchMedia('(prefers-reduced-motion:reduce)').matches) return;
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const root = document.documentElement;

  /* ---------- 1. ransom-note letters: touch one and it flips to a new angle, like re-arranging fridge magnets ---------- */
  const flip = chip => {
    const now = performance.now();
    if (chip._pk && now - chip._pk < 380) return;
    chip._pk = now;
    chip.style.setProperty('--r', rnd(-9, 9).toFixed(1) + 'deg');
    chip.style.setProperty('--y', rnd(-5, 5).toFixed(1) + 'px');
    chip.animate([{translate: '0 0'}, {translate: '0 -12px'}, {translate: '0 0'}], {duration: 340, easing: 'cubic-bezier(.34,1.56,.64,1)'});
  };
  document.addEventListener('pointerover', e => { if (e.pointerType !== 'mouse') return; const c = e.target.closest && e.target.closest('.rn span:not(.sp)'); if (c) flip(c); });
  document.addEventListener('pointerdown', e => { const c = e.target.closest && e.target.closest('.rn span:not(.sp)'); if (c) flip(c); });

  /* ---------- 2. glitch: a ransom line (or a big title) tears sideways for a moment ---------- */
  const busy = new WeakSet();
  async function glitch(el, steps = 5) {
    if (!el || busy.has(el)) return;
    busy.add(el);
    const kids = el.classList.contains('rn') ? [...el.querySelectorAll('span:not(.sp)')] : [el];
    for (let i = 0; i < steps; i++) {
      el.classList.toggle('pk-gl', i % 2 === 0);
      kids.forEach(k => { if (Math.random() < .6) k.animate([{translate: `${rnd(-7, 7).toFixed(1)}px ${rnd(-3, 3).toFixed(1)}px`}, {translate: '0 0'}], {duration: 90, easing: 'steps(2,end)'}); });
      await wait(70 + Math.random() * 40);
    }
    el.classList.remove('pk-gl');
    busy.delete(el);
  }
  const hero = document.getElementById('rn-title');
  if (hero) {
    if (fine) hero.addEventListener('pointerenter', () => glitch(hero));
    else hero.addEventListener('pointerdown', () => glitch(hero));
  }
  /* big titles and the manifesto lines glitch once when they are scrolled to */
  const io = 'IntersectionObserver' in window && new IntersectionObserver(es => es.forEach(en => {
    if (!en.isIntersecting) return;
    io.unobserve(en.target);
    setTimeout(() => glitch(en.target, 4), 420 + (+en.target.style.getPropertyValue('--i') || 0) * 160);
  }), {threshold: .6});
  if (io) document.querySelectorAll('.sec-t,.mk-h,.mani-lines .rn').forEach(el => io.observe(el));
  if (fine) document.querySelectorAll('.sec-t,.mk-h,.mani-lines .rn').forEach(el => el.addEventListener('pointerenter', () => glitch(el, 4)));
  /* now and then the hero title glitches by itself, only while it is on screen and the tab is open */
  if (hero && 'IntersectionObserver' in window) {
    let seen = true;
    new IntersectionObserver(es => { seen = es[0].isIntersecting; }).observe(hero);
    (function idle() { setTimeout(() => { if (seen && !document.hidden && !root.classList.contains('pre')) glitch(hero, 6); idle(); }, rnd(7000, 12000)); })();
  }

  /* ---------- 3. scroll speed: titles and photos sway with it, the top ticker speeds up (and runs backwards when you scroll up) ---------- */
  const sway = [...document.querySelectorAll('.sec-t,.mk-h,.mani-note,.mk-f')];
  let lastY = scrollY, vel = 0, raf = 0, mq = null;
  const getMq = () => { if (mq) return mq; const m = document.getElementById('mq'); mq = m && m.getAnimations && m.getAnimations()[0]; return mq; };
  function tick() {
    const dy = scrollY - lastY; lastY = scrollY;
    vel += (Math.max(-3, Math.min(3, dy * .09)) - vel) * .22;
    const v = Math.abs(vel) < .02 ? 0 : +vel.toFixed(2);
    sway.forEach(el => el.style.setProperty('--v', v));
    const a = getMq(); if (a) { const r = 1 + v * 2.2; a.updatePlaybackRate ? a.updatePlaybackRate(r) : (a.playbackRate = r); }
    raf = v === 0 && dy === 0 ? 0 : requestAnimationFrame(tick);
  }
  addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(tick); }, {passive: true});

  /* ---------- 4. paint splat wherever you click or tap (not on buttons, links or the draggable city) ---------- */
  const cols = ['var(--pink)', 'var(--gold)', 'var(--paper)'];
  document.addEventListener('pointerdown', e => {
    if (!e.isPrimary || e.button > 0) return;
    if (e.target.closest && e.target.closest('a,button,input,select,textarea,summary,label,dialog,.strip,.loader,.map-view,#nav')) return;
    const live = document.querySelectorAll('.pk-splat');
    if (live.length > 7) live[0].remove();
    const s = document.createElement('i');
    s.className = 'pk-splat' + (Math.random() < .4 ? ' star' : '');
    if (s.className.includes('star')) s.textContent = '✱';
    s.style.cssText = `--s:${Math.round(rnd(20, 38))}px;--c:${pick(cols)};translate:${e.clientX}px ${e.clientY}px`;
    s.setAttribute('aria-hidden', 'true');
    s.addEventListener('animationend', () => s.remove());
    document.body.appendChild(s);
  }, {passive: true});

  /* ---------- 5. the big blob cursor (site.js) gets a label over the pasted-up photos ---------- */
  document.querySelectorAll('.mk-f').forEach(f => { f.dataset.cur = 'ART ✱'; });
})();
