/* Hero.jsx — the first screen: kicker, ransom-note "CIRCLES", three lines, the lead, the button, the concrete arch with the spinning coin.
   The pointer drift, the scroll-linked --hp and the torn edge are in lib/useHome.js (useHeroEffects). */
import {useEffect, useRef} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {coinPlay} from '../../lib/coin.js';
import {Ransom} from '../art.jsx';
import Coin from '../Coin.jsx';

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
      <a className="btn rise" style={{'--i': 8}} href="#city" data-t="hero_cta">{t('hero_cta')}</a>
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
