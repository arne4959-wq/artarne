/* profile.html / profile-<id>.html — the artist profile (the picture hall is studio-<id>.html). From profile.js + profile.html.
   Look: design/profile-reference.html. Optional artists.js fields (tagline, concept, since, timeline[], instagram): an empty one hides its whole slot.
   Donation-only: no prices, no sold state; the support box has preset amounts and a custom one, and opens the donation dialog. */
import {useRef, useState} from 'react';
import {CONFIG} from 'virtual:circles/config';
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import {artistById} from '../lib/art.js';
import {DON_AMOUNTS, MAX_AMOUNT, canDonate, sampleMode, validAmount} from '../lib/donate.js';
import PageShell from '../components/PageShell.jsx';
import Nav, {MENU_FULL} from '../components/Nav.jsx';
import {MiniFoot, NotFoundSection} from '../components/Bits.jsx';
import {useDialogs} from '../components/Dialogs.jsx';
import {Fab, SkipLink} from '../components/Ux.jsx';
import sprite from 'virtual:circles/sprite/profile';
import styles from '../styles/profile.js';

const https = u => { try { const x = new URL(u); return x.protocol === 'https:' && x.hostname.includes('.'); } catch (e) { return false; } };
const chars = s => 'Segmenter' in Intl ? Array.from(new Intl.Segmenter(undefined, {granularity: 'grapheme'}).segment(s), x => x.segment) : Array.from(s);
const TAPE = ['pink', 'gold'];
const LOGOS = [   // left%, top%, size px, opacity, start angle, seconds per turn, direction, drift px
  [3, 3, 170, .28, -12, 12, 'turn', 30], [88, 2, 120, .22, 18, 18, 'turnr', -24], [92, 26, 200, .26, -6, 9, 'turn', -30], [2, 40, 230, .24, 10, 22, 'turnr', 26],
  [86, 62, 150, .28, 22, 14, 'turn', -20], [6, 80, 110, .24, -20, 10, 'turnr', 22], [46, 92, 190, .2, 4, 26, 'turn', 24]];

function stats(A) {
  return [[A.pieces.length, 'pf_nw', 'ink', -3], [+A.since > 0 ? A.since : 0, 'pf_ny', 'gold', -1.5]].filter(s => s[0] > 0);
}

async function copy(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) {}
  try {   // old browsers / non-secure pages: select a throw-away field and copy
    const ta = document.createElement('textarea'); ta.value = text; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:-9999px;top:0';
    document.body.appendChild(ta); ta.select(); const ok = document.execCommand('copy'); ta.remove(); return ok;
  } catch (e) { return false; }
}

