/* highlights.html — the weekly highlights. SAMPLE data (lib/places.js). Ranking: "Resonated" taps, views break ties, donation amounts never count.
   Works (1-3 as towers, 4-6 on a lobby board), concepts (the artists' own words), one new artist to watch. Same page as highlights.js. */
import {useState} from 'react';
import {ARTISTS} from '../lib/art.js';
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import {resCount, sampleViews, NEW_SAMPLE, chars} from '../lib/places.js';
import PageShell from '../components/PageShell.jsx';
import Nav from '../components/Nav.jsx';
import {MiniFoot} from '../components/Bits.jsx';
import {Dist, ScLink} from '../components/Dist.jsx';
import {SkipLink} from '../components/Ux.jsx';
import sprite from 'virtual:circles/sprite/highlights';
import styles from '../styles/places.js';

const BG = ['#C4958A', '#E8B730', '#D4CFCA'];
const LINKS = [['index.html#city', 'nav_city'], ['highlights.html', 'nav_hi'], ['legends.html', 'nav_lg']];

function Works({L, rows}) {
  const {t} = L, list = rows.slice(0, 6), nf = n => n.toLocaleString(L.lang === 'th' ? 'th-TH' : L.lang === 'lo' ? 'lo-LA' : 'en-US');
  const href = x => `studio-${x.a.id}.html?work=${x.k}`;
  return <>
    <div className="pl-podium">{[1, 0, 2].map(k => { const x = list[k], r = k + 1; return <div className="pl-pc" key={k}>
      <a className={`pl-twr pl-r${r}`} href={href(x)} aria-label={t('hi_open', {n: r, t: L.titleL(x.p), a: L.nameL(x.a)})}>
        <span className="pl-bb" style={{aspectRatio: x.p.ar}}><img src={x.p.img} alt="" loading="lazy" decoding="async"/></span><span className="pl-legs" aria-hidden="true"/>
        <span className="pl-tb" aria-hidden="true"><b className="pl-rk">0{r}</b></span></a></div>; })}</div>
    <div className="pl-caps" aria-hidden="true">{[1, 0, 2].map(k => { const x = list[k]; return <p className="pl-cap" key={k}><b>{L.titleL(x.p)}</b><span>{t('hi_by', {a: L.nameL(x.a)})}</span><span className="pl-ct">{t('hi_res', {n: nf(x.res)})} · {t('hi_views', {n: nf(x.views)})}</span></p>; })}</div>
    <div className="pl-dir"><p className="pl-dir-h">{t('hi_dir')}</p><ol>{list.slice(3, 6).map((x, j) => <li key={j}><a href={href(x)}><span className="pl-n">0{j + 4}</span>
      <span className="pl-tt">{L.titleL(x.p)}<span className="pl-by">{t('hi_by', {a: L.nameL(x.a)})}</span></span><span className="pl-ct">{t('hi_res', {n: nf(x.res)})}<br/>{t('hi_views', {n: nf(x.views)})}</span></a></li>)}</ol></div>
  </>;
}
function Concepts({L, rows}) {
  const {t} = L, nf = n => n.toLocaleString(L.lang === 'th' ? 'th-TH' : L.lang === 'lo' ? 'lo-LA' : 'en-US'), list = rows.filter(x => L.pk(x.p, 'say')).slice(0, 4);
  return <><p className="pl-lead">{t('hi_c_lead')}</p><ol className="pl-cl">{list.map((x, j) => <li className="pl-cp" key={j}><span className="pl-n" aria-hidden="true">{j + 1}</span>
    <div><q>{L.pk(x.p, 'say')}</q><div className="pl-meta"><span className="pl-own">{t('hi_own')}</span><span>— {L.nameL(x.a)} · {t('hi_from', {t: L.titleL(x.p)})}</span><span>{t('hi_res', {n: nf(x.res)})}</span></div></div></li>)}</ol></>;
}
function Newcomers({L}) {
  const {t} = L, nf = n => n.toLocaleString(L.lang === 'th' ? 'th-TH' : L.lang === 'lo' ? 'lo-LA' : 'en-US');
  const items = NEW_SAMPLE.map(n => { const a = ARTISTS.find(x => x.id === n.id); if (!a) return null;
    const w = a.pieces.map((p, k) => ({p, res: resCount(a.id, k), views: sampleViews(a.id, k)}));
    return {a, wk: n.wk, res: w.reduce((s, x) => s + x.res, 0), views: w.reduce((s, x) => s + x.views, 0), say: (w.find(x => L.pk(x.p, 'say')) || {p: {}}).p}; })
    .filter(Boolean).sort((x, y) => y.res - x.res || y.views - x.views);
  const f = items[0]; if (!f) return null;
  const av = (a, i) => <span className="pl-av" style={{background: BG[i % 3]}} aria-hidden="true">{chars(L.nameL(a))[0] || ''}</span>;
  return <><p className="pl-lead">{t('hi_n_lead')}</p><div className="pl-newb"><div className="pl-feat">{av(f.a, 0)}<div>
    <p className="pl-badge">{t('hi_n_badge')}</p><h3>{L.nameL(f.a)}</h3><p className="pl-j">{t('hi_joined', {n: f.wk})}</p>
    {L.pk(f.say, 'say') ? <q>{L.pk(f.say, 'say')}</q> : null}<p className="pl-ct">{t('hi_res', {n: nf(f.res)})} · {t('hi_views', {n: nf(f.views)})}</p>
    <a className="pl-btn" href={`studio-${f.a.id}.html`}>{t('hi_n_go', {a: L.nameL(f.a)})}</a></div></div>
    <p className="pl-more">{t('hi_n_more')}</p><ul className="pl-runs">{items.slice(1).map((r, i) => <li key={r.a.id}>{av(r.a, i + 1)}<div><b>{L.nameL(r.a)}</b><span>{t('hi_joined', {n: r.wk})}</span></div><span className="pl-ct">{t('hi_res', {n: nf(r.res)})}</span></li>)}</ul></div></>;
}

