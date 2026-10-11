/* useHome.js — the behaviours of the home page as hooks (from site.js, circles.js and hd2d.js). Each one works on the page's DOM by id,
   like the old script did, and cleans up after itself: React may mount a page twice in development. All of them stay still when motion is reduced. */
import {useEffect} from 'react';
import {reduce} from './env.js';

/* adds `.in` to elements when they scroll into view (once). `root` = the scroll box (the strip for the buildings), null = the window */
export function observeIn(nodes, root) {
  if (!('IntersectionObserver' in window)) { nodes.forEach(n => n.classList.add('in')); return () => {}; }
  const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), {root, threshold: .15});
  nodes.forEach(n => io.observe(n));
  return () => io.disconnect();
}

/* the nav gets .scrolled after 40px; the hero's --hp follows the scroll; the arch drifts with the pointer; the hero and the city pause off screen */
export function useHeroEffects() {
  useEffect(() => {
    const nav = document.getElementById('nav'), hero = document.getElementById('hero'), par = document.getElementById('arch-par');
    const undo = [];
    {   // nav: read scrollY once per frame, touch the class only when it changes
      let on = null, q = false;
      const sync = () => { q = false; const v = scrollY > 40; if (v !== on) { on = v; nav.classList.toggle('scrolled', v); } };
      const f = () => { if (!q) { q = true; requestAnimationFrame(sync); } };
      addEventListener('scroll', f, {passive: true}); sync(); undo.push(() => removeEventListener('scroll', f));
    }
    if (!reduce) {
      const move = e => { const r = hero.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; par.style.transform = `translate(${x * -22}px, ${y * -16}px)`; };
      const leave = () => { par.style.transform = ''; };
      hero.addEventListener('pointermove', move); hero.addEventListener('pointerleave', leave);
      undo.push(() => { hero.removeEventListener('pointermove', move); hero.removeEventListener('pointerleave', leave); });
      // scroll-linked hero: --hp 0…1 over the hero's height (learnt from a ResizeObserver, never read from layout while scrolling)
      let t = false, last = 0, hh = Math.min(innerHeight * .94, 1000), ro = null;
      if ('ResizeObserver' in window) { ro = new ResizeObserver(es => { hh = es[0].borderBoxSize && es[0].borderBoxSize[0] ? es[0].borderBoxSize[0].blockSize : es[0].contentRect.height; }); ro.observe(hero); }
      const onResize = () => { hh = hero.offsetHeight; }; if (!ro) addEventListener('resize', onResize);
      const upd = () => { const v = +Math.min(1, Math.max(0, scrollY / (hh * .9))).toFixed(3); if (v !== last) { hero.style.setProperty('--hp', v); last = v; } t = false; };
      const onScroll = () => { if (!t) { t = true; requestAnimationFrame(upd); } };
      addEventListener('scroll', onScroll, {passive: true}); upd();
      undo.push(() => { removeEventListener('scroll', onScroll); removeEventListener('resize', onResize); ro && ro.disconnect(); });
    }
    {   // the torn paper edge under the hero
      const pts = ['0 0', '100% 0'];
      for (let i = 40; i >= 0; i--) pts.push(`${i * 2.5}% ${100 - 1.2 - ((i * 37) % 7) * .75 - (i % 2) * 1.4}%`);
      hero.style.clipPath = `polygon(${pts.join(',')})`;
    }
    if ('IntersectionObserver' in window) {   // pause what animates where nobody looks
      const io = new IntersectionObserver(es => es.forEach(en => en.target.classList.toggle('zz-off', !en.isIntersecting)), {rootMargin: '120px 0px'});
      document.querySelectorAll('#hero, #city').forEach(el => io.observe(el)); undo.push(() => io.disconnect());
    }
    {   // coming back with the browser's back button: lift the curtain and forget the morphing building
      const show = e => { if (e.persisted) { document.getElementById('curtain')?.classList.remove('cover'); document.querySelectorAll('.bd').forEach(b => { b.style.viewTransitionName = ''; }); } };
      addEventListener('pageshow', show); undo.push(() => removeEventListener('pageshow', show));
    }
    return () => undo.forEach(f => f());
  }, []);
}

