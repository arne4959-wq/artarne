/* legends.html — the Legends district: only the frame (see legends.js). At most 2 clearly marked SAMPLE slots, no pieces of our own, no donate button. */
import {useState} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {usePageMeta} from '../lib/meta.js';
import PageShell from '../components/PageShell.jsx';
import Nav from '../components/Nav.jsx';
import {MiniFoot} from '../components/Bits.jsx';
import {Dist, ScLink} from '../components/Dist.jsx';
import {SkipLink} from '../components/Ux.jsx';
import sprite from 'virtual:circles/sprite/legends';
import styles from '../styles/places.js';

const LEGENDS = [];   // real pieces: none yet, chosen one by one by the site owner (fields: see legends.js)
const SLOTS = [{type: 'img', sample: true}, {type: 'music', sample: true}, {type: 'film', empty: true}, {type: 'img', empty: true}];
const KEY = {img: 'lg_img', film: 'lg_film', music: 'lg_music'};
const Cross = () => <svg viewBox="0 0 400 300" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0L400 300M400 0L0 300" stroke="#8F8C85" strokeWidth="2"/></svg>;

function Media({x}) {
  const {t} = useLang();
  if (x.type === 'music') return <div className="pl-media aud"><button className="pl-play" type="button" disabled aria-label={t('lg_play')}>▶</button><span className="pl-bars" aria-hidden="true"/><span>{t('lg_ph_aud')}</span></div>;
  if (x.type === 'film') return <div className="pl-media vid" aria-hidden="true"><span className="pl-tri"/></div>;
  return <div className="pl-media img" role="img" aria-label={t('lg_ph_img')}><Cross/><span aria-hidden="true">{t('lg_ph_img')}</span></div>;
}
function Piece({x, hidden}) {
  const {t} = useLang(), k = t(KEY[x.type]);
  if (x.empty) return <li className="pl-vt empty" data-type={x.type} hidden={hidden}>{x.type === 'film' ? <div className="pl-media vid" aria-hidden="true"><span className="pl-tri"/></div> : <div className="pl-media img" aria-hidden="true"><Cross/></div>}
    <p className="pl-em-h">{t('lg_empty', {k})}</p><p className="pl-em-p">{t('lg_empty_p', {k})}</p></li>;
  return <li className="pl-vt" data-type={x.type} hidden={hidden}><div className="pl-vt-top"><span className="pl-vt-type">{k}</span><span className="pl-vt-stamp">{t('lg_sample')}</span></div><Media x={x}/>
    <dl><div><dt>{t('lg_f_title')}</dt><dd>{t('lg_p_title')}</dd></div><div><dt>{t('lg_f_maker')}</dt><dd>{t('lg_p_maker')}</dd></div>
      <div className="pl-vt-own"><dt>{t('lg_f_own')}</dt><dd>{t('lg_p_own')}<small>{t('lg_f_src')}: {t('lg_p_src')}</small></dd></div>
      <div className="pl-vt-hist"><dt>{t('lg_f_hist')}</dt><dd>{t('lg_p_hist')}</dd></div><div><dt>{t('lg_f_credit')}</dt><dd>{t('lg_p_credit')}</dd></div></dl><div className="pl-vt-base" aria-hidden="true"/></li>;
}

export default function Legends() {
  const {t} = useLang(), [flt, setFlt] = useState('all');
  usePageMeta(t('lg_h') + ' — circles', t('lg_meta'));
  const slots = LEGENDS.length ? [] : SLOTS;
  return <PageShell styles={styles} sprite={sprite} lead={<SkipLink/>}>
    <Nav links={[['index.html#city', 'nav_city'], ['highlights.html', 'nav_hi'], ['legends.html', 'nav_lg']]} menu={[['index.html#city', 'nav_city'], ['highlights.html', 'nav_hi'], ['legends.html', 'nav_lg'], ['join.html', 'foot_join']]}/>
    <main id="main" className="pl-main" tabIndex={-1}><div className="pl-wrap">
      <div className="bc pl-crumb" role="navigation" aria-label={t('bc_aria')}><ol><li><a href="index.html#city">{t('bc_city')}</a></li><li aria-current="page"><span>{t('lg_h')}</span></li></ol></div>
      <div className="pl-pedi">
        <svg viewBox="0 0 720 80" preserveAspectRatio="none" aria-hidden="true"><polygon points="360,5 714,77 6,77" fill="#C4C1B9" stroke="#0E0D0C" strokeWidth="6" strokeLinejoin="miter"/><polygon points="360,26 640,70 80,70" fill="none" stroke="#0E0D0C" strokeWidth="2" strokeDasharray="2 9"/></svg>
        <h1 id="lg-h">{t('lg_h')}</h1><div className="pl-cols" aria-hidden="true"><i/><i/><i/><i/></div><div className="pl-step" aria-hidden="true"/></div>
      <p className="pl-lead">{t('lg_lead')}</p>
      <div className="pl-nodon"><span>{t('lg_nodon')}</span><a className="pl-btn" href="highlights.html">{t('lg_go')}</a></div>
      <div className="pl-flt" role="group" aria-labelledby="lg-flt-k"><span className="sr" id="lg-flt-k">{t('lg_flt')}</span>
        {[['all', 'lg_all'], ['img', 'lg_img'], ['film', 'lg_film'], ['music', 'lg_music']].map(([k, s]) => <button key={k} type="button" data-flt={k} aria-pressed={flt === k} onClick={() => setFlt(k)}>{t(s)}</button>)}</div>
      <ul className="pl-vitr" id="lg-list">{slots.filter(x => x.sample).concat(slots.filter(x => x.empty)).map((x, i) => <Piece key={i} x={x} hidden={flt !== 'all' && flt !== x.type}/>)}</ul>
    </div></main>
    <Dist here="legends"/><MiniFoot/><div className="foot-tools"><ScLink/></div>
  </PageShell>;
}