function weekLabel(L) {
  const d = new Date(), day = (d.getDay() + 6) % 7, mon = new Date(d.getFullYear(), d.getMonth(), d.getDate() - day), sun = new Date(mon.getFullYear(), mon.getMonth(), mon.getDate() + 6);
  const jan4 = new Date(mon.getFullYear(), 0, 4), wk = 1 + Math.round(((mon - new Date(jan4.getFullYear(), 0, 4 - ((jan4.getDay() + 6) % 7))) / 864e5) / 7);
  const loc = L.lang === 'th' ? 'th-TH-u-ca-gregory' : L.lang === 'lo' ? 'lo-LA-u-ca-gregory' : 'en-GB', f = new Intl.DateTimeFormat(loc, {day: 'numeric', month: 'short'});
  return L.t('hi_week', {n: wk, r: f.format(mon).replace(/\.$/, '') + '–' + f.format(sun).replace(/\.$/, ''), y: sun.getFullYear()});
}

export default function Highlights() {
  const L = useLang(), {t} = L, [tab, setTab] = useState(0);
  usePageMeta(t('hi_h') + ' — circles', t('hi_meta'));
  const rows = ARTISTS.flatMap(a => a.pieces.map((p, k) => ({a, p, k, res: resCount(a.id, k), views: sampleViews(a.id, k)}))).sort((x, y) => y.res - x.res || y.views - x.views);
  const TABS = [['w', 'hi_t_w'], ['c', 'hi_t_c'], ['n', 'hi_t_n']];
  const key = e => { let n = -1; if (e.key === 'ArrowRight') n = (tab + 1) % 3; else if (e.key === 'ArrowLeft') n = (tab + 2) % 3; else if (e.key === 'Home') n = 0; else if (e.key === 'End') n = 2; if (n >= 0) { e.preventDefault(); setTab(n); setTimeout(() => document.getElementById('tab-' + TABS[n][0])?.focus(), 0); } };
  return <PageShell styles={styles} sprite={sprite} lead={<SkipLink/>}>
    <Nav links={LINKS} menu={[['index.html#city', 'nav_city'], ['highlights.html', 'nav_hi'], ['legends.html', 'nav_lg'], ['join.html', 'foot_join']]}/>
    <main id="main" className="pl-main" tabIndex={-1}><div className="pl-wrap">
      <div className="bc pl-crumb" role="navigation" aria-label={t('bc_aria')}><ol><li><a href="index.html#city">{t('bc_city')}</a></li><li aria-current="page"><span>{t('hi_h')}</span></li></ol></div>
      <h1 className="pl-h" id="hi-h"><span>{t('hi_h')}</span></h1>
      <p className="pl-week"><span id="hi-week-t">{weekLabel(L)}</span> <span className="pl-chip">SAMPLE</span></p>
      <p className="pl-how"><b>{t('hi_how_k')}</b><span>{t('hi_how')}</span><span>{t('hi_not')}</span></p>
      <div className="pl-tabs" role="tablist" id="hi-tabs" aria-labelledby="hi-h" onKeyDown={key}>{TABS.map(([id, k], i) =>
        <button key={id} role="tab" type="button" id={'tab-' + id} aria-selected={tab === i} aria-controls={'pan-' + id} tabIndex={tab === i ? 0 : -1} onClick={() => setTab(i)}>{t(k)}</button>)}</div>
      {TABS.map(([id], i) => <div key={id} className="pl-panel" role="tabpanel" id={'pan-' + id} aria-labelledby={'tab-' + id} tabIndex={0} hidden={tab !== i}>
        {id === 'w' ? <Works L={L} rows={rows}/> : id === 'c' ? <Concepts L={L} rows={rows}/> : <Newcomers L={L}/>}</div>)}
    </div></main>
    <Dist here="highlights"/><MiniFoot/><div className="foot-tools"><ScLink/></div>
  </PageShell>;
}