/* the round cursor with its label ("ENTER", "VIEW", "← DRAG →"): only with a mouse */
export function useCursor() {
  useEffect(() => {
    if (reduce || !matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    const el = document.getElementById('cursor'), lab = document.getElementById('cursor-label'), root = document.documentElement;
    root.classList.add('has-cursor');
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y, raf = 0;
    const loop = () => { cx += (x - cx) * .2; cy += (y - cy) * .2; el.style.transform = `translate(${cx}px,${cy}px)`; raf = (Math.abs(x - cx) > .1 || Math.abs(y - cy) > .1) ? requestAnimationFrame(loop) : 0; };
    const wake = () => { if (!raf) raf = requestAnimationFrame(loop); };
    const move = e => {
      x = e.clientX; y = e.clientY; el.classList.add('show'); wake();
      const bd = e.target.closest && e.target.closest('[data-cur]'), st = e.target.closest && e.target.closest('.strip');
      el.classList.toggle('big', !!bd); el.classList.toggle('drag', !bd && !!st);
      lab.textContent = bd ? bd.dataset.cur : (st ? '← DRAG →' : '');
    };
    const down = () => el.classList.add('down'), up = () => el.classList.remove('down'), leave = () => el.classList.remove('show');
    addEventListener('pointermove', move); addEventListener('pointerdown', down); addEventListener('pointerup', up); document.addEventListener('pointerleave', leave);
    return () => { removeEventListener('pointermove', move); removeEventListener('pointerdown', down); removeEventListener('pointerup', up); document.removeEventListener('pointerleave', leave); cancelAnimationFrame(raf); root.classList.remove('has-cursor'); };
  }, []);
}

/* Lenis smooth scrolling (self-hosted in vendor/) and its anchor links; the page works without it */
export function useLenis() {
  useEffect(() => {
    if (reduce) return;
    let lenis = null, raf = 0, dead = false, clicks = [];
    const start = () => {
      if (dead || !window.Lenis) return;
      lenis = new window.Lenis({lerp: .16, wheelMultiplier: 1});
      (function loop(t) { lenis.raf(t); raf = requestAnimationFrame(loop); })(performance.now());
      document.querySelectorAll('a[href^="#"]').forEach(a => {
        const f = e => { const id = a.getAttribute('href'); if (id.length > 1 && document.querySelector(id)) { e.preventDefault(); lenis.scrollTo(id, {offset: -70, duration: 1.4}); } };
        a.addEventListener('click', f); clicks.push([a, f]);
      });
    };
    const load = () => { if (window.Lenis) start(); else { const s = document.createElement('script'); s.src = 'vendor/lenis.min.js'; s.onload = start; document.head.appendChild(s); } };
    if (document.readyState === 'complete') load(); else addEventListener('load', load, {once: true});
    return () => { dead = true; cancelAnimationFrame(raf); lenis && lenis.destroy && lenis.destroy(); clicks.forEach(([a, f]) => a.removeEventListener('click', f)); removeEventListener('load', load); };
  }, []);
}

/* the count-up of the numbers: 1.6 s, ease-out, when 60 % of them is in view */
export function useCountUp(deps) {
  useEffect(() => {
    const els = [...document.querySelectorAll('[data-count]')], NF = new Intl.NumberFormat('en-US');
    const fmt = (el, v) => { el.textContent = NF.format(Math.round(v)) + (el.dataset.suf || ''); };
    if (reduce || !('IntersectionObserver' in window)) { els.forEach(el => fmt(el, +el.dataset.count)); return; }
    const raf = new Set();
    const run = el => { const end = +el.dataset.count, t0 = performance.now(); (function f(n) { const k = Math.min(1, (n - t0) / 1600); fmt(el, end * (1 - Math.pow(1 - k, 3))); if (k < 1) raf.add(requestAnimationFrame(f)); })(t0); };
    const io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } }), {threshold: .6});
    els.forEach(el => io.observe(el));
    return () => { io.disconnect(); raf.forEach(cancelAnimationFrame); };
  }, deps);   // eslint-disable-line react-hooks/exhaustive-deps
}
