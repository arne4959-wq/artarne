/* HomeTop.jsx — what sits above the page: the loader (counts 0→100 while the fonts load), the round cursor, the page-change curtain,
   the marquee. From index.html + site.js ("v4: loader") + circles.js (renderMarquee). */
import {useEffect, useRef, useState} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {reduce} from '../../lib/env.js';
import Coin from '../Coin.jsx';

const seen = () => { try { return sessionStorage.getItem('circles-seen') === '1'; } catch (e) { return false; } };
const small = () => matchMedia('(pointer:coarse)').matches || innerWidth < 768;   // phones and small screens skip the count-up

/* html.pre holds the hero's entrance animations back until the loader is done; Home adds it, this removes it */
export function Loader() {
  const {t} = useLang();
  const [gone, setGone] = useState(() => reduce || seen() || small()), ref = useRef(null), count = useRef(null);
  useEffect(() => {
    const root = document.documentElement, boot = () => root.classList.remove('pre');
    if (gone) { boot(); return; }
    const DUR = 1700, t0 = performance.now(), timers = [];
    let raf = 0, finished = false;
    const fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    const counted = new Promise(res => (function tick(now) {
      const k = Math.min(1, (now - t0) / DUR), e = 1 - Math.pow(1 - k, 3);
      if (count.current) count.current.textContent = String(Math.round(e * 100)).padStart(3, '0');
      if (k < 1) raf = requestAnimationFrame(tick); else res();
    })(t0));
    const go = () => {
      if (finished) return; finished = true;
      try { sessionStorage.setItem('circles-seen', '1'); } catch (e) {}
      ref.current && ref.current.classList.add('done');
      timers.push(setTimeout(boot, 520), setTimeout(() => setGone(true), 1400));
    };
    Promise.all([fontsReady, counted]).then(go);
    timers.push(setTimeout(go, 6000));   // safety net
    return () => { cancelAnimationFrame(raf); timers.forEach(clearTimeout); finished = true; };
  }, [gone]);
  if (gone) return null;
  return <div className="loader" id="loader" aria-hidden="true" ref={ref}>
    <div className="loader-top" data-t="ld_top">{t('ld_top')}</div>
    <Coin lead="loader-orb" mode="hop"/>
    <div className="loader-count" id="loader-count" ref={count}>000</div>
    <div className="loader-text" data-t="ld_text">{t('ld_text')}</div>
  </div>;
}

export const CursorMarkup = () => <div className="cursor" id="cursor" aria-hidden="true"><i className="cd"></i><span id="cursor-label"></span></div>;
export const Curtain = () => <div className="curtain" id="curtain"><Coin mode="spin" depth={5} n={9}/></div>;

export function Marquee() {
  const {t} = useLang();
  return <div className="marquee" aria-hidden="true"><div id="mq">{[0, 1, 2, 3].flatMap(r => t('mq').flatMap((x, i) => [<span key={`s${r}-${i}`}>{x}</span>, <i key={`i${r}-${i}`}>✱</i>]))}</div></div>;
}
