/* Hero.jsx — the first screen: kicker, ransom-note "CIRCLES", three lines, the lead, the button, the concrete arch with the spinning coin.
   The pointer drift, the scroll-linked --hp and the torn edge are in lib/useHome.js (useHeroEffects). */
import {useEffect, useRef} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {coinPlay} from '../../lib/coin.js';
import {ARTISTS} from '../../lib/art.js';
import {openStudio} from '../../lib/home.js';
import {reduce} from '../../lib/env.js';
import {Ransom} from '../art.jsx';
import Coin from '../Coin.jsx';

/* the hero shortcuts: a random work of a random artist who has works, and "search by name" (scroll to the city search and focus it) */
function shortcutRandom() {
  const pool = ARTISTS.filter(a => a.pieces && a.pieces.length); if (!pool.length) return;
  const a = pool[Math.floor(Math.random() * pool.length)];
  openStudio(a.id, Math.floor(Math.random() * a.pieces.length), reduce);
}
function shortcutFind(e) {
  const i = document.getElementById('city-q'); if (!i) return;
  e.preventDefault();
  document.getElementById('city')?.scrollIntoView({behavior: reduce ? 'auto' : 'smooth', block: 'start'});
  setTimeout(() => i.focus({preventScroll: true}), reduce ? 0 : 500);
}

export default function Hero() {
  const {t, lang} = useLang(), coin = useRef(null);
  useEffect(() => {   // one spin by itself after the page has settled, so people learn it moves
    const id = setTimeout(() => coinPlay(coin.current, 'c3-settle'), 2600);
    return () => clearTimeout(id);
  }, []);
  const spin = () => coinPlay(coin.current, 'c3-settle');
  return <header className="hero" id="hero">
    <div className="hero-copy">
      <div className="kicker rise" style={{'--i': 0}}>No gallery. No middleman.</div>
      <Ransom as="h1" className="rn drop" id="rn-title" aria-label="CIRCLES" text="CIRCLES"/>
      <span className="hl rise" style={{'--i': 4}} data-t="hero_hl1">{t('hero_hl1')}</span>
      <span className="hl pink rise" style={{'--i': 5}} data-t="hero_hl2">{t('hero_hl2')}</span>
      <span className="hl gold rise" style={{'--i': 6}} data-t="hero_hl3">{t('hero_hl3')}</span>
      <p className="lead rise" style={{'--i': 7}} data-t="hero_lead">{t('hero_lead')}</p>
      <div className="hero-cta rise" style={{'--i': 8}}><a className="btn pk" href="#city" data-t="hero_cta">{t('hero_cta')}</a><a className="btn ghost" href="#featured" data-t="hero_cta2">{t('hero_cta2')}</a></div>
      <ul className="hero-trust rise" style={{'--i': 9}}><li data-t="hero_t1">{t('hero_t1')}</li><li data-t="hero_t2">{t('hero_t2')}</li></ul>
      <section className="shortcuts rise" style={{'--i': 9}} aria-labelledby="sc-h"><h2 id="sc-h" className="sc-h" data-t="sc_h">{t('sc_h')}</h2><div className="sc-grid">
        <button type="button" className="sc sc-y" onClick={shortcutRandom}><i aria-hidden="true">?</i><span data-t="sc_rand">{t('sc_rand')}</span></button>
        <a className="sc" href="highlights.html#new"><i aria-hidden="true">+</i><span data-t="sc_new">{t('sc_new')}</span></a>
        <a className="sc sc-p" href="highlights.html"><i aria-hidden="true">★</i><span data-t="sc_hl">{t('sc_hl')}</span></a>
        <a className="sc" href="#city" onClick={shortcutFind}><i aria-hidden="true">⌕</i><span data-t="sc_find">{t('sc_find')}</span></a>
      </div></section>
    </div>
    <div className="arch concrete" id="arch">
      <div className="arch-in tartan"><div className="arch-par" id="arch-par">
        <Coin ref={coin} mode="float" depth={9} n={15} aria-hidden="false" role="button" tabIndex={0} aria-label={lang === 'en' ? 'Spin the circles badge' : 'หมุนโลโก้ circles'}
          onClick={spin} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); spin(); } }}/>
      </div></div>
      <div className="sticker">ART NOT SORRY</div>
    </div>
    <div className="hero-tape"></div>
  </header>;
}