function ProfileBody({A}) {
  const L = useLang(), {t} = L, {openDonate} = useDialogs(), live = useRef(null), timers = useRef({}), [custom, setCustom] = useState(''), [badAmt, setBadAmt] = useState(false);
  const name = L.nameL(A);
  const tagline = L.pk(A, 'tagline'), bio = L.pk(A, 'bio'), concept = L.pk(A, 'concept');
  const tl = Array.isArray(A.timeline) ? A.timeline.filter(x => x && x.y && (x.t || x.tEn)) : [];
  const ig = A.instagram && https(A.instagram) ? A.instagram : '';
  const can = canDonate(A), smp = sampleMode(A);
  const url = () => new URL(`profile-${A.id}.html`, location.href).href;
  // the status line is emptied first, so a screen reader announces the same message twice in a row
  const say = m => {
    const el = live.current; el.textContent = ''; setTimeout(() => { el.textContent = m; }, 30);
    clearTimeout(timers.current.say); timers.current.say = setTimeout(() => { el.textContent = ''; }, 3000);
  };
  const copyLink = async () => { const ok = await copy(url()); say(t(ok ? 'pf_copied' : 'copy_fail')); };
  const share = async () => {
    if (navigator.share) { try { await navigator.share({title: document.title, url: url()}); } catch (err) { /* cancelled */ } return; }
    copyLink();
  };
  return <section className="pf" id="pf" aria-labelledby="pf-name">
    <div className="pf-bg" aria-hidden="true">{['a', 'b', 'c', 'd'].map((c, i) => <i key={c} className={`pf-ring pf-ring-${c}`} style={{'--pf-d': i * 1.6 + 's'}}/>)}<i className="pf-star"></i><i className="pf-dotb"></i>
      {LOGOS.map((l, i) => <i key={i} className="pf-lg" style={{left: l[0] + '%', top: l[1] + '%', width: l[2] + 'px', height: l[2] + 'px', '--o': l[3], '--a': l[4] + 'deg', '--t': l[5] + 's', '--sp': 'pf-' + l[6], '--dx': l[7] + 'px'}}/>)}</div>
    <div className="pf-in-wrap">
      <div className="pf-port pf-in pf-pop" style={{'--r': '0deg', '--pf-d': '.1s'}} aria-hidden="true"><span className="pf-pic">{chars(name)[0] || ''}</span><span className="pf-tp pf-tp-gold pf-tp-top"></span></div>
      <h2 className="pf-name" id="pf-name"><span className="pf-sr">{name}</span>{chars(name).map((c, i) =>
        <span key={i} className={`pf-ltr pf-in pf-drop pf-l${i % 3}`} style={{'--r': [-3, 2, -1.5, 2.5][i % 4] + 'deg', '--pf-d': (.5 + i * .14).toFixed(2) + 's'}} aria-hidden="true">{c}</span>)}</h2>
      <ul className="pf-tags" aria-label={t('lb_artist')}>{[[L.discL(A), 'paper', -2], [L.cityL(A), 'gold', 1.5]].filter(x => x[0]).map((x, i) =>
        <li key={i} className={`pf-tag pf-in pf-pop pf-t-${x[1]}`} style={{'--r': x[2] + 'deg', '--pf-d': (1 + i * .1) + 's'}}>{x[0]}</li>)}</ul>
      {tagline || bio ? <div className="pf-note pf-in pf-rise" style={{'--r': '-.8deg', '--pf-d': '1.3s'}}><i className="pf-tp pf-tp-pink pf-tp-l"></i><i className="pf-tp pf-tp-pink pf-tp-r"></i>{tagline ? <p className="pf-tag1">“{tagline}”</p> : null}{bio ? <p className="pf-bio">{bio}</p> : null}</div> : null}
      {concept ? <div className="pf-cc pf-in pf-rise" style={{'--r': '.8deg', '--pf-d': '1.6s'}}><span className="pf-cv" aria-hidden="true">CONCEPT</span><div><small>{t('pf_cn', {a: name})}</small><p>{concept}</p></div><i className="pf-tp pf-tp-gold pf-tp-c"></i></div> : null}
      <ul className="pf-stats">{stats(A).map((s, i) => <li key={s[1]} className={`pf-st pf-st-${s[2]} pf-in pf-pop`} style={{'--r': s[3] + 'deg', '--pf-d': (1.6 + i * .08).toFixed(2) + 's'}}><b>{s[0]}</b><span>{t(s[1])}</span></li>)}</ul>
      {tl.length ? <ol className="pf-tl pf-in pf-rise" style={{'--r': '0deg', '--pf-d': '1.9s'}} aria-label={t('pf_tl')}>{tl.map((x, i) => <li key={i}><b>{x.y}</b><span>{L.pk(x, 't')}</span></li>)}</ol> : null}
      <div className="pf-works">
        <div className="pf-wh"><h3 className="bl bl-y"><span className="bl-t">{t('pf_wh')}</span></h3><span className="pf-hv">{t('pf_hover')}</span></div>
        <ul className="pf-strip">{A.pieces.slice(0, 4).map((p, k) => {
          return <li key={k} className="pf-in pf-rise" style={{'--r': [-3, 2, -1.5, 3][k] + 'deg', '--pf-d': (1.9 + k * .12).toFixed(2) + 's'}}><a className="pf-pk" href={`studio-${A.id}.html?work=${k}`} style={{'--ar': p.ar || '1/1'}} aria-label={L.titleL(p) + ' · ' + p.y}>
            <span className={`pf-tp pf-tp-${TAPE[(k + 1) % 2]}`}></span>{p.img ? <img src={p.img} alt={L.titleL(p)} loading="lazy" decoding="async" draggable="false"/> : null}
            <span className="pf-cap"><b>{L.titleL(p)}</b><span className="pf-cp">{p.y}</span></span></a></li>;
        })}</ul>
        <a className="pf-all" href={`studio-${A.id}.html`}>{t('pf_all')}</a>
      </div>
      <div className="pf-sup pf-in pf-pop" style={{'--r': '-1deg', '--pf-d': '2.6s'}}><div className="pf-sbox">
        <span className="pf-heart" aria-hidden="true">♥</span>
        <div className="pf-stx"><h3 className="bl bl-y bl-dk"><span className="bl-t">{t('pf_sup1', {a: name})} {t('pf_sup2')}</span></h3><p>{t('pf_supn')}</p></div>
        <div className="pf-sb">{can
          ? <button type="button" className="pf-sbtn" onClick={() => openDonate(A)}>{t('pf_supb', {a: name})}</button>
          : <><button type="button" className="pf-sbtn" disabled aria-disabled="true">{t('pf_supb', {a: name})}</button><span className="pf-soon" aria-hidden="true">{t('pf_soon')}</span></>}</div></div><i className="pf-tp pf-tp-gold pf-tp-s"></i>
        {can && <div className="pf-tips" id="pf-tips" role="group" aria-labelledby="pf-tips-h">
          <p className="pf-tips-h" id="pf-tips-h">{t('tip_h')}{smp && <> <span className="pf-tips-s">{t('sm_tag')}</span></>}</p>
          <div className="pf-tips-r">{DON_AMOUNTS.map(n => <button key={n} type="button" className="pf-amt" data-pf-tip={n} aria-label={t('pf_supb', {a: name}) + ' ' + L.money(n)} onClick={() => openDonate(A, n)}>{L.money(n)}</button>)}</div>
          <form className="pf-tipf" noValidate onSubmit={e => { e.preventDefault(); if (!validAmount(custom)) { setBadAmt(true); return; } setBadAmt(false); openDonate(A, +custom); }}>
            <label htmlFor="pf-tip-n">{t('tip_other')}</label>
            <input id="pf-tip-n" name="n" type="number" inputMode="numeric" min="1" max={MAX_AMOUNT} step="1" placeholder="12" value={custom} aria-invalid={badAmt || undefined} onChange={e => { setCustom(e.target.value); setBadAmt(false); }}/>
            <button type="submit" className="pf-bt">{t('tip_go')}</button></form>
          {badAmt && <p className="pf-tiperr" role="alert">{t('tip_bad')}</p>}</div>}</div>
      <div className="pf-cta pf-in pf-rise" style={{'--r': '0deg', '--pf-d': '2.2s'}}>
        <a className="pf-go bl bl-y bl-dk" href={`studio-${A.id}.html`}><span className="bl-t">{t('pf_walk')}</span></a>
        {ig ? <a className="pf-lk" href={ig} target="_blank" rel="noopener">{t('pf_ig')}</a> : null}
        <button type="button" className="pf-bt pf-bt-gold" data-pf-share="" onClick={share}>{t('pf_share')}</button>
        <button type="button" className="pf-bt" data-pf-copy="" onClick={copyLink}>{t('pf_copy')}</button>
        <span className="pf-live" role="status" aria-live="polite" ref={live}></span>
      </div>
    </div></section>;
}

export default function Profile({id}) {
  const L = useLang(), {t, lang} = L, A = artistById(id || 'napha');
  usePageMeta(...(A ? [t('title_pf', {a: L.nameL(A)}), t('desc_pf', {a: L.nameL(A), d: L.discL(A)})] : [t('nf_h') + ' — circles', t('nf_p')]));
  const built = /\/profile-[a-z0-9-]+\.html$/i.test(location.pathname) && A ? {'data-pre': '1', 'data-profile': A.id} : {};
  // key: a language change rebuilds the profile (its entrance animation plays again), like the old render() did
  return <PageShell styles={styles} sprite={sprite} lead={<SkipLink/>}>
    <Nav links={[['index.html#city', 'nav_city'], ['index.html#manifesto', 'nav_about']]} join menu={MENU_FULL}/>
    <main id="main" tabIndex={-1} {...built}>{A ? <>
      <div className="pf-marq" aria-hidden="true" key={'m' + lang}><div className="pf-marq-t">{t('pf_marq').repeat(10)}</div></div>
      <ProfileBody key={lang} A={A}/></> : <NotFoundSection/>}</main>
    <MiniFoot/>
    {A && <Fab A={A}/>}
  </PageShell>;
}
