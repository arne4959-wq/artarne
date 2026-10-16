/* Nav — the top bar of every page (wireNav in circles.js): logo coin, page links, language button, Join, mobile menu.
   links: [[href, stringKey], …] before the language button; join: show the Join button; menu: [[href, stringKey], …] for the phone menu */
import {useEffect, useRef, useState} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {LANGS, LANG_BTN, LANG_NAME} from '../lib/lang.js';
import {coinPlay} from '../lib/coin.js';
import {useDialogs} from './Dialogs.jsx';
import Coin from './Coin.jsx';

/* all three languages side by side, the current one filled (see .lang-seg in circles.css) */
export function LangButton() {
  const {lang, setLang, t} = useLang();
  return <div className="lang-seg" id="lang" role="group" aria-label={t('lang_aria')}>
    {LANGS.map(l => <button key={l} type="button" lang={l} aria-pressed={l === lang} aria-label={LANG_NAME[l]} onClick={() => l !== lang && setLang(l)}>{LANG_BTN[l]}</button>)}
  </div>;
}

export default function Nav({links = [], join = false, menu = null, brandHref = 'index.html', id}) {
  const {t, lang} = useLang(), dialogs = useDialogs();
  const coin = useRef(null), shownLang = useRef(lang);
  const [open, setOpen] = useState(false);
  // the logo flips when the language changes (not on the first render)
  useEffect(() => { if (shownLang.current === lang) return; shownLang.current = lang; coinPlay(coin.current, 'c3-once'); }, [lang]);
  useEffect(() => {
    if (!menu) return;
    const close = e => { if (e.type === 'keydown' ? e.key === 'Escape' : !e.target.closest('#mnav')) setOpen(false); };
    addEventListener('click', close); addEventListener('keydown', close);
    return () => { removeEventListener('click', close); removeEventListener('keydown', close); };
  }, [menu]);
  const spin = () => coinPlay(coin.current, 'c3-once');
  const brand = <><Coin ref={coin} front="#orb-s" back="#orb-s" depth={2} n={5}/>CIRCLES</>;
  return (
    <nav id={id}>
      {brandHref ? <a className="brand" href={brandHref} onPointerEnter={spin} onClick={spin}>{brand}</a>
        : <div className="brand" onPointerEnter={spin} onClick={spin}>{brand}</div>}
      <div className="links">
        {withAll(links).map(([href, k]) => <a key={href + k} href={href} data-t={k}>{t(k)}</a>)}
        <LangButton/>
        {join && <button type="button" className="join" onClick={() => dialogs.openJoin()}>{t('nav_join')}</button>}
        {menu && <button type="button" className="menu-btn" id="menu-btn" aria-label={t('menu_aria')} aria-expanded={open ? 'true' : 'false'} aria-controls="mnav"
          onClick={e => { e.stopPropagation(); setOpen(o => !o); }}><i></i><i></i></button>}
      </div>
      {menu && <div className={'mnav' + (open ? ' open' : '')} id="mnav" inert={!open} onClick={e => { if (e.target.closest('a')) setOpen(false); }}>
        {withAll(menu).sort((a, b) => /join\.html$/.test(b[0]) - /join\.html$/.test(a[0])).map(([href, k]) => <a key={href + k} className={/join\.html$/.test(href) ? 'mn-join' : undefined} href={href} data-t={k}>{t(k)}</a>)}
      </div>}
    </nav>
  );
}

/* "All artists": next to "City" in the top bar and the phone menu, on every page (it goes to the search + filter row of the home page) */
const withAll = list => list.flatMap(([href, k]) => /#city$/.test(href) ? [[href, k], [href.replace(/#city$/, '#all-artists'), 'nav_all']] : [[href, k]]);

/* the menus the old pages used */
export const MENU_FULL = [['index.html#city', 'nav_city'], ['index.html#manifesto', 'foot_manifesto'], ['index.html#how', 'foot_how'], ['index.html#featured', 'foot_feat'], ['index.html#map', 'foot_map'], ['join.html', 'foot_join']];
