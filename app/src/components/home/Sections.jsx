/* Sections.jsx — everything under the city on the home page: manifesto, the loop, how it works, featured works, spotlight, numbers,
   the join band, support, the footer with the newsletter. From index.html and site.js; the DOM is what the old script left on the page. */
import {useEffect, useMemo, useRef, useState} from 'react';
import {CONFIG} from 'virtual:circles/config';
import {useLang} from '../../lib/i18n.jsx';
import {useMt} from '../../lib/manageStrings.js';
import {reduce} from '../../lib/env.js';
import {artBg, workStatus} from '../../lib/art.js';
import {worksList, allWorks, TAPE, noLabel, openStudio, spotlightOf} from '../../lib/home.js';
import {CY_RING, ROOMS_SVG} from '../../lib/homeSvg.js';
import {subscribeNews} from '../../lib/forms.js';
import {Ransom, ArtImg, Stamp, StatusChip} from '../art.jsx';
import {useDialogs} from '../Dialogs.jsx';
import {useToast} from '../Toast.jsx';

export const TapeWrap = ({r}) => <div className={'tape-wrap' + (r ? ' r' : '')} aria-hidden="true"><div className="tape-bar"></div></div>;

export function Manifesto() {
  const {t} = useLang();
  return <section className="sec mani" id="manifesto">
    <div className="sec-k reveal">Manifesto</div>
    <div className="mani-lines" role="heading" aria-level={2} aria-label={t('mani_aria')}>
      {[0, 3, 5, 2].map((s, i) => <Ransom key={i} as="div" className="rn reveal" aria-hidden="true" data-k={`mani${i + 1}`} data-s={s} style={{'--i': i}} text={t(`mani${i + 1}`)} seed={s} wrap/>)}
    </div>
    <p className="mani-note reveal" style={{'--i': 4}} data-t="mani_note">{t('mani_note')}</p>
  </section>;
}

export function Cycle() {
  const {t} = useLang();
  return <section className="sec cy" id="cycle" aria-labelledby="cy-h">
    <div>
      <div className="sec-k reveal">The loop</div>
      <h2 className="sec-t reveal" id="cy-h"><span data-t="cy_h">{t('cy_h')}</span></h2>
      <p className="sec-p reveal" style={{'--i': 1}} data-t="cy_p">{t('cy_p')}</p>
    </div>
    <div className="cy-fig reveal" style={{'--i': 2}}>
      <svg className="cy-ring" viewBox="0 0 100 100" aria-hidden="true" dangerouslySetInnerHTML={{__html: CY_RING}}/>
      <span className="cy-orbit" aria-hidden="true"></span>
      <ol className="cy-steps" aria-label={t('cy_aria')}>{[1, 2, 3, 4].map(n => <li key={n}><b>{n}</b><span data-t={`cy_${n}`}>{t(`cy_${n}`)}</span></li>)}</ol>
    </div>
  </section>;
}

const ROOM_META = [['FL.01 — ROOM A', '01', '4.00 M'], ['FL.02 — ROOM B', '02', '6.00 M'], ['FL.03 — ROOM C', '03', '5.00 M']];
export function How() {
  const {t} = useLang();
  return <section className="sec bp" id="how">
    <div className="sec-k reveal">How it works</div>
    <h2 className="sec-t reveal"><span data-t="how_h">{t('how_h')}</span></h2>
    <div className="bp-grid">
      {ROOM_META.map(([no, n, dim], i) => <article key={n} className="room reveal" style={{'--i': i}}>
        <span className="room-no">{no}</span>
        <svg viewBox="0 0 200 92" aria-hidden="true" dangerouslySetInnerHTML={{__html: ROOMS_SVG[i]}}/>
        <div className="room-n">{n}</div><h3 data-t={`s${i + 1}_h`}>{t(`s${i + 1}_h`)}</h3>
        <p data-t={`s${i + 1}_p`}>{t(`s${i + 1}_p`)}</p>
        <span className="room-dim">{dim}</span>
      </article>)}
    </div>
  </section>;
}

