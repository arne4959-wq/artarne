/* City.jsx — the City section: heading, the buildings-or-map switch, the filter bar and its follow-me note, the strip, the progress bar and the map.
   From index.html + site.js (renderMap, syncFilter, setView, mapFromHash). The filter lights buildings and districts; the strip scrolls to the first match. */
import {useEffect, useMemo, useRef, useState} from 'react';
import {useLang} from '../../lib/i18n.jsx';
import {reduce} from '../../lib/env.js';
import {mapSpans, planOf} from '../../lib/cityPlan.js';
import {noLabel, openStudio} from '../../lib/home.js';
import Strip, {scrollCity} from './Strip.jsx';

const PLAZA = '<circle cx="60" cy="40" r="34"/><circle cx="60" cy="40" r="22"/><circle cx="60" cy="40" r="8"/><path d="M60,4 V76 M24,40 H96"/>';

export default function City({artists}) {
  const L = useLang(), {t, nameL, discL, cityL} = L;
  const [view, setView] = useState('city'), [d, setD] = useState(''), [qRaw, setQRaw] = useState('');
  const q = qRaw.trim().toLowerCase(), act = !!(d || q);   // search by name, discipline or city, together with the discipline filter
  const slide = useRef(false);   // true when the visitor chose the filter: then the strip slides to the first match
  const wave = d === '*wave';
  const hit = a => (!d || (wave ? !!a.wave : a.disc === d)) && (!q || [a.name, a.nameEn, a.nameLo, a.disc, discL(a), a.city, cityL(a)].some(x => x && String(x).toLowerCase().includes(q)));
  const matches = act ? artists.filter(hit) : [], n = matches.length, only = n === 1 ? matches[0] : null;
  const filters = useMemo(() => [['', t('f_all')], ...(artists.some(a => a.wave) ? [['*wave', t('f_wave')]] : []), ...[...new Map(artists.map(a => [a.disc, discL(a)]))]], [artists, L.lang]);   // eslint-disable-line react-hooks/exhaustive-deps
  const top = filters.filter(f => f[0] === '' || f[0] === '*wave'), rest = filters.filter(f => f[0] !== '' && f[0] !== '*wave'), disc = !!d && d !== '*wave';   // "All" and "New wave" stay in sight; the disciplines open from the "Art form" button, which also says which one is on
  const chip = ([v, label]) => <button key={v} type="button" className={'fbtn' + (v === d ? ' on' : '')} data-d={v} aria-pressed={v === d}>{label}</button>;
  const [panel, setPanel] = useState(false), tog = useRef(null);
  const closePanel = () => { setPanel(false); tog.current?.focus({preventScroll: true}); };
  const setFilter = v => { slide.current = true; setD(v); };

  const firstRun = useRef(true);
  useEffect(() => {   // light the matching buildings, dim the rest; slide the strip to the first match
    if (firstRun.current) { firstRun.current = false; return; }   // nothing is filtered yet: the old page did not touch the buildings at start either
    const strip = document.getElementById('strip');
    let first = null;
    document.querySelectorAll('#strip-in .bd').forEach((bd, i) => {
      const h = hit(artists[i]);
      bd.style.transitionDelay = '0s';
      bd.classList.toggle('lit', act && h); bd.classList.toggle('dim', act && !h);
      if (act && h && !first) first = bd;
    });
    if (slide.current && first) strip.scrollTo({left: Math.max(0, first.offsetLeft - 80), behavior: reduce ? 'auto' : 'smooth'});
    slide.current = false;
  }, [d, q, artists]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {   // "#map" in the address (or a link to it anywhere) opens the map view of this section
    const fromHash = () => {
      if (location.hash !== '#map') return;
      setView('map');
      const go = () => { const el = document.querySelector('.city-tools'); if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY - 96); };
      requestAnimationFrame(go); addEventListener('load', () => setTimeout(go, 50), {once: true});
    };
    const click = e => { const a = e.target.closest && e.target.closest('a[href="#map"]'); if (a) setView('map'); };
    fromHash(); addEventListener('hashchange', fromHash); document.addEventListener('click', click, true);
    return () => { removeEventListener('hashchange', fromHash); document.removeEventListener('click', click, true); };
  }, []);

  const map = view === 'map', total = artists.length, Ls = mapSpans(total);
  return <section className="city" id="city">
    <div className="city-head reveal">
      <h2><i>The</i><br/><b data-t="city_h">{t('city_h')}</b></h2>
      <p data-t="city_p">{t('city_p')}</p>
      <div className="pager" hidden={map}><button onClick={() => scrollCity(-1)} aria-label={t('pager_l')}>←</button><button onClick={() => scrollCity(1)} aria-label={t('pager_r')}>→</button></div>
    </div>
    <div className="city-tools reveal" id="all-artists">
      <div className="vtog" id="vtog" role="group" aria-label={t('v_aria')}>
        {[['city', 'v_city'], ['map', 'v_map']].map(([v, k]) => <button key={v} type="button" className={'vt' + (view === v ? ' on' : '')} data-v={v} aria-pressed={view === v} data-t={k} onClick={() => setView(v)}>{t(k)}</button>)}
      </div>
      <input type="search" className="city-search" id="city-q" value={qRaw} onChange={e => { slide.current = true; setQRaw(e.target.value); }} onKeyDown={e => { if (e.key === 'Escape') setQRaw(''); }}
        placeholder={t('search_ph')} aria-label={t('search_aria')} maxLength={40} autoComplete="off" enterKeyHint="search"/>
      <div className="filters" id="filters" role="group" aria-label={t('filters_aria')}
        onClick={e => { const b = e.target.closest('.fbtn[data-d]'); if (!b) return; setFilter(b.dataset.d); if (b.closest('#fpanel')) closePanel(); }}   /* picked one from the panel: it gets out of the way */
        onKeyDown={e => { if (e.key === 'Escape' && panel) closePanel(); }}>
        {top.map(chip)}
        <button type="button" ref={tog} className={'fbtn ftog' + (disc ? ' on' : '')} id="ftog" aria-expanded={panel} aria-controls="fpanel" onClick={() => panel ? closePanel() : setPanel(true)}>
          <span className="ft-l">{disc ? `${t('f_branch')}: ${discL(artists.find(a => a.disc === d))}` : t('f_branch')}</span><span className="ft-a" aria-hidden="true">{panel ? '▴' : '▾'}</span></button>
        <div className="fpanel" id="fpanel" hidden={!panel}>{rest.map(chip)}</div>
      </div>
      <div className={'fnote' + (act ? '' : ' off')} id="fnote" role="status" inert={!act}>
        <span id="fnote-t">{act ? (!n ? t('fnote_q0') : q ? t('fnote_q', {n}) : wave ? t('fnote_wave', {n}) : t('fnote', {n, d: discL(artists.find(a => a.disc === d))})) : ''}</span>
        <a href="#strip" data-t="fnote_go">{t('fnote_go')}</a>
        <a id="fnote-in" href={only ? `studio-${only.id}.html` : '#'} hidden={!only} data-id={only ? only.id : undefined} data-t="fnote_in" onClick={e => { e.preventDefault(); if (only) openStudio(only.id, null, reduce); }}>{t('fnote_in')}</a>
        <button type="button" id="fnote-x" data-t="fnote_x" onClick={() => { setQRaw(''); setFilter(''); }}>{t('fnote_x')}</button>
      </div>
    </div>
    <Strip artists={artists} hidden={map}/>
    <div className="progress" id="progress" aria-hidden="true" hidden={map}><i id="progress-i"></i></div>
    <div className="map-view" id="map" hidden={!map}>
      <div className={'map' + (act ? ' f' : '')} id="map-grid" onClick={e => { const b = e.target.closest('.dist'); if (b) openStudio(b.dataset.id, null, reduce); }}>   {/* a district on the map = that artist's building */}
        {artists.map((a, i) => <button key={a.id} className={`dist d${i % 6}${i === 0 || (i === total - 1 && total % 2 === 0) ? ' wide' : ''}${act && hit(a) ? ' on' : ''}`} style={{gridColumn: `span ${Ls.s[i]}`}}
          data-id={a.id} data-d={a.disc} data-w={a.wave ? 1 : 0} data-cur="ENTER"><span className="dn">{`${noLabel(i)} · ${t('district')}`}</span><span className="dd">{discL(a)}</span><span className="da">{`${nameL(a)} · ${cityL(a)}`}</span>
          <svg viewBox="0 0 120 80" aria-hidden="true" dangerouslySetInnerHTML={{__html: planOf(a.kind)}}/></button>)}
        {Ls.p ? <div className="plaza" style={{gridColumn: `span ${Ls.p}`}} aria-hidden="true"><span>{t('plaza')}</span><svg viewBox="0 0 120 80" dangerouslySetInnerHTML={{__html: PLAZA}}/></div> : null}
        <div className="compass" aria-hidden="true">N ↑</div>
      </div>
    </div>
  </section>;
}
