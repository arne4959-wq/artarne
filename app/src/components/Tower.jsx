/* Tower.jsx — the artist's studio as a cut-open concrete tower (html() of ../tower.js). Same markup, ids and classes as the plain page; the rules are in tower.css.
   Top to bottom: roof sign (name + Donate) · IDEAS floor · SKETCHES floor · FINISHED WORKS floor · lobby (bio + Support circles) · a contact sheet under the tower.
   Each window is one work at one stage: onOpen(k, stage) opens the work window there. The lift on the side lights one floor kind and dims the others. */
import {useState} from 'react';
import {useLang} from '../lib/i18n.jsx';
import {canDonate} from '../lib/donate.js';
import {STAGES, CATS, floors, stage, stagesOf, num} from '../lib/tower.js';
import {useDialogs} from './Dialogs.jsx';

function Win({A, k, st, onOpen}) {
  const L = useLang(), {t} = L, p = A.pieces[k], title = L.titleL(p), none = t('st_none_' + st.s);
  const glass = st.s === 'idea'
    ? (st.has ? <span className="tw-note"><i className="tw-tape" aria-hidden="true"></i><span>{st.text}</span></span> : <span className="tw-empty">{none}</span>)
    : (st.has ? <img src={st.src} alt="" loading="lazy" decoding="async" draggable="false"/> : <span className="tw-empty">{none}</span>);
  return <button type="button" className={`tw-win tw-${st.s}${st.has ? '' : ' tw-void'}`} data-k={k} data-s={st.s} onClick={() => onOpen(k, st.s)}
    aria-label={title + ' — ' + t('st_' + st.s) + (st.has ? '' : ' (' + none + ')')}>
    <span className="tw-glass">{glass}</span><span className="tw-cap" aria-hidden="true"><b>{num(k)}</b> {title}</span></button>;
}

/* the contact sheet: every work (row) x every stage (column) */
function Sheet({A, onOpen}) {
  const L = useLang(), {t} = L;
  return <section className="tw-sheet" aria-labelledby="tw-sheet-h"><div className="tw-sheet-in"><div className="tw-sheet-top"><h2 id="tw-sheet-h">{t('st_sheet_h')}</h2></div>
    <p className="tw-sheet-p">{t('st_sheet_p')}</p>
    <div className="tw-sheet-sc"><table className="tw-sheet-t"><thead><tr><th scope="col">{t('st_work')}</th>{STAGES.map(s => <th key={s} scope="col">{t('st_' + s)}</th>)}</tr></thead>
      <tbody>{A.pieces.map((p, k) => <tr key={k}><th scope="row"><b>{num(k)}</b><span>{L.titleL(p)}</span></th>
        {stagesOf(L, p).map(st => {
          const inner = st.s === 'idea' ? (st.has ? <span className="tw-snip">{st.text}</span> : <i aria-hidden="true">—</i>)
            : (st.has ? <img src={st.src} alt="" loading="lazy" decoding="async" draggable="false"/> : <i aria-hidden="true">—</i>);
          return <td key={st.s}><button type="button" className={'tw-cell' + (st.has ? '' : ' tw-void')} data-k={k} data-s={st.s} onClick={() => onOpen(k, st.s)}
            aria-label={t('st_open', {t: L.titleL(p), s: t('st_' + st.s)}) + (st.has ? '' : ' (' + t('st_none_' + st.s) + ')')}>{inner}</button></td>;
        })}</tr>)}</tbody></table></div></div></section>;
}

export default function Tower({A, onOpen}) {
  const L = useLang(), {t} = L, {openDonate, openSupportCircles} = useDialogs(), [lit, setLit] = useState('all');
  const n = A.pieces.length, {shown, rows, total, floors: fl} = floors(n);
  const range = i => rows === 1 ? t('tw_fl', {n: total - i * rows}) : t('tw_fl_r', {a: total - i * rows - rows + 1, b: total - i * rows});
  return <div className="tw" id="tw">
    <p className="tw-hint"><mark>{t('tw_hint_k')}</mark> {t('tw_hint')}</p>
    <div className="tw-grid">
      <div className="tw-bld" id="tw-bld" data-lit={lit}>
        <div className="tw-roof"><i className="tw-ant" aria-hidden="true"></i><div className="tw-sign"><b>{t('tw_roof', {n: L.nameL(A).toUpperCase()})}</b></div>
          {canDonate(A) ? <button type="button" className="btn pk tw-don" data-support={A.id} onClick={() => openDonate(A)}>{t('tw_don', {a: L.nameL(A)})}</button> : null}</div>
        {fl.map(f => <section key={f.cat + f.r} className="tw-fl" data-f={f.cat} aria-label={t('tw_fl', {n: f.level}) + ' · ' + t('tw_room_' + f.cat)}>
          <div className="tw-lab"><b>{t('tw_fl', {n: f.level})}</b><span>{t('tw_room_' + f.cat)}</span></div>
          {f.ks.map(k => <Win key={k} A={A} k={k} st={stage(L, A.pieces[k], f.st)} onOpen={onOpen}/>)}</section>)}
        <section className="tw-lobby" aria-labelledby="tw-lobby-h"><div className="tw-door" aria-hidden="true"><img src="people/stand.png" width="20" height="28" alt=""/></div>
          <div className="tw-lob-t"><small>{t('tw_lobby_k')}</small><h2 id="tw-lobby-h">{L.nameL(A)}</h2><p>{L.pk(A, 'bio')}</p>
            <p className="tw-note-fee">{t('tw_lobby_note')}</p>
            <div className="tw-lob-act"><button type="button" className="btn pk" data-support="site" onClick={openSupportCircles}>{t('tw_sup_site')}</button>
              <a className="lr-prof" href={`profile-${A.id}.html`}>{t('mus_prof2', {a: L.nameL(A)})}</a></div></div></section>
        <div className="tw-ground" aria-hidden="true"></div>
      </div>
      <div className="tw-lift" role="group" aria-label={t('tw_lift')}><small>{t('tw_lift')}</small>
        {CATS.map(([cat], i) => <button key={cat} type="button" data-lift={cat} aria-pressed={lit === cat} onClick={() => setLit(cat)}><span aria-hidden="true">↑</span> {range(i)}<small>{t('tw_cat_' + cat)}</small></button>)}
        <button type="button" className="all" data-lift="all" aria-pressed={lit === 'all'} onClick={() => setLit('all')}>{t('tw_lift_all')}</button></div>
    </div>
    {n > shown ? <p className="tw-more">{t('tw_more', {n: shown, m: n})}</p> : null}
    {n ? <Sheet A={A} onOpen={onOpen}/> : null}
  </div>;
}
