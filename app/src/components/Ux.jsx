/* Ux.jsx — ease of use, the same as the end of circles.js (ux()): "pause motion", and the floating Share / Support buttons on an artist's page.
   The skip link is a plain <a className="skip" href="#main"> that each page passes to PageShell as `lead`. */
import {useEffect, useState} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {useDialogs} from './Dialogs.jsx';
import {useToast} from './Toast.jsx';

const KEY = 'circles-calm';
import {canDonate} from '../lib/donate.js';

/* skip link: moves the focus to <main id="main"> itself (the smooth-scroll library would otherwise swallow the #main jump) */
export function SkipLink() {
  const {t} = useLang();
  return <a className="skip" href="#main" data-t="skip_main" onClick={e => { const m = document.getElementById('main'); if (!m) return; e.preventDefault(); m.focus({preventScroll: true}); m.scrollIntoView({block: 'start'}); }}>{t('skip_main')}</a>;
}

export function Calm() {
  const {t} = useLang();
  const [on, setOn] = useState(() => { try { return localStorage.getItem(KEY) === '1'; } catch (e) { return false; } });
  useEffect(() => { if (on) document.documentElement.setAttribute('data-calm', '1'); else document.documentElement.removeAttribute('data-calm'); }, [on]);
  const lab = t(on ? 'calm_on' : 'calm_off');
  return <button type="button" className="calm" aria-pressed={on} aria-label={lab} title={lab}
    onClick={() => setOn(v => { const n = !v; try { localStorage.setItem(KEY, n ? '1' : '0'); } catch (e) {} return n; })}>
    <span aria-hidden="true">{on ? '▶' : '❚❚'}</span><span className="calm-t"> {lab}</span></button>;
}

/* Share sits in the footer row (a quiet button), so nothing floats over the work on a phone */
export function ShareFoot() {
  const {t} = useLang(), toast = useToast();
  const share = async () => {
    const url = location.href.split('#')[0];
    try { if (navigator.share) { await navigator.share({title: document.title, url}); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); toast(t('share_copied')); } catch (e) { /* no clipboard: nothing to do */ }
  };
  return <button type="button" className="calm share-foot" aria-label={t('share_btn')} title={t('share_btn')} onClick={share}><span aria-hidden="true">↗</span><span className="calm-t"> {t('share_btn')}</span></button>;
}

/* the one floating button: "Donate to <artist>". Hidden on the first screen (nothing is covered there) and while the page's own (primary) Donate button
   is on screen; the quiet per-work links do not count */
export function Fab({A}) {
  const {t, nameL} = useLang(), {openDonate} = useDialogs(), [away, setAway] = useState(true), can = canDonate(A);
  useEffect(() => {
    if (!can) return;
    document.documentElement.classList.add('has-fab');
    let raf = 0;
    const check = () => { raf = 0; const vh = innerHeight; setAway(scrollY < 160 || [...document.querySelectorAll('[data-support]:not(.fab-s):not([data-quiet]), .pf-sbtn')].some(el => { const r = el.getBoundingClientRect(); return r.width && r.bottom > 0 && r.top < vh; })); };
    const queue = () => { if (!raf) raf = requestAnimationFrame(check); };
    addEventListener('scroll', queue, {passive: true}); addEventListener('resize', queue);
    const first = setTimeout(queue, 800), id = setInterval(queue, 2000); queue();
    return () => { removeEventListener('scroll', queue); removeEventListener('resize', queue); clearTimeout(first); clearInterval(id); cancelAnimationFrame(raf); document.documentElement.classList.remove('has-fab'); };
  }, [can]);
  if (!can) return null;
  return <div className="fab-wrap"><button type="button" className={'btn pk fab-s fab-sup' + (away ? ' away' : '')} data-support={A.id} onClick={() => openDonate(A)}>{t('pf_supb', {a: nameL(A)})}</button></div>;
}