/* featured works: sorted, "show all", the cards. A new key per action makes the cards start over, like the old innerHTML did. */
export function Featured({artists}) {
  const L = useLang(), {t, nameL, discL, titleL, money, moneyHtml, lang} = L;
  const [showAll, setShowAll] = useState(false), [sortBy, setSortBy] = useState('cur'), [mode, setMode] = useState('init'), [round, setRound] = useState(0), first = useRef(true);
  useEffect(() => { if (first.current) { first.current = false; return; } setMode('still'); setRound(r => r + 1); }, [lang]);   // a language switch: no animation
  const list = useMemo(() => worksList(artists, {showAll, sortBy}), [artists, showAll, sortBy]), total = useMemo(() => allWorks(artists).length, [artists]);
  const pop = () => { setMode('pop'); setRound(r => r + 1); };
  return <section className="sec feat" id="featured">
    <span className="stk" aria-hidden="true">NEW EVERY WEEK ★</span>
    <div className="sec-k reveal">This week</div>
    <h2 className="sec-t reveal"><span id="feat-h">{t(showAll ? 'feat_h_all' : 'feat_h')}</span></h2>
    <div className="feat-bar reveal">
      <label className="sortl"><span data-t="sort_label">{t('sort_label')}</span>
        <select id="sort" value={sortBy} onChange={e => { setSortBy(e.target.value); pop(); }}>
          {[['cur', 'sort_cur'], ['low', 'sort_low'], ['high', 'sort_high'], ['new', 'sort_new']].map(([v, k]) => <option key={v} value={v} data-t={k}>{t(k)}</option>)}
        </select></label>
      <button type="button" className="fbtn" id="all-btn" aria-pressed={showAll} onClick={() => { setShowAll(v => !v); pop(); }}>{showAll ? t('less_btn') : t('all_btn', {n: total})}</button>
      <span className="feat-count" id="feat-count" role="status">{t('feat_count', {n: list.length})}</span>
    </div>
    <div className="masonry" id="masonry">
      {list.map(({a, p, k}, n) => <div key={`${round}:${a.id}:${k}`} className={mode === 'pop' ? 'mi pop' : mode === 'still' ? 'mi reveal in' : 'mi reveal'} style={{'--i': mode === 'init' ? n % 3 : n}}>
        <a className="card" href={`studio-${a.id}.html?work=${k}`} draggable="false" data-id={a.id} data-k={k} data-cur="VIEW" aria-label={t('card_aria', {t: titleL(p), a: nameL(a), p: money(p.p, p)})}
          onClick={e => { if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return; e.preventDefault(); openStudio(a.id, k, reduce); }}>
          <i className="tape" style={{'--tr': TAPE[n % TAPE.length] + 'deg'}}></i>
          <span className="art" style={{'--ar': p.ar, '--art': artBg(a.works, k)}}><ArtImg a={a} k={k}/><Stamp p={p}/></span>
          <span className="plate"><span className="pn">{titleL(p)}</span><span className="pa">{`${nameL(a)} · ${discL(a)}`}</span>
            <span className={'pp' + (workStatus(p) ? ' strike' : '')} dangerouslySetInnerHTML={{__html: moneyHtml(p.p, p)}}/><StatusChip p={p}/></span>
        </a></div>)}
    </div>
  </section>;
}

/* the spotlight: the first artist of the city and their first work. The three-question interview is the sample artist Napha's; a real
   artist shows their own tagline, concept and bio in the same frame. */
export function Spotlight({artists}) {
  const L = useLang(), {t, pk, nameL, discL, cityL, titleL, moneyHtml} = L, mt = useMt();
  const N = spotlightOf(artists); if (!N) return null;
  const idx = artists.indexOf(N), p = N.pieces[0], isNapha = N.id === 'napha';
  const meta = t('spot_meta', {d: discL(N), y: N.since, c: cityL(N)}).replace('NO.01', noLabel(idx));
  const lines = [pk(N, 'tagline'), pk(N, 'concept')].filter(Boolean), bio = pk(N, 'bio');
  return <section className="sec spot" id="spotlight">
    <div className="chk" aria-hidden="true"></div>
    <div className="sec-k reveal">Spotlight</div>
    <h2 className="sec-t reveal"><i data-t="spot_i">{t('spot_i')}</i><br/>{isNapha ? <span data-t="spot_h">{t('spot_h')}</span> : <span>{nameL(N)}</span>}</h2>
    <div className="spot-g">
      <figure className="afr concrete reveal"><div className="afr-in" id="afr-in" style={{'--art': artBg(N.works, 0)}}>
        <img id="afr-img" alt={titleL(p)} decoding="async" src={p.img || undefined}/>
        <figcaption id="afr-cap" dangerouslySetInnerHTML={{__html: `<b>${esc(titleL(p))}</b><span>${esc(nameL(N))} · ${p.y} · ${moneyHtml(p.p, p)}</span>`}}/>
      </div></figure>
      <div className="spot-qa">
        <div className="spot-meta reveal" id="spot-meta">{meta}</div>
        {isNapha ? <details className="fold fold-spot"><summary><span data-t="fold_spot">{t('fold_spot')}</span></summary><div className="fold-body">
          {[1, 2, 3].map(n => <div key={n} className="qa reveal" style={{'--i': n}}><div className="q" data-t={`q${n}`}>{t(`q${n}`)}</div><p className="a" data-t={`a${n}`}>{t(`a${n}`)}</p></div>)}
        </div></details>
          : (lines.length || bio) ? <div className="qa reveal" style={{'--i': 1}}>{lines.map((x, i) => <div key={i} className="q">{x}</div>)}{bio && <p className="a">{bio}</p>}</div> : null}
        <button type="button" className="btn pk reveal" style={{'--i': 4}} onClick={() => openStudio(N.id, null, reduce)} {...(isNapha ? {'data-t': 'spot_cta'} : {})}>{isNapha ? t('spot_cta') : mt('sp_cta', {a: nameL(N)})}</button>
      </div>
    </div>
  </section>;
}
const esc = s => String(s).replace(/[&<>"']/g, c => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'}[c]));

export function Stats({artists}) {
  const {t} = useLang();
  const nA = artists.length, nW = artists.reduce((n, a) => n + a.pieces.length, 0), nD = new Set(artists.map(a => a.disc)).size;
  return <section className="stats" id="stats" aria-label={t('stats_aria')}><div className="stats-g">
    <div className="st reveal" style={{'--i': 0}}><b id="c-art" data-count={nA}>0</b><span data-t="st1">{t('st1')}</span></div>
    <div className="st reveal" style={{'--i': 1}}><b id="c-work" data-count={nW}>0</b><span data-t="st2">{t('st2')}</span></div>
    <div className="st reveal" style={{'--i': 2}}><b id="c-disc" data-count={nD}>0</b><span data-t="st3">{t('st3')}</span></div>
    <div className="st reveal" style={{'--i': 3}}><b data-count="100" data-suf="%">0</b><span data-t="st4">{t('st4')}</span></div>
  </div></section>;
}

export function JoinBand() {
  const {t} = useLang();
  return <section className="sec join-band" id="join">
    <div><div className="sec-k reveal" data-t="jn_kick">{t('jn_kick')}</div>
      <h2 className="sec-t reveal"><span data-t="join_h">{t('join_h')}</span></h2>
      <p className="jb-p" data-t="jb_p">{t('jb_p')}</p></div>
    <a className="btn" href="join.html" data-t="jb_btn">{t('jb_btn')}</a>
  </section>;
}

/* the Support button is a real link only when CONFIG.donate is an https:// address, otherwise a disabled "Coming soon" (never a dead link) */
export function Support() {
  const {t} = useLang(), {openSupport} = useDialogs(), qr = !!(CONFIG.support && (CONFIG.support.qr || CONFIG.support.no));
  let ok = false; try { ok = new URL(CONFIG.donate).protocol === 'https:'; } catch (e) {}
  return <section className="sec sup" id="support">
    <div>
      <div className="sec-k reveal">Support</div>
      <h2 className="sec-t reveal"><span data-t="sup_h">{t('sup_h')}</span></h2>
      <p className="sec-p reveal" data-t="sup_p">{t('sup_p')}</p>
      {qr ? <button type="button" className="btn pk" id="donate-btn" onClick={() => openSupport(CONFIG.support, 'Circles')} data-t="don_btn">{t('don_btn')}</button>
        : ok ? <a className="btn pk" id="donate-btn" href={CONFIG.donate} target="_blank" rel="noopener" data-t="don_btn">{t('don_btn')}</a>
        : <button type="button" className="btn pk soon" id="donate-btn" disabled data-t="don_soon">{t('don_soon')}</button>}
    </div>
    <div className="sup-w reveal" style={{'--i': 1}}>
      <h3 data-t="sup_where">{t('sup_where')}</h3>
      <ul>{[1, 2, 3].map(n => <li key={n}><span data-t={`sup_r${n}`}>{t(`sup_r${n}`)}</span><b className="sup-v">[__]%</b><i className="sup-bar" aria-hidden="true"></i></li>)}</ul>
      <p className="sup-note" data-t="sup_note">{t('sup_note')}</p>
    </div>
  </section>;
}

export function Footer() {
  const {t} = useLang(), {openJoin} = useDialogs(), toast = useToast(), [busy, setBusy] = useState(false);
  const soon = e => { e.preventDefault(); toast(t('social_soon')); };
  const menu = [['#city', 'nav_city'], ['#manifesto', 'foot_manifesto'], ['#how', 'foot_how'], ['#featured', 'foot_feat'], ['#map', 'foot_map'], ['join.html', 'foot_join']];
  return <footer className="foot reveal">
    <h3 data-t-html="foot_h" dangerouslySetInnerHTML={{__html: t('foot_h')}}/>
    <p data-t="foot_p">{t('foot_p')}</p>
    <button type="button" className="btn" onClick={() => openJoin()} data-t="foot_btn">{t('foot_btn')}</button>
    <details className="fold fold-foot"><summary><span data-t="fold_foot">{t('fold_foot')}</span></summary>
      <div className="foot-more">
        <div><h4 data-t="foot_menu">{t('foot_menu')}</h4><ul>{menu.map(([h, k]) => <li key={k}><a href={h} data-t={k}>{t(k)}</a></li>)}</ul></div>
        <div><h4 data-t="foot_social">{t('foot_social')}</h4><ul>
          <li><a href="#" onClick={soon}>Instagram · @circles.city</a></li><li><a href="#" onClick={soon}>X · @circles_city</a></li><li><a href="#" onClick={soon}>YouTube · circles city</a></li></ul></div>
        <form className="news" onSubmit={async e => { e.preventDefault(); const f = e.currentTarget; setBusy(true); try { const k = await subscribeNews(f); if (k) toast(t(k)); } finally { setBusy(false); } }}>
          <label htmlFor="news-em" data-t="news_label">{t('news_label')}</label>
          <label className="hp" aria-hidden="true">Website<input className="hp-n" name="website" tabIndex={-1} autoComplete="off"/></label>
          <div className="news-r"><input id="news-em" type="email" required placeholder="you@example.com" autoComplete="email"/><button className="btn" type="submit" data-t="news_btn" disabled={busy}>{t('news_btn')}</button></div>
          <small className="news-c" data-t-html="news_consent" dangerouslySetInnerHTML={{__html: t('news_consent')}}/>
        </form>
      </div></details>
    <div className="foot-c"><span data-t="foot_copy">{t('foot_copy')}</span>{' · '}<a href="privacy.html" data-t="legal_privacy">{t('legal_privacy')}</a>{' · '}<a href="terms.html" data-t="legal_terms">{t('legal_terms')}</a></div>
  </footer>;
}
